# Migration Example: ReOwn to Para

This example demonstrates a complete migration from ReOwn/WalletConnect to Para Universal Embedded Wallets.

## Before Migration

### package.json (Before)
```json
{
  "dependencies": {
    "@web3modal/wagmi": "^3.5.7",
    "@web3modal/siwe": "^3.5.7",
    "wagmi": "^1.4.12",
    "viem": "^1.19.11"
  }
}
```

### Provider Setup (Before)
```typescript
// providers/Web3Provider.tsx
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react'
import { WagmiConfig } from 'wagmi'
import { arbitrum, mainnet } from 'viem/chains'

const projectId = 'your-project-id'

const metadata = {
  name: 'Web3Modal',
  description: 'Web3Modal Example',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
}

const chains = [mainnet, arbitrum]
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata })

createWeb3Modal({ wagmiConfig, projectId, chains })

export function Web3Provider({ children }: { children: React.ReactNode }) {
  return <WagmiConfig config={wagmiConfig}>{children}</WagmiConfig>
}
```

### Connect Button (Before)
```typescript
// components/ConnectButton.tsx
export function ConnectButton() {
  return <w3m-button />
}
```

## After Migration

### package.json (After)
```json
{
  "dependencies": {
    "@getpara/react-sdk": "latest",
    "wagmi": "^1.4.12",
    "viem": "^1.19.11"
  }
}
```

### Provider Setup (After)
```typescript
// providers/ParaProvider.tsx
import { ParaProvider } from "@getpara/react-sdk";
import { mainnet, arbitrum } from "viem/chains";
import { http } from "viem";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ParaProvider
      paraClientConfig={{
        apiKey: process.env.PARA_API_KEY!,
        env: process.env.PARA_ENVIRONMENT as "development" | "production",
      }}
      externalWalletConfig={{
        wallets: ["METAMASK", "COINBASE", "WALLETCONNECT", "RAINBOW"],
        evmConnector: {
          config: {
            chains: [mainnet, arbitrum],
            transports: {
              [mainnet.id]: http(),
              [arbitrum.id]: http(),
            },
          },
        },
      }}
    >
      {children}
    </ParaProvider>
  );
}
```

### Connect Button (After)
```typescript
// components/ConnectButton.tsx
import { useAccount, useModal, useWallet } from "@getpara/react-sdk";

export function ConnectButton() {
  const { openModal } = useModal();
  const { data: wallet } = useWallet();
  const { isConnected } = useAccount();

  if (isConnected && wallet?.address) {
    return (
      <button 
        onClick={() => openModal()}
        className="bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-lg"
      >
        {wallet.address.slice(0, 6)}...{wallet.address.slice(-4)}
      </button>
    );
  }

  return (
    <button 
      onClick={() => openModal()}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg"
    >
      Connect Wallet
    </button>
  );
}
```

### Environment Variables
```bash
# .env
PARA_API_KEY=your_para_api_key_here
PARA_ENVIRONMENT=development
```

## Existing Wagmi Hooks (Unchanged!)

All your existing Wagmi hooks continue to work without any changes:

```typescript
// These hooks work exactly the same with Para
import { useAccount, useBalance, useContractRead, useContractWrite } from 'wagmi'

function MyComponent() {
  const { address, isConnected } = useAccount()
  const { data: balance } = useBalance({ address })
  
  // All your existing Wagmi code continues to work!
  return (
    <div>
      {isConnected ? (
        <p>Balance: {balance?.formatted}</p>
      ) : (
        <ConnectButton />
      )}
    </div>
  )
}
```

## Migration Steps

1. **Remove old packages**
   ```bash
   npm uninstall @web3modal/wagmi @web3modal/siwe
   ```

2. **Install Para SDK**
   ```bash
   npm install @getpara/react-sdk
   npm run postinstall
   ```

3. **Update environment variables**
   - Add `PARA_API_KEY` and `PARA_ENVIRONMENT` to `.env`

4. **Replace provider component**
   - Replace Web3Modal provider with Para provider

5. **Update connect button**
   - Replace `<w3m-button />` with Para connect button

6. **Test everything**
   - Verify wallet connections work
   - Test all existing functionality
   - Check mobile compatibility

## Key Benefits

- ✅ **Zero changes to existing Wagmi hooks**
- ✅ **Better mobile wallet experience**
- ✅ **Universal embedded wallet support**
- ✅ **Improved user onboarding**
- ✅ **Simplified wallet management**

## Testing Checklist

- [ ] Connect with MetaMask
- [ ] Connect with Coinbase Wallet
- [ ] Connect with WalletConnect
- [ ] Test transaction signing
- [ ] Test chain switching
- [ ] Test on mobile devices
- [ ] Verify all existing features work