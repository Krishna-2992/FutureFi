// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity ^0.8.20;

contract FutureExchange4 {

    AggregatorV3Interface internal priceFeed;
    IERC20 internal USDCtoken;

    uint256 public lastSettlementDate;

    address[] traders;
    mapping(address => uint256) traderUSDCBalance;
    mapping(address => bool) isTrader;

    constructor(address _priceFeed, address _USDCtoken) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        USDCtoken = IERC20(_USDCtoken);
        lastSettlementDate = block.timestamp;
        // setFuturesInitialPrice(0);
    }

    function createTraderAccount() public {
        require(!isTrader[msg.sender], "Trader already exists");

        // Transfer 10 USDC from the trader's account to the contract
        require(USDCtoken.transferFrom(msg.sender, address(this), 10 * 10**18), "Insufficient USDC balance");

        // Update the trader's USDC balance
        traderUSDCBalance[msg.sender] += 10 * 10**18;

        isTrader[msg.sender] = true;
        traders.push(msg.sender);
    }





}