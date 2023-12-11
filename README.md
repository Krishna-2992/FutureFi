# FutureFi
## A Decentralized Futures Market

FutureFi is a decentralized futures market where traders can buy and sell assets at their projected future value. The future value of an asset is not static and can change based on the current demand for the asset. The demand among traders to buy or sell an asset today can cause its price to fluctuate in the future.

In this exchange, users can deposit self-minted USDC tokens to become traders. They can then buy or sell an asset at the current future price by depositing margin money (5% of the asset's futures price). All contracts will be settled and executed at the final price at the end of the settlement period.

## How it Works

The process involves the following steps:

1. Read the current price of the commodity from the [Chainlink data feed](https://docs.chain.link/docs/using-chainlink-reference-contracts).
2. Require every trader to open an account and keep a fixed amount of money in it.
3. Utilize an innovative algorithm to determine the future's price based on current demand.
4. Enable traders to buy/sell the future at the current future price.
5. Store trade details in storage variables.
6. Emit appropriate events for each process to maintain a historical record.
7. After 9 days, halt the trading process for settlement.
8. During settlement, everyone's net assets are adjusted to zero. This means that anyone who currently owns an asset will automatically sell it at the current rate, and vice versa.
9. All assets that are settled automatically will be bought/sold at the future's price at that instant.
10. After the settlement phase, the market will resume on the 10th day for traders to start trading again.
11. Traders can claim or deposit the USDC they have in the market at any time (except their margin money). However, to trade, they must have at least 10 USDC in their trading account.

Two Chainlink automations were created:

- After 9 days: This halts the trading process and begins the settlement process.
- After 10 days: This resumes the trading process, resets some storage variables, and performs `updateLatestSettlementTime` and `setFuturesInitialPrice`.

## Innovative Algorithm

The algorithm works as follows:

- Get the price of the asset from Chainlink.
- New futures price = Current futures price + (Net demand * Adjustment factor).
- The adjustment factor for WETH is 0.1.

## Event Emission

Events are emitted for the following actions:

- Creation of a new trader: `newTrader(trader, timestamp)`.
- Selling assets: `sellAsset(trader, amount, futurePrice, timestamp, maturityTime)`.
- Buying assets: `buyAsset(trader, amount, futurePrice, timestamp, maturityTime)`.
- Invocation of contract settlement: `settleContracts(timestamp)`.
- Halting of the system: `haltSystem(timestamp, bool)`.
- Updating of trader's USDC after all contracts are settled: `updateTraderUSDC(trader, maturityTime, usdcReturned)`.
- Starting of a new slot: `startNewSlot(timestamp)`.
- Setting of the initial future price: `setFutureInitialPrice(timestamp, futurePrice)`.
- Updating of the last execution date: `updateLastExecutionDate(oldExecutionDate, newExecutionDate)`.
- Claiming of USDC: `claimUsdc(trader, _amount)`.

### TESTING PART:

    NOTE: FOR TESTING PURPOSE, PRICE FEED VALUE SET TO 1500*10**8, mocks not deployed separately!!

    i) Deployment: ✅
    - should deploy properly with priceFeed address and usdcTokenAddress

    ii) Creating Trader:
    - should create trader properly and update variables

    iii) Buying Assets(SINGLE & MULTIPLE ASSETS):
    - check for trader existence
    - check that current future price raises after purchase
    - check if the security amount updated properly
    - check if futureCumulativeSum updates properly
    - check if netAssetsOwned updates properly
    - check if totalAssetsBought updates properly

    iv) Selling Assets(SINGLE & MULTIPLE ASSETS)
    - check for trader existence
    - check that current future price drops after selling
    - check if the security amount updated properly
    - check if futureCumulativeSum updates properly
    - check if netAssetsOwned updates properly
    - check if totalAssetsBought updates properly

    v) Buying and Selling Assets(SINGLE TRADER)
    - check if security amount updates properly
    - calculate the price and cross verify
    - check if futureCumulativeSum updates properly
    - check if netAssetsOwned updates properly
    - check if totalAssetsBought updates properly

    vi) Settling Futures Contracts(SINGLE TRADER)
    - after settlement, the traderUSDCBalance updates
    - security amount becomes 0
    - futureCumulativeSum becomes 0
    - netAssetsOwned becomes 0
    <!-- - totalAssetsBought becomes 0 -->
    - system halts
    - buying and selling stops

    vii) Settling Futures Contracts(MULTIPLE TRADERS)
    - after settlement, the traderUSDCBalance updates
    - security amount becomes 0
    - futureCumulativeSum becomes 0
    - netAssetsOwned becomes 0
    - buying and selling halts

    viii) CLAIM USDC
    - only trader could claim
    - amount should be less than in the traderUSDCBalance
    - reduces traderUSDCBalance by amount

    ix) Starting new slot
    - system resumes(halting stops)
    - currentPrice updates
    <!-- - should erase the state data variable from: totalAssetsBought, totalAssetsSold -->
    - should update lastSettlementDate
    - should set future initial price from chainlink data feed

### Deployment:

    The contracts are deployed on Avalanche Fuji Testnetwork
    USDC token address: 0xBe9C09c59Bf1f8909FBCb9707c45685cBA46b795
    Futures contract address: 0xb35810fbE1A2D6695416541b9e52C777B011B716

### Chainlink Usage: 

    1) Data Feed: Contract uses chainlink's data feed so as to access the real value of WETH so as to calculate the futures value of the asset
    2) Automation: Contract uses chainlink's time automation to call the settleContracts and startNewSlot function with an interval of 10 days.

### Future Modification Possibilities: 
    1) Can be made compatible to handle multiple slots rather than just immidiate one.
    2) Better Algorithm can be used to calculate the futures price which will be in correspondance with the actual price of the asset in outer market as well
    3) Integration of cross chain protocols like ccip, which will make it accessible through multiple chains.

### Providing security: 
    For providing security, our contract makes the user deposit the margin amount for the token trade(5%). If the seller makes a profit, then the margin money will be returned alongwith the profit made but in case of a loss, the loss will be covered up using the same security money only. This ensures that the net total of the assets in the marketplace should sum up to zero.
