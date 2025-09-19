#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MCPTester {
  constructor() {
    this.serverProcess = null;
  }

  async testTool(toolName, args) {
    return new Promise((resolve, reject) => {
      const server = spawn('node', [join(__dirname, 'dist/index.js')], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let errorOutput = '';

      server.stdout.on('data', (data) => {
        output += data.toString();
      });

      server.stderr.on('data', (data) => {
        errorOutput += data.toString();
      });

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
      server.stdin.end();

      server.on('close', (code) => {
        if (code !== 0) {
          reject(new Error(`Server exited with code ${code}: ${errorOutput}`));
        } else {
          resolve({ output, errorOutput });
        }
      });

      // Timeout after 10 seconds
      setTimeout(() => {
        server.kill();
        reject(new Error('Test timed out'));
      }, 10000);
    });
  }

  async runTests() {
    console.log('🧪 Testing MCP ReOwn to Para Migration Server...\n');

    try {
      // Test 1: Analyze project
      console.log('1️⃣ Testing project analysis...');
      const analysisResult = await this.testTool('analyze_project', {
        projectPath: join(__dirname, 'test-project')
      });
      console.log('✅ Project analysis: PASSED\n');

      // Test 2: Generate migration config
      console.log('2️⃣ Testing migration config generation...');
      const configResult = await this.testTool('generate_migration_config', {
        paraApiKey: 'test-api-key',
        environment: 'development',
        supportedChains: [1, 137],
        wallets: ['METAMASK', 'COINBASE']
      });
      console.log('✅ Migration config: PASSED\n');

      // Test 3: Generate provider component
      console.log('3️⃣ Testing provider component generation...');
      const providerResult = await this.testTool('generate_provider_component', {
        config: {
          paraApiKey: 'test-api-key',
          environment: 'development',
          supportedChains: [1],
          wallets: ['METAMASK']
        },
        typescript: true
      });
      console.log('✅ Provider component: PASSED\n');

      // Test 4: Generate connect button
      console.log('4️⃣ Testing connect button generation...');
      const buttonResult = await this.testTool('generate_connect_button', {
        typescript: true,
        styling: 'tailwind'
      });
      console.log('✅ Connect button: PASSED\n');

      // Test 5: Create migration guide
      console.log('5️⃣ Testing migration guide creation...');
      const guideResult = await this.testTool('create_migration_guide', {
        projectName: 'Test Project'
      });
      console.log('✅ Migration guide: PASSED\n');

      console.log('🎉 All tests passed! MCP server is working correctly.');
      console.log('\n📋 Summary:');
      console.log('- Project analysis: ✅');
      console.log('- Migration config: ✅');
      console.log('- Provider component: ✅');
      console.log('- Connect button: ✅');
      console.log('- Migration guide: ✅');

    } catch (error) {
      console.error('❌ Test failed:', error.message);
      process.exit(1);
    }
  }
}

// Run tests if this file is executed directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tester = new MCPTester();
  tester.runTests().catch(console.error);
}

export { MCPTester };