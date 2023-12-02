// SPDX-License-Identifier: MIT

import "@chainlink/contracts/src/v0.8/interfaces/AggregatorV3Interface.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

pragma solidity ^0.8.20;

////////////////////////////////////////////////////
// In this contract, I will improve the data structure of the contract and will make it more optimised and complete.
////////////////////////////////////////////////////

contract FuturesExchange2 {

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
        uint256 downpayment,
        uint256 timestamp, 
        uint256 maturityTime
    );
    event SettleFutureTrade (
        address indexed seller, 
        address indexed buyer, 
        uint256 price,
        uint256 maturityTime
    );
    event ExecuteFutureTrade (
        address indexed seller, 
        address indexed buyer, 
        uint256 price,
        uint256 maturityTime, 
        uint256 executionTime
    );
    event WETHClaimed (
        address indexed buyer, 
        uint256 timestamp
    );
    event USDCClaimed (
        address indexed seller, 
        uint256 timestamp
    );

    AggregatorV3Interface internal priceFeed;
    IERC20 internal WETHtoken;
    IERC20 internal USDCtoken;

    enum Process { Buy, Sell }
    enum Status { Created, Settled, Executed }

    uint256 public lastSettlementDate;

    struct Contract {
        address trader;
        Process process;
        Status status;
        uint256 price;
        uint256 createdAt;
        uint256 matureAt;
        uint256 valueAtCreation;
        uint256 assetDeposited;
    }

    ////////// MAPPINGS //////////////
    // contract id to contract
    mapping (bytes32 => Contract) contractIdToContract;
    // address to contractId array
    mapping (address => bytes32[]) addressToContractIds;
    // address to price to contractId (assuming only one contract per price by each user)
    mapping (address => mapping(uint256 => mapping(uint256 => bytes32))) addressPricedContractId;

    // List of buyers and sellers: 
    address[] public sellers;
    address[] public buyers;

    // Gas saver mappings: 
    mapping (address => bool) isSeller;
    mapping (address => bool) isBuyer;

    // List to available sellers/buyers at specific prices 
    mapping (uint256 => address[]) slotPriceSellers;
    mapping (uint256 => address[]) slotPriceBuyers;

    // record of how many seller/buyer have been settled for specific prices(price => index)
    mapping (uint256 => uint256) slotSellerIndex;
    mapping (uint256 => uint256) slotBuyerIndex;

    // Balance present in the traders account(they are the ultimate balance in the account of trader, can be claimed anytime!)
    mapping (address => uint256) wethBalance; 
    mapping (address => uint256) usdcBalance;

    // Future scope of creation of some variables to store the total amount of trade performed by this exchange in this slot and in overall history!!

    constructor(address _priceFeed, address _WETHtoken, address _USDCtoken) {
        priceFeed = AggregatorV3Interface(_priceFeed);
        WETHtoken = IERC20(_WETHtoken);
        USDCtoken = IERC20(_USDCtoken);
        lastSettlementDate = block.timestamp;
    }

    /**
     * @dev get your WETH locked so as to sell them at a later date
     * @param _durationSlots after how many slots to settle it(only 0 available in this contract - updates possible)
     * @param _price price(in usdc) at which asset will be sold after duration(tick size will be 100 USDC for now)
     */
    function sellOneFutureEther(uint8 _durationSlots, uint256 _price) public {
        // currently the duration can only take the value of 0
        require(_durationSlots == 0, "duration can only be zero in this contract");
        // currently price should be multiple of 100 usdc
        require(_price % 10**20 == 0, "price should be multiple of 100 usdc in this contract");

        // take the WETH token from the sender
        WETHtoken.transferFrom(msg.sender, address(this), 10**18);

        uint256 maturityTime = getLastSettlementDate() + (10 days) * _durationSlots;

        // encrypting this way ensures that same seller has not already set the same price at the same slot
        bytes32 contractId = keccak256(abi.encodePacked(msg.sender, maturityTime, _price));
        require(contractIdToContract[contractId].price == 0, "Same user can't make the same trade again with same amount and in same slot");

        // update the mappings: 
        contractIdToContract[contractId] = Contract(
            msg.sender, 
            Process.Sell, 
            Status.Created, 
            _price, 
            block.timestamp, 
            maturityTime, 
            getPrice(), 
            10**18
        );
        addressToContractIds[msg.sender].push(contractId);
        addressPricedContractId[msg.sender][maturityTime][_price] = contractId;
        isSeller[msg.sender] = true;

        sellers.push(msg.sender);

        // Settle the existing buyer with this seller if possible
        if(slotPriceBuyers[_price].length > slotBuyerIndex[_price]) {
            // make the status of both of the seller and the buyer contracts to be Settled
            address buyer = slotPriceBuyers[_price][slotBuyerIndex[_price]];
            settlePair(msg.sender, buyer, _price, maturityTime);
            slotBuyerIndex[_price]++;
        } else {
            slotPriceSellers[_price].push(msg.sender);
        }

        // emit the event for sellFutureWETH
        emit SellFutureWETH(
            msg.sender, 
            10**18,
            _price, 
            block.timestamp, 
            maturityTime
        );

        // Haulting can be implemented here in Future contracts!!

    }

    /**
     * @dev get your USDC locked so as to get WETH at a later date by submitting further amount
     * @param _durationSlot after how many slots to settle it(only 0 available in this contract - updates possible)
     * @param _price price(in usdc) at which asset will be brought after duration(tick size will be 100 USDC for now)
     */
    function buyOneFutureEther(uint256 _durationSlot, uint256 _price) public {
        // currently the duration can only take the value of 0
        require(_durationSlot == 0, "duration can only be zero in this contract");
        // currently price should be multiple of 100 usdc
        require(_price % 10**20 == 0, "price should be multiple of 100 usdc in this contract");

        // receive 25% the value of the WETH from the buyer
        uint256 wethPrice = getPrice();
        uint256 usdcTokenReceive = (wethPrice * 1e10) / 4;
        USDCtoken.transferFrom(msg.sender, address(this), usdcTokenReceive);

        uint256 maturityTime = getLastSettlementDate() + (10 days) * _durationSlot;

        bytes32 contractId = keccak256(abi.encodePacked(msg.sender,     maturityTime, _price));
        require(contractIdToContract[contractId].price == 0, "Same user can't make the same trade again with same amount and in same slot");

        // update the mappings: 
        contractIdToContract[contractId] = Contract(
            msg.sender, 
            Process.Buy, 
            Status.Created, 
            _price, 
            block.timestamp, 
            maturityTime, 
            getPrice(), 
            usdcTokenReceive
        );
        addressToContractIds[msg.sender].push(contractId);
        addressPricedContractId[msg.sender][maturityTime][_price] = contractId;
        isBuyer[msg.sender] = true;

        buyers.push(msg.sender);

        // settle the existing sellers with this buyer if possible 
        if(slotPriceSellers[_price].length > slotSellerIndex[_price]) {
            // make the status of both of the seller and the buyer contracts to be Settled
            address seller = slotPriceSeller[_price][slotSellerIndex[_price]];
            settlePair(seller, buyer, _price, maturityTime);
            slotSellerIndex[_price]++;
        } else {
            slotPriceBuyer[_price].push(msg.sender);
        }

        // emit the event for buyFutureWETH
        emit BuyFutureWETH(
            msg.sender, 
            10**18, 
            _price, 
            block.timestamp, 
            maturityTime
        );

    }
    
    function settlePair(address seller, address buyer, uint256 _price, uint256 _maturityTime) internal {
        // update the status of contracts: 
        bytes32 sellerContractId = addressPricedContractId[seller][_maturityTime][_price];
        bytes32 buyerContractId = addressPricedContractId[buyer][_maturityTime][_price];
        contractIdToContract[sellerContractId].status = Status.Settled;
        contractIdToContract[buyerContractId].status = Status.Settled;

        // emit the event for SettleFutureTrade
        emit SettleFutureTrade(seller, buyer, _price, _maturityTime);
    }   

    function ExecuteFuture(uint256 _price, uint256 _maturityTime) public {
        // automate this function using chainlink automations
        // take all the traders and check the contracts

        require(isSeller[msg.sender] || isBuyer[msg.sender], "Only traders allowed!");

        // check if the date for the future execution has passed. 
        uint256 currentTimestamp = block.timestamp;

        require(contractMaturityTime < currentTimestamp, "Contract has not yet matured");

    }

    // function changeLastMatureTime => use chainlink automations here!!

    // function to get the current WETH price
    function getPrice() public view returns(uint256) {
        (, int answer, , ,) = priceFeed.latestRoundData();
        return uint256(answer);
    }

    function getDecimals() public view returns(uint8) {
        uint8 decimal = priceFeed.decimals();
        return decimal;
    }

    function getLastSettlementDate() public view returns(uint256) {
        return lastSettlementDate;
    }

    // GETTERS

}
