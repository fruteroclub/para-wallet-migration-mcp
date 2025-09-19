#!/usr/bin/env node

import { spawn } from 'child_process';
import readline from 'readline';

class MCPInteractive {
  constructor() {
    this.requestId = 1;
  }

  async sendRequest(method, params) {
    return new Promise((resolve, reject) => {
      const server = spawn('node', ['dist/index.js'], {
        stdio: ['pipe', 'pipe', 'pipe']
      });

      let output = '';
      let responseReceived = false;

      server.stdout.on('data', (data) => {
        const text = data.toString();
        output += text;
        
        // Look for JSON-RPC response
        try {
          const lines = text.split('\n').filter(line => line.trim());
          for (const line of lines) {
            if (line.startsWith('{') && !responseReceived) {
              const response = JSON.parse(line);
              if (response.id === this.requestId - 1) {
                responseReceived = true;
                resolve(response);
                server.kill();
                return;
              }
            }
          }
        } catch (e) {
          // Continue parsing
        }
      });

      server.stderr.on('data', (data) => {
        console.log('Server started:', data.toString());
      });

      const request = {
        jsonrpc: '2.0',
        id: this.requestId++,
        method,
        params
      };

      server.stdin.write(JSON.stringify(request) + '\n');

      setTimeout(() => {
        if (!responseReceived) {
          server.kill();
          reject(new Error('Request timeout'));
        }
      }, 10000);
    });
  }

  async showMenu() {
    console.log('\n🚀 MCP ReOwn to Para Migration - Interactive Test');
    console.log('=' .repeat(60));
    console.log('1. Analizar proyecto de prueba');
    console.log('2. Generar configuración Para');
    console.log('3. Generar componente Provider');
    console.log('4. Generar botón de conexión');
    console.log('5. Crear guía de migración');
    console.log('6. Ver todas las herramientas disponibles');
    console.log('0. Salir');
    console.log('=' .repeat(60));
  }

  async listTools() {
    try {
      console.log('\n📋 Obteniendo herramientas disponibles...');
      const response = await this.sendRequest('tools/list', {});
      
      if (response.result && response.result.tools) {
        console.log('\n🛠️ Herramientas disponibles:');
        response.result.tools.forEach((tool, index) => {
          console.log(`${index + 1}. ${tool.name}`);
          console.log(`   📝 ${tool.description}`);
          console.log('');
        });
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  async analyzeProject() {
    try {
      console.log('\n📊 Analizando proyecto de prueba...');
      const response = await this.sendRequest('tools/call', {
        name: 'analyze_project',
        arguments: {
          projectPath: './test-project'
        }
      });

      if (response.result) {
        const data = JSON.parse(response.result.content[0].text);
        console.log('\n✅ Análisis completado:');
        console.log(`📁 Proyecto: ${data.analysis.projectPath}`);
        console.log(`📦 Paquetes ReOwn: ${data.analysis.packageJsonAnalysis.reownPackages.join(', ')}`);
        console.log(`🔄 Complejidad: ${data.analysis.migrationComplexity}`);
        console.log(`📋 Recomendaciones: ${data.analysis.recommendations.length}`);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  async generateConfig() {
    try {
      console.log('\n⚙️ Generando configuración Para...');
      const response = await this.sendRequest('tools/call', {
        name: 'generate_migration_config',
        arguments: {
          paraApiKey: 'demo-api-key',
          environment: 'development',
          supportedChains: [1, 137],
          wallets: ['METAMASK', 'COINBASE', 'WALLETCONNECT']
        }
      });

      if (response.result) {
        const data = JSON.parse(response.result.content[0].text);
        console.log('\n✅ Configuración generada:');
        console.log(`🔑 API Key: ${data.migrationConfig.paraApiKey}`);
        console.log(`🌍 Ambiente: ${data.migrationConfig.environment}`);
        console.log(`⛓️ Chains: ${data.migrationConfig.supportedChains.join(', ')}`);
        console.log(`💼 Wallets: ${data.migrationConfig.wallets.join(', ')}`);
        console.log(`⏱️ Tiempo estimado: ${data.estimatedTimeMinutes} minutos`);
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  async generateProvider() {
    try {
      console.log('\n🔧 Generando componente Provider...');
      const response = await this.sendRequest('tools/call', {
        name: 'generate_provider_component',
        arguments: {
          config: {
            paraApiKey: 'demo-api-key',
            environment: 'development',
            supportedChains: [1],
            wallets: ['METAMASK', 'COINBASE']
          },
          typescript: true
        }
      });

      if (response.result) {
        const data = JSON.parse(response.result.content[0].text);
        console.log('\n✅ Componente generado:');
        console.log(`📄 Archivo: ${data.filename}`);
        console.log(`📦 Dependencias: ${data.dependencies.join(', ')}`);
        console.log('\n📝 Vista previa del código:');
        console.log(data.code.substring(0, 400) + '...');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  async generateButton() {
    try {
      console.log('\n🎨 Generando botón de conexión...');
      const response = await this.sendRequest('tools/call', {
        name: 'generate_connect_button',
        arguments: {
          typescript: true,
          styling: 'tailwind'
        }
      });

      if (response.result) {
        const data = JSON.parse(response.result.content[0].text);
        console.log('\n✅ Botón generado:');
        console.log(`📄 Archivo: ${data.filename}`);
        console.log(`🎨 Estilo: ${data.styling}`);
        console.log('\n📝 Vista previa:');
        console.log(data.code.substring(0, 300) + '...');
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  async createGuide() {
    try {
      console.log('\n📋 Creando guía de migración...');
      const response = await this.sendRequest('tools/call', {
        name: 'create_migration_guide',
        arguments: {
          projectName: 'Mi App Web3 Demo'
        }
      });

      if (response.result) {
        const data = JSON.parse(response.result.content[0].text);
        console.log('\n✅ Guía creada:');
        console.log(`📝 Proyecto: ${data.projectName}`);
        console.log(`📋 Pasos: ${data.migrationGuide.steps.length}`);
        console.log('\n🔄 Pasos de migración:');
        data.migrationGuide.steps.forEach((step, index) => {
          console.log(`  ${index + 1}. ${step.title}`);
        });
      }
    } catch (error) {
      console.error('❌ Error:', error.message);
    }
  }

  async start() {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    while (true) {
      await this.showMenu();
      
      const choice = await new Promise(resolve => {
        rl.question('\n¿Qué opción deseas probar? (0-6): ', resolve);
      });

      switch (choice) {
        case '1':
          await this.analyzeProject();
          break;
        case '2':
          await this.generateConfig();
          break;
        case '3':
          await this.generateProvider();
          break;
        case '4':
          await this.generateButton();
          break;
        case '5':
          await this.createGuide();
          break;
        case '6':
          await this.listTools();
          break;
        case '0':
          console.log('\n👋 ¡Gracias por probar el servidor MCP!');
          rl.close();
          return;
        default:
          console.log('❌ Opción inválida');
      }

      await new Promise(resolve => {
        rl.question('\n⏳ Presiona Enter para continuar...', resolve);
      });
    }
  }
}

const interactive = new MCPInteractive();
interactive.start().catch(console.error);