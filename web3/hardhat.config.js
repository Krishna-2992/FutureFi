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
            url: POLYGON_MUMBAI_URL,
            accounts: [PRIVATE_KEY],
        },
        avalanche: {
            url: AVALANCHE_FUZI_URL,
            accounts: [PRIVATE_KEY],
        },
    },
}
