// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract SimpleCounter {
    uint256 private counter;

    event CounterIncremented(uint256 count, uint256 timestamp);

    function increment() external {
        counter++;
        emit CounterIncremented(counter, block.timestamp);
    }

    function getCount() external view returns (uint256) {
        return counter;
    }
} 