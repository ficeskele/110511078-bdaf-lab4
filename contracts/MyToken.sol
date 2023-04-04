//SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
contract myToken is ERC20{ 
    address public owner;
    constructor() ERC20("myToken", "ICE") {
        _mint(msg.sender, 920130 * 10 ** decimals());
         owner = msg.sender;
    }
}
