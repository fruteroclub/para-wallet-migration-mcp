#!/usr/bin/env node

import { spawn } from 'child_process';

const config = {
  paraApiKey: "para_test_1234567890abcdef",
  environment: "development",
  supportedChains: [1, 137, 42161, 8453],
  wallets: ["METAMASK", "COINBASE", "WALLETCONNECT", "RAINBOW"]
};

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
      name: "generate_provider_component",
      arguments: {
        config: config,
        typescript: true
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
        if (response.result && response.result.content) {
          console.log(`\n=== PARA PROVIDER COMPONENT ===`);
          console.log(response.result.content[0].text);
        }
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

server.stdin.write(JSON.stringify(messages[0]) + '\n');