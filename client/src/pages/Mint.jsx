import React, { useContext, useEffect } from 'react'
import { usdcContractAddress, futureContractAddress } from '../constants'
import UserContext from '../context/userContext'

const Mint = () => {
    const { setTxCompleted, isConnected, userBalance, allowances } =
        useContext(UserContext)
    const {
        getBalance,
        getAllowances,
        approveUSDC,
        mintTokens,
        connectToMetamask,
    } = useContext(UserContext)

    useEffect(() => {
        getBalance()
        getAllowances()
    }, [isConnected, setTxCompleted])

    return (
        <div>
            {isConnected && (
                <div>
                    <div className='text-xl m-2'>
                        token address:{' '}
                        <span className='font-semibold'>
                            {usdcContractAddress}
                        </span>
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
                        <button
                            onClick={() =>
                                approveUSDC(
                                    document.querySelector('#approveUSDC').value
                                )
                            }
                            className='text-xl'
                        >
                            Approve tokens
                        </button>
                    </div>
                    <button onClick={mintTokens} className='text-xl m-4 w-1/2'>
                        Mint 5000 tokens
                    </button>
                </div>
            )}
            {!isConnected && (
                <div className='flex flex-col justify-around'>
                    <button onClick={connectToMetamask} className='mt-24 text-3xl'>
                        Connect the wallet first
                    </button>
                </div>
            )}
        </div>
    )
}

export default Mint
