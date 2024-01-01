import React, { useState, useEffect, useContext } from 'react'
import UserContext from '../context/userContext'

const History = () => {
    const { txCompletedCount, isConnected, historicTrades } =
        useContext(UserContext)
    const { getFuturesData, getHistoricTrades, connectToMetamask } =
        useContext(UserContext)

    useEffect(() => {
        getFuturesData()
        getHistoricTrades()
    }, [isConnected, txCompletedCount])

    return (
        <div>
            {isConnected && (
                <div className='m-4 text-xl'>
                    <div className='text-3xl m-8 font-bold'>
                        Trader's previous trades:
                    </div>
                    {historicTrades.length && (
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
                    )}
                    <hr />
                    {!historicTrades.length && (
                        <div>No Trades made by this trader</div>
                    )}
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

export default History
