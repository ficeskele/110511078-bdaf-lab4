// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./NewSimplesafe.sol";
import "./Proxy.sol";

contract SafeFactory {
    // Address of the safe implementation contract
    address public safeImpl;
    // Address of the owner of the factory contract
    address private owner;
    // Address of deployed safe
    address[] private deploySafeAddr;
    // Address of deployed proxy
    address[] private deployProxyAddr;

    event CreateContract(address _contract);
    event ImpleUpdated(address newImplementation);

    constructor(address _implementation) {
        owner = msg.sender;
        safeImpl = _implementation;
    }

    modifier onlyOwner {
        require(msg.sender == owner, "Only the owner can call this function.");
        _;
    }

    function updateImplementation(address _newImpl) external onlyOwner {
        require(_newImpl != address(0),"New implementation address cannot be zero.");
        safeImpl = _newImpl;
    }

    function deploySafeProxy() external returns (address) {
        Proxy proxy = new Proxy(safeImpl, msg.sender);
        emit CreateContract(address(proxy));
        deployProxyAddr.push(address(proxy));
        return address(proxy);
    }

    function deploySafe() external returns (address){
        NewSimplesafe newSimplesafe = new NewSimplesafe(msg.sender);
        emit CreateContract(address(newSimplesafe));
        deploySafeAddr.push(address(newSimplesafe));
        return address(newSimplesafe);
    }

    // return Address of deployed safe
    function getdeploySafeAddr(uint256 index) external view returns (address) {
        require(index < deploySafeAddr.length, "Invalid index");
        return deploySafeAddr[index];
    }

    // return Address of deployed proxy
    function getdeployProxyAddr(uint256 index) external view returns (address) {
        require(index < deployProxyAddr.length, "Invalid index");
        return deployProxyAddr[index];
    }

    // return current owner
    function OWNER() external view returns (address) {
        return owner;
    }
}

