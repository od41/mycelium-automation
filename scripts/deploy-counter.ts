// @ts-ignore
import { ethers } from "hardhat";

async function main() {  
  console.log("Deploying SimpleCounter...");
  const SimpleCounter = await ethers.getContractFactory("SimpleCounter");
  const counter = await SimpleCounter.deploy();
  
  await counter.waitForDeployment();
  
  const address = await counter.getAddress();
  console.log(`SimpleCounter deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 