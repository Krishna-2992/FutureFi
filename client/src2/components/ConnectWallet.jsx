import React from 'react'
import { useCustomContext } from '../ContextProvider'
import { ethers } from 'ethers'

const ConnectWallet = () => {
    const { state, setState } = useCustomContext()

    const connectWallet = async () => {
        if (window.ethereum !== 'undefined') {
            try {
                if (window.ethereum !== 'undefined') {
                    const accounts = await window.ethereum.request({
                        method: 'eth_requestAccounts',
                    })
                    const provider = new ethers.BrowserProvider(window.ethereum)

                    const signer = provider.getSigner()

                    setState({ provider, signer, contract: '' })
                    console.log('provider', provider)
                    // console.log('connected accounts', accounts)
                    // document.getElementById('connect_button').innerHTML =
                    //     'connected'
                    // setConnected(true)
                } else {
                    alert('Please install metamask')
                }
            } catch (error) {
                console.log(error)
            }
        }
        return <button onClick={() => connectWallet()}>connectWalet</button>
    }
    
}

export default ConnectWallet
