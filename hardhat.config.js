require("@nomiclabs/hardhat-ethers");
//require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-etherscan");
require("@nomicfoundation/hardhat-toolbox");
require("@nomiclabs/hardhat-truffle5");
require("dotenv").config();
require("hardhat-gas-reporter")

const PRIVATE_KEY = process.env.PRIVATE_KEY;
const ENDPOINT_URL = process.env.ENDPOINT_URL;

module.exports = {
  solidity: "0.8.0",
  
  networks: {
    goerli: {
      url: ENDPOINT_URL,
      accounts: [`0x${PRIVATE_KEY}`],
    },
  },
  etherscan: {
    // 下面這個就是 Etherscan 的 API Key 哦 
    // 和上面第一步中 .env 檔案中的對應
    apiKey: process.env.ETHERSCAN_API_KEY
  },
  gasReporter:{
    enabled: true,
  }
  
};