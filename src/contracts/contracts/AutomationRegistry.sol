// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract AutomationRegistry {
    struct Upkeep {
        address owner;
        address targetContract;
        bytes checkData;
        uint256 balance;
        bool active;
        uint256 lastExecuted;
        uint256 interval;
    }
    
    mapping(uint256 => Upkeep) public upkeeps;
    uint256 public upkeepCount;
    uint256 public minimumFunding;
    address public owner;
    
    event UpkeepRegistered(uint256 indexed upkeepId, address indexed owner, address targetContract);
    event UpkeepCancelled(uint256 indexed upkeepId);
    event UpkeepPerformed(uint256 indexed upkeepId, uint256 gasUsed);
    event FundsAdded(uint256 indexed upkeepId, uint256 amount);
    
    constructor(uint256 _minimumFunding) {
        owner = msg.sender;
        minimumFunding = _minimumFunding;
    }
    
    // Register a new upkeep with initial funding
    function registerUpkeep(
        address _targetContract,
        bytes calldata _checkData,
        uint256 _interval
    ) external payable returns (uint256) {
        require(msg.value >= minimumFunding, "Insufficient funding");
        
        uint256 upkeepId = upkeepCount++;
        
        upkeeps[upkeepId] = Upkeep({
            owner: msg.sender,
            targetContract: _targetContract,
            checkData: _checkData,
            balance: msg.value,
            active: true,
            lastExecuted: block.timestamp,
            interval: _interval
        });
        
        emit UpkeepRegistered(upkeepId, msg.sender, _targetContract);
        
        return upkeepId;
    }
    
    // Cancel an upkeep and withdraw remaining funds
    function cancelUpkeep(uint256 _upkeepId) external {
        Upkeep storage upkeep = upkeeps[_upkeepId];
        require(msg.sender == upkeep.owner, "Only owner can cancel");
        require(upkeep.active, "Upkeep already cancelled");
        
        upkeep.active = false;
        
        uint256 refund = upkeep.balance;
        upkeep.balance = 0;
        
        payable(upkeep.owner).transfer(refund);
        
        emit UpkeepCancelled(_upkeepId);
    }
    
    // Add more funds to an upkeep
    function addFunds(uint256 _upkeepId) external payable {
        require(upkeeps[_upkeepId].active, "Upkeep not active");
        
        upkeeps[_upkeepId].balance += msg.value;
        
        emit FundsAdded(_upkeepId, msg.value);
    }
    
    // This function would be called by your automation nodes
    function performUpkeep(uint256 _upkeepId, bytes calldata _performData) external {
        // In production, add node authentication
        Upkeep storage upkeep = upkeeps[_upkeepId];
        require(upkeep.active, "Upkeep not active");
        
        // Execute the target contract's performUpkeep
        (bool success, ) = upkeep.targetContract.call(
            abi.encodeWithSignature("performUpkeep(bytes)", _performData)
        );
        require(success, "Target contract execution failed");
        
        // Update the upkeep state
        upkeep.lastExecuted = block.timestamp;
        
        // Calculate and deduct fee (using a fixed gas estimate for now)
        uint256 estimatedGas = 200000; // Conservative estimate
        uint256 fee = estimatedGas * tx.gasprice;
        require(upkeep.balance >= fee, "Insufficient funds");
        
        upkeep.balance -= fee;
        
        // Send fee to node operator (in production, handle this more securely)
        payable(msg.sender).transfer(fee);
        
        emit UpkeepPerformed(_upkeepId, estimatedGas);
    }
    
    /**
     * @notice Checks if an upkeep needs to be performed
     * @param checkData The encoded upkeep ID
     * @return needsExecution Whether the upkeep should be performed
     * @return performData The data to be passed to performUpkeep
     */
    function checkUpkeep(bytes calldata checkData) external view returns (bool needsExecution, bytes memory performData) {
        // Decode the upkeep ID from the checkData
        uint256 upkeepId = abi.decode(checkData, (uint256));
        
        Upkeep storage upkeep = upkeeps[upkeepId];
        
        // Check if upkeep is active and has sufficient balance
        if (!upkeep.active) {
            return (false, "");
        }
        
        // Check if enough time has passed since last execution
        if (block.timestamp < upkeep.lastExecuted + upkeep.interval) {
            return (false, "");
        }
        
        // Check if there's enough balance for at least one execution
        if (upkeep.balance < tx.gasprice * 100000) { // Assuming minimum 100k gas
            return (false, "");
        }
        
        // If all checks pass, return true and the checkData as performData
        return (true, checkData);
    }
    
    // View functions for clients
    function getUpkeepInfo(uint256 _upkeepId) external view returns (
        address owner,
        address targetContract,
        uint256 balance,
        bool active,
        uint256 lastExecuted,
        uint256 interval
    ) {
        Upkeep storage upkeep = upkeeps[_upkeepId];
        return (
            upkeep.owner,
            upkeep.targetContract,
            upkeep.balance,
            upkeep.active,
            upkeep.lastExecuted,
            upkeep.interval
        );
    }
}