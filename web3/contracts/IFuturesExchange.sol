// SPDX-License-Identifier: MIT

pragma solidity ^0.8.20;

contract IFuturesExchange {

    /**
     * @dev get your WETH locked so as to get them at a later date
     * @param _duration duration after which the asset will be sold
     * @param _price price at which asset will be sold after duration
     */
    function sellOneFutureEther(uint8 _duration, uint256 _price) public {

        // check that _duration must lie between 0 and 2

        // check that the selling is not haulted for that specific duration

        // take the WETH token from the trader

        // make a contract for this future trade

        // update the array regarding this trader

        // settle the existing buyers with correspondance to this seller

        // if the settlement not done, then update the sellerSlotAddresses mapping for this seller

        // if the sellers surpass the amount of total buyers present by 200%, hault the process of selling for 1 hour and make the chainlink automation which will check for the status every hour and if the number of sellers becomes less than 150% of total buyers, then resume the exchange for selling as well

        // here the seller and the buyer refers to the amount of WETH they have claimed to buy/sell

    }

}