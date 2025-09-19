import React from 'react';
import { createWeb3Modal, defaultWagmiConfig } from '@web3modal/wagmi/react';
import { WagmiConfig } from 'wagmi';
import { arbitrum, mainnet } from 'viem/chains';
import { useAccount, useBalance } from 'wagmi';

const projectId = 'your-project-id';

const metadata = {
  name: 'Web3Modal',
  description: 'Web3Modal Example',
  url: 'https://web3modal.com',
  icons: ['https://avatars.githubusercontent.com/u/37784886']
};

const chains = [mainnet, arbitrum];
const wagmiConfig = defaultWagmiConfig({ chains, projectId, metadata });

createWeb3Modal({ wagmiConfig, projectId, chains });

function ConnectButton() {
  return <w3m-button />;
}

function App() {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({ address });

  return (
    <div>
      <h1>My Web3 App</h1>
      {isConnected ? (
        <div>
          <p>Connected: {address}</p>
          <p>Balance: {balance?.formatted}</p>
        </div>
      ) : (
        <ConnectButton />
      )}
    </div>
  );
}

export default App;