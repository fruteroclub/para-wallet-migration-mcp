#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { MigrationService } from './services/migration-service.js';
import { CodeGenerator } from './services/code-generator.js';
import { ValidationService } from './services/validation-service.js';

const server = new Server({
  name: 'mcp-reown-para-migration',
  version: '1.0.0',
  capabilities: {
    tools: {},
  },
});

// Initialize services
const migrationService = new MigrationService();
const codeGenerator = new CodeGenerator();
const validationService = new ValidationService();

// List available tools
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'analyze_project',
        description: 'Analyze a project to detect ReOwn/WalletConnect usage and prepare migration plan',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
            },
            packageJsonPath: {
              type: 'string',
              description: 'Path to package.json file (optional)',
            },
          },
          required: ['projectPath'],
        },
      },
      {
        name: 'generate_migration_config',
        description: 'Generate Para configuration to replace ReOwn/WalletConnect setup',
        inputSchema: {
          type: 'object',
          properties: {
            paraApiKey: {
              type: 'string',
              description: 'Para API key',
            },
            environment: {
              type: 'string',
              enum: ['development', 'production'],
              description: 'Target environment',
              default: 'development',
            },
            supportedChains: {
              type: 'array',
              items: { type: 'number' },
              description: 'Array of supported chain IDs',
              default: [1],
            },
            wallets: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['METAMASK', 'COINBASE', 'WALLETCONNECT', 'RAINBOW'],
              },
              description: 'Supported wallet types',
              default: ['METAMASK', 'COINBASE', 'WALLETCONNECT'],
            },
          },
          required: ['paraApiKey'],
        },
      },
      {
        name: 'generate_provider_component',
        description: 'Generate React provider component for Para integration',
        inputSchema: {
          type: 'object',
          properties: {
            config: {
              type: 'object',
              description: 'Migration configuration object',
            },
            typescript: {
              type: 'boolean',
              description: 'Generate TypeScript version',
              default: true,
            },
          },
          required: ['config'],
        },
      },
      {
        name: 'generate_connect_button',
        description: 'Generate connect button component for Para',
        inputSchema: {
          type: 'object',
          properties: {
            typescript: {
              type: 'boolean',
              description: 'Generate TypeScript version',
              default: true,
            },
            styling: {
              type: 'string',
              enum: ['none', 'tailwind', 'styled-components', 'css-modules'],
              description: 'Styling approach to use',
              default: 'tailwind',
            },
          },
        },
      },
      {
        name: 'validate_migration',
        description: 'Validate migration setup and check for common issues',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
            },
            config: {
              type: 'object',
              description: 'Migration configuration to validate',
            },
          },
          required: ['projectPath'],
        },
      },
      {
        name: 'create_migration_guide',
        description: 'Create a step-by-step migration guide for the project',
        inputSchema: {
          type: 'object',
          properties: {
            projectName: {
              type: 'string',
              description: 'Name of the project being migrated',
            },
            currentSetup: {
              type: 'object',
              description: 'Current ReOwn/WalletConnect setup details',
            },
            targetConfig: {
              type: 'object',
              description: 'Target Para configuration',
            },
          },
          required: ['projectName'],
        },
      },
      {
        name: 'check_compatibility',
        description: 'Check compatibility between current Wagmi hooks and Para',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
            },
          },
          required: ['projectPath'],
        },
      },
      {
        name: 'generate_layout_with_styles',
        description: 'Generate Next.js layout with Para SDK styles properly imported',
        inputSchema: {
          type: 'object',
          properties: {
            typescript: {
              type: 'boolean',
              description: 'Generate TypeScript version',
              default: true,
            },
          },
        },
      },
      {
        name: 'generate_css_imports',
        description: 'Generate CSS import statements for Para SDK styles in the correct entry point',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
            },
            typescript: {
              type: 'boolean',
              description: 'Generate TypeScript version',
              default: true,
            },
          },
          required: ['projectPath'],
        },
      },
      {
        name: 'validate_para_migration',
        description: 'Validate the 3 critical issues that cause 90% of migration failures',
        inputSchema: {
          type: 'object',
          properties: {
            projectPath: {
              type: 'string',
              description: 'Path to the project directory',
            },
          },
          required: ['projectPath'],
        },
      },
      {
        name: 'generate_hooks_examples',
        description: 'Generate hook usage examples showing before/after migration patterns',
        inputSchema: {
          type: 'object',
          properties: {
            fromProvider: {
              type: 'string',
              enum: ['privy', 'reown', 'walletconnect'],
              description: 'Source wallet provider being migrated from',
              default: 'privy',
            },
            typescript: {
              type: 'boolean',
              description: 'Generate TypeScript version',
              default: true,
            },
          },
        },
      },
      {
        name: 'quick_migration_mode',
        description: 'Generate ultra-fast development configuration with timeouts and fallbacks',
        inputSchema: {
          type: 'object',
          properties: {
            config: {
              type: 'object',
              description: 'Base migration configuration',
            },
          },
          required: ['config'],
        },
      },
    ],
  };
});

// Handle tool calls
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  if (!args) {
    return {
      content: [
        {
          type: 'text',
          text: `No arguments provided for tool: ${name}`,
        },
      ],
      isError: true,
    };
  }

  try {
    switch (name) {
      case 'analyze_project':
        return await migrationService.analyzeProject(
          args.projectPath as string,
          args.packageJsonPath as string | undefined
        );

      case 'generate_migration_config':
        return await migrationService.generateMigrationConfig({
          paraApiKey: args.paraApiKey as string,
          environment: (args.environment as 'development' | 'production') || 'development',
          supportedChains: (args.supportedChains as number[]) || [1],
          wallets: (args.wallets as ('METAMASK' | 'COINBASE' | 'WALLETCONNECT' | 'RAINBOW')[]) || ['METAMASK', 'COINBASE', 'WALLETCONNECT'],
        });

      case 'generate_provider_component':
        return await codeGenerator.generateProviderComponent(
          args.config as any,
          args.typescript as boolean | undefined
        );

      case 'generate_connect_button':
        return await codeGenerator.generateConnectButton(
          args.typescript as boolean | undefined,
          args.styling as string | undefined
        );

      case 'validate_migration':
        return await validationService.validateMigration(
          args.projectPath as string,
          args.config as any
        );

      case 'create_migration_guide':
        return await migrationService.createMigrationGuide(
          args.projectName as string,
          args.currentSetup as any,
          args.targetConfig as any
        );

      case 'check_compatibility':
        return await validationService.checkWagmiCompatibility(args.projectPath as string);

      case 'generate_layout_with_styles':
        return await codeGenerator.generateLayoutWithStyles(
          args.typescript as boolean | undefined
        );

      case 'generate_css_imports':
        return await codeGenerator.generateCssImports(
          args.projectPath as string,
          args.typescript as boolean | undefined
        );

      case 'validate_para_migration':
        return await validationService.validateParaMigration(
          args.projectPath as string
        );

      case 'generate_hooks_examples':
        return await codeGenerator.generateHooksExamples(
          args.fromProvider as string | undefined,
          args.typescript as boolean | undefined
        );

      case 'quick_migration_mode':
        return await codeGenerator.generateQuickMigrationConfig(
          args.config as any
        );

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error executing ${name}: ${error instanceof Error ? error.message : String(error)}`,
        },
      ],
      isError: true,
    };
  }
});

// Start the server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('MCP ReOwn to Para Migration Server running on stdio');
}

main().catch((error) => {
  console.error('Server error:', error);
  process.exit(1);
});