// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";

contract Ticket is ERC721 {
    address public owner;
    uint256 public totalOccassions;
    uint256 public totalSupply;

    struct Occassion {
        uint256 id;
        string title;
        uint256 price;
        uint256 tickets;
        uint256 maxTickets;
        string date;
        string time;
        string location;
        uint256 maxResalePrice;
    }

    struct TicketInfo {
        uint256 occasionId;
        uint256 seatNumber;
        bool isForSale;
        uint256 resalePrice;
        address originalOwner; 
    }

    mapping(uint256 => Occassion) occasions;
    mapping(uint256 => mapping(address => bool)) public hasBought;
    mapping(uint256 => mapping(uint256 => address)) public seatTaken;
    mapping(uint256 => uint256[]) seatsTaken;
    mapping(uint256 => TicketInfo) public ticketDetails;

    event TicketListedForSale(uint256 tokenId, uint256 price);
    event TicketSold(uint256 tokenId, address from, address to, uint256 price);
    event TicketUnlisted(uint256 tokenId);
    
        /**
 * @notice Restricts function access to only the contract owner
 * @dev Throws if called by any account other than the owner
 */
    modifier onlyOwner {
        require(msg.sender == owner, "Caller is not the owner");
        _;
    }

    /**
     * @notice Restricts function access to only the ticket owner
     * @dev Throws if called by any account other than the ticket owner
     */
    modifier onlyTicketOwner(uint256 tokenId) {
        require(ownerOf(tokenId) == msg.sender, "Caller is not the ticket owner");
        _;
    }

    constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {
        owner = msg.sender;
    }
    /// @notice Creates a new event occasion with specified details
/// @param _title Name of the event
/// @param _price Cost per ticket in wei
/// @param _maxTickets Maximum number of tickets available
/// @param _date Date of the event
/// @param _time Time of the event
/// @param _location Location where event will be held
/// @dev Only callable by contract owner
   function list(
    string memory _title,
    uint256 _price,
    uint256 _maxTickets,
    string memory _date,
    string memory _time,
    string memory _location,
    uint256 _maxResalePrice
   ) public onlyOwner {
    totalOccassions++;
    occasions[totalOccassions] = Occassion(
        totalOccassions,
        _title,
        _price,
        0, // initial tickets value
        _maxTickets,
        _date,
        _time,
        _location,
        _maxResalePrice
    );
}
/// @notice Mints a new ticket NFT for a specific occasion and seat
/// @param _id The ID of the occasion to mint a ticket for
/// @param _seat The seat number to assign to the ticket
/// @dev Requires sufficient ETH payment, valid occasion ID, and available seat
/// @dev Updates occasion tickets count, seat assignments and total supply
 function mint(uint256 _id, uint256 _seat) public payable {
    // Checking that id is not 0 or less than total occassions...
    require(_id != 0, "Occasion ID must be greater than 0");
    require(_id <= totalOccassions, "Occasion ID exceeds total occasions");

    // Require that ETH sent is greater than cost...
    require(msg.value >= occasions[_id].price, "Insufficient ETH sent for the occasion");

    // Require that the seat is not taken, and the seats exists...
    require(_seat < occasions[_id].maxTickets, "Seat number exceeds max tickets");
    require(seatTaken[_id][_seat] == address(0), "Seat is already taken");

    occasions[_id].tickets -= 1; //Updating ticket count
    hasBought[_id][msg.sender] = true; // Update buying status
    seatTaken[_id][_seat] = msg.sender; // Assigning seat
    seatsTaken[_id].push(_seat); // Update seats currently taken
    totalSupply++;

    // Create ticket details
    ticketDetails[totalSupply] = TicketInfo({
        occasionId: _id,
        seatNumber: _seat,
        isForSale: false,
        resalePrice: 0,
        originalOwner: msg.sender
    });

    _safeMint(msg.sender, totalSupply);
 }

 function listTicketForSale(uint256 tokenId, uint256 price) public onlyTicketOwner(tokenId) {
    TicketInfo storage ticket = ticketDetails[tokenId];
    Occassion storage occasion = occasions[ticket.occasionId];

    require(!ticket.isForSale, "Ticket already listed for sale");
    require(price <= occasion.maxResalePrice, "Price exceeds maximum allowed");

    ticket.isForSale = true;
    ticket.resalePrice = price;

    emit TicketListedForSale(tokenId, price);
}

// Remove ticket from sale
function unlistTicket(uint256 tokenId) public onlyTicketOwner(tokenId) {
    TicketInfo storage ticket = ticketDetails[tokenId];
    require(ticket.isForSale, "Ticket not listed for sale");

    ticket.isForSale = false;
    ticket.resalePrice = 0;

    emit TicketUnlisted(tokenId); 
}

// Purchase a resale ticket
    function buyResaleTicket(uint256 tokenId) public payable {
        TicketInfo storage ticket = ticketDetails[tokenId];
        require(ticket.isForSale, "Ticket not for sale");
        require(msg.value >= ticket.resalePrice, "Insufficient payment");
        
        address seller = ownerOf(tokenId);
        require(msg.sender != seller, "Cannot buy your own ticket");

        // Update ticket details
        ticket.isForSale = false;
        uint256 resalePrice = ticket.resalePrice;
        ticket.resalePrice = 0;

        // Transfer ownership
        _transfer(seller, msg.sender, tokenId);

        // Update seat tracking
        seatTaken[ticket.occasionId][ticket.seatNumber] = msg.sender;
        hasBought[ticket.occasionId][msg.sender] = true;

        // Transfer payment to seller
        (bool success, ) = payable(seller).call{value: resalePrice}("");
        require(success, "Transfer to seller failed");

        emit TicketSold(tokenId, seller, msg.sender, resalePrice);
    }

    // Getting ticket details
    function getTicketDetails(uint256 tokenId) public view returns (
        uint256 occasionId,
        uint256 seatNumber,
        bool isForSale,
        uint256 resalePrice,
        address originalOwner
    ) {
        TicketInfo storage ticket = ticketDetails[tokenId];
        return (
            ticket.occasionId,
            ticket.seatNumber,
            ticket.isForSale,
            ticket.resalePrice,
            ticket.originalOwner
        );
    }

    // Checking if the ticket is for sale
    function isTicketForSale(uint256 tokenId) public view returns (bool, uint256) {
        TicketInfo memory ticket = ticketDetails[tokenId];
        return (ticket.isForSale, ticket.resalePrice);
    }
/// @notice Allows the owner to withdraw all ETH from the contract
/// @dev Uses low-level call to transfer ETH balance to owner
/// @custom:security Non-reentrant by default since state changes happen before transfer
 function withdraw() public onlyOwner {
    (bool success,) = owner.call{value: address(this).balance}("");
    require(success);
 }
}
