import { MigrationConfig } from '../types.js';

export class CodeGenerator {
  async generateProviderComponent(config: MigrationConfig, typescript: boolean = true): Promise<any> {
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
          text: JSON.stringify({
            filename: `AppProviders.${extension}`,
            code: providerCode,
            dependencies: [
              '@getpara/react-sdk',
              '@getpara/core-sdk',
              'viem',
            ],
            notes: [
              'Replace the API key with your actual Para API key',
              'Adjust chains based on your application needs',
              'Import this provider at the root of your application',
              '⚠️ CRITICAL: <ParaModal /> component is REQUIRED for modal to appear',
              'The ParaModal must be inside ParaProvider for openModal() to work',
              'Add "@getpara/react-sdk/styles.css" import to your main layout',
            ],
          }, null, 2),
        },
      ],
    };
  }

  async generateConnectButton(typescript: boolean = true, styling: string = 'tailwind'): Promise<any> {
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
          text: JSON.stringify({
            filename: `ConnectButton.${extension}`,
            code: baseCode,
            styling,
            dependencies: [
              '@getpara/react-sdk',
            ],
            notes: [
              'Customize the styling classes based on your design system',
              'The AdvancedConnectButton includes disconnect functionality',
              'Use the openModal() function to show Para\'s connection interface',
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
          }, null, 2),
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
          text: JSON.stringify({
            filename: `layout.${extension}`,
            code: layoutCode,
            dependencies: [
              'next',
            ],
            notes: [
              'This is a Next.js layout example',
              '⚠️ CRITICAL: "@getpara/react-sdk/styles.css" import is REQUIRED',
              'Place this in your app/layout.tsx for Next.js App Router',
              'For Pages Router, add the CSS import to _app.tsx',
            ],
          }, null, 2),
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

    return chainIds.map(id => chainMap[id] || `/* Chain ID ${id} - add appropriate import */`).join(', ');
  }

  private generateTransports(chainIds: number[]): string {
    return chainIds.map(id => `[${id}]: http(),`).join('\n              ');
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
}