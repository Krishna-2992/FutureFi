import { HiMenuAlt4 } from 'react-icons/hi'
import { AiOutlineClose } from 'react-icons/ai'
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import UserContext from '../context/userContext'

const Navbar = () => {
    const { isConnected, connectToMetamask } = React.useContext(UserContext)

    const [toggleMenu, setToggleMenu] = useState(false)
    const [activePage, setActivePage] = useState('Home')

    const NavbarItem = ({ title, classProps }) => {
        return (
            <div>
                {title === 'Docs' ? (
                    <div>
                        <li
                            className={`mx-4 p-2 cursor-pointer ${classProps}} ${
                                activePage === title ? 'blue-glassmorphism' : ''
                            }`}
                            onClick={() => setActivePage(title)}
                        >
                            <a
                                href='https://github.com/Krishna-2992/FutureFi/blob/main/README.md'
                                target='_blank'
                                rel="noopener noreferrer"
                            >
                                {title}
                            </a>
                        </li>
                    </div>
                ) : (
                    <div>
                        <li
                            className={`mx-4 p-2 cursor-pointer ${classProps}} ${
                                activePage === title ? 'blue-glassmorphism' : ''
                            }`}
                            onClick={() => setActivePage(title)}
                        >
                            <Link to={title == 'Home' ? '' : `/${title}`}>
                                {title}
                            </Link>
                        </li>
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className='w-full flex justify-around items-center p-4 blue-glassmorphism'>
            <div className=''>FutureFi</div>
            <ul className='text-white md:flex hidden list-none flex-row justify-between items-center flex-initial'>
                {['Home', 'Docs', 'Mint USDC', 'History'].map((item, index) => (
                    <NavbarItem key={item + index} title={item} />
                ))}
                <li
                    className='bg-[#2952e3] py-2 px-7 mx-4 rounded-full cursor-pointer hover:bg-[#2546bd]'
                    onClick={connectToMetamask}
                >
                    {isConnected ? 'Connected' : 'Connect Wallet'}
                </li>
            </ul>
            {!toggleMenu && (
                <HiMenuAlt4
                    fontSize={28}
                    className='text-white md:hidden cursor-pointer'
                    onClick={() => setToggleMenu(true)}
                />
            )}
            {toggleMenu && (
                <ul
                    className='z-10 fixed top-0 -right-2 p-3 w-[70w] h-screen shadow-2xl md:hidden
              flex flex-col justify-start items-end rounded-md blue-glassmorphism text-white animate-slide-in'
                >
                    <li className='text-xl w-full my-2'>
                        <AiOutlineClose onClick={() => setToggleMenu(false)} />
                    </li>
                    {['Home', 'Docs', 'Mint USDC', 'History'].map(
                        (item, index) => (
                            <NavbarItem
                                key={item + index}
                                title={item}
                                classProps='my-2 text-lg'
                            />
                        )
                    )}
                </ul>
            )}
        </div>
    )
}

export default Navbar
