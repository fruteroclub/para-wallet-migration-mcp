#!/usr/bin/env node

import { spawn } from 'child_process';
import { EOL } from 'os';

// MCP JSON-RPC messages
const messages = [
  // Initialize
  {
    jsonrpc: "2.0",
    id: 1,
    method: "initialize",
    params: {
      protocolVersion: "2024-11-05",
      capabilities: {
        tools: {}
      },
      clientInfo: {
        name: "test-client",
        version: "1.0.0"
      }
    }
  },
  // List tools
  {
    jsonrpc: "2.0",
    id: 2,
    method: "tools/list"
  },
  // Analyze Privy project
  {
    jsonrpc: "2.0",
    id: 3,
    method: "tools/call",
    params: {
      name: "analyze_project",
      arguments: {
        projectPath: "/path/to/my-dapp"
      }
    }
  }
];

const server = spawn('node', ['dist/index.js'], {
  stdio: ['pipe', 'pipe', 'pipe']
});

let responseCount = 0;

server.stdout.on('data', (data) => {
  const lines = data.toString().split('\n');
  for (const line of lines) {
    if (line.trim()) {
      try {
        const response = JSON.parse(line);
        console.log(`Response ${responseCount + 1}:`, JSON.stringify(response, null, 2));
        responseCount++;
        
        // Send next message if available
        if (responseCount < messages.length) {
          const nextMessage = JSON.stringify(messages[responseCount]) + '\n';
          server.stdin.write(nextMessage);
        } else if (responseCount === messages.length) {
          server.kill();
        }
      } catch (e) {
        // Ignore non-JSON lines
      }
    }
  }
});

server.stderr.on('data', (data) => {
  console.error('Server error:', data.toString());
});

server.on('close', (code) => {
  console.log(`Server closed with code ${code}`);
});

// Start with first message
const firstMessage = JSON.stringify(messages[0]) + '\n';
server.stdin.write(firstMessage);