// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

/**
* @title POAP (Proof of Attendance Protocol) 
* @notice ERC721 NFT for event attendees
 */
contract POAP is ERC721, AccessControl {
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER");

    uint256 private _nextTokenId;

    // eventId => attendee => claimed 
    mapping(uint256 => mapping(address => bool)) public claimed;

    // tokenId => eventId
    mapping(uint256 => uint256) public tokenEvent;

    // tokenId => metadata hash (encrypted off-chain data)
    mapping(uint256 => bytes32) public metadataHash;

    event POAPAwarded(
        uint256 indexed tokenId,
        uint256 indexed eventId,
        address indexed attendee,
        bytes32 metadataHash
    );

    error AlreadyClaimed();
    error Unauthorized();

    constructor() ERC721("EventVerse POAP", "EVPOAP") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
    * @notice Award POAP to attendee after check-in
    * @param eventId Event identifier
    * @param attendee Ticket holder address
    * @param _metadataHash of encrypted off-chain metadata
    */
    function awardPOAP(
        uint256 eventId,
        address attendee,
        bytes32 _metadataHash
    ) external onlyRole(VERIFIER_ROLE) {
        if (claimed[eventId][attendee]) revert AlreadyClaimed();

        claimed[eventId][attendee] = true;

        uint256 tokenId = ++_nextTokenId;

        tokenEvent[tokenId] = eventId;
        metadataHash[tokenId] = _metadataHash;

        _safeMint(attendee, tokenId);

        emit POAPAwarded(tokenId, eventId, attendee, _metadataHash);
    }

    /**
    * @notice Public mint for free POAPs
    * @param eventId Event identifier
    * @param _metadataHash of encrypted off-chain metadata
    */
    function mintPOAP(
        uint256 eventId,
        bytes32 _metadataHash
    ) external {
        if (claimed[eventId][msg.sender]) revert AlreadyClaimed();

        claimed[eventId][msg.sender] = true;

        uint256 tokenId = ++_nextTokenId;

        tokenEvent[tokenId] = eventId;
        metadataHash[tokenId] = _metadataHash;

        _safeMint(msg.sender, tokenId);

        emit POAPAwarded(tokenId, eventId, msg.sender, _metadataHash);
    }

    /**
    * @notice Batch award POAPS (gas optimization)
    */
    function awardPOAPBatch(
        uint256 eventId,
        address[] calldata attendees,
        bytes32[] calldata metadataHashes
    ) external onlyRole(VERIFIER_ROLE) {
        uint256 length = attendees.length;
        require(length == metadataHashes.length, "LENGTH_MISMATCH");

        for (uint256 i = 0; i < length; i++) {
            address attendee = attendees[i];
            if (claimed[eventId][attendee]) continue;

            claimed[eventId][attendee] = true;

            uint256 tokenId = ++_nextTokenId;

            tokenEvent[tokenId] = eventId;
            metadataHash[tokenId] = metadataHashes[i];

            _safeMint(attendee, tokenId);

            emit POAPAwarded(tokenId, eventId, attendee, metadataHashes[i]);
        }
    }

    /**
    * @notice Get user's POAPs
    */
    function getUserPOAPs(address user) 
        external 
        view 
        returns (uint256[] memory tokenIds, uint256[] memory eventIds) 
    {
        uint256 balance = balanceOf(user);
        tokenIds = new uint256[](balance);
        eventIds = new uint256[](balance);
        
        uint256 index = 0;
        for (uint256 i = 1; i <= _nextTokenId && index < balance; i++) {
            try this.ownerOf(i) returns (address owner) {
                if (owner == user) {
                    tokenIds[index] = i;
                    eventIds[index] = tokenEvent[i];
                    index++;
                }
            } catch {}
        }
    }

    /**
    * @notice Check if user has claimed POAP for event
    */
    function hasClaimed(uint256 eventId, address user) external view returns (bool) {
        return claimed[eventId][user];
    }

    /**
    * @dev Souldbound - prevent transfers
    */
    function _update(address to, uint256 tokenId, address auth)
        internal
        virtual
        override
        returns (address)
    {
        address from = _ownerOf(tokenId);
        require(from == address(0) || to == address(0), "POAP: soulbound");
        return super._update(to, tokenId, auth);
    }

    function supportsInterface(bytes4 interfaceId) 
        public
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}

/**
 * @title EventBadge
 * @notice ERC721 NFT for event Organizers (host credentials)
*/
contract EventBadge is ERC721, AccessControl {
    bytes32 public constant BADGE_ISSUER_ROLE = keccak256("BADGE_ISSUER");

    uint256 private _nextBadgeId;

    struct BadgeMetadata {
        uint256 eventId;
        uint256 issuedAt;
        uint256 attendeeCount;
        bytes32 encryptedData; // Hash of encrypted event metadata
    }

    // eventId => organizer => claimed
    mapping(uint256 => mapping(address => bool)) public badgeIssued;

    // badgeId => metadata
    mapping(uint256 => BadgeMetadata) public badgeMetadata;

    event BadgeAwarded(
        uint256 indexed badgeId,
        uint256 indexed eventId, 
        address indexed organizer,
        uint256 attendeeCount
    );

    error BadgeAlreadyIssued();

    constructor() ERC721("EventVerse Host Badge", "EVbadge") {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    /**
    * @notice Award badge to organizer after successful event
    * @param eventId Event identifier
    * @param organizer Event host address
    * @param attendeeCount Number of attendees (reputation metric)
    * @param encryptedData Hash of encrypted event statistics
    */
    function awardBadge(
        uint256 eventId,
        address organizer,
        uint256 attendeeCount,
        bytes32 encryptedData
    ) external onlyRole(BADGE_ISSUER_ROLE) {
        if (badgeIssued[eventId][organizer]) revert BadgeAlreadyIssued();

        badgeIssued[eventId][organizer] = true;

        uint256 badgeId = ++_nextBadgeId;

        badgeMetadata[badgeId] = BadgeMetadata({
            eventId: eventId,
            issuedAt: block.timestamp,
            attendeeCount: attendeeCount,
            encryptedData: encryptedData
        });

        _safeMint(organizer, badgeId);

        emit BadgeAwarded(badgeId, eventId, organizer, attendeeCount);
    }

    /**
    * @notice Get organizer reputation score
    * @dev Calculate based on number of badges
     */
     function getOrganizerReputation(address organizer) 
        external
        view 
        returns (uint256)
    {
        return balanceOf(organizer);
    }

    /**
    * @notice Get organizer's badges
    */
    function getOrganizerBadges(address organizer) 
        external 
        view 
        returns (uint256[] memory badgeIds, BadgeMetadata[] memory metadata) 
    {
        uint256 balance = balanceOf(organizer);
        badgeIds = new uint256[](balance);
        metadata = new BadgeMetadata[](balance);
        
        uint256 index = 0;
        for (uint256 i = 1; i <= _nextBadgeId && index < balance; i++) {
            try this.ownerOf(i) returns (address owner) {
                if (owner == organizer) {
                    badgeIds[index] = i;
                    metadata[index] = badgeMetadata[i];
                    index++;
                }
            } catch {}
        }
    }

    /**
    * @dev Optional: Allow transfers for reputation trading
    */
    function supportsInterface(bytes4 interfaceId) 
        public 
        view
        override(ERC721, AccessControl)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }
}