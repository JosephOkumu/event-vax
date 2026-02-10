// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
/**
 * @title EventManager
 * @notice Manages event lifecycle and metadata
 * @dev Central registry for event state and validation
 */
contract EventManager is AccessControl, Pausable {
    bytes32 public constant EVENT_ADMIN = keccak256("EVENT_ADMIN");

    enum EventState {
        Draft, // Initial state
        Active, // Sales live
        Ended, // Event Completed
        Cancelled // Event cancelled
    }

    struct EventDetails {
        uint256 eventId;
        address organizer;
        address ticketContract;
        uint256 startTime;
        uint256 endTime;
        uint256 createdAt;
        EventState state;
        bool exists;
    }

    // eventId => EventDetails
    mapping(uint256 => EventDetails) public events;

    // organizer => eventId[]
    mapping(address => uint256[]) public organizerEvents;

    // Total event count
    uint256 public totalEvents;

    // State transition tracking
    mapping(uint256 => mapping(EventState => uint256)) public stateTransitions;

    event EventRegistered(
        uint256  indexed eventId,
        address indexed organizer,
        address ticketContract,
        uint256 startTime,
        uint256 endTime
    );

    event EventStateChanged(
        uint256 indexed eventId,
        EventState previousState,
        EventState newState
    );

    event EventMetadataUpdated(
        uint256 indexed eventId,
        uint256 startTime,
        uint256 endTime
    );

    error EventNotFound();
    error InvalidTransition();
    error Unauthorized();
    error InvalidTimestamp();
    error EventAlreadyExists();

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(EVENT_ADMIN, msg.sender);
    } 

    /**
    * @notice Register new event
    * @dev Called by EventFactory during creation
    */
    function registerEvent(
        uint eventId,
        address organizer,
        address ticketContract,
        uint256 startTime,
        uint256 endTime
    ) external onlyRole(EVENT_ADMIN) {
        if (events[eventId].exists) revert EventAlreadyExists();
        if (startTime >= endTime) revert InvalidTimestamp();
        if (endTime <= block.timestamp) revert InvalidTimestamp();

        events[eventId] = EventDetails({
            eventId: eventId,
            organizer: organizer,
            ticketContract: ticketContract,
            startTime: startTime,
            endTime: endTime,
            createdAt: block.timestamp,
            state: EventState.Draft,
            exists: true
        });

        organizerEvents[organizer].push(eventId);
        totalEvents++;

        emit EventRegistered(eventId, organizer, ticketContract, startTime, endTime);
    }

    /**
    * @notice Activate event (enable ticket sales)
   */

    function activateEvent(uint256 eventId) external {
        EventDetails storage ev = events[eventId];

        if (!ev.exists) revert EventNotFound();
        if (msg.sender != ev.organizer) revert Unauthorized();
        if (ev.state != EventState.Draft) revert InvalidTransition();

        ev.state = EventState.Active;
        stateTransitions[eventId][EventState.Active] = block.timestamp;

        emit EventStateChanged(eventId, EventState.Draft, EventState.Active);
    }

    /**
    * @notice End event
     */
    function endEvent(uint256 eventId) external {
        EventDetails storage ev = events[eventId];
        if (msg.sender != ev.organizer && !hasRole(EVENT_ADMIN, msg.sender)) {
            revert Unauthorized();
        }
        if (ev.state != EventState.Active) revert InvalidTransition();

        EventState previousState = ev.state;
        ev.state = EventState.Ended;
        stateTransitions[eventId][EventState.Ended] = block.timestamp;

        emit EventStateChanged(eventId, previousState, EventState.Ended);
    } 
    
    /**
    * @notice Cancel event
    */
    function cancelEvent(uint256 eventId) external {
        EventDetails storage ev = events[eventId];

        if (!ev.exists) revert EventNotFound();
        if (msg.sender != ev.organizer && !hasRole(EVENT_ADMIN, msg.sender)) {
            revert Unauthorized();
        }
        if (ev.state == EventState.Ended) revert InvalidTransition();

        EventState previousState = ev.state;
        ev.state = EventState.Cancelled;
        stateTransitions[eventId][EventState.Cancelled] = block.timestamp;

        emit EventStateChanged(eventId, previousState, EventState.Cancelled);
    }

    /**
     * @notice Update event times (only in Draft state)
    */
    function updateEventMetadata(
        uint256 eventId,
        uint256 newStartTime,
        uint256 newEndTime
    ) external {
        EventDetails storage ev = events[eventId];

        if (!ev.exists) revert EventNotFound();
        if (msg.sender != ev.organizer) revert Unauthorized();
        if (ev.state != EventState.Draft) revert InvalidTransition();
        if (newStartTime >= newEndTime) revert InvalidTimestamp();
        if (newEndTime <= block.timestamp) revert InvalidTimestamp();

        ev.startTime = newStartTime;
        ev.endTime = newEndTime;

        emit EventMetadataUpdated(eventId, newStartTime, newEndTime);
    }

    /**
    * @notice Check if event is active
    */
    function isEventEnded(uint256 eventId) external view returns (bool) {
        return events[eventId].state == EventState.Ended;
    }

    /**
     * @notice Check if event is cancelled
     */
     function isEventCancelled(uint256 eventId) external view returns (bool) {
        return events[eventId].state == EventState.Cancelled;
     }

     /**
      * @notice Get event details
    */
    function getEventDetails(uint256 eventId)
        external
        view
        returns (EventDetails memory)
    {
        if (!events[eventId].exists) revert EventNotFound();
        return events[eventId];
    }

    /**
     * @notice Get all events by organizer 
     */
     function getOrganizerEvents(address organizer)
        external
        view
        returns (uint256[] memory)
    {
        return organizerEvents[organizer];
    }

    /**
    * @notice Verify event and state
    */
    function verifyEventState(uint256 eventId, EventState requiredState)
        external
        view
        returns (bool)
    {
        return events[eventId].exists && events[eventId].state == requiredState;
    }

    /**
    * @notice Get all active events
    */
    function getActiveEvents() external view returns (uint256[] memory) {
        uint256 count = 0;
        for (uint256 i = 1; i <= totalEvents; i++) {
            if (events[i].exists && events[i].state == EventState.Active) {
                count++;
            }
        }
        
        uint256[] memory activeIds = new uint256[](count);
        uint256 index = 0;
        for (uint256 i = 1; i <= totalEvents; i++) {
            if (events[i].exists && events[i].state == EventState.Active) {
                activeIds[index++] = i;
            }
        }
        return activeIds;
    }

    /**
    * @notice Get all events (paginated)
    */
    function getAllEvents(uint256 offset, uint256 limit) 
        external 
        view 
        returns (EventDetails[] memory) 
    {
        uint256 end = offset + limit;
        if (end > totalEvents) end = totalEvents;
        
        uint256 resultCount = 0;
        for (uint256 i = offset + 1; i <= end; i++) {
            if (events[i].exists) resultCount++;
        }
        
        EventDetails[] memory result = new EventDetails[](resultCount);
        uint256 index = 0;
        for (uint256 i = offset + 1; i <= end; i++) {
            if (events[i].exists) {
                result[index++] = events[i];
            }
        }
        return result;
    }

    /**
     * @notice Emergency pause
     */
     function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
     }

     function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
     }
}