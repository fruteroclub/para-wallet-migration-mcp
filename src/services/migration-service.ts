import { promises as fs } from 'fs';
import path from 'path';
import { MigrationConfig, MigrationConfigSchema } from '../types.js';

export class MigrationService {
  async analyzeProject(projectPath: string, packageJsonPath?: string): Promise<any> {
    try {
      const packagePath = packageJsonPath || path.join(projectPath, 'package.json');
      const packageContent = await fs.readFile(packagePath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      // Detect ReOwn/WalletConnect usage
      const reownPackages = this.detectReownPackages(packageJson);
      const walletConnectPackages = this.detectWalletConnectPackages(packageJson);

      // Detect Privy usage
      const privyPackages = this.detectPrivyPackages(packageJson);

      // Scan for usage patterns in source files
      const sourceFiles = await this.findSourceFiles(projectPath);
      const usagePatterns = await this.analyzeUsagePatterns(sourceFiles);

      // Estimate migration complexity
      const complexity = this.estimateMigrationComplexity(
        reownPackages,
        walletConnectPackages,
        privyPackages,
        usagePatterns
      );

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                analysis: {
                  projectPath,
                  packageJsonAnalysis: {
                    reownPackages,
                    walletConnectPackages,
                    privyPackages,
                    totalPackagesToMigrate:
                      reownPackages.length + walletConnectPackages.length + privyPackages.length,
                  },
                  sourceCodeAnalysis: {
                    filesScanned: sourceFiles.length,
                    usagePatterns,
                  },
                  migrationComplexity: complexity,
                  recommendations: this.generateRecommendations(
                    reownPackages,
                    walletConnectPackages,
                    privyPackages,
                    usagePatterns
                  ),
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Failed to analyze project: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async generateMigrationConfig(config: MigrationConfig): Promise<any> {
    try {
      const validatedConfig = MigrationConfigSchema.parse(config);

      const migrationSteps = [
        {
          step: 'Package Migration',
          description: 'Remove ReOwn/Privy packages and install Para SDK',
          commands: [
            'npm uninstall @web3modal/wagmi @web3modal/siwe @privy-io/react-auth',
            'npm install @getpara/react-sdk @getpara/core-sdk @getpara/evm-wallet-connectors',
            'npm run postinstall',
          ],
        },
        {
          step: 'Environment Configuration',
          description: 'Set up Para environment variables',
          envVars: {
            PARA_API_KEY: validatedConfig.paraApiKey,
            PARA_ENVIRONMENT: validatedConfig.environment,
          },
        },
        {
          step: 'Provider Configuration',
          description: 'Configure Para provider with external wallets',
          config: {
            paraClientConfig: {
              apiKey: validatedConfig.paraApiKey,
              env: validatedConfig.environment,
            },
            externalWalletConfig: {
              wallets: validatedConfig.wallets,
              evmConnector: {
                config: {
                  chains: validatedConfig.supportedChains,
                },
              },
            },
          },
        },
      ];

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                migrationConfig: validatedConfig,
                migrationSteps,
                estimatedTimeMinutes: this.estimateMigrationTime(migrationSteps),
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      throw new Error(
        `Failed to generate migration config: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  async createMigrationGuide(
    projectName: string,
    currentSetup?: any,
    targetConfig?: any
  ): Promise<any> {
    const guide = {
      projectName,
      migrationGuide: {
        overview:
          'Complete migration guide from ReOwn/WalletConnect to Para Universal Embedded Wallets',
        prerequisites: [
          'Para API key (get from Para dashboard)',
          'Node.js and npm/yarn installed',
          'Backup your current project',
        ],
        steps: [
          {
            title: '1. Package Migration',
            description: 'Update dependencies',
            actions: [
              'Remove existing Web3Modal packages',
              'Install Para React SDK',
              'Run postinstall scripts',
            ],
            code: `
# Remove old packages
npm uninstall @web3modal/wagmi @web3modal/siwe

# Install Para SDK
npm install @getpara/react-sdk

# Run postinstall
npm run postinstall
            `,
          },
          {
            title: '2. Environment Setup',
            description: 'Configure environment variables',
            actions: ['Add Para API key to .env file', 'Set environment (development/production)'],
            code: `
# .env
PARA_API_KEY=your_para_api_key_here
PARA_ENVIRONMENT=development
            `,
          },
          {
            title: '3. Provider Migration',
            description: 'Replace Web3Modal provider with Para provider',
            actions: [
              'Update provider import',
              'Configure Para client',
              'Set up external wallet configuration',
            ],
            code: this.generateProviderMigrationCode(targetConfig),
          },
          {
            title: '4. Connect Button Update',
            description: 'Update wallet connection UI',
            actions: [
              'Replace Web3Modal connect button',
              'Use Para hooks for wallet state',
              'Update styling if needed',
            ],
            code: this.generateConnectButtonCode(),
          },
          {
            title: '5. Verification',
            description: 'Test the migration',
            actions: [
              'Test wallet connections',
              'Verify Wagmi hooks still work',
              'Check transaction functionality',
            ],
          },
        ],
        postMigration: {
          testing: [
            'Connect with different wallet types',
            'Test transaction signing',
            'Verify chain switching',
            'Check mobile compatibility',
          ],
          monitoring: [
            'Monitor connection success rates',
            'Track user experience metrics',
            'Watch for any errors in production',
          ],
        },
      },
    };

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(guide, null, 2),
        },
      ],
    };
  }

  private detectReownPackages(packageJson: any): string[] {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    return Object.keys(dependencies).filter(
      (pkg) => pkg.includes('@web3modal') || pkg.includes('reown') || pkg.includes('@reown')
    );
  }

  private detectWalletConnectPackages(packageJson: any): string[] {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    return Object.keys(dependencies).filter(
      (pkg) => pkg.includes('@walletconnect') || pkg.includes('walletconnect')
    );
  }

  private detectPrivyPackages(packageJson: any): string[] {
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
    return Object.keys(dependencies).filter(
      (pkg) => pkg.includes('@privy-io') || pkg.includes('privy')
    );
  }

  private async findSourceFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];

    async function scanDirectory(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);

          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && extensions.some((ext) => entry.name.endsWith(ext))) {
            files.push(fullPath);
          }
        }
      } catch (error) {
        // Ignore directories we can't read
      }
    }

    await scanDirectory(projectPath);
    return files;
  }

  private async analyzeUsagePatterns(sourceFiles: string[]): Promise<any> {
    const patterns = {
      web3ModalImports: 0,
      walletConnectImports: 0,
      privyImports: 0,
      wagmiHooks: 0,
      createWeb3ModalUsage: 0,
      connectButtonUsage: 0,
      privyProviderUsage: 0,
      usePrivyHooks: 0,
    };

    for (const file of sourceFiles.slice(0, 100)) {
      // Limit to first 100 files for performance
      try {
        const content = await fs.readFile(file, 'utf-8');

        if (content.includes('@web3modal')) patterns.web3ModalImports++;
        if (content.includes('@walletconnect')) patterns.walletConnectImports++;
        if (content.includes('@privy-io')) patterns.privyImports++;
        if (
          content.includes('use') &&
          (content.includes('wagmi') || content.includes('Account') || content.includes('Balance'))
        )
          patterns.wagmiHooks++;
        if (content.includes('createWeb3Modal')) patterns.createWeb3ModalUsage++;
        if (content.includes('w3m-button') || content.includes('ConnectButton'))
          patterns.connectButtonUsage++;
        if (content.includes('PrivyProvider')) patterns.privyProviderUsage++;
        if (
          content.includes('usePrivy') ||
          content.includes('useLogin') ||
          content.includes('useWallets')
        )
          patterns.usePrivyHooks++;
      } catch (error) {
        // Ignore files we can't read
      }
    }

    return patterns;
  }

  private estimateMigrationComplexity(
    reownPackages: string[],
    walletConnectPackages: string[],
    privyPackages: string[],
    usagePatterns: any
  ): string {
    const totalPackages =
      reownPackages.length + walletConnectPackages.length + privyPackages.length;
    const totalUsage = Object.values(usagePatterns).reduce(
      (sum: number, count) => sum + (count as number),
      0
    );

    if (totalPackages <= 2 && totalUsage <= 10) return 'Low';
    if (totalPackages <= 5 && totalUsage <= 25) return 'Medium';
    return 'High';
  }

  private generateRecommendations(
    reownPackages: string[],
    walletConnectPackages: string[],
    privyPackages: string[],
    usagePatterns: any
  ): string[] {
    const recommendations: string[] = [];

    if (reownPackages.length > 0) {
      recommendations.push('Remove all @web3modal packages and replace with @getpara/react-sdk');
    }

    if (walletConnectPackages.length > 0) {
      recommendations.push(
        'WalletConnect packages may conflict with Para - consider removing unused ones'
      );
    }

    if (privyPackages.length > 0) {
      recommendations.push('Remove @privy-io packages and replace with @getpara/react-sdk');
      recommendations.push('Replace PrivyProvider with ParaProvider from Para SDK');
    }

    if (usagePatterns.wagmiHooks > 0) {
      recommendations.push('Good news: Your existing Wagmi hooks will continue to work with Para');
    }

    if (usagePatterns.createWeb3ModalUsage > 0) {
      recommendations.push('Replace createWeb3Modal configuration with Para provider setup');
    }

    if (usagePatterns.usePrivyHooks > 0) {
      recommendations.push(
        'Replace usePrivy, useLogin, and useWallets hooks with Para equivalents'
      );
    }

    if (usagePatterns.privyProviderUsage > 0) {
      recommendations.push(
        'Update PrivyProvider configuration to use Para Universal Embedded Wallets'
      );
    }

    // Critical findings from actual migration testing
    recommendations.push('⚠️ CRITICAL: Always include <ParaModal /> component inside ParaProvider');
    recommendations.push('⚠️ CRITICAL: Import "@getpara/react-sdk/styles.css" in your layout');
    recommendations.push(
      '⚠️ CRITICAL: Use Environment.DEVELOPMENT/PRODUCTION from @getpara/core-sdk'
    );
    recommendations.push('Configure embeddedWalletConfig for seamless wallet creation');
    recommendations.push('Test thoroughly in development before deploying to production');
    recommendations.push('Consider implementing gradual rollout for production deployments');

    return recommendations;
  }

  private estimateMigrationTime(steps: any[]): number {
    // Base time estimation in minutes
    const baseTime = 30; // Basic setup
    const perStepTime = 15; // Additional time per complex step

    return baseTime + steps.length * perStepTime;
  }

  private generateProviderMigrationCode(_config?: any): string {
    return `
// Before (Web3Modal)
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'

// After (Para)
import { ParaProvider, ParaModal } from "@getpara/react-sdk";
import { Environment } from "@getpara/core-sdk";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ParaProvider
      paraClientConfig={{
        apiKey: process.env.PARA_API_KEY!,
        env: Environment.DEVELOPMENT, // or Environment.PRODUCTION
      }}
      externalWalletConfig={{
        wallets: ["METAMASK", "COINBASE", "WALLETCONNECT", "RAINBOW"],
        evmConnector: {
          config: {
            chains: [mainnet, polygon, arbitrum],
            transports: {
              [mainnet.id]: http(),
              [polygon.id]: http(),
              [arbitrum.id]: http(),
            },
          },
        },
      }}
      embeddedWalletConfig={{
        createOnLogin: "all-users",
        showWalletUiOnLogin: true,
      }}
    >
      {children}
      {/* ⚠️ CRITICAL: ParaModal component is REQUIRED for modal to appear */}
      <ParaModal />
    </ParaProvider>
  );
}

// IMPORTANT: Add to your layout.tsx or _app.tsx:
// import '@getpara/react-sdk/styles.css'
    `;
  }

  private generateConnectButtonCode(): string {
    return `
// Before (Web3Modal)
<w3m-button />

// After (Para)
import { useAccount, useModal, useWallet } from "@getpara/react-sdk";

export function ConnectButton() {
  const { openModal } = useModal();
  const { data: wallet } = useWallet();
  const { isConnected } = useAccount();

  if (isConnected && wallet?.address) {
    return (
      <button onClick={() => openModal()}>
        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
      </button>
    );
  }

  return (
    <button onClick={() => openModal()}>
      Connect Wallet
    </button>
  );
}
    `;
  }
}
