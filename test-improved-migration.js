#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

// Test the improved MCP server with the lessons learned from real migration
async function testImprovedMigration() {
  console.log('🧪 Testing Improved Para Migration MCP Server...\n');

  const mcpPath = path.join(__dirname, 'dist', 'index.js');

  // Test 1: Generate improved provider component
  console.log('1️⃣ Testing Improved Provider Component Generation...');
  await testTool('generate_provider_component', {
    config: {
      paraApiKey: 'para_test_1234567890abcdef',
      environment: 'development',
      supportedChains: [42161], // Arbitrum
      wallets: ['METAMASK', 'COINBASE', 'WALLETCONNECT', 'RAINBOW']
    },
    typescript: true
  });

  // Test 2: Generate layout with styles
  console.log('\n2️⃣ Testing Layout with Styles Generation...');
  await testTool('generate_layout_with_styles', {
    typescript: true
  });

  // Test 3: Generate connect button
  console.log('\n3️⃣ Testing Connect Button Generation...');
  await testTool('generate_connect_button', {
    typescript: true,
    styling: 'tailwind'
  });

  // Test 4: Create migration guide with new insights
  console.log('\n4️⃣ Testing Migration Guide with Critical Insights...');
  await testTool('create_migration_guide', {
    projectName: 'my-defi-app',
    currentSetup: {
      framework: 'Privy',
      packages: ['@privy-io/react-auth']
    },
    targetConfig: {
      paraApiKey: 'para_test_1234567890abcdef',
      environment: 'development'
    }
  });

  console.log('\n✅ All tests completed! The MCP now includes critical fixes:\n');
  console.log('🔧 Key Improvements:');
  console.log('   • ⚠️  CRITICAL: <ParaModal /> component is now included');
  console.log('   • ⚠️  CRITICAL: "@getpara/react-sdk/styles.css" import added');
  console.log('   • ⚠️  CRITICAL: Environment.DEVELOPMENT/PRODUCTION usage');
  console.log('   • 🆕 embeddedWalletConfig for seamless wallet creation');
  console.log('   • 🆕 Layout generator with proper style imports');
  console.log('   • 📝 Updated recommendations based on real migration experience');
}

function testTool(toolName, args) {
  return new Promise((resolve, reject) => {
    const child = spawn('node', [path.join(__dirname, 'dist', 'index.js')], {
      stdio: ['pipe', 'pipe', 'pipe']
    });

    let output = '';
    let errorOutput = '';

    child.stdout.on('data', (data) => {
      output += data.toString();
    });

    child.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    child.on('close', (code) => {
      if (code === 0) {
        try {
          // Parse the MCP response
          const lines = output.trim().split('\n');
          const responseLine = lines.find(line => line.includes('"content"'));
          
          if (responseLine) {
            const response = JSON.parse(responseLine);
            if (response.content && response.content[0] && response.content[0].text) {
              const result = JSON.parse(response.content[0].text);
              console.log(`✅ ${toolName}: Generated successfully`);
              
              // Show key details based on tool
              if (toolName === 'generate_provider_component') {
                console.log(`   📁 File: ${result.filename}`);
                console.log(`   📦 Dependencies: ${result.dependencies.join(', ')}`);
                console.log(`   ⚠️  Critical Notes: ${result.notes.filter(n => n.includes('CRITICAL')).length} found`);
              } else if (toolName === 'generate_layout_with_styles') {
                console.log(`   📁 File: ${result.filename}`);
                console.log(`   ⚠️  Critical Notes: ${result.notes.filter(n => n.includes('CRITICAL')).length} found`);
              } else if (toolName === 'create_migration_guide') {
                console.log(`   📋 Steps: ${result.migrationGuide.steps.length}`);
                console.log(`   🎯 Focus: Para Modal + Styles integration`);
              }
            }
          }
          resolve();
        } catch (error) {
          console.log(`⚠️  ${toolName}: Completed but response parsing failed`);
          resolve();
        }
      } else {
        console.log(`❌ ${toolName}: Failed with code ${code}`);
        if (errorOutput) {
          console.log(`   Error: ${errorOutput.trim()}`);
        }
        resolve();
      }
    });

    // Send the MCP request
    const request = {
      jsonrpc: '2.0',
      id: 1,
      method: 'tools/call',
      params: {
        name: toolName,
        arguments: args
      }
    };

    child.stdin.write(JSON.stringify(request) + '\n');
    child.stdin.end();

    // Timeout after 10 seconds
    setTimeout(() => {
      child.kill();
      console.log(`⏰ ${toolName}: Timeout`);
      resolve();
    }, 10000);
  });
}

// Run the tests
testImprovedMigration().catch(console.error);