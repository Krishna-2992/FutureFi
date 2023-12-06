// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract SimpleCounter { 
    uint public counted = 0;

    function count() public {
        counted += 1;
    }
}