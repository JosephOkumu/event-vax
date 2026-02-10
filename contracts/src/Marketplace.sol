// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC1155/IERC1155.sol";
import "@openzeppelin/contracts/token/ERC1155/utils/ERC1155Holder.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

interface ITicketNFT {
    function organizer() external view returns (address);
}

/**
* @title Marketplace
* @notice Secondary market for ticket resale with anti-scalping measures
* @dev Implements escrow-based custody and forced royalties 
*/
contract Marketplace is ERC1155Holder, ReentrancyGuard, Pausable, AccessControl {
    bytes32 public constant PLATFORM_ADMIN = keccak256("PLATFORM_ADMIN");

    struct Listing {
        address seller;
        address ticketContract;
        uint256 tierId;
        uint256 amount;
        uint256 price;
        uint256 listedAt;
        bool active;
    }

    uint256 public nextListingId;
    mapping(uint256 => Listing) public listings;

    // Anti-scalping: time lock before resale
    uint256 public constant LOCK_PERIOD = 1 days;
    
    // Price cap: mx 120% of original price
    uint256 public constant MAX_MARKUP_BPS = 12000; // 120%

    // Platform fee: 2.5%
    uint256 public platformFeeBps = 250;

    // Organizer royalty: 1.5%
    uint256 public royaltyBps = 150;

    address public treasury;

    // ticketContract => tierId => original price
    mapping(address => mapping(uint256 => uint256)) public originalPrices;

    // ticketContract => tierId => user => resale count
    mapping(address => mapping(uint256 => mapping(uint256 => uint256))) public resaleCount;
    uint256 public constant MAX_RESALES = 3;

    event Listed(
        uint256 indexed listingId,
        address indexed seller,
        address ticketContract,
        uint256 tierId,
        uint256 amount,
        uint256 price
    );

    event Sold(
        uint256 indexed listingId,
        address indexed buyer,
        address indexed seller,
        uint256 price
    );

    event ListingCancelled(uint256 indexed listingId);
    event PriceUpdated(uint256 indexed listingId, uint256 oldPrice, uint256 newPrice);

    error ListingNotActive();
    error Unauthorized();
    error LockPeriodActive();
    error PriceExceedsCap();
    error InsufficientPayment();
    error MaxResalesReached();
    error InvalidAmount();

    constructor(address _treasury) {
        treasury = _treasury;
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(PLATFORM_ADMIN, msg.sender);
    }

    /**
    * @notice List ticket for resale
    * @param ticketContract Address of TicketNFT contract
    * @param tierId Ticket tier ID
    * @param amount Number of tickets to sell
    * @param price Total asking price
     */
     function listTicket(
        address ticketContract,
        uint256 tierId,
        uint256 amount,
        uint256 price
     )  external nonReentrant whenNotPaused returns (uint256 listingId) {
        if (amount == 0) revert InvalidAmount();

        // Check resale limit 
        if (resaleCount[ticketContract][tierId][uint256(uint160(msg.sender))] >= MAX_RESALES) {
            revert MaxResalesReached();
        }

        // Verify price cap (120% of original)
        uint256 originalPrice = originalPrices[ticketContract][tierId];
        if (originalPrice > 0) {
            uint256 maxPrice = (originalPrice * amount * MAX_MARKUP_BPS) / 10000;
            if (price > maxPrice) revert PriceExceedsCap();
        }

        // Transfer tickets to escrow
        IERC1155(ticketContract).safeTransferFrom(
            msg.sender,
            address(this),
            tierId,
            amount,
            ""
        );

        listingId = ++nextListingId;

        listings[listingId] = Listing({
            seller: msg.sender,
            ticketContract: ticketContract,
            tierId: tierId,
            amount: amount,
            price: price,
            listedAt: block.timestamp,
            active: true
        });

        emit Listed(listingId, msg.sender, ticketContract, tierId, amount, price);
     }

     /**
     * @notice Buy listed ticket
     * @param listingId ID of the listing
     */
     function buyTicket(uint256 listingId) 
        external
        payable
        nonReentrant
        whenNotPaused
    {
        Listing storage listing = listings[listingId];

        if (!listing.active) revert ListingNotActive();

        // Enforce time lock (anti-scalping)
        if (block.timestamp < listing.listedAt + LOCK_PERIOD) {
            revert LockPeriodActive();
        }

        if (msg.value < listing.price) revert InsufficientPayment();

        // Mark as sold
        listing.active = false;

        // Calculate fees
        uint256 platformFee = (listing.price * platformFeeBps) / 10000;
        uint256 royaltyFee = (listing.price * royaltyBps) / 10000;
        uint256 sellerProceeds = listing.price - platformFee - royaltyFee;

        // Transfer funds
        (bool success1,) = payable(treasury).call{value: platformFee}("");
        require(success1, "Treasury transfer failed");

        // Transfer royalty to original organizer
        address organizer = ITicketNFT(listing.ticketContract).organizer();
        (bool success2,) = payable(organizer).call{value: royaltyFee}("");
        require(success2, "Royalty transfer failed");
        (bool success3,) = payable(listing.seller).call{value: sellerProceeds}("");
        require(success3, "Seller transfer failed");

        // Transfer ticket to buyer
        IERC1155(listing.ticketContract).safeTransferFrom(
            address(this),
            msg.sender,
            listing.tierId,
            listing.amount,
            ""
        );

        // Increment resale count
        resaleCount[listing.ticketContract][listing.tierId][uint256(uint160(listing.seller))]++;

        // Refund excess
        if (msg.value > listing.price) {
            (bool success,) = payable(msg.sender).call{value: msg.value - listing.price}("");
            require(success, "Refund failed");
        }

        emit Sold(listingId, msg.sender, listing.seller, listing.price);
     }

        /**
        * @notice Cancel listing and return ticket
        */
        function cancelListing(uint256 listingId) external nonReentrant {
            Listing storage listing = listings[listingId];

            if (msg.sender != listing.seller) revert Unauthorized();
            if (!listing.active) revert ListingNotActive();

            listing.active = false;

            // Return ticket to seller
            IERC1155(listing.ticketContract).safeTransferFrom(
                address(this),
                listing.seller,
                listing.tierId,
                listing.amount,
                ""
            );
            
            emit ListingCancelled(listingId);
        }

        /**
        * @notice Update listing price (must still respect cap)
         */
         function updatePrice(uint256 listingId, uint256 newPrice) external {
            Listing storage listing = listings[listingId];

            if (msg.sender != listing.seller) revert Unauthorized();
            if (!listing.active) revert ListingNotActive();

            // Verify new price against cap
            uint256 originalPrice = originalPrices[listing.ticketContract][listing.tierId];
            if (originalPrice > 0) {
                uint256 maxPrice = (originalPrice * listing.amount * MAX_MARKUP_BPS) / 10000;
                if (newPrice > maxPrice) revert PriceExceedsCap();
             }

             uint256 oldPrice = listing.price;
             listing.price = newPrice;

             emit PriceUpdated(listingId, oldPrice, newPrice);
         }

         /**
         * @notice Set original ticket prices (called by TicketNFT contracts)
          */
        function setOriginalPrice(uint256 tierId, uint256 price) external {
            originalPrices[msg.sender][tierId] = price;
        }

        /**
        * @notice Update platform fee
        */
        function setPlatformFee(uint256 _feeBps) external onlyRole(PLATFORM_ADMIN) {
            require(_feeBps <= 1000, "Fee too high"); // Max 10%
            platformFeeBps = _feeBps;
        }

        /**
        * @notice Update royalty rate
        */
        function setRoyaltyBps(uint256 _royaltyBps) external onlyRole(PLATFORM_ADMIN) {
            require(_royaltyBps <= 500, "Royalty too high"); // Max 5%
            royaltyBps = _royaltyBps;
        }

        /**
        * @notice Get all active listings
        */
        function getActiveListings() external view returns (uint256[] memory) {
            uint256 count = 0;
            for (uint256 i = 1; i <= nextListingId; i++) {
                if (listings[i].active) count++;
            }
            
            uint256[] memory activeIds = new uint256[](count);
            uint256 index = 0;
            for (uint256 i = 1; i <= nextListingId; i++) {
                if (listings[i].active) {
                    activeIds[index++] = i;
                }
            }
            return activeIds;
        }

        /**
        * @notice Get listing details
        */
        function getListing(uint256 listingId) external view returns (Listing memory) {
            return listings[listingId];
        }

        /**
        * @notice Emergency pause
        */
        function pause() external onlyRole(PLATFORM_ADMIN) {
            _pause();
        }

        function unpause() external onlyRole(PLATFORM_ADMIN) {
            _unpause();
        }

        function supportsInterface(bytes4 interfaceId)
            public
            view
            override(ERC1155Holder, AccessControl)
            returns (bool)
        {
            return super.supportsInterface(interfaceId);
        }
}
