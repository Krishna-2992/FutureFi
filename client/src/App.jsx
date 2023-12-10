import {
    Route,
    Routes,
} from 'react-router-dom/dist/umd/react-router-dom.development'
import { useEffect, useState } from 'react'
import { ethers } from 'ethers'
import {
    usdcContractAddress,
    futureContractAddress,
    usdcContractAbi,
    futureContractAbi,
} from './constants'
import './App.css'
import {toast} from "react-toastify"
import Graph from './Graph'

function App() {
    const [state, setState] = useState({
        provider: null,
        signer: null,
        usdcContract: null,
        futureContract: null,
    })
    const [account, setAccount] = useState()
    const [connected, setConnected] = useState(false)
    const [page, setPage] = useState('trade')
    const [userBalance, setUserBalance] = useState()
    const [allowances, setAllowances] = useState()
    const [historicTrades, setHistoricTrades] = useState([])
    
    const [futureAssetPrices, setFutureAssetPrices] = useState([])
    const [traderAccountBalance, setTraderAccountBalance] = useState()

    useEffect(() => {
        // Run these functions only on initial render
        console.log('initial useEffect run')
        getBalance()
        getTraderBalance()
        getAllowances()
        getFuturesData()
    }, [connected])

    const connectWallet = async () => {
        try {
            if (window.ethereum != 'undefined') {
                checkCorrectNetwork()
                const accounts = await window.ethereum.request({
                    method: 'eth_requestAccounts',
                })
                setAccount(accounts[0])

                const provider = new ethers.providers.Web3Provider(
                    window.ethereum
                )
                const signer = provider.getSigner()

                const usdcContract = new ethers.Contract(
                    usdcContractAddress,
                    usdcContractAbi,
                    signer
                )
                const futureContract = new ethers.Contract(
                    futureContractAddress,
                    futureContractAbi,
                    signer
                )
                setState({ provider, signer, usdcContract, futureContract })
                console.log('connected accounts', accounts)
                document.getElementById('connect_button').innerHTML =
                    'connected'
                setConnected(true)
            } else {
                alert('Please install metamask')
            }
        } catch (error) {
            console.log(error)
        }
    }

    const checkCorrectNetwork = async () => {
        const currentNetwork = await state.provider.getNetwork()
        const currentChainId = currentNetwork.chainId

        const avalancheChainId = '43113'

        if (currentChainId.toString() !== avalancheChainId) {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x13881' }], // working with mumbai
            })
        }
    }

    const mintTokens = async () => {
        if (state.usdcContract) {
            checkCorrectNetwork()
            try {
                const mintAmount = ethers.utils.parseEther('1000')
                const tx = await state.usdcContract.mint(mintAmount)
                await tx.wait()
                console.log('minted tokens successfully')
                getBalance()
            } catch (error) {
                console.log(error)
            }
        }
    }

    const getBalance = async () => {
        if (state.usdcContract) {
            checkCorrectNetwork()
            try {
                const userBalance = await state.usdcContract.balanceOf(account)
                const formatUserBalance = ethers.utils.formatEther(userBalance)
                console.log(formatUserBalance)
                setUserBalance(formatUserBalance)
            } catch (error) {
                console.log(error)
            }
        }
    }

    const getFuturesData = async () => {
        if (state.futureContract) {
            checkCorrectNetwork()
            try {
                const executionTime =
                    await state.futureContract.getExecutionTimeBySlot(0)
                const futureTradeCount =
                    await state.futureContract.slotTotalTrades(executionTime)
                setFutureAssetPrices([])
                console.log('slot total trades', futureTradeCount)
                for (let i = 0; i < futureTradeCount; i++) {
                    const futureTrade =
                        await state.futureContract.futurePriceData(
                            executionTime,
                            i
                        )
                    console.log('future trade', futureTrade)

                    const price = ethers.utils.parseEther(
                        futureTrade[1].toString()
                    )

                    const priceObj = {
                        timestamp: parseInt(futureTrade[0]),
                        price: price,
                    }

                    setFutureAssetPrices((prev) => [...prev, priceObj])
                }
                console.log('futureAssetPrices', futureAssetPrices)
                console.log('futureAssetPrices', futureAssetPrices)
                // const formatUserBalance = ethers.utils.formatEther(userBalance)
                // console.log(formatUserBalance)
                // setUserBalance(formatUserBalance)
            } catch (error) {
                console.log(error)
            }
        }
    }

    const getAllowances = async () => {
        if (state.usdcContract) {
            checkCorrectNetwork()
            try {
                const allowances = await state.usdcContract.allowance(
                    account,
                    futureContractAddress
                )
                const formatAllowances = ethers.utils.formatEther(allowances)
                console.log(formatAllowances)
                setAllowances(formatAllowances)
            } catch (error) {
                console.log(error)
            }
        }
    }

    const getTraderBalance = async () => {
        if (state.usdcContract) {
            checkCorrectNetwork()
            try {
                const traderAccountBalance =
                    await state.futureContract.traderUSDCBalance(account)
                const formatTraderAccountBalance =
                    ethers.utils.formatEther(traderAccountBalance)
                const traderSecurityAmount =
                    await state.futureContract.tradersSecurityAmount(account)
                const formatTraderSecurityAmount =
                    ethers.utils.formatEther(traderSecurityAmount)

                const totalTraderAmount =
                    parseFloat(formatTraderAccountBalance) +
                    parseFloat(formatTraderSecurityAmount)
                setTraderAccountBalance(totalTraderAmount)
            } catch (error) {
                console.log(error)
            }
        }
    }

    const approveUSDC = async () => {
        if (state.usdcContract) {
            checkCorrectNetwork()
            try {
                const approvalAmount =
                    document.querySelector('#approveUSDC').value
                approvalAmount == 0 ? 1000 : approvalAmount

                const parsedApprovalAmount =
                    ethers.utils.parseEther(approvalAmount)

                const tx = await state.usdcContract.approve(
                    futureContractAddress,
                    parsedApprovalAmount
                )
                await tx.wait()
                getAllowances()
                console.log('approved tokens successfully')
            } catch (error) {
                console.log(error)
            }
        }
    }

    const buyFuture = async () => {
        if (state.usdcContract) {
            checkCorrectNetwork()
            try {
                const buyAssetAmount =
                    document.querySelector('#buyAssetAmount').value
                const tx = await state.futureContract.buyAsset(
                    buyAssetAmount,
                    0
                )
                await tx.wait()
                console.log(state.futureContract)

                console.log('weth brought successfully')
            } catch (error) {
                console.log(error)
            }
        }
    }

    const sellFuture = async () => {
        if (state.usdcContract) {
            checkCorrectNetwork()
            try {
                const sellAssetAmount =
                    document.querySelector('#sellAssetAmount').value
                const tx = await state.futureContract.sellAsset(
                    sellAssetAmount,
                    0
                )
                await tx.wait()

                console.log('weth sold successfully')
            } catch (error) {
                console.log(error)
            }
        }
    }

    const createTraderAccount = async () => {
        if (state.usdcContract) {
            checkCorrectNetwork()
            try {
                const tx = await state.futureContract.createTraderAccount()
                await tx.wait()

                console.log('trader account created!!')
            } catch (error) {
                console.log(error)
            }
        }
    }

    const getHistoricTraders = async () => {
        if (state.futureContract) {
            checkCorrectNetwork()
            try {
                const tradeCount = await state.futureContract.tradesCount(
                    account
                )
                console.log('tradeCount', tradeCount.toString())
                setHistoricTrades([])
                for (let i = 0; i < tradeCount.toString(); i++) {
                    const contracts = await state.futureContract.userContracts(
                        account,
                        i
                    )
                    const price = ethers.utils.formatEther(
                        contracts[2].toString()
                    )
                    const dateObj = new Date(contracts[3].toNumber() * 1000) // Convert timestamp to milliseconds and create a Date object

                    const formattedDateTime = dateObj.toLocaleDateString(
                        'en-US',
                        {
                            year: 'numeric',
                            month: 'numeric',
                            day: 'numeric',
                            hour: 'numeric',
                            minute: 'numeric',
                            second: 'numeric',
                        }
                    )
                    const tradeObj = {
                        process: contracts[0] == 0 ? 'Buy' : 'Sell',
                        assetAmount: contracts[1].toString(),
                        assetPrice: price,
                        timestamp: formattedDateTime,
                    }
                    console.log('tradeObj', tradeObj)
                    setHistoricTrades((prev) => [...prev, tradeObj])
                    console.log('tradeArray', historicTrades)
                }
            } catch (error) {
                console.log(error)
            }
        }
    }

    return (
        <div>
            {/* Navbar */}
            <div className='flex justify-between text-xl shadow-xl'>
                <div className='text-4xl font-bold'>FutureFi</div>
                <div className='flex justify-right items-center'>
                    {userBalance && (
                        <div className='mx-4'>
                            USER's balance: {userBalance} USDC
                        </div>
                    )}
                    <button onClick={connectWallet} id='connect_button'>
                        connect wallet
                    </button>
                    <button onClick={() => toast("HEllo")}>
                        Toast
                    </button>
                </div>
            </div>

            <div className='flex justify-around m-4 shadow-xl'>
                <div
                    className={`mx-4 text-3xl cursor-pointer ${
                        page === 'trade' && 'font-bold'
                    }`}
                    onClick={() => setPage('trade')}
                >
                    trade
                </div>
                <div
                    className={`mx-4 text-3xl cursor-pointer ${
                        page === 'mint' && 'font-bold'
                    }`}
                    onClick={() => setPage('mint')}
                >
                    mint
                </div>
                <div
                    className={`mx-4 text-3xl cursor-pointer ${
                        page === 'history' && 'font-bold'
                    }`}
                    onClick={() => {
                        setPage('history')
                        getHistoricTraders()
                    }}
                >
                    history
                </div>
            </div>
            {connected === false && (
                <div className='flex flex-col justify-around'>
                    <button onClick={connectWallet} className='mt-24 text-3xl'>
                        Connect the wallet first
                    </button>
                </div>
            )}
            {connected === true && page === 'trade' && (
                <div>
                    <div className='flex justify-around m-8'>
                        <div className='flex flex-col'>
                            <button className='' onClick={createTraderAccount}>
                                Create Trader Account
                            </button>
                            <div className='m-4'>
                                <input
                                    type='text'
                                    id='buyAssetAmount'
                                    className='p-2'
                                    placeholder='buy future amount'
                                />
                                <button onClick={buyFuture} className='m-4'>
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
                                <button onClick={sellFuture} className='m-4'>
                                    Sell Future
                                </button>
                            </div>

                            {/* trader account balance */}
                            <div className='flex text-xl'>
                                <div className='m-4'>
                                    Trader's account balance:
                                </div>
                                <div className='my-4 font-semibold'>
                                    {traderAccountBalance} USDC
                                </div>
                            </div>
                        </div>
                        {/* <div>Graph for the future</div> */}
                        <Graph futureAssetPrices={futureAssetPrices}/>
                    </div>
                </div>
            )}
            {connected === true && page === 'mint' && (
                <div>
                    <div className='text-xl m-2'>
                        token address: {usdcContractAddress}
                    </div>
                    <div className='text-xl m-2'>token name: USD Token</div>
                    <div className='text-xl m-2'>token symbol: USDC</div>
                    <div className='text-xl m-2'>
                        Current user balance:{' '}
                        <span className='font-bold'>{userBalance} USDC</span>
                    </div>
                    <div className='text-xl m-2'>
                        Future contract allowances:{' '}
                        <span className='font-bold'>{allowances} USDC</span>
                    </div>
                    <div>
                        <input
                            type='text'
                            id='approveUSDC'
                            className='h-full p-2 m-4'
                            placeholder='1000'
                        />
                        <button onClick={approveUSDC} className='text-xl'>
                            Approve tokens
                        </button>
                    </div>
                    <button onClick={mintTokens} className='text-xl m-4 w-1/2'>
                        Mint 1000 tokens
                    </button>
                </div>
            )}
            {connected === true && page === 'history' && (
                <div className='historic-trades m-4 text-xl'>
                    <div className='text-3xl m-8 font-bold'>
                        Trader's previous trades:
                    </div>
                    <table>
                        <thead>
                            <tr>
                                <th className='p-8 m-2'>Process</th>
                                <th className='p-8 m-2'>Asset Amount</th>
                                <th className='p-8 m-2'>Asset Price</th>
                                <th className='p-8 m-2'>Timestamp</th>
                            </tr>
                        </thead>
                        <tbody>
                            {historicTrades.map((tradeObj, index) => (
                                <tr key={index}>
                                    <td className='p-8 m-2'>
                                        {tradeObj.process}
                                    </td>
                                    <td className='p-8 m-2'>
                                        {tradeObj.assetAmount}
                                    </td>
                                    <td className='p-8 m-2'>
                                        {tradeObj.assetPrice}
                                    </td>
                                    <td className='p-8 m-2'>
                                        {tradeObj.timestamp}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    <hr />
                    
                </div>
            )}
        </div>
    )
}

export default App
