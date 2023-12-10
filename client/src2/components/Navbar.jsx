import React from 'react'
import { Link } from 'react-router-dom'

import ConnectWallet from './ConnectWallet'

const Navbar = () => {
    return (
        <div>
            <div className='flex flex-row justify-around'>
                <Link className='link' to='/'>
                    Trade
                </Link>
                <Link className='link' to='/Mint'>
                    Mint
                </Link>
                <Link className='link' to='/History'>
                    History
                </Link>
                <ConnectWallet />
            </div>
        </div>
    )
}

export default Navbar
