// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/QRVerificationSystem.sol";

/**
 * @title SetMetadataRegistry
 * @notice Script to connect MetadataRegistry to QRVerificationSystem
 */
contract SetMetadataRegistry is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address qrVerification = vm.envAddress("QR_VERIFICATION");
        address metadataRegistry = vm.envAddress("METADATA_REGISTRY");
        
        vm.startBroadcast(deployerPrivateKey);

        QRVerificationSystem qrSystem = QRVerificationSystem(qrVerification);
        qrSystem.setMetadataRegistry(metadataRegistry);
        
        console.log("MetadataRegistry connected to QRVerificationSystem");
        console.log("   QRVerification:", qrVerification);
        console.log("   MetadataRegistry:", metadataRegistry);

        vm.stopBroadcast();
    }
}
