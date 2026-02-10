// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

interface IEventManager {
    function isEventCancelled(uint256 eventId) external view returns (bool);
}

/**
* @title TicketNFT
* @notice ERC1155 implementation for multi-tier event tickets
* @dev Cloned per event via EventFactory
*/
contract TicketNFT is ERC1155, AccessControl, Pausable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant ORGANIZER_ROLE = keccak256("ORGANIZER");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER");
    bytes32 public constant PAYMENT_GATEWAY_ROLE = keccak256("PAYMENT_GATEWAY");

    struct TicketTier {
        uint256 maxSupply;
        uint256 minted;
        uint256 price;
        uint256 fiatPrice; // Price in cents (e.g., 1000 = KES 10.00)
        bool exists;
    }

    address public factory;
    address public organizer;
    address public marketplace;
    IEventManager public eventManager;

    uint256 public eventId;
    uint256 public eventDate;
    string public eventName;

    // Revenue split (basis points)
    uint256 public platformFeeBps = 250; // 2.5%
    address public treasury;

    // Supported payment tokens (address(0) = native token)
    mapping(address => bool) public acceptedTokens;

    // tierdId => TicketTier
    mapping(uint256 => TicketTier) public tiers;

    // user => tierId => used count
    mapping(address => mapping(uint256 => uint256)) public usedTickets;

    // Refund  tracking
    mapping(address => mapping(uint256 => uint256)) public refundClaims;

    // Off-chain payment tracking (M-Pesa, USSD)
    mapping(bytes32 => bool) public paymentProcessed; // paymentRef => processed
    mapping(bytes32 => address) public paymentBuyer; // paymentRef => buyer

    bool public initialized;

    event TicketTierCreated(uint256 indexed tierId, uint256 maxSupply, uint256 price);
    event TicketPurchased(address indexed buyer, uint256 indexed tierId, uint256 amount, address token);
    event OffChainPurchase(address indexed buyer, uint256 indexed tierId, uint256 amount, bytes32 paymentRef, string paymentMethod);
    event TicketCheckedIn(address indexed user, uint256 tierId);
    event RefundProcessed(address indexed user, uint256 indexed tierId, uint256 indexed amount);

    error AlreadyInitialized();
    error TierExists();
    error TierNotFound();
    error SoldOut();
    error EventPassed();
    error InsufficientPayment();
    error NoUnusedTickets();
    error TokenNotAccepted();
    error RefundNotAvailable();
    error PaymentAlreadyProcessed();
    error InvalidPaymentReference();

    modifier onlyOrganizer() {
        _checkOrganizer();
        _;
    }

    function _checkOrganizer() private view {
        require(hasRole(ORGANIZER_ROLE, msg.sender), "Not organizer");
    }

    constructor() ERC1155("") {}

    /**
    * @notice Initialize cloned contract
    * @dev Called by EventFactory after clone deployment
    */
    function initialize(
        address _organizer,
        uint256 _eventId,
        uint256 _eventDate,
        string calldata _eventName,
        string calldata baseURI,
        address _marketplace,
        address _eventManager
    ) external {
        if (initialized) revert AlreadyInitialized();
        initialized = true;

        factory = msg.sender;
        organizer = _organizer;
        eventId = _eventId;
        eventDate = _eventDate;
        eventName = _eventName;
        marketplace = _marketplace;
        eventManager = IEventManager(_eventManager);
        treasury = _marketplace; // Use marketplace as treasury

        _setURI(baseURI);

        _grantRole(DEFAULT_ADMIN_ROLE, _organizer);
        _grantRole(ORGANIZER_ROLE, _organizer);
        _grantRole(PAYMENT_GATEWAY_ROLE, _marketplace); // Marketplace can process payments

        // Accept native toke by default
        acceptedTokens[address(0)] = true;
    }

    /**
    * @notice Create a new ticket tier
    * @param tierId Unique identifier for tier (0=Regular, 1=VIP, 2=VVIP)
    * @param maxSupply Maximum tickets for this tier
    * @param price Price per ticket (in wei or token units)
     */
     function createTier(
        uint256 tierId,
        uint256 maxSupply, 
        uint256 price 
     ) external onlyOrganizer {
        if (tiers[tierId].exists) revert TierExists();

        tiers[tierId] = TicketTier({
            maxSupply: maxSupply,
            minted: 0,
            price: price,
            fiatPrice: 0,
            exists: true
        });

        if (marketplace != address(0)) {
            (bool success,) = marketplace.call(
                abi.encodeWithSignature("setOriginalPrice(uint256,uint256)", tierId, price)
            );
            require(success, "Marketplace call failed");
        }

        emit TicketTierCreated(tierId, maxSupply, price);
     }

     /**
     * @notice TicketTierCreated multiple tiers (gas optimization)
    */
    function createTiersBatch(
        uint256[] calldata tierIds,
        uint256[] calldata maxSupplies,
        uint256[] calldata prices
    )   external
         nonReentrant
         onlyOrganizer
    {
        uint256 length = tierIds.length;
        require(length == maxSupplies.length && length == prices.length, "Length mismatch");

        for (uint256 i = 0; i < length; i++) {
            if (tiers[tierIds[i]].exists) revert TierExists();
        
        tiers[tierIds[i]] = TicketTier({
            maxSupply: maxSupplies[i],
            minted: 0,
            price: prices[i],
            fiatPrice: 0,
            exists: true
            });

            if (marketplace != address(0)) {
                (bool success,) = marketplace.call(
                    abi.encodeWithSignature("setOriginalPrice(uint256,uint256)", tierIds[i], prices[i])
                );
                require(success, "Marketplace call failed");
            }

            emit TicketTierCreated(tierIds[i], maxSupplies[i], prices[i]);
        }
    }

    /**
     * @notice Set fiat price for tier (for M-Pesa/USSD)
     */
     function setFiatPrice(uint256 tierId, uint256 priceInCents) external onlyOrganizer {
        if (!tiers[tierId].exists) revert TierNotFound();
        tiers[tierId].fiatPrice = priceInCents;
     }

     /**
     * @notice Activate ticket sales
     */
     function goLive() external view onlyOrganizer {
        require(address(eventManager) == address(0) || !eventManager.isEventCancelled(eventId), "Event cancelled");
     }

     /**
     * @notice Purchase tickets with native token
    */
    function purchaseTicket(uint256 tierId, uint256 amount) 
        external
        payable
        nonReentrant
        whenNotPaused
     {
         require(address(eventManager) == address(0) || !eventManager.isEventCancelled(eventId), "Event cancelled");
         _purchaseTicket(tierId, amount, address(0), msg.value);
     }

    /**
      * @notice Purchase tickets with 
      */
    function purchaseTicketWithToken(
        uint256 tierId,
        uint256 amount,
        address token
    ) external nonReentrant whenNotPaused {
        require(address(eventManager) == address(0) || !eventManager.isEventCancelled(eventId), "Event cancelled");
        if (!acceptedTokens[token]) revert TokenNotAccepted();

        uint256 totalCost = tiers[tierId].price * amount;
        IERC20(token).safeTransferFrom(msg.sender, address(this), totalCost);

        _purchaseTicket(tierId, amount, token, totalCost);
    }

    /**
    * @notice Mint tickets after off-chain payment (M-Pesa, USSD)
    * @param buyer Wallet address of buyer
    * @param tierId Ticket tier
    * @param amount Number of tickets
    * @param paymentRef M-Pesa/USSD transaction reference
    * @param paymentMethod "MPESA" or "USSD"
    */
    function mintAfterPayment(
        address buyer,
        uint256 tierId,
        uint256 amount,
        bytes32 paymentRef,
        string calldata paymentMethod
    ) external onlyRole(PAYMENT_GATEWAY_ROLE) nonReentrant whenNotPaused {
        if (paymentProcessed[paymentRef]) revert PaymentAlreadyProcessed();
        if (!tiers[tierId].exists) revert TierNotFound();
        if (block.timestamp >= eventDate) revert EventPassed();

        TicketTier storage tier = tiers[tierId];
        if (tier.minted + amount > tier.maxSupply) revert SoldOut();

        // Mark payment as processed
        paymentProcessed[paymentRef] = true;
        paymentBuyer[paymentRef] = buyer;

        tier.minted += amount;
        _mint(buyer, tierId, amount, "");

        emit OffChainPurchase(buyer, tierId, amount, paymentRef, paymentMethod);
    }

    /**
    * @dev Internal purchase logic
    */
    function _purchaseTicket(
        uint256 tierId,
        uint256 amount,
        address token,
        uint256 payment
    ) private {
        if (!tiers[tierId].exists) revert TierNotFound();
        if (block.timestamp >= eventDate) revert EventPassed();

        TicketTier storage tier = tiers[tierId];
        
        if (tier.minted + amount > tier.maxSupply) revert SoldOut();

        uint256 totalCost = tier.price * amount;
        
        // Free tickets - skip payment logic
        if (totalCost == 0) {
            tier.minted += amount;
            _mint(msg.sender, tierId, amount, "");
            emit TicketPurchased(msg.sender, tierId, amount, token);
            return;
        }

        // Paid tickets
        if (payment < totalCost) revert InsufficientPayment();

        uint256 platformFee = (totalCost * platformFeeBps) / 10000;
        uint256 organizerAmount = totalCost - platformFee;

        tier.minted += amount;
        _mint(msg.sender, tierId, amount, "");

        // Distribute funds
        if (token == address(0)) {
            if (platformFee > 0 && treasury != address(0)) {
                (bool success1,) = payable(treasury).call{value: platformFee}("");
                require(success1, "Platform fee transfer failed");
            }
            (bool success2,) = payable(organizer).call{value: organizerAmount}("");
            require(success2, "Organizer payment failed");
            
            if (payment > totalCost) {
                (bool success3,) = payable(msg.sender).call{value: payment - totalCost}("");
                require(success3, "Refund failed");
            }
        }
        
        emit TicketPurchased(msg.sender, tierId, amount, token);
    }
    

        /**
        * @notice Check in a ticket holder
        * @dev Called by authorized verifier (QR scanners)
        */
        function checkIn(address user, uint256 tierId)
            external
            nonReentrant
            onlyRole(VERIFIER_ROLE)
        {
            require(address(eventManager) == address(0) || !eventManager.isEventCancelled(eventId), "Event cancelled");
            uint256 balance = balanceOf(user, tierId);
            uint256  used = usedTickets[user][tierId];

            if (balance <= used) revert NoUnusedTickets();

            usedTickets[user][tierId]++;

            emit TicketCheckedIn(user, tierId);
        }

        /**
        * @notice Cancel event and enable refunds
         */
         function cancelEvent() external onlyOrganizer {
         }

         /**
          * @notice Claim refund for cancelled event
          */
        function claimRefund(uint256 tierId) external nonReentrant {
            require(address(eventManager) != address(0) && eventManager.isEventCancelled(eventId), "Event not cancelled");
            uint256 balance = balanceOf(msg.sender, tierId);
            uint256 claimed = refundClaims[msg.sender][tierId];

            if (balance <= claimed) revert RefundNotAvailable();

            uint256 refundAmount = (balance -  claimed) * tiers[tierId].price;
            refundClaims[msg.sender][tierId] = balance;

            // Burn refunded tickets
            _burn(msg.sender, tierId, balance - claimed);

            // Process refund (native token only for simplicity)
            (bool success, ) = payable(msg.sender).call{value: refundAmount}("");
            require(success, "Refund failed");

            emit RefundProcessed(msg.sender, tierId, refundAmount);
        }

        /**
        * @notice Withdraw funds to organizer
         */
         function withdraw() external onlyOrganizer nonReentrant {
            uint256 balance = address(this).balance;
            if (balance > 0) {
                (bool success,) = payable(organizer).call{value: balance}("");
                require(success, "Withdraw failed");
            }
         }

         /**
         * @notice Get revenue split info
         */
         function getRevenueSplit(uint256 amount) 
             external 
             view 
             returns (uint256 platformFee, uint256 organizerAmount) 
         {
             platformFee = (amount * platformFeeBps) / 10000;
             organizerAmount = amount - platformFee;
         }

         /** 
         * @notice Accepted payment tokens
          */
          function addPaymentToken(address token) external onlyOrganizer {
             acceptedTokens[token] = true;
          }

          /**
          * @notice Mark event as ended
          */
          function endEvent() external onlyOrganizer {
          }

          /**
          * @notice Get all tiers for this event
          */
          function getAllTiers() external view returns (uint256[] memory) {
              uint256 count = 0;
              for (uint256 i = 0; i < 10; i++) { // Assuming max 10 tiers
                  if (tiers[i].exists) count++;
              }
              
              uint256[] memory tierIds = new uint256[](count);
              uint256 index = 0;
              for (uint256 i = 0; i < 10; i++) {
                  if (tiers[i].exists) {
                      tierIds[index++] = i;
                  }
              }
              return tierIds;
          }

          /**
          * @notice Get tier details
          */
          function getTierDetails(uint256 tierId) 
              external 
              view 
              returns (uint256 maxSupply, uint256 minted, uint256 price, uint256 fiatPrice, bool exists) 
          {
              TicketTier memory tier = tiers[tierId];
              return (tier.maxSupply, tier.minted, tier.price, tier.fiatPrice, tier.exists);
          }

          /**
          * @notice Get user's unused ticket count
          */
          function getUnusedTickets(address user, uint256 tierId) 
              external 
              view 
              returns (uint256) 
          {
              return balanceOf(user, tierId) - usedTickets[user][tierId];
          }

          /**
          * @notice Get user's tickets across all tiers
          */
          function getUserTickets(address user) 
              external 
              view 
              returns (uint256[] memory tierIds, uint256[] memory balances) 
          {
              uint256 count = 0;
              for (uint256 i = 0; i < 10; i++) {
                  if (tiers[i].exists && balanceOf(user, i) > 0) count++;
              }
              
              tierIds = new uint256[](count);
              balances = new uint256[](count);
              uint256 index = 0;
              
              for (uint256 i = 0; i < 10; i++) {
                  if (tiers[i].exists && balanceOf(user, i) > 0) {
                      tierIds[index] = i;
                      balances[index] = balanceOf(user, i);
                      index++;
                  }
              }
          }

          /**
          * @notice emergency pause
          */
          function pause() external onlyOrganizer {
            _pause();
          }

          function unpause() external onlyOrganizer {
            _unpause();
          }

          function supportsInterface(bytes4 interfaceId)
              public
              view
              override(ERC1155, AccessControl)
              returns (bool)
          {
              return super.supportsInterface(interfaceId);
          }
}


