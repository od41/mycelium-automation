import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.20",
  paths: {
    sources: "./src/contracts/contracts",  // Where your .sol files are
    tests: "./src/contracts/test",         // Where your tests are
    cache: "./src/contracts/cache",        // Where Hardhat stores cache
    artifacts: "./src/contracts/artifacts" // Where compiled contracts will go
  },
  networks: {
    sepolia: {
      url: process.env.RPC_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
};

export default config; 