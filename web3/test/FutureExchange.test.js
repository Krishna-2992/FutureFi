const { loadFixture } = require('@nomicfoundation/hardhat-network-helpers')

const { assert, expect } = require('chai')

const hre = require('hardhat')
const { ethers } = require('hardhat')

async function deployUsdc() {
    const USDC = await ethers.getContractFactory('USDCToken')
    const usdcToken = await USDC.deploy()
    console.log('usdc token deployed at:', usdcToken.target)
    return usdcToken
}

describe('FuturesExchange', () => {
    async function deployFixture() {
        const usdcToken = await deployUsdc()
        const [deployer, trader1, trader2, trader3] = await ethers.getSigners()

        const priceFeed = '0x0000000000000000000000000000000000000000'
        const usdcTokenAddress = usdcToken.target

        const FuturesExchange = await ethers.getContractFactory(
            'FutureExchange'
        )
        const futuresExchange = await FuturesExchange.deploy(
            priceFeed,
            usdcTokenAddress
        )

        console.log('address is : ', futuresExchange.target)
        return {
            futuresExchange,
            usdcToken,
            deployer,
            trader1,
            trader2,
            trader3,
        }
    }

    async function completeBasicSetup() {
        const { futuresExchange, usdcToken, trader1 } = await loadFixture(
            deployFixture
        )
        // mint tokens in traders account
        await usdcToken.connect(trader1).mint('5000000000000000000000')

        // approve the exchange for spending tokens
        await usdcToken
            .connect(trader1)
            .approve(futuresExchange.target, '5000000000000000000000')

        // register the trader
        const traderTx = await futuresExchange
            .connect(trader1)
            .createTraderAccount()
        await traderTx.wait()

        //   get maturity time of the current slot
        const maturityTime = await futuresExchange.getExecutionTimeBySlot(0)

        //   get current futures price at maturity date
        const futuresPrice = await futuresExchange.futureValueAt(maturityTime)

        console.log('futuresPrice', futuresPrice)

        return {
            futuresExchange,
            usdcToken,
            trader1,
            traderTx,
            maturityTime,
            futuresPrice,
        }
    }

    describe('deployment', () => {
        it('should deploy the contract properly', async () => {
            const { futuresExchange } = await loadFixture(deployFixture)
            console.log(futuresExchange.target)
        })
    })
    describe('creating trader', () => {
        it('should create the trader properly', async () => {
            const { futuresExchange, usdcToken, trader1 } = await loadFixture(
                deployFixture
            )

            // mint tokens in traders account
            await usdcToken.connect(trader1).mint('5000000000000000000000')
            // approve the exchange for spending tokens
            await usdcToken
                .connect(trader1)
                .approve(futuresExchange.target, '5000000000000000000000')

            const traderTx = await futuresExchange
                .connect(trader1)
                .createTraderAccount()
            traderTx.wait()

            console.log('trader registered')

            const trader = await futuresExchange.traders(0)

            console.log('trader', trader)
            expect(trader).equals(trader1.address)
        })
    })
    describe('buying assets', () => {
        it('should update trader variables correctly after buying an asset', async () => {
            const {
                futuresExchange,
                usdcToken,
                trader1,
                traderTx,
                maturityTime,
                futuresPrice,
            } = await loadFixture(completeBasicSetup)

            // buy an asset
            const buyTx = await futuresExchange
                .connect(trader1)
                .buyAsset('1', 0)
            await buyTx.wait()

            // check traderUSDCBalance after buying
            const traderUSDCBalanceAfter =
                await futuresExchange.traderUSDCBalance(trader1.address)
            expect(traderUSDCBalanceAfter).to.equal('10000000000000000000')

            // check isTrader
            const isTrader = await futuresExchange.isTrader(trader1.address)
            expect(isTrader).to.equal(true)

            // check tradersSecurityAmount
            const tradersSecurityAmount =
                await futuresExchange.tradersSecurityAmount(trader1.address)
            console.log('tradersSecurityAmount', tradersSecurityAmount)
            console.log('futuresPrice', futuresPrice)
            expect(tradersSecurityAmount * BigInt(100)).to.equal(
                BigInt(futuresPrice) * BigInt('5')
            )

            // check futureCumulativeSum
            const futureCumulativeSum =
                await futuresExchange.futureCumulativeSum(trader1.address)
            expect(futureCumulativeSum).to.equal(
                BigInt(-1) * BigInt(futuresPrice)
            )

            // check netAssetsOwned
            const netAssetsOwned = await futuresExchange.netAssetsOwned(
                trader1.address
            )
            expect(netAssetsOwned).to.equal(1)
        })
    })
    describe('selling assets', () => {
        it('does not change trader usdc balance on selling', async () => {
            const {
                futuresExchange,
                usdcToken,
                trader1,
                traderTx,
                maturityTime,
                futuresPrice,
            } = await loadFixture(completeBasicSetup)

            // sell an asset
            const sellTx = await futuresExchange
                .connect(trader1)
                .sellAsset('1', 0)
            await sellTx.wait()

            // check traderUSDCBalance after selling
            const traderUSDCBalanceAfter =
                await futuresExchange.traderUSDCBalance(trader1.address)
            expect(traderUSDCBalanceAfter).to.equal('10000000000000000000')
        })
        it('check that the isTrader mapping is updated', async () => {
            const {
                futuresExchange,
                usdcToken,
                trader1,
                traderTx,
                maturityTime,
                futuresPrice,
            } = await loadFixture(completeBasicSetup)

            // sell an asset
            const sellTx = await futuresExchange
                .connect(trader1)
                .sellAsset('1', 0)
            await sellTx.wait()

            // check isTrader
            const isTrader = await futuresExchange.isTrader(trader1.address)
            expect(isTrader).to.equal(true)
        })
        it('trader security amount updates properly', async () => {
            const {
                futuresExchange,
                usdcToken,
                trader1,
                traderTx,
                maturityTime,
                futuresPrice,
            } = await loadFixture(completeBasicSetup)

            // sell an asset
            const sellTx = await futuresExchange
                .connect(trader1)
                .sellAsset('1', 0)
            await sellTx.wait()

            // check tradersSecurityAmount
            const tradersSecurityAmount =
                await futuresExchange.tradersSecurityAmount(trader1.address)
            expect(tradersSecurityAmount * BigInt(100)).to.equal(
                BigInt(futuresPrice) * BigInt('5')
            )
        })
        it('traders futureCumulativeSum and netAssetsOwned updates properly', async () => {
            const {
                futuresExchange,
                usdcToken,
                trader1,
                traderTx,
                maturityTime,
                futuresPrice,
            } = await loadFixture(completeBasicSetup)

            // sell an asset
            const sellTx = await futuresExchange
                .connect(trader1)
                .sellAsset('1', 0)
            await sellTx.wait()

            // check futureCumulativeSum
            const futureCumulativeSum =
                await futuresExchange.futureCumulativeSum(trader1.address)
            expect(futureCumulativeSum).to.equal(BigInt(futuresPrice))

            // check netAssetsOwned
            const netAssetsOwned = await futuresExchange.netAssetsOwned(
                trader1.address
            )
            expect(netAssetsOwned).to.equal(-1)
        })
        it('updates the futures price after the trade', async () => {
            const {
                futuresExchange,
                usdcToken,
                trader1,
                traderTx,
                maturityTime,
                futuresPrice,
            } = await loadFixture(completeBasicSetup)

            // sell an asset
            const sellTx = await futuresExchange
                .connect(trader1)
                .sellAsset('1', 0)
            await sellTx.wait()

            const updatedFuturesPrice = await futuresExchange.futureValueAt(
                maturityTime
            )

            console.log('futuresPrice', futuresPrice)
            console.log('updatedFuturesPrice', updatedFuturesPrice)

            expect(futuresPrice).to.be.greaterThan(updatedFuturesPrice)
        })
    })
    describe('ONE TRADER, MULTIPLE TRADES!!', () => {
        it('traders security amount updates properly', async () => {
            const {
                futuresExchange,
                usdcToken,
                trader1,
                traderTx,
                maturityTime,
                futuresPrice,
            } = await loadFixture(completeBasicSetup)

            // sell an asset
            const sellTx = await futuresExchange
                .connect(trader1)
                .sellAsset('4', 0)
            await sellTx.wait()

            let calculatedSecurity = futuresPrice / BigInt(5)

            const futuresPrice2 = await futuresExchange.futureValueAt(
                maturityTime
            )

            const buyTx = await futuresExchange
                .connect(trader1)
                .buyAsset('2', 0)
            await sellTx.wait()

            calculatedSecurity += futuresPrice2 / BigInt(10)

            const tradersSecurityAmount =
                await futuresExchange.tradersSecurityAmount(trader1.address)
            expect(tradersSecurityAmount).to.equal(calculatedSecurity)
        })
        it('traders futureCumulativeSum and netAssetsOwned updates properly', async () => {
            const {
                futuresExchange,
                usdcToken,
                trader1,
                traderTx,
                maturityTime,
                futuresPrice,
            } = await loadFixture(completeBasicSetup)

            // sell an asset
            const sellTx = await futuresExchange
                .connect(trader1)
                .sellAsset('4', 0)
            await sellTx.wait()
            let calculatedFutureCumulativeSum = BigInt(4) * futuresPrice

            const futuresPrice2 = await futuresExchange.futureValueAt(
                maturityTime
            )
            console.log('futurePrice2', futuresPrice2)

            const buyTx = await futuresExchange
                .connect(trader1)
                .buyAsset('2', 0)
            await sellTx.wait()

            calculatedFutureCumulativeSum -= BigInt(2) * futuresPrice2

            // check futureCumulativeSum
            const futureCumulativeSum =
                await futuresExchange.futureCumulativeSum(trader1.address)
            expect(futureCumulativeSum).to.equal(
                BigInt(calculatedFutureCumulativeSum)
            )

            // check netAssetsOwned
            const netAssetsOwned = await futuresExchange.netAssetsOwned(
                trader1.address
            )
            expect(netAssetsOwned).to.equal(-2)
        })
    })
    describe('SETTLING FUTURES CONTRACTS - SINGLE TRADER', () => {
        it('traders security amount updates properly', async () => {
            const {
                futuresExchange,
                usdcToken,
                trader1,
                traderTx,
                maturityTime,
                futuresPrice,
            } = await loadFixture(completeBasicSetup)

            // sell an asset
            const sellTx = await futuresExchange
                .connect(trader1)
                .sellAsset('4', 0)
            await sellTx.wait()

            const buyTx = await futuresExchange
                .connect(trader1)
                .buyAsset('2', 0)
            await sellTx.wait()

            // check futureCumulativeSum
            const futureCumulativeSum =
                await futuresExchange.futureCumulativeSum(trader1.address)

            const futuresPrice2 = await futuresExchange.futureValueAt(
                maturityTime
            )
            const pricePaid = futuresPrice2 * BigInt(2)
            console.log('futurePrie2', futuresPrice2)
            console.log('pricePaid', pricePaid)

            const tradersSecurityAmount =
                await futuresExchange.tradersSecurityAmount(trader1.address)
            console.log('traders security amount', tradersSecurityAmount)

            const returnedToTrader =
                tradersSecurityAmount + (futureCumulativeSum - pricePaid)

            const latestSettlementDate =
                await futuresExchange.getLastSettlementDate()
            console.log(latestSettlementDate)

            await futuresExchange.settleAllContracts()

            const traderUSDCBalanceAfter =
                await futuresExchange.traderUSDCBalance(trader1.address)

            console.log('returnedToTrader', returnedToTrader)
            console.log('traderusdcBalance', traderUSDCBalanceAfter)

            expect(traderUSDCBalanceAfter).to.equal(
                returnedToTrader + BigInt('10000000000000000000')
            )
        })
    })
    describe('READ TRADERS', () => {
        it('must give proper trader details', async () => {
            const {
                futuresExchange,
                usdcToken,
                trader1,
                traderTx,
                maturityTime,
                futuresPrice,
            } = await loadFixture(completeBasicSetup)

            // sell an asset
            const sellTx = await futuresExchange
                .connect(trader1)
                .sellAsset('4', 0)
            await sellTx.wait()

            const buyTx = await futuresExchange
                .connect(trader1)
                .buyAsset('2', 0)
            await sellTx.wait()
            const traderContracts = await futuresExchange.userContracts(
                trader1.address,
                1
            )
            console.log(traderContracts)
        })
    })
})
