// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {TicketNFT} from "../src/TicketNFT.sol";
import {EventFactory} from "../src/EventFactory.sol";
import {EventManager} from "../src/EventManager.sol";
import {Marketplace} from "../src/Marketplace.sol";
import {QRVerificationSystem} from "../src/QRVerificationSystem.sol";
import {POAP, EventBadge} from "../src/PoapAndBadgeSystem.sol";
import {MetadataRegistry} from "../src/MetadataRegistry.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        
        console.log("Deploying contracts with account:", deployer);
        console.log("Account balance:", deployer.balance);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy TicketNFT implementation
        TicketNFT ticketImplementation = new TicketNFT();
        console.log("TicketNFT Implementation:", address(ticketImplementation));

        // 2. Deploy EventManager
        EventManager eventManager = new EventManager();
        console.log("EventManager:", address(eventManager));

        // 3. Deploy Marketplace
        Marketplace marketplace = new Marketplace(deployer); // deployer as treasury
        console.log("Marketplace:", address(marketplace));

        // 4. Deploy EventFactory
        EventFactory factory = new EventFactory(
            address(ticketImplementation),
            deployer, // treasury
            address(eventManager),
            address(marketplace)
        );
        console.log("EventFactory:", address(factory));

        // 5. Grant EVENT_ADMIN role to factory
        eventManager.grantRole(eventManager.EVENT_ADMIN(), address(factory));
        console.log("Granted EVENT_ADMIN role to factory");

        // 6. Deploy MetadataRegistry
        MetadataRegistry registry = new MetadataRegistry();
        console.log("MetadataRegistry:", address(registry));

        // 7. Deploy QRVerificationSystem
        QRVerificationSystem qrSystem = new QRVerificationSystem();
        qrSystem.setEventManager(address(eventManager));
        qrSystem.setMetadataRegistry(address(registry));
        console.log("QRVerificationSystem:", address(qrSystem));

        // 8. Deploy POAP
        POAP poap = new POAP();
        poap.grantRole(poap.VERIFIER_ROLE(), address(qrSystem));
        console.log("POAP:", address(poap));

        // 9. Deploy EventBadge
        EventBadge badge = new EventBadge();
        console.log("EventBadge:", address(badge));

        vm.stopBroadcast();

        console.log("\n=== Deployment Summary ===");
        console.log("TicketNFT Implementation:", address(ticketImplementation));
        console.log("EventManager:", address(eventManager));
        console.log("Marketplace:", address(marketplace));
        console.log("EventFactory:", address(factory));
        console.log("QRVerificationSystem:", address(qrSystem));
        console.log("POAP:", address(poap));
        console.log("EventBadge:", address(badge));
        console.log("MetadataRegistry:", address(registry));
    }
}
