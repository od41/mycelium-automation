// @ts-ignore
import { ethers as hardhatEthers } from "hardhat";
import { ethers } from "ethers";

// Load environment variables
require('dotenv').config();

async function main() {
  // Contract addresses
  const automationRegistryAddress = process.env.REGISTRY_ADDRESS;
  const simpleCounterAddress = process.env.COUNTER_ADDRESS;

  // Get the contract instances
  const automationRegistry = await hardhatEthers.getContractAt("AutomationRegistry", automationRegistryAddress);
  
  // For the checkData, we'll encode the upkeep ID (which will be assigned by the contract)
  // Since we don't know the ID yet, we'll use 0 as a placeholder
  // The automation node will replace this with the actual upkeep ID
  const checkData = ethers.AbiCoder.defaultAbiCoder().encode(["uint256"], [0]);
  
  // Set the interval to 5 minutes (in seconds)
  const interval = 300;
  
  // Set the minimum funding (you can adjust this based on the contract's minimumFunding)
  const fundingAmount = ethers.parseEther("0.00001"); // 0.1 ETH

  console.log("Registering upkeep...");
  console.log("Target Contract:", simpleCounterAddress);
  console.log("Interval:", interval, "seconds");
  console.log("Funding Amount:", ethers.formatEther(fundingAmount), "ETH");

  // Register the upkeep
  const tx = await automationRegistry.registerUpkeep(
    simpleCounterAddress,
    checkData,
    interval,
    { value: fundingAmount }
  );

  // Wait for the transaction to be mined
  const receipt = await tx.wait();

  // Find the UpkeepRegistered event to get the upkeep ID
  const event = receipt.events?.find(e => e.event === "UpkeepRegistered");
  const upkeepId = event?.args?.upkeepId;

  console.log("Upkeep registered successfully!");
  console.log("Upkeep ID:", upkeepId.toString());
  console.log("Transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });