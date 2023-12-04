// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity ^0.8.20;

contract FutureExchange3 {

    event SellFutureWETH (
        address indexed seller, 
        uint256 amount, 
        uint256 price, 
        uint256 timestamp, 
        uint256 maturityTime
    );
    event BuyFutureWETH (
        address indexed seller, 
        uint256 amount, 
        uint256 price, 
        uint256 timestamp, 
        uint256 maturityTime
    );
    event CreateTraderAccount(
        address indexed trader,
        uint256 timestamp
    );
    event TraderContractsSettled (
        address indexed trader, 
        int256 assetsRemained, 
        uint256 priceReturned
    );
    
    AggregatorV3Interface internal priceFeed;
    IERC20 internal USDCtoken;

    enum Process { Buy, Sell }
    enum Status { Created, Settled }

    uint256 public lastSettlementDate;
    uint256 prePaymentPercentage = 5;

    struct Contract {
        address trader;
        Process process;
        Status status;
        uint256 assetAmount;
        uint256 pricePaid;
        uint256 valueAtCreation;
        uint256 settlementTime;
    }

    mapping (address => bytes32[]) addressToContractIds;
    mapping (bytes32 => Contract) contractIdToContract;

    address[] traders;
    mapping(address => uint256) traderUSDCBalance;
    mapping(address => bool) isTrader;
    mapping(address => uint256) tradersSecurityAmount;
    // in case of buy, we will subtract (current future rate * number of assets)
    mapping(address => int256) futureCumulativeSum; // handle int256 carefully
    mapping(address => int256) netAssetsOwned; // handle int256 carefully

    // execution time => specific slot assets sold
    mapping (uint256 => uint256) totalAssetsSold;
    mapping (uint256 => uint256) totalAssetsBought;

    // execution time => futures value
    mapping (uint256 => uint256) futureValueAt;


    constructor(address _priceFeed, address _USDCtoken) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        USDCtoken = IERC20(_USDCtoken);
        lastSettlementDate = block.timestamp;
        setFuturesInitialPrice(0);
    }

    function createTraderAccount() public {
        require(!isTrader[msg.sender], "Trader already exists");

        // Transfer 10 USDC from the trader's account to the contract
        require(USDCtoken.transferFrom(msg.sender, address(this), 10 * 10**18), "Insufficient USDC balance");

        // Update the trader's USDC balance
        traderUSDCBalance[msg.sender] += 10 * 10**18;

        isTrader[msg.sender] = true;
        traders.push(msg.sender);

        emit CreateTraderAccount(msg.sender, block.timestamp);
    }

    function buyAsset(uint256 _amount, uint8 _durationSlot) public {
        require(isTrader[msg.sender], "Trader account not created");
        // _amount will be in terms of 0.1 weth
        uint256 currentFuturePrice = futureValueAt[_durationSlot];
        uint256 pricePaid = currentFuturePrice * prePaymentPercentage * _amount;

        require(USDCtoken.transferFrom(msg.sender, address(this), pricePaid * 10**10), "Insufficient USDC balance");

        tradersSecurityAmount[msg.sender] += pricePaid * 10*10;
        futureCumulativeSum[msg.sender] -= int256(currentFuturePrice * _amount * 10**10);
        netAssetsOwned[msg.sender] += 1;

        uint256 maturityTime = getExecutionTimeBySlot(_durationSlot);

        bytes32 contractId = keccak256(abi.encodePacked(msg.sender, _durationSlot, block.timestamp));

        contractIdToContract[contractId] = Contract(
            msg.sender, 
            Process.Buy, 
            Status.Created, 
            _amount, 
            pricePaid, 
            currentFuturePrice, 
            maturityTime
        );
        addressToContractIds[msg.sender].push(contractId);

        totalAssetsBought[maturityTime] += _amount;

        traders.push(msg.sender);
        isTrader[msg.sender] = true;

        // execute setFuturesPrice at the end
        updateFuturesPrice(_durationSlot);
    }

    function sellAsset(uint256 _amount, uint8 _durationSlot) public {
        // _amount will be in terms of 0.1 weth

        require(_amount > 0, "Selling amount must be greater than zero");

        uint256 currentFuturePrice = futureValueAt[_durationSlot];
        uint256 pricePaid = currentFuturePrice * _amount;

        // Transfer WETH to the seller
        require(USDCtoken.transferFrom(msg.sender, address(this), pricePaid * 10**10), "Insufficient USDC balance");

        tradersSecurityAmount[msg.sender] += pricePaid * 10*10;
        futureCumulativeSum[msg.sender] += int256(currentFuturePrice * _amount * 10**10);
        netAssetsOwned[msg.sender] -= 1;

        uint256 maturityTime = getExecutionTimeBySlot(_durationSlot);

        bytes32 contractId = keccak256(abi.encodePacked(msg.sender, _durationSlot, block.timestamp));

        contractIdToContract[contractId] = Contract(
            msg.sender,
            Process.Sell,
            Status.Created,
            _amount,
            pricePaid,
            currentFuturePrice,
            maturityTime
        );
    
        addressToContractIds[msg.sender].push(contractId);

        totalAssetsSold[maturityTime] += _amount;

        traders.push(msg.sender);
        isTrader[msg.sender] = true;

        // Execute setFuturesPrice at the end
        updateFuturesPrice(_durationSlot);
    }


    function settleAllContracts() public {
        // will be invoked by first chainlink automation

        // 9 days have passed for the traders to buy and sell.

        // for the traders who have not settled their assets yet, we will automatically settle their future contracts for the current price

        // make a mapping which will keep track of how many assets the user is supposed to buy or sell in order to neutralize the account

        uint256 maturityTime = getExecutionTimeBySlot(0);
        uint256 traderCount = traders.length;
        for(uint i=0; i<traderCount; i++) {
            address trader = traders[i];
            if(netAssetsOwned[trader] < 0) { // sells more than buys
                int256 assetsToPurchase = netAssetsOwned[trader];
                int256 usdcToBePaid = assetsToPurchase * int256(futureValueAt[maturityTime] * 10**10);
                int256 netFutureCumulative = futureCumulativeSum[trader] - usdcToBePaid;
                if(netFutureCumulative < 0) { // loss
                    uint256 positiveNetFutureCumulative = uint256(netFutureCumulative * (-1));
                    // if(tradersSecurityAmount[trader] > positiveNetFutureCumulative) {
                    //     emit LessSecurityProvided!!()
                    // }
                    require(tradersSecurityAmount[trader] > positiveNetFutureCumulative, "less security provided");
                    // all set. put the remaining tokens in the traders account
                    traderUSDCBalance[trader] += tradersSecurityAmount[trader] - positiveNetFutureCumulative;
                    
                } else { // profit
                    // all set. put the remaining tokens in the traders account
                    traderUSDCBalance[trader] += tradersSecurityAmount[trader] + uint256(netFutureCumulative);
                }
                // emit the event that this trader has been settled!!
            } else { // buys more than sell
                int256 assetsToSell = netAssetsOwned[trader];
                int256 usdcToReceive = assetsToSell * int256(futureValueAt[maturityTime] * 10**10);
                int256 netFutureCumulative = futureCumulativeSum[trader] + usdcToReceive;
                if(netFutureCumulative < 0) { // loss
                    uint256 positiveNetFutureCumulative = uint256(netFutureCumulative * (-1));
                    require(tradersSecurityAmount[trader] > positiveNetFutureCumulative, "less security provided");
                    // all set. put the remaining tokens in the traders account
                    traderUSDCBalance[trader] += tradersSecurityAmount[trader] - positiveNetFutureCumulative;
                    
                } else { // profit
                    // all set. put the remaining tokens in the traders account
                    traderUSDCBalance[trader] += tradersSecurityAmount[trader] + uint256(netFutureCumulative);
                }
                // emit the event that this trader has been settled!!
            }
        }

    }

    function startNewSlot() public {
        // will be called by second chainlink automation


    }

    function setFuturesInitialPrice(uint8 _durationSlot) internal {
        uint256 maturityTime = getExecutionTimeBySlot(_durationSlot);
        uint256 currentPrice = getPrice();
        futureValueAt[maturityTime] = currentPrice;
    } 

    // execute this function each time any new selling or buying takes place
    function updateFuturesPrice(uint8 _durationSlot) internal {
        uint256 maturityTime = getExecutionTimeBySlot(_durationSlot);
        // if more assets are bought => moore demand => price must rise
        uint256 netDemand = totalAssetsBought[maturityTime] - totalAssetsBought[maturityTime];
        // New futures price = Current futures price + (Net demand * Adjustment factor)
        // adjustment factor for weth be 0.1
        futureValueAt[maturityTime] = futureValueAt[maturityTime] + netDemand/10;
    }

    function updateLastSettlementDate() public {
        lastSettlementDate = lastSettlementDate + 10 days;
        // also along with this set the future's initial price
    }

    // function to get the current WETH price
    function getPrice() public view returns(uint256) {
        // (, int answer, , ,) = priceFeed.latestRoundData();
        // return uint256(answer);
        return 150000000000;
    }

    function getLastSettlementDate() public view returns(uint256) {
        return lastSettlementDate;
    }

    function getExecutionTimeBySlot(uint8 _durationSlot) public view returns(uint256) {
        uint256 maturityTime = getLastSettlementDate() + (10 days) * _durationSlot;
        return maturityTime;
    }

}