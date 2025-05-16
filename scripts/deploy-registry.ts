// @ts-ignore
import { ethers } from "hardhat";

async function main() {
  // Deploy AutomationRegistry with minimum funding of 0.00001 ETH
  const minimumFunding = ethers.parseEther("0.00001");
  
  console.log("Deploying AutomationRegistry...");
  const AutomationRegistry = await ethers.getContractFactory("AutomationRegistry");
  const registry = await AutomationRegistry.deploy(minimumFunding);
  
  await registry.waitForDeployment();
  
  const address = await registry.getAddress();
  console.log(`AutomationRegistry deployed to: ${address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 