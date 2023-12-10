// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity ^0.8.20;

contract FutureExchange {

    event TraderAccountCreation(
        address indexed trader,
        uint256 timestamp
    );

    event BuyFutureWETH (
        address indexed seller, 
        uint256 amount, 
        uint256 futurePrice, 
        uint256 timestamp, 
        uint256 maturityTime
    );

    event SellFutureWETH (
        address indexed seller, 
        uint256 amount, 
        uint256 futurePrice, 
        uint256 timestamp, 
        uint256 maturityTime
    );

    event SettleContractsInvoked (
        uint256 timestamp
    );

    event Halted (
        uint256 timestamp, 
        bool halted
    );

    event TraderContractsSettled (
        address indexed trader, 
        uint256 maturityTime, 
        uint256 usdcReturned
    );

    event NewSlotStarted (
        uint256 timestamp
    );

    event FutureInitialPriceSet (
        uint256 timestamp, 
        uint256 futurePrice
    );

    event UpdateLastExecutionDate (
        uint256 oldExecutionDate, 
        uint256 newExecutionDate
    );

    event UsdcClaimed(
        address trader, 
        uint256 amount
    );

    event UsdcDeposited(
        address trader, 
        uint256 amount
    );

    enum Process { Buy, Sell }

    AggregatorV3Interface internal priceFeed;
    IERC20 internal USDCtoken;

    uint256 currentPrice;
    bool halted;
    uint256 public lastSettlementDate;
    uint256 prePaymentPercentage = 5;

    address[] public traders;
    mapping(address => uint256) public traderUSDCBalance;
    mapping(address => bool) public isTrader;
    mapping(address => uint256) public tradersSecurityAmount;
    mapping(address => int256) public futureCumulativeSum; // handle int256 carefully
    mapping(address => int256) public netAssetsOwned; // handle int256 carefully

    // execution time => specific slot assets sold
    mapping (uint256 => uint256) public totalAssetsSold;
    mapping (uint256 => uint256) public totalAssetsBought;

    // all the bought and sold assets of the user
    struct Contract {
        Process process;
        uint256 assetAmount;
        uint256 assetPrice;
        uint256 timestamp;
    }
    mapping (address => Contract[]) public userContracts;

    // execution time => futures value
    mapping (uint256 => uint256) public futureValueAt;

    constructor(address _priceFeed, address _USDCtoken) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        USDCtoken = IERC20(_USDCtoken);
        lastSettlementDate = block.timestamp;
        currentPrice = getPrice() * 10**10;
        setFuturesInitialPrice();
    }

    function createTraderAccount() public {
        require(!isTrader[msg.sender], "Trader already exists");

        // Transfer 10 USDC from the trader's account to the contract
        require(USDCtoken.transferFrom(msg.sender, address(this), 10 * 10**18), "Insufficient USDC balance");

        // Update the trader's USDC balance
        traderUSDCBalance[msg.sender] += 10 * 10**18;

        isTrader[msg.sender] = true;
        traders.push(msg.sender);

        emit TraderAccountCreation(msg.sender, block.timestamp);
    }

    function buyAsset(uint256 _amount, uint8 _durationSlot) public {
        require(isTrader[msg.sender], "Trader account not created");
        require(!halted, "System is in settlement phase!");
        require(traderUSDCBalance[msg.sender] >= 10*10**18, "Min 10 usdc required to trade");
        require(_amount > 0, "Buying amount must be greater than zero");

        uint256 maturityTime = getExecutionTimeBySlot(_durationSlot);
        uint256 currentFuturePrice = futureValueAt[maturityTime];
        uint256 pricePaid = currentFuturePrice * prePaymentPercentage * _amount / 100;

        require(USDCtoken.transferFrom(msg.sender, address(this), pricePaid), "Insufficient USDC balance");

        userContracts[msg.sender].push(Contract(
            Process.Buy, 
            _amount, 
            currentFuturePrice, 
            block.timestamp
        ));

        tradersSecurityAmount[msg.sender] += pricePaid;
        futureCumulativeSum[msg.sender] -= int256(currentFuturePrice * _amount);
        netAssetsOwned[msg.sender] += int256(_amount);

        totalAssetsBought[maturityTime] += _amount;

        emit BuyFutureWETH(msg.sender, _amount, currentFuturePrice, block.timestamp, maturityTime);

        // execute setFuturesPrice at the end
        updateFuturesPrice(_durationSlot);
    }

    function sellAsset(uint256 _amount, uint8 _durationSlot) public {
        // _amount will be in terms of 0.1 weth
        require(isTrader[msg.sender], "Trader account not created");
        require(!halted, "System is in settlement phase!");
        require(traderUSDCBalance[msg.sender] >= 10*10**18, "Min 10 usdc required to trade");
        require(_amount > 0, "Selling amount must be greater than zero");

        uint256 maturityTime = getExecutionTimeBySlot(_durationSlot);
        uint256 currentFuturePrice = futureValueAt[maturityTime];
        uint256 pricePaid = currentFuturePrice * prePaymentPercentage * _amount / 100;

        // Transfer WETH to the seller
        require(USDCtoken.transferFrom(msg.sender, address(this), pricePaid ), "Insufficient USDC balance");

        userContracts[msg.sender].push(Contract(
            Process.Sell, 
            _amount, 
            currentFuturePrice, 
            block.timestamp
        ));

        tradersSecurityAmount[msg.sender] += pricePaid;
        futureCumulativeSum[msg.sender] += int256(currentFuturePrice * _amount);
        netAssetsOwned[msg.sender] -= int256(_amount);

        totalAssetsSold[maturityTime] += _amount;

        emit SellFutureWETH(msg.sender, _amount, currentFuturePrice, block.timestamp, maturityTime);

        // Execute setFuturesPrice at the end
        updateFuturesPrice(_durationSlot);
    }

    function settleAllContracts() public {
        // will be invoked by first chainlink automation

        // 9 days have passed for the traders to buy and sell.

        emit SettleContractsInvoked(block.timestamp);

        halted = true;
        emit Halted(block.timestamp, true);

        uint256 maturityTime = getExecutionTimeBySlot(0);
        uint256 traderCount = traders.length;
        for(uint i=0; i<traderCount; i++) {
            address trader = traders[i];
            if(netAssetsOwned[trader] < 0) { // sells more than buys
                int256 assetsToPurchase = netAssetsOwned[trader];

                int256 usdcToBePaid = (assetsToPurchase * (-1)) * int256(futureValueAt[maturityTime]); 

                int256 netFutureCumulative = futureCumulativeSum[trader] - usdcToBePaid;

                if(netFutureCumulative < 0) { // loss
                    uint256 positiveNetFutureCumulative = uint256(netFutureCumulative * (-1));
                    // if(tradersSecurityAmount[trader] > positiveNetFutureCumulative) {
                    //     emit LessSecurityProvided!!()
                    // }
                    require(tradersSecurityAmount[trader] > positiveNetFutureCumulative, "less security amount provided");
                    // all set. put the remaining tokens in the traders account
                    traderUSDCBalance[trader] += tradersSecurityAmount[trader] - positiveNetFutureCumulative;
                    
                } else { // profit
                    // all set. put the remaining tokens in the traders account
                    uint256 amountToIncrease = tradersSecurityAmount[trader] + uint256(netFutureCumulative);

                    traderUSDCBalance[trader] += amountToIncrease;
                }
                // emit the event that this trader has been settled!!
            } else { // buys more than sell
                int256 assetsToSell = netAssetsOwned[trader];
                int256 usdcToReceive = assetsToSell * int256(futureValueAt[maturityTime]);
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
            tradersSecurityAmount[trader] = 0;
            futureCumulativeSum[trader] = 0;
            netAssetsOwned[trader] = 0;

            // emit TraderContractsSettled(trader, maturityTime, )
        }
    }
    

    function startNewSlot() public {
        // will be called by second chainlink automation
        halted = false;
        emit Halted(block.timestamp, true);
        currentPrice = getPrice();

        // update updateLastSettlementDate
        updateLastSettlementDate();
        setFuturesInitialPrice();

    }

    function setFuturesInitialPrice() internal {
        uint256 maturityTime = getExecutionTimeBySlot(0);
        futureValueAt[maturityTime] = currentPrice;
    } 

    // execute this function each time any new selling or buying takes place
    function updateFuturesPrice(uint8 _durationSlot) internal {
        uint256 maturityTime = getExecutionTimeBySlot(_durationSlot);
        // if more assets are bought => moore demand => price must rise
        int256 netDemand = int256(totalAssetsBought[maturityTime]) - int256(totalAssetsSold[maturityTime]);

        // New futures price = Current futures price + (Net demand * Adjustment factor)
        // adjustment factor for weth be 0.1
        // 1500*10**18 - 0.1*10**18 * netDemand 
        // every 1 token = 10**18 
        if(netDemand < 0) {
            futureValueAt[maturityTime] = currentPrice - uint256(netDemand * (-1)) * 10**17;
        } else {
            futureValueAt[maturityTime] = currentPrice + uint256(netDemand) * 10**17;
        }
    }

    function updateLastSettlementDate() public {
        lastSettlementDate = lastSettlementDate + 10 days;
    }

    function claimUsdc(uint256 _amount) public {
        require(isTrader[msg.sender], "ONLY TRADERS!!");
        require(traderUSDCBalance[msg.sender] > _amount, "INSUFFICIENT USDC IN TRADER ACCOUNT");
        traderUSDCBalance[msg.sender] -= _amount;
        USDCtoken.transfer(msg.sender, _amount);
    }

    function depositUsdc(uint256 _amount) public {
        require(isTrader[msg.sender], "ONLY TRADERS!!");
        require(USDCtoken.transferFrom(msg.sender, address(this), _amount ), "Insufficient USDC balance");
        traderUSDCBalance[msg.sender] += _amount;        
    }

    // function to get the current WETH price
    function getPrice() public view returns(uint256) {
        (, int answer, , ,) = priceFeed.latestRoundData();
        return uint256(answer);
    }

    function getLastSettlementDate() public view returns(uint256) {
        return lastSettlementDate;
    }

    function getExecutionTimeBySlot(uint8 _durationSlot) public view returns(uint256) {
        uint256 maturityTime = getLastSettlementDate() + (10 days) * (_durationSlot + 1);
        return maturityTime;
    }

}
