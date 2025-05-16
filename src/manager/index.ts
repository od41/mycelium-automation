import winston from 'winston';
import dotenv from 'dotenv';
import { ethers } from 'ethers';
import axios from 'axios';
import { AutomationRegistry__factory } from '../../typechain-types/factories/AutomationRegistry__factory';
import AutomationRegistry from '../../src/contracts/artifacts/src/contracts/contracts/AutomationRegistry.sol/AutomationRegistry.json';

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
const RPC_URL = process.env.RPC_URL;
const PRIVATE_KEY = process.env.PRIVATE_KEY!;

// Initialize provider and wallet
const provider = new ethers.JsonRpcProvider(RPC_URL);
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);
const registry = AutomationRegistry__factory.connect(REGISTRY_ADDRESS, wallet);

async function scanUpkeeps() {
  const upkeepCount = await registry.upkeepCount();
  logger.info(`Scanning ${upkeepCount} upkeeps`);
  
  for (let i = 0; i < upkeepCount; i++) {
    const upkeepInfo = await registry.getUpkeepInfo(i);
    
    // Skip inactive upkeeps
    if (!upkeepInfo.active) continue;
    
    // Check if it's time to execute this upkeep
    const currentTime = Math.floor(Date.now() / 1000);
    if (currentTime >= Number(upkeepInfo.lastExecuted) + Number(upkeepInfo.interval)) {
      logger.info(`Executing upkeep ${i}`);
      
      try {
        // Load the target contract and check if upkeep is needed
        const targetContract = new ethers.Contract(
          upkeepInfo.targetContract,
          AutomationRegistry.abi,
          provider
        );
        
        // Encode the upkeep ID for the check
        const checkData = ethers.AbiCoder.defaultAbiCoder().encode(['uint256'], [i]);
        const [needsExecution, performData] = await targetContract.checkUpkeep(checkData);
        
        if (needsExecution) {
          // Execute the upkeep through the registry
          const tx = await registry.performUpkeep(i, performData, {
            gasLimit: 500000
          });
          
          const receipt = await tx.wait();
          if (receipt) {
            logger.info(`Successfully executed upkeep ${i}, tx hash: ${receipt.hash}`);
          } else {
            logger.warn(`Upkeep ${i} transaction completed but no receipt available`);
          }
        } else {
          logger.info(`Upkeep ${i} does not need execution`);
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