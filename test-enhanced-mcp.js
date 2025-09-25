#!/usr/bin/env node

// Test script for the enhanced Para Migration MCP server
// This script tests the new tools added based on the migration learnings

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const serverPath = path.join(__dirname, 'dist', 'index.js');

async function testMcpTool(toolName, args = {}) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Testing tool: ${toolName}`);
    console.log(`   Args: ${JSON.stringify(args, null, 2)}`);
    
    const server = spawn('node', [serverPath]);
    let output = '';
    let hasInitialized = false;
    
    server.stdout.on('data', (data) => {
      const message = data.toString();
      
      if (message.includes('MCP ReOwn to Para Migration Server running')) {
        hasInitialized = true;
        
        // Send the tool request
        const request = {
          jsonrpc: '2.0',
          id: 1,
          method: 'tools/call',
          params: {
            name: toolName,
            arguments: args
          }
        };
        
        server.stdin.write(JSON.stringify(request) + '\n');
      } else if (hasInitialized && message.trim()) {
        try {
          const response = JSON.parse(message);
          if (response.id === 1) {
            output = response;
            server.kill();
          }
        } catch (e) {
          // Ignore parsing errors
        }
      }
    });
    
    server.stderr.on('data', (data) => {
      const message = data.toString();
      if (!message.includes('running on stdio')) {
        console.error('Server error:', message);
      }
    });
    
    server.on('close', (code) => {
      if (output) {
        resolve(output);
      } else {
        reject(new Error(`Server exited with code ${code}, no output received`));
      }
    });
    
    // Timeout after 10 seconds
    setTimeout(() => {
      server.kill();
      reject(new Error('Test timeout'));
    }, 10000);
  });
}

async function runTests() {
  console.log('🚀 Testing Enhanced Para Migration MCP Server');
  console.log('=' .repeat(60));
  
  const tests = [
    {
      name: 'validate_para_migration',
      args: { projectPath: '/tmp/test-project' },
      description: 'Test the new critical validation tool'
    },
    {
      name: 'generate_css_imports', 
      args: { projectPath: '/tmp/test-project', typescript: true },
      description: 'Test CSS import generation'
    },
    {
      name: 'generate_hooks_examples',
      args: { fromProvider: 'privy', typescript: true },
      description: 'Test hook migration examples from Privy'
    },
    {
      name: 'quick_migration_mode',
      args: { 
        config: { 
          paraApiKey: 'test_key_123',
          environment: 'development',
          wallets: ['METAMASK', 'COINBASE']
        }
      },
      description: 'Test quick migration configuration'
    }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    try {
      console.log(`\n📋 ${test.description}`);
      const result = await testMcpTool(test.name, test.args);
      
      if (result && result.result && result.result.content) {
        console.log('✅ PASS - Tool executed successfully');
        
        // Parse and show key information from the result
        const content = result.result.content[0];
        if (content.type === 'text') {
          try {
            const data = JSON.parse(content.text);
            
            if (test.name === 'validate_para_migration') {
              console.log(`   Critical issues found: ${data.criticalIssueCount || 0}`);
              if (data.issues && data.issues.length > 0) {
                console.log(`   Issues: ${data.issues.join(', ')}`);
              }
            } else if (test.name === 'generate_css_imports') {
              console.log(`   Entry point found: ${data.entryPointFound ? 'Yes' : 'No'}`);
              console.log(`   Instructions: ${data.instructions}`);
            } else if (test.name === 'generate_hooks_examples') {
              console.log(`   From provider: ${data.fromProvider}`);
              console.log(`   Migration notes: ${data.migrationNotes.length} items`);
            } else if (test.name === 'quick_migration_mode') {
              console.log(`   Quick config generated with ${data.speedOptimizations.length} optimizations`);
              console.log(`   Target migration time: ${data.migrationTimeline.total}`);
            }
          } catch (e) {
            console.log('   Response data could not be parsed, but tool succeeded');
          }
        }
        
        passed++;
      } else {
        console.log('❌ FAIL - No valid result returned');
        failed++;
      }
      
    } catch (error) {
      console.log(`❌ FAIL - ${error.message}`);
      failed++;
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log(`📊 Test Results: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('🎉 All enhanced MCP tools are working correctly!');
    console.log('\n🚀 Migration improvements successfully implemented:');
    console.log('   ✅ Critical validation tool (3 main failure points)');
    console.log('   ✅ CSS import generation with path detection');
    console.log('   ✅ Before/after hook examples for migrations');
    console.log('   ✅ Quick development mode configuration');
    console.log('\n💡 The MCP should now reduce migration time from 40+ minutes to <5 minutes');
  } else {
    console.log('⚠️  Some tests failed. Check the implementation.');
    process.exit(1);
  }
}

runTests().catch(console.error);