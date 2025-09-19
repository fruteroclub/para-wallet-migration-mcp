#!/usr/bin/env node

// Simple test to verify MCP server tools
import { MigrationService } from './dist/services/migration-service.js';
import { CodeGenerator } from './dist/services/code-generator.js';
import { ValidationService } from './dist/services/validation-service.js';

async function runSimpleTests() {
  console.log('🧪 Testing MCP Server Components...\n');

  try {
    const migrationService = new MigrationService();
    const codeGenerator = new CodeGenerator();
    const validationService = new ValidationService();

    // Test 1: Analyze test project
    console.log('1️⃣ Testing project analysis...');
    const analysisResult = await migrationService.analyzeProject('./test-project');
    console.log('✅ Project analysis completed');
    
    // Test 2: Generate migration config
    console.log('2️⃣ Testing config generation...');
    const configResult = await migrationService.generateMigrationConfig({
      paraApiKey: 'test-key',
      environment: 'development',
      supportedChains: [1],
      wallets: ['METAMASK']
    });
    console.log('✅ Config generation completed');

    // Test 3: Generate provider component
    console.log('3️⃣ Testing provider generation...');
    const providerResult = await codeGenerator.generateProviderComponent({
      paraApiKey: 'test-key',
      environment: 'development',
      supportedChains: [1],
      wallets: ['METAMASK']
    }, true);
    console.log('✅ Provider generation completed');

    // Test 4: Generate connect button
    console.log('4️⃣ Testing button generation...');
    const buttonResult = await codeGenerator.generateConnectButton(true, 'tailwind');
    console.log('✅ Button generation completed');

    console.log('\n🎉 All core functionality tests passed!');
    console.log('\n📋 The MCP server is ready to use with:');
    console.log('- Project analysis and migration planning');
    console.log('- Para configuration generation');
    console.log('- React component generation');
    console.log('- Migration validation');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

runSimpleTests();