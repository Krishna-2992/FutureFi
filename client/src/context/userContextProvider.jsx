import React, { createContext, useState } from 'react'
import { ethers } from 'ethers'
import UserContext from './userContext'
import {
    usdcContractAbi,
    usdcContractAddress,
    futureContractAbi,
    futureContractAddress,
} from '../constants'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'

const toastError = () => {
    return toast.error('Error detected, please check console!', {
        position: 'top-right',
        autoClose: 3000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
        theme: 'light',
    })
}
const toastSuccessObject = {
    position: 'top-right',
    autoClose: 3000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    progress: undefined,
    theme: 'light',
}

const UserContextProvider = ({ children }) => {
    // utility state variables
    const [txCompletedCount, setTxCompletedCount] = useState(0)

    // connection state variables
    const [isConnected, setIsConnected] = useState(false)
    const [address, setAddress] = useState('')
    const [provider, setProvider] = useState(null)
    const [signer, setSigner] = useState(null)
    const [usdcContract, setUsdcContract] = useState(null)
    const [futureContract, setFutureContract] = useState(null)

    // Homepage state variables
    const [isTrader, setIsTrader] = useState(false)
    const [userBalance, setUserBalance] = useState(0)
    const [traderAccountBalance, setTraderAccountBalance] = useState(0)
    const [traderSecurityAmount, setTraderSecurityAmount] = useState(0)
    const [executionTime, setExecutionTime] = useState(null)
    const [currentFuturePrice, setCurrentFuturePrice] = useState(null)

    // Mint page state variables:
    const [allowances, setAllowances] = useState(0)

    // History page state variables:
    const [futureAssetPrices, setFutureAssetPrices] = useState([])
    const [historicTrades, setHistoricTrades] = useState([])

    // Homepage functions
    const checkCorrectNetwork = async () => {
        await window.ethereum.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0xa869' }], // chainId must be in hexadecimal
        })
    }
    const connectToMetamask = async () => {
        console.log('conecting to metamask')
        try {
            const provider = new ethers.providers.Web3Provider(window.ethereum)
            await provider.send('eth_requestAccounts', [])

            const signer = provider.getSigner()
            const address = await signer.getAddress()

            await checkCorrectNetwork()

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
            setProvider(provider)
            setSigner(signer)
            setIsConnected(true)
            setAddress(address)
            setUsdcContract(usdcContract)
            setFutureContract(futureContract)
            toast.success('wallet connected!', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            })
        } catch (error) {
            toast.error('Error detected, please check console!', {
                position: 'top-right',
                autoClose: 3000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
                theme: 'light',
            })
            console.log('the error that occured is: ', error)
        }
    }
    const getIsTrader = async () => {
        console.log('getIsTrader called')
        if (futureContract) {
            console.log(futureContract)
            checkCorrectNetwork()
            try {
                console.log(address)
                const isTrader = await futureContract.isTrader(address)
                console.log('isTrader', isTrader)
                setIsTrader(isTrader)
            } catch (error) {
                console.log(error)
                console.log(error)
                toastError()
            }
        }
    }
    const getBalance = async () => {
        if (usdcContract) {
            checkCorrectNetwork()
            try {
                const userBalance = await usdcContract.balanceOf(address)
                const formatUserBalance = ethers.utils.formatEther(userBalance)
                console.log(formatUserBalance)
                setUserBalance(formatUserBalance)
            } catch (error) {
                console.log(error)
                console.log(error)
                toastError()
            }
        }
    }
    const getTraderBalance = async () => {
        if (usdcContract) {
            checkCorrectNetwork()
            try {
                const traderAccountBalance =
                    await futureContract.traderUSDCBalance(address)
                const formatTraderAccountBalance =
                    ethers.utils.formatEther(traderAccountBalance)
                const traderSecurityAmount =
                    await futureContract.tradersSecurityAmount(address)
                const formatTraderSecurityAmount =
                    ethers.utils.formatEther(traderSecurityAmount)

                setTraderAccountBalance(parseFloat(formatTraderAccountBalance))
                setTraderSecurityAmount(parseFloat(formatTraderSecurityAmount))
            } catch (error) {
                console.log(error)
                console.log(error)
                toastError()
            }
        }
    }
    const getCurrentFuture = async () => {
        if (futureContract) {
            checkCorrectNetwork()
            try {
                const executionTime =
                    await futureContract.getExecutionTimeBySlot(0)
                const futureValue = await futureContract.futureValueAt(
                    executionTime
                )
                const dateObj = new Date(executionTime.toNumber() * 1000) // Convert timestamp to milliseconds and create a Date object

                const formattedDateTime = dateObj.toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'numeric',
                    day: 'numeric',
                })
                setExecutionTime(formattedDateTime)
                setCurrentFuturePrice(futureValue / Math.pow(10, 18))
            } catch (error) {
                console.log(error)
                console.log(error)
                toastError()
            }
        }
    }
    const createTraderAccount = async () => {
        if (usdcContract) {
            checkCorrectNetwork()
            try {
                console.log('create trader account called')
                const tx = await futureContract.createTraderAccount()
                await tx.wait()

                toast.success(
                    'trader account created successfully',
                    toastSuccessObject
                )
                getBalance()
            } catch (error) {
                console.log(error)
                toastError()
            }
        }
    }
    const depositUsd = async (amount) => {
        if (futureContract) {
            checkCorrectNetwork()
            try {
                console.log(amount)
                const tx = await futureContract.depositUsdc(
                    ethers.utils.parseEther(amount)
                )
                await tx.wait()
                console.log('usdc deposited')
                setTxCompletedCount((prev) => ++prev)
                toast.success('usdc deposited successfully', toastSuccessObject)
            } catch (error) {
                console.log(error)
                toastError()
            }
        }
    }
    const claimUsd = async () => {
        if (futureContract) {
            checkCorrectNetwork()
            try {
                const tx = await futureContract.claimUsdc('10')
                await tx.wait()
                console.log('usdc claimed')
                setTxCompletedCount((prev) => ++prev)
                toast.success('usdc claimed successfully!', toastSuccessObject)
            } catch (error) {
                console.log(error)
                toastError()
            }
        }
    }
    const buyFuture = async (buyAssetAmount) => {
        if (usdcContract) {
            checkCorrectNetwork()
            try {
                const tx = await futureContract.buyAsset(buyAssetAmount, 0)
                await tx.wait()
                console.log(futureContract)
                console.log('weth brought successfully')
                setTxCompletedCount((prev) => ++prev)
                toast.success('brought usdc successfully', toastSuccessObject)
            } catch (error) {
                console.log(error)
                toastError()
            }
        }
    }

    const sellFuture = async (sellAssetAmount) => {
        if (usdcContract) {
            checkCorrectNetwork()
            try {
                const tx = await futureContract.sellAsset(sellAssetAmount, 0)
                await tx.wait()
                setTxCompletedCount((prev) => ++prev)
                console.log('weth sold successfully')
                toast.success('sold usdc successfully', toastSuccessObject)
            } catch (error) {
                console.log(error)
                toastError()
            }
        }
    }

    // Mint section functions
    const getAllowances = async () => {
        if (usdcContract) {
            checkCorrectNetwork()
            try {
                const allowances = await usdcContract.allowance(
                    address,
                    futureContractAddress
                )
                const formatAllowances = ethers.utils.formatEther(allowances)
                console.log(formatAllowances)
                setAllowances(formatAllowances)
            } catch (error) {
                console.log(error)
                console.log(error)
                toastError()
            }
        }
    }
    const approveUSDC = async (approvalAmount) => {
        if (usdcContract) {
            checkCorrectNetwork()
            try {
                approvalAmount == 0 ? 1000 : approvalAmount

                const parsedApprovalAmount =
                    ethers.utils.parseEther(approvalAmount)

                const tx = await usdcContract.approve(
                    futureContractAddress,
                    parsedApprovalAmount
                )
                await tx.wait()
                console.log('incrementing txcount')
                console.log("before", txCompletedCount)
                setTxCompletedCount(prev => prev + 1)
                console.log("after", txCompletedCount)
                console.log('approved tokens successfully')
                toast.success('approved usdc successfully', toastSuccessObject)
            } catch (error) {
                console.log(error)
                toastError()
            }
        }
    }
    const mintTokens = async () => {
        if (usdcContract) {
            checkCorrectNetwork()
            try {
                const mintAmount = ethers.utils.parseEther('5000')
                console.log(usdcContract)
                const tx = await usdcContract.mint(mintAmount)
                await tx.wait()
                console.log('minted tokens successfully')
                console.log(txCompletedCount)
                setTxCompletedCount((prev) => ++prev)
                console.log(txCompletedCount)
                toast.success('minted usdc successfully', toastSuccessObject)
            } catch (error) {
                console.log(error)
                toastError()
            }
        }
    }
    const getFuturesData = async () => {
        console.log('git future data')
        if (futureContract) {
            checkCorrectNetwork()
            try {
                const executionTime =
                    await futureContract.getExecutionTimeBySlot(0)
                const futureTradeCount = await futureContract.slotTotalTrades(
                    executionTime
                )
                setFutureAssetPrices([])
                console.log('slot total trades', futureTradeCount)
                for (let i = 0; i < futureTradeCount; i++) {
                    const futureTrade = await futureContract.futurePriceData(
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
            } catch (error) {
                console.log(error)
                console.log(error)
                toastError()
            }
        }
    }
    const getHistoricTrades = async () => {
        if (futureContract) {
            checkCorrectNetwork()
            try {
                const tradeCount = await futureContract.tradesCount(address)
                console.log('tradeCount', tradeCount.toString())
                setHistoricTrades([])
                for (let i = 0; i < tradeCount.toString(); i++) {
                    const contracts = await futureContract.userContracts(
                        address,
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
                    setHistoricTrades((prev) => [...prev, tradeObj])
                    console.log('👍 x ', i, ' ', historicTrades)
                }
            } catch (error) {
                console.log(error)
                console.log(error)
                toastError()
            }
        }
    }

    return (
        <UserContext.Provider
            value={{
                txCompletedCount,
                provider,
                signer,
                isConnected,
                address,
                usdcContract,
                futureContract,
                connectToMetamask,
                getIsTrader,
                createTraderAccount,
                isTrader,
                currentFuturePrice,
                executionTime,
                getCurrentFuture,
                userBalance,
                getBalance,
                traderAccountBalance,
                getTraderBalance,
                traderSecurityAmount,
                depositUsd,
                claimUsd,
                buyFuture,
                sellFuture,
                allowances,
                getAllowances,
                approveUSDC,
                mintTokens,
                getFuturesData,
                getHistoricTrades,
                futureAssetPrices,
                historicTrades,
            }}
        >
            {children}
        </UserContext.Provider>
    )
}

export default UserContextProvider
