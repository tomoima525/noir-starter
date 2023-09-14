// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import 'forge-std/Test.sol';
import '../contract/Starter.sol';

contract StarterTest is Test {
    Starter public starter;
    UltraVerifier public verifier;

    function setUp() public {
        verifier = new UltraVerifier();
        starter = new Starter(verifier);
    }

    function testVerifyProof() public view {
        string memory proof = vm.readLine('./circuits/proofs/main.proof');
        bytes memory proofBytes = vm.parseBytes(proof);
        bytes32[] memory publicInputs = new bytes32[](4);
        publicInputs[0] = bytes32(
            0x2ca8546807e6355a4a01dbce024fd82c0ff9fd50d426da6dfdd6faf17aa15b9d
        );
        publicInputs[1] = bytes32(
            0x137f7ec30b7b7a9d88649ae6d5f80ba2c974d5b80f2ea169efa95a44685ff143
        );
        publicInputs[2] = bytes32(
            0x08d6eacdd52aecdcc5f411ef9d456a330bbe8e47fc2b1a686216b16f1b1303fe
        );

        // 16 in hex
        publicInputs[3] = bytes32(
            0x0000000000000000000000000000000000000000000000000000000000000012
        );
        bool proofResult = starter.verifyEqual(proofBytes, publicInputs);
        require(proofResult, 'Proof is not valid');
    }
}
