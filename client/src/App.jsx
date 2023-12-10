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

    const connectWallet = async () => {
        try {
            if (window.ethereum !== 'undefined') {
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
            // alert('Please switch to avalanche fuji network')
        }
    }

    const mintTokens = async () => {
        if (state.usdcContract) {
            checkCorrectNetwork()
            try {
                const mintAmount = ethers.utils.parseEther('10000')
                await state.usdcContract.mint(mintAmount)
                console.log('minted tokens successfully')
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
                // const formatUserBalance = ethers.utils.formatEther(userBalance)
                // console.log(formatUserBalance)
                // setUserBalance(formatUserBalance)
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
                if (approvalAmount == 0) return

                const parsedApprovalAmount =
                    ethers.utils.parseEther(approvalAmount)

                await state.usdcContract.approve(
                    futureContractAddress,
                    parsedApprovalAmount
                )

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
                const buyAssetAmount =
                    document.querySelector('#buyAssetAmount').value
                const tx = await state.futureContract.sellAsset(
                    buyAssetAmount,
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
                const contracts = await state.futureContract.userContracts(account, 0)
                console.log("contract", contracts)

                
            } catch (error) {
                console.log(error)
            }
        }
    }

    // automatic functions
    getBalance()

    return (
        <div>
            {/* Navbar */}
            <div className='flex justify-between text-xl'>
                <div className='flex justify-left'>
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
                </div>
                <div className='flex justify-right items-center'>
                    {userBalance && (
                        <div className='mx-4'>balance: {userBalance} USDC</div>
                    )}
                    <button onClick={connectWallet} id='connect_button'>
                        connect wallet
                    </button>
                </div>
            </div>

            {page === 'trade' && (
                <div>
                    <div className='flex justify-around m-8'>
                        <div className='flex flex-col'>
                            <button className='' onClick={createTraderAccount}>
                                Create Trader Account
                            </button>
                            <button onClick={getHistoricTraders}>
                                Historic trders
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
                            <button onClick={sellFuture}>Sell Future</button>
                        </div>
                        <div>Graph for the future</div>
                    </div>
                </div>
            )}
            {page === 'mint' && (
                <div>
                    <button onClick={mintTokens}>Mint token</button>
                    <div>
                        <input
                            type='text'
                            id='approveUSDC'
                            className='h-full p-2 m-4'
                            placeholder='1000'
                        />
                        <button onClick={approveUSDC}>Approve tokens</button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default App
