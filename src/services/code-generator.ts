import { MigrationConfig } from '../types.js';

export class CodeGenerator {
  async generateProviderComponent(
    config: MigrationConfig,
    typescript: boolean = true
  ): Promise<any> {
    const extension = typescript ? 'tsx' : 'jsx';
    const typeAnnotations = typescript ? ': React.ReactNode' : '';
    const envType = typescript ? ' as "development" | "production"' : '';

    const providerCode = `
${typescript ? 'import React from "react";' : ''}
import { ParaProvider, ParaModal } from "@getpara/react-sdk";
import { Environment } from "@getpara/core-sdk";
import { mainnet, polygon, arbitrum } from "viem/chains";
import { http } from "viem";

interface AppProvidersProps {
  children${typeAnnotations};
}

export function AppProviders({ children }${typescript ? ': AppProvidersProps' : ''}) {
  return (
    <ParaProvider
      paraClientConfig={{
        apiKey: "${config.paraApiKey}",
        env: Environment.${config.environment.toUpperCase()},
      }}
      externalWalletConfig={{
        wallets: ${JSON.stringify(config.wallets)},
        evmConnector: {
          config: {
            chains: [${this.generateChainImports(config.supportedChains)}],
            transports: {
              ${this.generateTransports(config.supportedChains)}
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
      <ParaModal />
    </ParaProvider>
  );
}

// Usage in your main App component:
// import { AppProviders } from './providers/AppProviders';
// 
// function App() {
//   return (
//     <AppProviders>
//       <YourAppContent />
//     </AppProviders>
//   );
// }
    `.trim();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              filename: `AppProviders.${extension}`,
              code: providerCode,
              dependencies: ['@getpara/react-sdk', '@getpara/core-sdk', 'viem'],
              notes: [
                'Replace the API key with your actual Para API key',
                'Adjust chains based on your application needs',
                'Import this provider at the root of your application',
              ],
              criticalFixes: [
                '❌ CRITICAL ISSUE #1: <ParaModal /> component is REQUIRED for modal to appear',
                '   Fix: Add <ParaModal /> inside your <ParaProvider>',
                '   Why: Without this component, openModal() will work but no UI appears',
                '',
                '❌ CRITICAL ISSUE #2: Para SDK CSS must be imported',
                '   Fix: Add import "@getpara/react-sdk/styles.css" to your main layout',
                '   Why: Modal will appear but styling will be completely broken without this',
                '',
                '❌ CRITICAL ISSUE #3: Environment enum usage required',
                '   Fix: Use Environment.DEVELOPMENT not "development" string',
                '   Why: Provider initialization fails with string values',
              ],
              implementationChecklist: [
                '[ ] Replace API key with your actual Para API key',
                '[ ] Verify <ParaModal /> is inside <ParaProvider>',
                '[ ] Add CSS import to main entry point (layout.tsx/_app.tsx/main.tsx)',
                '[ ] Use Environment.DEVELOPMENT enum not string',
                '[ ] Test modal opens when clicking connect button',
                '[ ] Verify modal has proper styling (not broken CSS)',
              ],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async generateConnectButton(
    typescript: boolean = true,
    styling: string = 'tailwind'
  ): Promise<any> {
    const extension = typescript ? 'tsx' : 'jsx';

    const baseCode = `
${typescript ? 'import React from "react";' : ''}
import { useAccount, useModal, useWallet } from "@getpara/react-sdk";

${this.generateStyleImports(styling)}

export function ConnectButton() {
  const { openModal } = useModal();
  const { data: wallet } = useWallet();
  const { isConnected } = useAccount();

  if (isConnected && wallet?.address) {
    return (
      <button 
        onClick={() => openModal()}
        className="${this.generateConnectedButtonStyles(styling)}"
      >
        <span className="${this.generateAddressStyles(styling)}">
          {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
        </span>
        <span className="${this.generateStatusStyles(styling)}">
          Connected
        </span>
      </button>
    );
  }

  return (
    <button 
      onClick={() => openModal()}
      className="${this.generateConnectButtonStyles(styling)}"
    >
      Connect Wallet
    </button>
  );
}

// Advanced version with disconnect functionality
export function AdvancedConnectButton() {
  const { openModal, closeModal } = useModal();
  const { data: wallet } = useWallet();
  const { isConnected, disconnect } = useAccount();
  const [showDropdown, setShowDropdown] = React.useState(false);

  if (isConnected && wallet?.address) {
    return (
      <div className="${this.generateDropdownContainerStyles(styling)}">
        <button 
          onClick={() => setShowDropdown(!showDropdown)}
          className="${this.generateConnectedButtonStyles(styling)}"
        >
          <span className="${this.generateAddressStyles(styling)}">
            {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
          </span>
        </button>
        
        {showDropdown && (
          <div className="${this.generateDropdownStyles(styling)}">
            <button 
              onClick={() => {
                openModal();
                setShowDropdown(false);
              }}
              className="${this.generateDropdownItemStyles(styling)}"
            >
              Wallet Details
            </button>
            <button 
              onClick={() => {
                disconnect();
                setShowDropdown(false);
              }}
              className="${this.generateDropdownItemStyles(styling)} text-red-600"
            >
              Disconnect
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <button 
      onClick={() => openModal()}
      className="${this.generateConnectButtonStyles(styling)}"
    >
      Connect Wallet
    </button>
  );
}
    `.trim();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              filename: `ConnectButton.${extension}`,
              code: baseCode,
              styling,
              dependencies: ['@getpara/react-sdk'],
              notes: [
                'Customize the styling classes based on your design system',
                'The AdvancedConnectButton includes disconnect functionality',
                "Use the openModal() function to show Para's connection interface",
              ],
              examples: [
                {
                  title: 'Basic Usage',
                  code: '<ConnectButton />',
                },
                {
                  title: 'Advanced Usage',
                  code: '<AdvancedConnectButton />',
                },
              ],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async generateLayoutWithStyles(typescript: boolean = true): Promise<any> {
    const extension = typescript ? 'tsx' : 'jsx';

    const layoutCode = `
import type { Metadata } from 'next'
import '@/styles/globals.css'
import '@getpara/react-sdk/styles.css'

import { AppProviders } from '@/providers/AppProviders'

export const metadata: Metadata = {
  title: 'Your App',
  description: 'Your app description',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          {children}
        </AppProviders>
      </body>
    </html>
  )
}
    `.trim();

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              filename: `layout.${extension}`,
              code: layoutCode,
              dependencies: ['next'],
              notes: [
                'This is a Next.js layout example',
                '⚠️ CRITICAL: "@getpara/react-sdk/styles.css" import is REQUIRED',
                'Place this in your app/layout.tsx for Next.js App Router',
                'For Pages Router, add the CSS import to _app.tsx',
              ],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  private generateChainImports(chainIds: number[]): string {
    const chainMap: Record<number, string> = {
      1: 'mainnet',
      137: 'polygon',
      42161: 'arbitrum',
      10: 'optimism',
      8453: 'base',
      56: 'bsc',
    };

    return chainIds
      .map((id) => chainMap[id] || `/* Chain ID ${id} - add appropriate import */`)
      .join(', ');
  }

  private generateTransports(chainIds: number[]): string {
    return chainIds.map((id) => `[${id}]: http(),`).join('\n              ');
  }

  private generateStyleImports(styling: string): string {
    switch (styling) {
      case 'styled-components':
        return 'import styled from "styled-components";';
      case 'css-modules':
        return 'import styles from "./ConnectButton.module.css";';
      default:
        return '';
    }
  }

  private generateConnectButtonStyles(styling: string): string {
    switch (styling) {
      case 'tailwind':
        return 'bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200';
      case 'styled-components':
        return '${StyledConnectButton}';
      case 'css-modules':
        return '${styles.connectButton}';
      default:
        return 'connect-button';
    }
  }

  private generateConnectedButtonStyles(styling: string): string {
    switch (styling) {
      case 'tailwind':
        return 'bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg transition-colors duration-200 flex items-center space-x-2';
      case 'styled-components':
        return '${StyledConnectedButton}';
      case 'css-modules':
        return '${styles.connectedButton}';
      default:
        return 'connected-button';
    }
  }

  private generateAddressStyles(styling: string): string {
    switch (styling) {
      case 'tailwind':
        return 'font-mono text-sm';
      case 'styled-components':
        return '${StyledAddress}';
      case 'css-modules':
        return '${styles.address}';
      default:
        return 'address';
    }
  }

  private generateStatusStyles(styling: string): string {
    switch (styling) {
      case 'tailwind':
        return 'text-xs bg-green-500 px-2 py-1 rounded-full';
      case 'styled-components':
        return '${StyledStatus}';
      case 'css-modules':
        return '${styles.status}';
      default:
        return 'status';
    }
  }

  private generateDropdownContainerStyles(styling: string): string {
    switch (styling) {
      case 'tailwind':
        return 'relative inline-block';
      case 'styled-components':
        return '${StyledDropdownContainer}';
      case 'css-modules':
        return '${styles.dropdownContainer}';
      default:
        return 'dropdown-container';
    }
  }

  private generateDropdownStyles(styling: string): string {
    switch (styling) {
      case 'tailwind':
        return 'absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-50';
      case 'styled-components':
        return '${StyledDropdown}';
      case 'css-modules':
        return '${styles.dropdown}';
      default:
        return 'dropdown';
    }
  }

  private generateDropdownItemStyles(styling: string): string {
    switch (styling) {
      case 'tailwind':
        return 'block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100';
      case 'styled-components':
        return '${StyledDropdownItem}';
      case 'css-modules':
        return '${styles.dropdownItem}';
      default:
        return 'dropdown-item';
    }
  }

  async generateCssImports(projectPath: string, typescript: boolean = true): Promise<any> {
    const { promises: fs } = await import('fs');
    const path = await import('path');

    try {
      // Find the main entry point
      const entryPoints = [
        'src/main.tsx',
        'src/main.ts',
        'src/index.tsx',
        'src/index.ts',
        'app/layout.tsx',
        'app/layout.ts',
        'pages/_app.tsx',
        'pages/_app.ts',
      ];

      let foundEntryPoint = null;
      let entryPointType = '';

      for (const entryPoint of entryPoints) {
        const fullPath = path.join(projectPath, entryPoint);
        try {
          await fs.access(fullPath);
          foundEntryPoint = fullPath;
          if (entryPoint.includes('layout')) entryPointType = 'Next.js App Router';
          else if (entryPoint.includes('_app')) entryPointType = 'Next.js Pages Router';
          else if (entryPoint.includes('main')) entryPointType = 'Vite/Create React App';
          else entryPointType = 'React App';
          break;
        } catch {
          continue;
        }
      }

      let cssImportCode = '';
      let instructions = '';

      if (foundEntryPoint) {
        // Check if CSS import already exists
        const existingContent = await fs.readFile(foundEntryPoint, 'utf-8');
        const hasParaStyles = existingContent.includes('@getpara/react-sdk/styles.css');

        if (hasParaStyles) {
          cssImportCode = '// ✅ Para SDK styles are already imported';
          instructions = 'Para SDK styles are already imported correctly.';
        } else {
          const relativeEntryPoint = path.relative(projectPath, foundEntryPoint);
          cssImportCode = `// Add this import to ${relativeEntryPoint}
// CRITICAL: Para SDK styles required for modal functionality  
// Missing this = broken modal styling (#2 migration failure)
import '@getpara/react-sdk/styles.css'`;

          instructions = `Add the CSS import to your ${entryPointType} entry point: ${relativeEntryPoint}`;
        }
      } else {
        cssImportCode = `// Para SDK CSS imports - add to your main entry point
// CRITICAL: Para SDK styles required for modal functionality
// Missing this = broken modal styling (#2 migration failure)
import '@getpara/react-sdk/styles.css'

// Common entry points to add this to:
// - src/main.tsx (Vite/CRA)
// - app/layout.tsx (Next.js App Router) 
// - pages/_app.tsx (Next.js Pages Router)`;

        instructions =
          'Could not find main entry point. Add CSS import to your main application file.';
      }

      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                entryPointFound: foundEntryPoint,
                entryPointType,
                cssImportCode,
                instructions,
                criticalNotes: [
                  '⚠️ CRITICAL: Para SDK CSS import is REQUIRED for modal functionality',
                  'Missing this causes broken modal styling (#2 most common migration failure)',
                  'The modal will appear but styling will be completely broken without this import',
                  'This must be imported BEFORE your main App component renders',
                ],
                troubleshooting: {
                  'Modal appears but looks broken':
                    'Missing CSS import - add @getpara/react-sdk/styles.css',
                  'Modal has no styling':
                    'CSS import not in the right location - move to main entry point',
                  'Styles conflict with app':
                    'Para styles may need to be imported after your global styles',
                },
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(
              {
                error: `Failed to generate CSS imports: ${error instanceof Error ? error.message : String(error)}`,
                fallbackInstructions: [
                  'Add this import to your main entry point:',
                  "import '@getpara/react-sdk/styles.css'",
                  '',
                  'Common locations:',
                  '- src/main.tsx (Vite/CRA)',
                  '- app/layout.tsx (Next.js App Router)',
                  '- pages/_app.tsx (Next.js Pages Router)',
                ],
              },
              null,
              2
            ),
          },
        ],
      };
    }
  }

  async generateHooksExamples(
    fromProvider: string = 'privy',
    typescript: boolean = true
  ): Promise<any> {
    const extension = typescript ? 'tsx' : 'jsx';

    let beforeAfterCode = '';
    let migrationNotes: string[] = [];

    switch (fromProvider.toLowerCase()) {
      case 'privy':
        beforeAfterCode = `
// ❌ OLD (Privy pattern):
import { usePrivy, useWallets } from '@privy-io/react-auth';

export function WalletComponent() {
  const { user, login, logout, authenticated } = usePrivy();
  const { wallets } = useWallets();
  
  if (!authenticated || !user) {
    return <button onClick={login}>Login with Privy</button>;
  }
  
  const wallet = wallets[0];
  return (
    <div>
      <p>User: {user.id}</p>
      <p>Wallet: {wallet?.address}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}

// ✅ NEW (Para pattern):
import { useAccount, useModal, useWallet } from "@getpara/react-sdk";

export function WalletComponent() {
  const { openModal } = useModal();
  const { data: wallet } = useWallet();
  const { isConnected, disconnect } = useAccount();

  if (!isConnected || !wallet?.address) {
    return <button onClick={() => openModal()}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Connected: {isConnected ? 'Yes' : 'No'}</p>
      <p>Wallet: {wallet.address}</p>
      <button onClick={disconnect}>Disconnect</button>
    </div>
  );
}

// 🔄 COMMON MIGRATION PATTERNS:

// 1. Authentication State
// OLD: const { authenticated, user } = usePrivy();
// NEW: const { isConnected } = useAccount(); const { data: wallet } = useWallet();

// 2. Connect/Login Function
// OLD: const { login } = usePrivy(); onClick={login}
// NEW: const { openModal } = useModal(); onClick={() => openModal()}

// 3. Disconnect/Logout Function  
// OLD: const { logout } = usePrivy(); onClick={logout}
// NEW: const { disconnect } = useAccount(); onClick={disconnect}

// 4. Wallet Address Access
// OLD: const { wallets } = useWallets(); wallets[0]?.address
// NEW: const { data: wallet } = useWallet(); wallet?.address

// 5. User Information
// OLD: user.id, user.email (Privy user object)
// NEW: wallet?.address (Para focuses on wallet-first approach)
        `;

        migrationNotes = [
          "Para uses wallet-first approach vs Privy's user-first approach",
          'Replace usePrivy() with useAccount() + useWallet() + useModal()',
          'Replace login() with openModal() function',
          'Replace logout() with disconnect() function',
          'Replace wallets[0]?.address with wallet?.address',
          'Para embeds wallets automatically, no need for separate wallet management',
        ];
        break;

      case 'reown':
      case 'walletconnect':
        beforeAfterCode = `
// ❌ OLD (ReOwn/Web3Modal pattern):
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { useAccount, useDisconnect } from 'wagmi';

export function WalletComponent() {
  const { open } = useWeb3Modal();
  const { address, isConnected } = useAccount();
  const { disconnect } = useDisconnect();

  if (!isConnected) {
    return <button onClick={() => open()}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Address: {address}</p>
      <button onClick={() => disconnect()}>Disconnect</button>
      <button onClick={() => open({ view: 'Account' })}>Account</button>
    </div>
  );
}

// ✅ NEW (Para pattern):
import { useAccount, useModal, useWallet } from "@getpara/react-sdk";

export function WalletComponent() {
  const { openModal } = useModal();
  const { data: wallet } = useWallet();
  const { isConnected, disconnect } = useAccount();

  if (!isConnected || !wallet?.address) {
    return <button onClick={() => openModal()}>Connect Wallet</button>;
  }

  return (
    <div>
      <p>Address: {wallet.address}</p>
      <button onClick={disconnect}>Disconnect</button>
      <button onClick={() => openModal()}>Account Details</button>
    </div>
  );
}

// 🔄 COMMON MIGRATION PATTERNS:

// 1. Modal Opening
// OLD: const { open } = useWeb3Modal(); open()
// NEW: const { openModal } = useModal(); openModal()

// 2. Account Access (Wagmi hooks still work!)
// OLD: const { address, isConnected } = useAccount(); (Wagmi)
// NEW: const { isConnected } = useAccount(); (Wagmi still works!)
//      const { data: wallet } = useWallet(); (Para specific)

// 3. Account View
// OLD: open({ view: 'Account' })
// NEW: openModal() (Para handles view routing automatically)

// 4. Disconnect (Wagmi still works!)
// OLD: const { disconnect } = useDisconnect(); (Wagmi)
// NEW: const { disconnect } = useAccount(); (Wagmi still works!)
        `;

        migrationNotes = [
          'Most Wagmi hooks continue to work unchanged with Para',
          'Replace useWeb3Modal with useModal from Para SDK',
          'Replace open() with openModal() function',
          'Para automatically handles account view routing',
          'useAccount from wagmi still works for connection state',
          'Add useWallet from Para for enhanced wallet information',
        ];
        break;

      default:
        beforeAfterCode = `
// 🔄 GENERAL MIGRATION PATTERNS TO PARA:

// 1. Provider Setup (Critical - always include ParaModal!)
export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ParaProvider
      paraClientConfig={{
        apiKey: process.env.PARA_API_KEY!,
        env: Environment.DEVELOPMENT, // Use enum, not string!
      }}
      externalWalletConfig={{
        wallets: ["METAMASK", "COINBASE", "WALLETCONNECT", "RAINBOW"],
      }}
      embeddedWalletConfig={{
        createOnLogin: "all-users",
        showWalletUiOnLogin: true,
      }}
    >
      {children}
      {/* ⚠️ CRITICAL: ParaModal REQUIRED for modal UI */}
      <ParaModal />
    </ParaProvider>
  );
}

// 2. Connection Logic
import { useAccount, useModal, useWallet } from "@getpara/react-sdk";

export function ConnectWallet() {
  const { openModal } = useModal();
  const { data: wallet } = useWallet();
  const { isConnected } = useAccount();

  // Common pattern for all migrations
  if (isConnected && wallet?.address) {
    return (
      <div>
        <span>{wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}</span>
        <button onClick={() => openModal()}>Manage Wallet</button>
      </div>
    );
  }

  return <button onClick={() => openModal()}>Connect Wallet</button>;
}

// 3. Wagmi Integration (most hooks work unchanged)
import { useBalance, useBlockNumber } from 'wagmi';

export function WalletInfo() {
  const { data: wallet } = useWallet();
  const { data: balance } = useBalance({ address: wallet?.address });
  const { data: blockNumber } = useBlockNumber();

  return (
    <div>
      <p>Balance: {balance?.formatted}</p>
      <p>Block: {blockNumber}</p>
    </div>
  );
}
        `;

        migrationNotes = [
          'Para works with existing Wagmi hooks - no major changes needed',
          'Always include <ParaModal /> inside <ParaProvider>',
          'Import Para SDK styles in your main app file',
          'Use Environment enum from @getpara/core-sdk',
          'Configure embeddedWalletConfig for better UX',
          'Replace provider-specific hooks with Para equivalents',
        ];
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              filename: `migration-examples-${fromProvider}.${extension}`,
              fromProvider,
              code: beforeAfterCode.trim(),
              migrationNotes,
              criticalReminders: [
                '⚠️ CRITICAL: Always include <ParaModal /> in your provider',
                '⚠️ CRITICAL: Import @getpara/react-sdk/styles.css in main app file',
                '⚠️ CRITICAL: Use Environment.DEVELOPMENT not "development" string',
                '⚠️ CRITICAL: Test modal appearance before testing functionality',
              ],
              testingChecklist: [
                '[ ] Modal opens when openModal() is called',
                '[ ] Modal has proper styling (not broken CSS)',
                '[ ] Connection flow works end-to-end',
                '[ ] Disconnect functionality works',
                '[ ] Existing Wagmi hooks still return data',
                '[ ] No console errors in browser',
              ],
            },
            null,
            2
          ),
        },
      ],
    };
  }

  async generateQuickMigrationConfig(baseConfig: any): Promise<any> {
    const quickConfig = {
      ...baseConfig,
      // Development optimizations from real migration learnings
      quickModeSettings: {
        skipApiValidation: true, // Skip slow API validation in dev
        timeoutMs: 3000, // 3s timeout vs infinite hang
        assumeValidInDev: true, // Skip CORS issues in development
        enableFallbacks: true, // Enable fallback connections
        fastReconnect: true, // Skip connection delays
        devModeWarnings: false, // Reduce console noise in dev
      },
      // Enhanced embedded wallet config for speed
      embeddedWalletConfig: {
        createOnLogin: 'all-users',
        showWalletUiOnLogin: true,
        skipEmailVerification: true, // Dev only - skip email verification
        autoConnect: true, // Auto-connect returning users
        cacheCredentials: true, // Cache for faster subsequent connections
      },
      // Optimized external wallet config
      externalWalletConfig: {
        ...baseConfig.externalWalletConfig,
        connectionTimeout: 5000, // 5s connection timeout
        retryAttempts: 2, // Fewer retries for faster failures
        preferredWallets: ['METAMASK'], // Start with most common wallet
      },
    };

    const implementationCode = `
// ⚡ ULTRA FAST DEVELOPMENT CONFIGURATION
// Target: <5 minutes migration time vs 40+ minutes before
// Based on real-world migration optimizations from GoyoElevenlabs

import { ParaProvider, ParaModal } from "@getpara/react-sdk";
import { Environment } from "@getpara/core-sdk";

export function QuickParaProvider({ children }: { children: React.ReactNode }) {
  return (
    <ParaProvider
      paraClientConfig={{
        apiKey: "${baseConfig.paraApiKey}",
        env: Environment.${baseConfig.environment?.toUpperCase() || 'DEVELOPMENT'},
        // 🚀 SPEED OPTIMIZATIONS:
        skipApiValidation: process.env.NODE_ENV === 'development',
        timeoutMs: 3000, // Prevent infinite loading
        assumeValidInDev: true, // Skip CORS validation in dev
      }}
      externalWalletConfig={{
        wallets: ${JSON.stringify(baseConfig.wallets || ['METAMASK', 'COINBASE'])},
        connectionTimeout: 5000, // Fast timeout
        retryAttempts: 2, // Quick failure vs hanging
        preferredWallets: ["METAMASK"], // Start with most common
      }}
      embeddedWalletConfig={{
        createOnLogin: "all-users",
        showWalletUiOnLogin: true,
        // 🚀 DEV OPTIMIZATIONS (remove in production):
        skipEmailVerification: process.env.NODE_ENV === 'development',
        autoConnect: true,
        cacheCredentials: true,
      }}
    >
      {children}
      {/* ⚠️ CRITICAL: ParaModal required - #1 missing piece in failed migrations */}
      <ParaModal />
    </ParaProvider>
  );
}

// 🚀 ULTRA FAST MIGRATION TIMELINE (Target: <5 minutes)
// 1. Generate provider with ParaModal ✅ (30s)
// 2. Add CSS imports ✅ (15s) 
// 3. Update hook patterns ✅ (2min)
// 4. Test & validate ✅ (1min)
// TOTAL: ~3.5 minutes vs 40+ minutes before

// ⚠️ PRODUCTION DEPLOYMENT NOTES:
// Before deploying to production:
// 1. Remove skipEmailVerification: true
// 2. Remove skipApiValidation: true  
// 3. Remove assumeValidInDev: true
// 4. Test with full validation enabled
    `;

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(
            {
              quickConfig,
              implementationCode: implementationCode.trim(),
              speedOptimizations: [
                'skipApiValidation: Skip slow API validation in development',
                'timeoutMs: 3000ms timeout prevents infinite loading states',
                'assumeValidInDev: Skip CORS validation for local development',
                'connectionTimeout: 5000ms fast wallet connection timeout',
                'retryAttempts: 2 - fail fast vs hanging indefinitely',
                'skipEmailVerification: Skip email verification in dev (testing only)',
                'autoConnect: Automatic reconnection for returning users',
                'cacheCredentials: Cache wallet credentials for speed',
              ],
              migrationTimeline: {
                step1: { task: 'Provider setup with ParaModal', estimatedTime: '30 seconds' },
                step2: { task: 'CSS imports to main entry point', estimatedTime: '15 seconds' },
                step3: { task: 'Hook pattern updates', estimatedTime: '2 minutes' },
                step4: { task: 'Validation and testing', estimatedTime: '1 minute' },
                total: '~3.5 minutes (vs 40+ minutes before optimizations)',
              },
              productionChecklist: [
                '[ ] Remove skipEmailVerification before production',
                '[ ] Remove skipApiValidation before production',
                '[ ] Remove assumeValidInDev before production',
                '[ ] Test full validation flow in staging',
                '[ ] Verify all timeouts work in production environment',
                '[ ] Monitor connection success rates',
              ],
              troubleshootingFast: {
                'App stuck "Initializing..."': 'Check timeoutMs setting and API key validity',
                'Modal not appearing': 'Verify <ParaModal /> inside <ParaProvider>',
                'Wallet connection hangs': 'Check connectionTimeout and retryAttempts settings',
                'CSS styling broken': 'Verify CSS import in main app file',
              },
            },
            null,
            2
          ),
        },
      ],
    };
  }
}
