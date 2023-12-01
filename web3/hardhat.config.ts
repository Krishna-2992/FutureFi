import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";

require("dotenv").config()

const POLYGON_MUMBAI_URL = process.env.POLYGON_MUMBAI_URL
const PRIVATE_KEY = process.env.PRIVATE_KEY

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  networks: {
    hardhat: {
      chainId: 31337,
    }, 
    polygon: {
      url: "https://rpc-mumbai.maticvigil.com/",
      accounts: ["fe706c57071a206353d19d061cbdec00fff6b1e2b649a2f5654bedf6e793b3f0"]
    }
  }
};

export default config;
