// // SPDX-License-Identifier: MIT
// pragma solidity ^0.8.20;


// import "./LiquidityToken.sol";
//     // this pool will accept responses from people for the assets price after some specific timeperiod...will create the structure for that

//     // we need to provde the address of the priceFeed which would be used to get the data from the chainlink oracle.

//     // SCOPE: currently building so as to accept the margin money in USDC only but there is a scope for adding different tokens for that.

//     // SCOPE: make it such that multiple futures can be maintained for the same user!!

// contract Pool{

//     address priceFeedAddress;

//     struct Future {
//         uint256 price;
//         uint256 currentPrice;
//         address trader;
//         uint256 timestamp;
//         bytes32 futureHash;
//     }

//     // both combined will be user to hash
//     mapping (address => bytes32) public userToTradeHash;
//     mapping (bytes32 => Future) public tradeHashToTradeStruct;

//     /**
//      * @dev deployer need to provide the starting information
//      * @param _name of the liquidity token
//      * @param _symbol of the liquidity token
//      * @param _oracle address of the oracle which will provide the data 
//      */

//     constructor(string memory _name, string memory _symbol, address _priceFeedAddress) LiquidityToken(_name, _symbol) {
//         priceFeedAddress = _priceFeedAddress;
//     }

//     // Questions: 
//     // 1) In which token will liquidity be provided? - USDC


//     // function to add liquidity
//     function addLiquidity(uint amount) external {
        
//     }

//     // function to remove liquidity

//     // function to do a future's betting

//     // function to claim our reward

//     // 


    

// }


