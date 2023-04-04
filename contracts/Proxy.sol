// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;


contract Proxy {
    mapping(address => mapping(address => uint256)) public balances;
    address public owner;
    mapping(address => uint256) public tokenFee ;
    uint public Totaltax;
    bool public isOwnerinit = false;
    address public implementation;

    // unstructured storage 
    bytes32 private constant IMPLEMENTATION_SLOT = keccak256("ICELIN_LAB4");
    bytes32 private constant OWNER_SLOT = keccak256("LAB4OWNER");

    // argument "owner" is used to initialize the owner of the implementation  
    constructor(address _Implementation, address _Owner){
        //unstructured storage for implementation 
        _Storeimplementation(_Implementation);

        //unstructured storage for owner 
        _StoreOwner(msg.sender);

        implementation = _writeimplementation();
        owner = _writeowner();
        bytes memory encodedData = abi.encodeWithSignature("initialization(address)", _Owner);
        (,bytes memory _data) = _Implementation.delegatecall(encodedData);
    }

    // use calldata to use the fnuction in implementation
    fallback() external payable {
        _delegate(_writeimplementation());
    }

    function _writeowner() internal view returns (address impl) {
        bytes32 slot = OWNER_SLOT;
        assembly {
        impl := sload(slot)
        }
    }

    function _writeimplementation() internal view returns (address impl) {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
        impl := sload(slot)
        }
    }

    function _Storeimplementation(address _Implementation) internal {
        bytes32 slot = IMPLEMENTATION_SLOT;
        assembly {
            sstore(slot,_Implementation)
        }
    }

    function _StoreOwner(address _owner) internal {
        bytes32 slot = OWNER_SLOT;
        assembly {
            sstore(slot,_owner)
        }
    }

    function _delegate(address _Implementation) internal {
        (,bytes memory _data) = _Implementation.delegatecall(msg.data);
    }
 
    function upgrade(address newImplementation) external {
        // only owner can call
        if (msg.sender != owner) revert();

        // rewrite the implementation slot
        _Storeimplementation(newImplementation);
        implementation = _writeimplementation();
    }

    //return the owner of the contract
    function OWNER() external view returns (address) {
        return owner;
    }

    //return the implemention pointed by proxy
    function getimplementation() external view returns (address) {
        return implementation;
    }

}