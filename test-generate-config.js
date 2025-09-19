#!/usr/bin/env node

import { spawn } from 'child_process';

const messages = [
  {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      clientInfo: { name: "test-client", version: "1.0.0" }
    }
  },
  {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/call",
    params: {
      name: "generate_migration_config",
      arguments: {
        paraApiKey: "para_test_1234567890abcdef",
        environment: "development",
        supportedChains: [1, 137, 42161, 8453], // Ethereum, Polygon, Arbitrum, Base
        wallets: ["METAMASK", "COINBASE", "WALLETCONNECT", "RAINBOW"]
      }
    }
  }
];

const server = spawn('node', ['dist/index.js']);
let responseCount = 0;

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log(`\n=== MIGRATION CONFIG ===`);
        console.log(JSON.stringify(response, null, 2));
        responseCount++;
        
        if (responseCount < messages.length) {
          server.stdin.write(JSON.stringify(messages[responseCount]) + '\n');
        } else {
          server.kill();
        }
      } catch (e) {}
    }
  }
});

server.stderr.on('data', (data) => {
  // Ignore stderr
});

server.stdin.write(JSON.stringify(messages[0]) + '\n');