import winston from 'winston';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import axios from 'axios';

// Load environment variables
dotenv.config();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
  ],
});


// Load configuration
const REGISTRY_ADDRESS = process.env.REGISTRY_ADDRESS!;
const REGISTRY_ABI = require('./abi/RegistryABI.json');
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const registry = new ethers.Contract(REGISTRY_ADDRESS, REGISTRY_ABI, wallet);

async function scanUpkeeps() {
  const upkeepCount = await registry.upkeepCount();
  logger.info(`Scanning ${upkeepCount} upkeeps`);
  
  for (let i = 0; i < upkeepCount; i++) {
    const upkeepInfo = await registry.getUpkeepInfo(i);
    
    // Skip inactive upkeeps
    if (!upkeepInfo.active) continue;
    
    // Check if it's time to execute this upkeep
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime >= upkeepInfo.lastExecuted.toNumber() + upkeepInfo.interval.toNumber()) {
      logger.info(`Executing upkeep ${i}`);
      
      try {
        // Load the target contract and check if upkeep is needed
        const targetContract = new ethers.Contract(
          upkeepInfo.targetContract,
          ['function checkUpkeep(bytes) external view returns (bool, bytes)'],
          provider
        );
        
        const [needsExecution, performData] = await targetContract.checkUpkeep(upkeepInfo.checkData);
        
        if (needsExecution) {
          // Execute the upkeep
          const targetWithSigner = targetContract.connect(wallet);
          const tx = await targetWithSigner.performUpkeep(performData, {
            gasLimit: 500000
          });
          
          const receipt = await tx.wait();
          const gasUsed = receipt.gasUsed.toNumber();
          
          // Report the execution and collect payment
          await registry.performUpkeep(i, gasUsed);
          logger.info(`Successfully executed upkeep ${i}, gas used: ${gasUsed}`);
        }
      } catch (error) {
        logger.error(`Error executing upkeep ${i}:`, error);
      }
    }
  }
}

// Main function
async function main() {
  logger.info('Starting Mycelium Automation');
  
  try {
    await scanUpkeeps();
    logger.info('Mycelium Automation completed successfully');
  } catch (error) {
    logger.error('Error in Mycelium Automation:', error);
    process.exit(1);
  }
}

// Run the main function
main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
}); 