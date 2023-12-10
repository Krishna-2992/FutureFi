require('@nomicfoundation/hardhat-toolbox')

require('dotenv').config()

const POLYGON_MUMBAI_URL = process.env.POLYGON_MUMBAI_URL
const AVALANCHE_FUZI_URL = process.env.AVALANCHE_FUZI_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY

module.exports = {
    solidity: '0.8.20',
    networks: {
        hardhat: {
            chainId: 31337,
        },
        polygon: {
            url: 'https://rpc-mumbai.maticvigil.com/',
            accounts: [
                'd4a65146f356db236eb4f167416c74c7d04b8e5a592518ab15d20083e0a9ee0f',
            ],
        },
        avalanche: {
            url: 'https://api.avax-test.network/ext/bc/C/rpc',
            accounts: [
                'd4a65146f356db236eb4f167416c74c7d04b8e5a592518ab15d20083e0a9ee0f',
            ],
        },
        localhost: {
            url: 'http://127.0.0.1:8545/',
            accounts: [
                '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
            ],
        },
    },
}
