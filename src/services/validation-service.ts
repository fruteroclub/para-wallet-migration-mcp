import { promises as fs } from 'fs';
import path from 'path';
import { MigrationConfig } from '../types.js';

export class ValidationService {
  async validateMigration(projectPath: string, config?: MigrationConfig): Promise<any> {
    const validationResults = {
      packageValidation: await this.validatePackages(projectPath),
      configValidation: config ? await this.validateConfig(config) : null,
      environmentValidation: await this.validateEnvironment(projectPath),
      codeValidation: await this.validateCodeStructure(projectPath),
      recommendations: [] as string[],
    };

    // Generate recommendations based on validation results
    validationResults.recommendations = this.generateValidationRecommendations(validationResults);

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            validationResults,
            overallStatus: this.calculateOverallStatus(validationResults),
            timestamp: new Date().toISOString(),
          }, null, 2),
        },
      ],
    };
  }

  async checkWagmiCompatibility(projectPath: string): Promise<any> {
    try {
      const sourceFiles = await this.findReactFiles(projectPath);
      const compatibility = {
        wagmiHooks: {
          found: 0,
          compatible: 0,
          incompatible: 0,
          details: [] as any[],
        },
        imports: {
          wagmiImports: 0,
          reownImports: 0,
          walletConnectImports: 0,
        },
        recommendations: [] as string[],
      };

      for (const file of sourceFiles) {
        try {
          const content = await fs.readFile(file, 'utf-8');
          const fileAnalysis = await this.analyzeFileForWagmiUsage(file, content);
          
          compatibility.wagmiHooks.found += fileAnalysis.hooks.length;
          compatibility.wagmiHooks.compatible += fileAnalysis.compatibleHooks;
          compatibility.wagmiHooks.incompatible += fileAnalysis.incompatibleHooks;
          compatibility.wagmiHooks.details.push(...fileAnalysis.details);

          if (content.includes('wagmi')) compatibility.imports.wagmiImports++;
          if (content.includes('@web3modal') || content.includes('reown')) compatibility.imports.reownImports++;
          if (content.includes('@walletconnect')) compatibility.imports.walletConnectImports++;
        } catch (error) {
          // Skip files we can't read
        }
      }

      // Generate compatibility recommendations
      compatibility.recommendations = this.generateCompatibilityRecommendations(compatibility);

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify({
              compatibility,
              filesAnalyzed: sourceFiles.length,
              compatibilityScore: this.calculateCompatibilityScore(compatibility),
            }, null, 2),
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to check Wagmi compatibility: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  private async validatePackages(projectPath: string): Promise<any> {
    try {
      const packageJsonPath = path.join(projectPath, 'package.json');
      const packageContent = await fs.readFile(packageJsonPath, 'utf-8');
      const packageJson = JSON.parse(packageContent);

      const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      return {
        hasParaSDK: !!dependencies['@getpara/react-sdk'],
        hasReownPackages: Object.keys(dependencies).some(pkg => pkg.includes('@web3modal') || pkg.includes('reown')),
        hasWagmi: !!dependencies['wagmi'],
        hasViem: !!dependencies['viem'],
        conflictingPackages: this.findConflictingPackages(dependencies),
        requiredPackages: this.getRequiredPackages(),
        status: 'analyzed',
      };
    } catch (error) {
      return {
        error: `Failed to validate packages: ${error instanceof Error ? error.message : String(error)}`,
        status: 'error',
      };
    }
  }

  private async validateConfig(config: MigrationConfig): Promise<any> {
    const validation = {
      apiKey: {
        provided: !!config.paraApiKey,
        valid: config.paraApiKey && config.paraApiKey.length > 0,
      },
      environment: {
        valid: ['development', 'production'].includes(config.environment),
        value: config.environment,
      },
      chains: {
        valid: Array.isArray(config.supportedChains) && config.supportedChains.length > 0,
        count: config.supportedChains?.length || 0,
      },
      wallets: {
        valid: Array.isArray(config.wallets) && config.wallets.length > 0,
        supported: config.wallets?.every(wallet => 
          ['METAMASK', 'COINBASE', 'WALLETCONNECT', 'RAINBOW'].includes(wallet)
        ),
        count: config.wallets?.length || 0,
      },
    };

    return {
      ...validation,
      isValid: validation.apiKey.valid && 
               validation.environment.valid && 
               validation.chains.valid && 
               validation.wallets.valid,
    };
  }

  private async validateEnvironment(projectPath: string): Promise<any> {
    try {
      const envPath = path.join(projectPath, '.env');
      const envExamplePath = path.join(projectPath, '.env.example');
      
      const envExists = await this.fileExists(envPath);
      const envExampleExists = await this.fileExists(envExamplePath);
      
      let envVars = {};
      if (envExists) {
        const envContent = await fs.readFile(envPath, 'utf-8');
        envVars = this.parseEnvFile(envContent);
      }

      return {
        envFileExists: envExists,
        envExampleExists: envExampleExists,
        hasParaApiKey: 'PARA_API_KEY' in envVars,
        hasParaEnvironment: 'PARA_ENVIRONMENT' in envVars,
        environmentVariables: Object.keys(envVars),
        recommendations: this.generateEnvRecommendations(envVars),
      };
    } catch (error) {
      return {
        error: `Failed to validate environment: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private async validateCodeStructure(projectPath: string): Promise<any> {
    try {
      const srcPath = path.join(projectPath, 'src');
      const srcExists = await this.fileExists(srcPath);
      
      if (!srcExists) {
        return {
          error: 'No src directory found',
          hasValidStructure: false,
        };
      }

      const sourceFiles = await this.findReactFiles(projectPath);
      const structure = {
        totalFiles: sourceFiles.length,
        componentFiles: sourceFiles.filter(f => f.includes('component') || f.includes('Component')).length,
        hookFiles: sourceFiles.filter(f => f.includes('hook') || f.includes('Hook')).length,
        providerFiles: sourceFiles.filter(f => f.includes('provider') || f.includes('Provider')).length,
        hasWeb3ModalUsage: false,
        hasWagmiUsage: false,
      };

      // Check for existing Web3Modal and Wagmi usage
      for (const file of sourceFiles.slice(0, 50)) { // Limit for performance
        try {
          const content = await fs.readFile(file, 'utf-8');
          if (content.includes('@web3modal') || content.includes('createWeb3Modal')) {
            structure.hasWeb3ModalUsage = true;
          }
          if (content.includes('wagmi') || content.includes('useAccount') || content.includes('useBalance')) {
            structure.hasWagmiUsage = true;
          }
        } catch (error) {
          // Skip files we can't read
        }
      }

      return {
        ...structure,
        hasValidStructure: structure.totalFiles > 0,
      };
    } catch (error) {
      return {
        error: `Failed to validate code structure: ${error instanceof Error ? error.message : String(error)}`,
      };
    }
  }

  private async analyzeFileForWagmiUsage(filePath: string, content: string): Promise<any> {
    const wagmiHooks = [
      'useAccount', 'useBalance', 'useBlockNumber', 'useConnect', 'useDisconnect',
      'useEnsName', 'useEnsAvatar', 'useNetwork', 'useSwitchNetwork', 'useContractRead',
      'useContractWrite', 'usePrepareContractWrite', 'useWaitForTransaction',
      'useSendTransaction', 'usePrepareSendTransaction', 'useSignMessage',
    ];

    const foundHooks = wagmiHooks.filter(hook => content.includes(hook));
    const compatibleHooks = foundHooks.length; // All Wagmi hooks are compatible with Para
    const incompatibleHooks = 0; // No known incompatible hooks

    return {
      file: filePath,
      hooks: foundHooks,
      compatibleHooks,
      incompatibleHooks,
      details: foundHooks.map(hook => ({
        hook,
        compatible: true,
        note: 'This Wagmi hook will continue to work with Para',
      })),
    };
  }

  private async findReactFiles(projectPath: string): Promise<string[]> {
    const files: string[] = [];
    const extensions = ['.tsx', '.jsx'];
    
    async function scanDirectory(dir: string) {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });
        
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          
          if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
            await scanDirectory(fullPath);
          } else if (entry.isFile() && extensions.some(ext => entry.name.endsWith(ext))) {
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

  private async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);
      return true;
    } catch {
      return false;
    }
  }

  private parseEnvFile(content: string): Record<string, string> {
    const envVars: Record<string, string> = {};
    const lines = content.split('\n');
    
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...valueParts] = trimmed.split('=');
        if (key && valueParts.length > 0) {
          envVars[key.trim()] = valueParts.join('=').trim();
        }
      }
    }
    
    return envVars;
  }

  private findConflictingPackages(dependencies: Record<string, string>): string[] {
    const conflicting: string[] = [];
    const packageNames = Object.keys(dependencies);
    
    // Check for packages that might conflict with Para
    const potentialConflicts = [
      '@web3modal/wagmi',
      '@web3modal/siwe',
      '@web3modal/ethereum',
    ];
    
    for (const pkg of potentialConflicts) {
      if (packageNames.includes(pkg)) {
        conflicting.push(pkg);
      }
    }
    
    return conflicting;
  }

  private getRequiredPackages(): string[] {
    return [
      '@getpara/react-sdk',
      'wagmi',
      'viem',
    ];
  }

  private generateValidationRecommendations(results: any): string[] {
    const recommendations: string[] = [];
    
    if (results.packageValidation.hasReownPackages) {
      recommendations.push('Remove ReOwn/Web3Modal packages to avoid conflicts');
    }
    
    if (!results.packageValidation.hasParaSDK) {
      recommendations.push('Install @getpara/react-sdk package');
    }
    
    if (results.packageValidation.conflictingPackages.length > 0) {
      recommendations.push(`Remove conflicting packages: ${results.packageValidation.conflictingPackages.join(', ')}`);
    }
    
    if (results.environmentValidation && !results.environmentValidation.hasParaApiKey) {
      recommendations.push('Add PARA_API_KEY to your environment variables');
    }
    
    if (results.codeValidation && results.codeValidation.hasWeb3ModalUsage) {
      recommendations.push('Update Web3Modal provider to Para provider');
    }
    
    return recommendations;
  }

  private generateCompatibilityRecommendations(compatibility: any): string[] {
    const recommendations: string[] = [];
    
    if (compatibility.wagmiHooks.found > 0) {
      recommendations.push(`Great! Found ${compatibility.wagmiHooks.found} Wagmi hooks that will continue to work with Para`);
    }
    
    if (compatibility.imports.reownImports > 0) {
      recommendations.push('Update ReOwn/Web3Modal imports to Para SDK imports');
    }
    
    if (compatibility.wagmiHooks.incompatible > 0) {
      recommendations.push(`Review ${compatibility.wagmiHooks.incompatible} potentially incompatible hooks`);
    }
    
    recommendations.push('Test all wallet functionality after migration');
    
    return recommendations;
  }

  private generateEnvRecommendations(envVars: Record<string, string>): string[] {
    const recommendations: string[] = [];
    
    if (!('PARA_API_KEY' in envVars)) {
      recommendations.push('Add PARA_API_KEY=your_api_key_here to .env file');
    }
    
    if (!('PARA_ENVIRONMENT' in envVars)) {
      recommendations.push('Add PARA_ENVIRONMENT=development to .env file');
    }
    
    recommendations.push('Never commit your .env file to version control');
    recommendations.push('Update .env.example with Para-specific variables');
    
    return recommendations;
  }

  private calculateOverallStatus(results: any): string {
    const hasErrors = Object.values(results).some((result: any) => 
      result && typeof result === 'object' && 'error' in result
    );
    
    if (hasErrors) return 'error';
    
    const hasParaSDK = results.packageValidation?.hasParaSDK;
    const hasConflicts = results.packageValidation?.conflictingPackages?.length > 0;
    
    if (hasParaSDK && !hasConflicts) return 'ready';
    if (hasParaSDK) return 'warning';
    return 'needs_setup';
  }

  private calculateCompatibilityScore(compatibility: any): number {
    const total = compatibility.wagmiHooks.found;
    if (total === 0) return 100; // No hooks to migrate
    
    const compatible = compatibility.wagmiHooks.compatible;
    return Math.round((compatible / total) * 100);
  }
}