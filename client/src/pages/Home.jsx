import React from 'react'
import UserContext from '../context/userContext'
import Graph from '../components/Graph'

const Home = () => {
    const {
        txCompletedCount,
        isTrader,
        isConnected,
        userBalance,
        traderAccountBalance,
        traderSecurityAmount,
        futureAssetPrices,
        executionTime,
        currentFuturePrice,
    } = React.useContext(UserContext)
    const {
        getIsTrader,
        getBalance,
        getTraderBalance,
        getCurrentFuture,
        depositUsd,
        claimUsd,
        buyFuture,
        sellFuture,
        getFuturesData,
        connectToMetamask,
    } = React.useContext(UserContext)

    React.useEffect(() => {
        getIsTrader()
        getBalance()
        getTraderBalance()
        getFuturesData()
        getCurrentFuture()
    }, [isConnected, txCompletedCount])

    return (
        <div>
            {isConnected && (
                <div>
                    <div className='text-2xl'>
                        Future USDC Value on{' '}
                        <span className='text-3xl font-bold'>
                            {executionTime}
                        </span>{' '}
                        is{' '}
                        <span className='text-3xl font-bold'>
                            {currentFuturePrice}
                        </span>{' '}
                        USDC
                    </div>
                    <div className='flex justify-around'>
                        <div className='w-full m-4 white-glassmorphism'>
                            <Graph futureAssetPrices={futureAssetPrices} />
                        </div>
                        <div className='flex flex-col w-full'>
                            {!isTrader && (
                                <div className=''>
                                    <button
                                        className='m-20 h-20'
                                        // onClick={createTraderAccount}
                                    >
                                        Create Trader Account
                                    </button>
                                    <div>
                                        please mint and approve tokens before
                                        creating trader account
                                    </div>
                                </div>
                            )}
                            {isTrader && (
                                <div>
                                    <div className='flex text-xl'>
                                        <div className='m-4'>
                                            User's account balance:
                                        </div>
                                        <div className='my-4 font-semibold'>
                                            {userBalance} USDC
                                        </div>
                                    </div>
                                    <div className='m-2'>
                                        <input
                                            type='text'
                                            id='buyAssetAmount'
                                            className='p-2'
                                            placeholder='buy future amount'
                                        />
                                        <button
                                            className='m-2'
                                            onClick={() =>
                                                buyFuture(
                                                    document.querySelector(
                                                        '#buyAssetAmount'
                                                    ).value
                                                )
                                            }
                                        >
                                            Buy Future
                                        </button>
                                    </div>
                                    <div className=''>
                                        <input
                                            type='text'
                                            id='sellAssetAmount'
                                            className='p-2'
                                            placeholder='sell future amount'
                                        />
                                        <button
                                            className='m-2'
                                            onClick={() =>
                                                sellFuture(
                                                    document.querySelector(
                                                        '#sellAssetAmount'
                                                    ).value
                                                )
                                            }
                                        >
                                            Sell Future
                                        </button>
                                    </div>

                                    <div className='flex text-xl'>
                                        <div className='m-4'>
                                            User's trader balance:
                                        </div>
                                        <div className='my-4 font-semibold'>
                                            {traderAccountBalance} USDC
                                        </div>
                                    </div>
                                    <div className='flex text-xl'>
                                        <div className='m-4'>
                                            Trader's security amount:
                                        </div>
                                        <div className='my-4 font-semibold'>
                                            {traderSecurityAmount} USDC
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    {isTrader && (
                        <div className=''>
                            <div>
                                <input
                                    type='text'
                                    id='depositUsd'
                                    className='p-2 m-2'
                                    placeholder='deposit amount'
                                />
                                <button
                                    onClick={() =>
                                        depositUsd(
                                            document.querySelector(
                                                '#depositUsd'
                                            ).value
                                        )
                                    }
                                >
                                    Deposit USDC
                                </button>
                            </div>
                            <div>
                                <input
                                    type='text'
                                    id='claimUsd'
                                    className='p-2 m-2'
                                    placeholder='claim amount'
                                />
                                <button
                                    onClick={() =>
                                        claimUsd(
                                            document.querySelector('#claimUsd')
                                                .value
                                        )
                                    }
                                >
                                    Claim USDC
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
            {!isConnected && (
                <div className='flex flex-col justify-around'>
                    <button
                        onClick={connectToMetamask}
                        className='mt-24 text-3xl'
                    >
                        Connect the wallet first
                    </button>
                </div>
            )}
        </div>
    )
}

export default Home
