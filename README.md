# Mycelium Automation

A decentralized automation system built on blockchain technology that allows users to register and execute automated tasks through smart contracts.

## Features

- Smart contract-based automation registry
- Customizable automation intervals
- Pay-per-execution model
- Support for multiple automation types
- Built-in monitoring and logging

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- A wallet with some ETH for contract deployment and automation registration
- Git

## Project Structure

```
src/
├── contracts/       # Smart contracts and deployment scripts
├── scripts/        # Automation scripts and utilities
└── manager/        # Automation manager and orchestration code
```

## Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/mycelium-automation.git
cd mycelium-automation
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the root directory:
```env
PRIVATE_KEY=your_private_key_here
RPC_URL=your_rpc_url_here
CHAIN_ID=your_chain_id_here
```

## Smart Contract Deployment

1. Compile the contracts:
```bash
npx hardhat compile
```

2. Deploy the AutomationRegistry contract:
```bash
npx hardhat run scripts/deploy.ts --network <your-network>
```

3. Verify the contract on Etherscan (optional):
```bash
npx hardhat verify --network <your-network> <contract-address> <constructor-args>
```

## Registering Your Automation

### 1. Create Your Automation Contract

Your automation contract must implement these functions:

```solidity
function checkUpkeep(bytes calldata checkData) external view returns (bool, bytes memory);
function performUpkeep(bytes calldata performData) external;
```

Example:
```solidity
contract MyAutomation {
    function checkUpkeep(bytes calldata) external view returns (bool, bytes memory) {
        // Your check logic here
        return (true, "");
    }

    function performUpkeep(bytes calldata) external {
        // Your automation logic here
    }
}
```

### 2. Register with AutomationRegistry

1. Deploy your automation contract
2. Calculate the minimum funding required (this varies by network and gas prices)
3. Register your automation using the AutomationRegistry contract:

```typescript
const minimumFunding = await registry.minimumFunding();
const interval = 3600; // 1 hour in seconds

const tx = await registry.registerUpkeep(
    automationContractAddress,
    "0x", // checkData
    interval,
    { value: minimumFunding }
);

const receipt = await tx.wait();
const [upkeepId] = receipt.events.find(e => e.event === "UpkeepRegistered").args;
console.log("Upkeep ID:", upkeepId.toString());
```

### 3. Managing Your Automation

- **Add Funds:**
```typescript
await registry.addFunds(upkeepId, { value: ethers.parseEther("1.0") });
```

- **Cancel Automation:**
```typescript
await registry.cancelUpkeep(upkeepId);
```

- **Check Status:**
```typescript
const info = await registry.getUpkeepInfo(upkeepId);
console.log("Active:", info.active);
console.log("Balance:", ethers.formatEther(info.balance));
```

## Running the Automation Manager

1. Build the project:
```bash
npm run build
```

2. Start the manager in production:
```bash
npm run start:prod
```

The manager will automatically monitor registered automations and execute them when conditions are met.

## Development

- Run tests:
```bash
npm test
```

- Lint code:
```bash
npm run lint
```

- Format code:
```bash
npm run format
```

## Monitoring and Logs

The automation manager uses Winston for logging. Logs are stored in:
- `logs/error.log` for errors
- `logs/combined.log` for all logs

## Security Considerations

1. Never share your private keys
2. Always test automations on testnet first
3. Set reasonable minimum funding amounts
4. Monitor your automation's balance regularly
5. Implement proper access controls in your automation contracts

## License

ISC

## Contributing

1. Fork the repository
2. Create your feature branch
3. Commit your changes
4. Push to the branch
5. Create a new Pull Request 