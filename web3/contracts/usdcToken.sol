// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract USDCToken is ERC20 {

    constructor() ERC20('USD Token', "USDC") {}

    function mint(uint256 _amount) public {
        _mint(msg.sender, _amount);
    }

}