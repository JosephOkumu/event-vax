// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IEventManager {
    function isEventCancelled(uint256 eventId) external view returns (bool);
}

interface ITicketNFT {
    function balanceOf(address account, uint256 id) external view returns (uint256);
    function checkIn(address user, uint256 typeId) external;
}

interface IPOAP {
    function awardPOAP(uint256 eventId, address attendee, bytes32 metadataHash, string calldata ipfsHash) external;
    function claimed(uint256 eventId, address attendee) external view returns (bool);
}

interface IMetadataRegistry {
    enum MetadataType { Event, Ticket, POAP, Badge }
    
    struct Metadata {
        string ipfsHash;
        bytes32 contentHash;
        uint256 timestamp;
        address updatedBy;
        bool frozen;
    }
    
    function getMetadata(MetadataType entityType, uint256 entityId) external view returns (Metadata memory);
    function metadataExists(MetadataType entityType, uint256 entityId) external view returns (bool);
}

/** 
* @title QRVerificationSystem
* @notice Handles secure QR code-based ticket verification and check-in
* @dev Combines signature verification with on-chain state validation
*/
contract QRVerificationSystem is AccessControl, EIP712, ReentrancyGuard {
    using ECDSA for bytes32;

    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER");
    bytes32 public constant EVENT_ADMIN = keccak256("EVENT_ADMIN");

    // Typehash for QR verification 
    bytes32 public constant QR_VERIFY_TYPEHASH = keccak256(
        "QRVerify(uint256 eventId, address attendee, uint256 tierId, uint256 nonce, uint256 deadline)"
    );

    struct CheckInRecord {
        uint256 eventId;
        address attendee;
        uint256 tierId;
        uint256 timestamp;
        address verifier;
        bool poapAwarded;
    }

    struct EventCheckIn {
        address ticketContract;
        address poapContract;
        bool active;
        uint256 checkInCount;
        uint256 startTime;
        uint256 endTime;
    }

    // eventId => EventCheckIn
    mapping(uint256 => EventCheckIn) public eventCheckIns;

    IEventManager public eventManager;
    IMetadataRegistry public metadataRegistry;

    // eventId => attendee => CheckInRecord[]
    mapping(uint256 => mapping(address => CheckInRecord[])) public checkInHistory;

    // eventId => attendee => checked in
    mapping(uint256 => mapping(address => bool)) public hasCheckedIn;

    // Nonce tracking per attendee (replay protection)
    mapping(address => uint256) public nonces;

    // QR code hash => used (prevent same QR reuse)
    mapping(bytes32 => bool) public qrCodeUsed;

    // Rate limiting: attendee => last check-in time
    mapping(address => uint256) public lastCheckInTime;
    uint256 public constant RATE_LIMIT = 10 seconds;

    event EventCheckInConfigured(
        uint256 indexed eventId,
        address ticketContract,
        address poapContract
    );

    event TicketVerified(
        uint256 indexed eventId,
        address indexed attendee,
        uint256 tierId,
        address verifier
    );

    event CheckInCompleted(
        uint256 indexed eventId,
        address indexed attendee,
        uint256 tierId,
        bool poapAwarded
    );

    event POAPAwarded(uint256 indexed eventId, address indexed attendee);

    error EventNotConfigured();
    error CheckInNotActive();
    error InvalidSignature();
    error NonceAlreadyUsed();
    error QRCodeAlreadyUsed();
    error DeadlineExpired();
    error NoTicketOwned();
    error AlreadyCheckedIn();
    error RateLimitExceeded();
    error InvalidTimestamp();
    error EventNotStarted();
    error EventEnded();

    constructor() EIP712("QRVerificationSystem", "1") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EVENT_ADMIN, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
    }

    function setEventManager(address _eventManager) external onlyRole(DEFAULT_ADMIN_ROLE) {
        eventManager = IEventManager(_eventManager);
    }

    function setMetadataRegistry(address _metadataRegistry) external onlyRole(DEFAULT_ADMIN_ROLE) {
        metadataRegistry = IMetadataRegistry(_metadataRegistry);
    }

    /**
    * @notice Configure check-in for an event
    * @param eventId Event identifier
    * @param ticketContract Address of TicketNFT contract
    * @param poapContract Address of POAP  contract
    * @param startTime Check-in start timestamp
    * @param endTime Check-in end timestamp
    */
    function configureEventCheckIn(
        uint256 eventId,
        address ticketContract,
        address poapContract,
        uint256 startTime,
        uint256 endTime
    ) external onlyRole(EVENT_ADMIN) {
        if (startTime >= endTime) revert InvalidTimestamp();

        eventCheckIns[eventId] = EventCheckIn({
            ticketContract: ticketContract,
            poapContract: poapContract,
            active: true,
            checkInCount: 0,
            startTime: startTime,
            endTime: endTime
        });

        emit EventCheckInConfigured(eventId, ticketContract, poapContract);
    }

    /**
    * @notice Verify QR code and complete check-in
    * @dev Main entry point for scanner apps
    * @param eventId Event identifier
    * @param attendee Ticket holder address
    * @param tierId Ticket tier ID
    * @param nonce Unique nonce for this verification
    * @param timestamp QR generation timestamp
    * @param signature EIP-712 signature
    */
    function verifyAndCheckIn(
        uint256 eventId,
        address attendee,
        uint256 tierId,
        uint256 nonce,
        uint256 timestamp,
        uint256 deadline,
        bytes calldata signature
    ) external onlyRole(VERIFIER_ROLE) nonReentrant {
        EventCheckIn storage checkIn = eventCheckIns[eventId];

        // Validity checks
        if (!checkIn.active) revert CheckInNotActive();
        if (address(eventManager) != address(0) && eventManager.isEventCancelled(eventId)) revert CheckInNotActive();
        if (block.timestamp < checkIn.startTime) revert EventNotStarted();
        if (block.timestamp > checkIn.endTime) revert EventEnded();
        if (block.timestamp > deadline) revert DeadlineExpired();
        if (hasCheckedIn[eventId][attendee]) revert AlreadyCheckedIn();

        // Rate limiting
        if (block.timestamp < lastCheckInTime[attendee] + RATE_LIMIT) {
            revert RateLimitExceeded();
        }

        // Nonce check
        if (nonce <= nonces[attendee]) revert NonceAlreadyUsed();

        // QR code uniqueness check
        bytes32 qrHash = keccak256(
            abi.encodePacked(eventId, attendee, tierId, nonce, timestamp)
        );
        if (qrCodeUsed[qrHash]) revert QRCodeAlreadyUsed();

        // Verify signature
        bytes32 structHash = keccak256(
            abi.encode(
                QR_VERIFY_TYPEHASH,
                eventId, 
                attendee,
                tierId,
                nonce,
                timestamp,
                deadline
            )
        );

        bytes32 digest = _hashTypedDataV4(structHash);
        address signer = digest.recover(signature);

        // Signature must be from attendee (self-signed QR)
        if (signer != attendee) revert InvalidSignature();

        // Verify ticket ownership
        ITicketNFT ticketContract = ITicketNFT(checkIn.ticketContract);
        if (ticketContract.balanceOf(attendee, tierId) == 0) revert NoTicketOwned();

        // Mark QR as used
        qrCodeUsed[qrHash] = true;
        nonces[attendee] = nonce;
        lastCheckInTime[attendee] = block.timestamp;

        emit TicketVerified(eventId, attendee, tierId, msg.sender);

        // Execute check-in on TicketNFT
        ticketContract.checkIn(attendee, tierId);

        // Mark as checked in
        hasCheckedIn[eventId][attendee] = true;
        checkIn.checkInCount++;

        // Award POAP if configured
        bool  poapAwarded = false;
        if (checkIn.poapContract != address(0)) {
            IPOAP poapContract = IPOAP (checkIn.poapContract);

            if (!poapContract.claimed(eventId, attendee)) {
                // Retrieve IPFS metadata from MetadataRegistry
                string memory ipfsHash = "";
                bytes32 contentHash = keccak256(abi.encodePacked(eventId, attendee, block.timestamp));
                
                if (address(metadataRegistry) != address(0)) {
                    try metadataRegistry.getMetadata(IMetadataRegistry.MetadataType.POAP, eventId) returns (IMetadataRegistry.Metadata memory metadata) {
                        if (bytes(metadata.ipfsHash).length > 0) {
                            ipfsHash = metadata.ipfsHash;
                            contentHash = metadata.contentHash;
                        }
                    } catch {}
                }
                
                poapContract.awardPOAP(eventId, attendee, contentHash, ipfsHash);
                poapAwarded = true;
                emit POAPAwarded(eventId, attendee);
            }
        }

        // Record check-in
        checkInHistory[eventId][attendee].push(CheckInRecord({
            eventId: eventId,
            attendee: attendee,
            tierId: tierId,
            timestamp: block.timestamp,
            verifier: msg.sender,
            poapAwarded: poapAwarded
        }));

        emit CheckInCompleted(eventId, attendee, tierId, poapAwarded);
    }

    /**
    * @notice Batch check-in (for manual processing)
    * @dev Used when QR scanning fails or for VIP fast-track
    */
    function batchCheckIn(
        uint256 eventId,
        address[] calldata attendees,
        uint256[] calldata tierIds
    ) external onlyRole(VERIFIER_ROLE) nonReentrant {
        require(attendees.length == tierIds.length, "Length mismatch");

        EventCheckIn storage checkIn = eventCheckIns[eventId];
        if (!checkIn.active) revert CheckInNotActive();

        ITicketNFT ticketContract = ITicketNFT(checkIn.ticketContract);
        IPOAP poapContract = IPOAP(checkIn.poapContract);

        for (uint256 i = 0; i < attendees.length; i++) {
            address attendee = attendees[i];
            uint256 tierId = tierIds[i];

            if (hasCheckedIn[eventId][attendee]) continue;

            // Verify ticket ownership
            if (ticketContract.balanceOf(attendee, tierId) == 0) continue;

            // Execute check-in
            ticketContract.checkIn(attendee, tierId);
            hasCheckedIn[eventId][attendee] = true;
            checkIn.checkInCount++;

            // Award POAP
            bool poapAwarded = false;
            if (checkIn.poapContract != address(0)) {
                if (!poapContract.claimed(eventId, attendee)) {
                    // Retrieve IPFS metadata from MetadataRegistry
                    string memory ipfsHash = "";
                    bytes32 contentHash = keccak256(abi.encodePacked(eventId, attendee, block.timestamp));
                    
                    if (address(metadataRegistry) != address(0)) {
                        try metadataRegistry.getMetadata(IMetadataRegistry.MetadataType.POAP, eventId) returns (IMetadataRegistry.Metadata memory metadata) {
                            if (bytes(metadata.ipfsHash).length > 0) {
                                ipfsHash = metadata.ipfsHash;
                                contentHash = metadata.contentHash;
                            }
                        } catch {}
                    }
                    
                    poapContract.awardPOAP(eventId, attendee, contentHash, ipfsHash);
                    poapAwarded = true;
                }
            }

            // Record
            checkInHistory[eventId][attendee].push(CheckInRecord({
                eventId: eventId,
                attendee: attendee,
                tierId: tierId,
                timestamp: block.timestamp,
                verifier: msg.sender,
                poapAwarded: poapAwarded
            }));

            emit CheckInCompleted(eventId, attendee, tierId, poapAwarded);
        }
    }

    /**
    * @notice Emergency check-in reversal (admin only)
     */
     function reverseCheckIn(uint256 eventId, address attendee)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
    {
        hasCheckedIn[eventId][attendee] = false;
        eventCheckIns[eventId].checkInCount--;
    }

    /**
    * @notice Active/deactivate event check-in
    */
    function setCheckInActive(uint256 eventId, bool active)
        external
        onlyRole(EVENT_ADMIN)
    {
        eventCheckIns[eventId].active = active;
    }

    /**
    * @notice Get check-in status
     */
     function getCheckInStatus(uint256 eventId, address attendee)
        external
        view
        returns (
            bool checkedIn,
            uint256 checkInTime,
            bool poapAwarded
        )
    {
        checkedIn = hasCheckedIn[eventId][attendee];

        CheckInRecord[] memory history = checkInHistory[eventId][attendee];
        if (history.length > 0) {
            CheckInRecord memory record = history[history.length - 1];
            checkInTime = record.timestamp;
            poapAwarded = record.poapAwarded;
        }
    }

    /**
    * @notice Get check-in history for attendee
    */
    function getCheckInHistory(uint256 eventId, address attendee)
        external
        view 
        returns (CheckInRecord[] memory)
    {
        return checkInHistory[eventId][attendee];
    }

    /**
    * @notice Get total check-ins for event
    */
    function getEventCheckInCount(uint256 eventId)
            external
            view
            returns (uint256)
        {
            return eventCheckIns[eventId].checkInCount;
        }

        /**
        * @notice Verify QR signature without check-in (preview)
        */
        function verifyQRSignature(
            uint256 eventId, 
            address attendee,
            uint256 tierId,
            uint256 nonce,
            uint256 timestamp,
            uint256 deadline,
            bytes calldata signature
        ) external view returns (bool valid, string memory reason) {
            if (block.timestamp > deadline) {
                return (false, "Deadline expired");
            }

            if (nonce <= nonces[attendee]) {
                return (false, "Nonce already used");
            }

            bytes32 qrHash = keccak256(
                abi.encodePacked(eventId, attendee, tierId, nonce, timestamp)
            );
            if (qrCodeUsed[qrHash]) {
                return (false, "QR already used");
            }

            bytes32 structHash = keccak256(
                abi.encode(
                    QR_VERIFY_TYPEHASH,
                    eventId,
                    attendee,
                    tierId,
                    nonce,
                    timestamp,
                    deadline
                )
            );

            bytes32 digest = _hashTypedDataV4(structHash);
            address signer = digest.recover(signature);

            if (signer != attendee) {
                return (false, "Invalid signature");
            }
            
            return (true, "Valid");
        }

        /**
        * @notice Get current nonce for attendee
        */
        function getCurrentNonce(address attendee) external view returns (uint256) {
            return nonces[attendee];
        }

        /**
        * @notice Verify if user can comment/rate (has checked in)
        */
        function canParticipate(uint256 eventId, address user) external view returns (bool) {
            return hasCheckedIn[eventId][user];
        }
}