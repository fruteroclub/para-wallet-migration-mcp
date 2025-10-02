/**
 * Replacement Strategy Pattern Implementation
 * Handles different migration strategies with atomic operations
 */

import {
  MigrationStrategy,
  ReplacementOperation,
  ProjectState,
  HOOK_REPLACEMENT_MAP,
  PROVIDER_REPLACEMENT_MAP,
} from './migration-engine.js';

export interface ReplacementStrategy {
  strategy: MigrationStrategy;
  execute(state: ProjectState): Promise<ReplacementOperation[]>;
  validate(state: ProjectState): Promise<boolean>;
  getEstimatedTime(): number;
}

/**
 * Privy to Para Replacement Strategy
 * Complete replacement approach - no compatibility layer
 */
export class PrivyToParaStrategy implements ReplacementStrategy {
  strategy = MigrationStrategy.PRIVY_TO_PARA;

  async execute(state: ProjectState): Promise<ReplacementOperation[]> {
    const operations: ReplacementOperation[] = [];

    // 1. Remove Privy dependencies (CRITICAL)
    operations.push({
      id: 'remove-privy-deps',
      type: 'dependency',
      oldValue: '@privy-io/react-auth',
      newValue: '', // remove completely
      critical: true,
    });

    operations.push({
      id: 'remove-privy-wagmi',
      type: 'dependency',
      oldValue: '@privy-io/wagmi',
      newValue: '', // remove completely
      critical: true,
    });

    // 2. Add Para dependency (CRITICAL)
    operations.push({
      id: 'add-para-react',
      type: 'dependency',
      oldValue: '',
      newValue: '@para-wallet/react',
      critical: true,
    });

    // 3. Replace all imports atomically
    for (const importUsage of state.imports.filter((i) => i.type === 'privy')) {
      operations.push({
        id: `replace-import-${importUsage.file}-${importUsage.line}`,
        type: 'import',
        file: importUsage.file,
        line: importUsage.line,
        oldValue: importUsage.import,
        newValue: this.getParaImportReplacement(importUsage.import),
        critical: true,
      });
    }

    // 4. Replace provider with ParaProvider + ParaModal (CRITICAL)
    for (const provider of state.providers.filter((p) => p.provider === 'PrivyProvider')) {
      operations.push({
        id: `replace-provider-${provider.file}-${provider.line}`,
        type: 'provider',
        file: provider.file,
        line: provider.line,
        oldValue: this.generatePrivyProvider(provider.props),
        newValue: this.generateParaProvider(provider.props),
        critical: true,
      });
    }

    // 5. Replace all hook usages
    for (const hook of state.hooks.filter((h) => h.from.includes('privy'))) {
      const newHook = this.getHookReplacement(hook.hook);
      if (newHook) {
        operations.push({
          id: `replace-hook-${hook.file}-${hook.line}`,
          type: 'hook',
          file: hook.file,
          line: hook.line,
          oldValue: hook.usage,
          newValue: hook.usage.replace(hook.hook, newHook),
          critical: false, // hooks can be updated gradually
        });
      }
    }

    // 6. Add Para CSS imports (CRITICAL)
    for (const entryPoint of state.entryPoints) {
      operations.push({
        id: `add-para-css-${entryPoint}`,
        type: 'style',
        file: entryPoint,
        oldValue: '',
        newValue: "import '@para-wallet/react/styles.css'",
        critical: true,
      });
    }

    return operations;
  }

  async validate(state: ProjectState): Promise<boolean> {
    // Validate that Privy dependencies are present
    const hasPrivyAuth = Object.keys(state.dependencies).includes('@privy-io/react-auth');
    const hasPrivyImports = state.imports.some((i) => i.type === 'privy');

    return hasPrivyAuth || hasPrivyImports;
  }

  getEstimatedTime(): number {
    return 180; // 3 minutes for complete Privy replacement
  }

  private getParaImportReplacement(privyImport: string): string {
    // Transform Privy imports to Para imports
    if (privyImport.includes('usePrivy')) {
      return privyImport.replace('usePrivy', 'useAccount');
    }
    if (privyImport.includes('useWallets')) {
      return privyImport.replace('useWallets', 'useWallet');
    }
    if (privyImport.includes('useLogin')) {
      return privyImport.replace('useLogin', 'useConnect');
    }
    if (privyImport.includes('useLogout')) {
      return privyImport.replace('useLogout', 'useDisconnect');
    }
    if (privyImport.includes('PrivyProvider')) {
      return privyImport.replace('PrivyProvider', 'ParaProvider, ParaModal');
    }

    // Default replacement
    return privyImport.replace('@privy-io/react-auth', '@para-wallet/react');
  }

  private getHookReplacement(privyHook: string): string | null {
    const replacements = HOOK_REPLACEMENT_MAP['privy-to-para'];
    return replacements[privyHook as keyof typeof replacements] || null;
  }

  private generatePrivyProvider(props: Record<string, any>): string {
    return `<PrivyProvider
  appId={${props.appId || 'PRIVY_APP_ID'}}
  clientId={${props.clientId || 'PRIVY_CLIENT_ID'}}
  config={{...}}
>
  {children}
</PrivyProvider>`;
  }

  private generateParaProvider(props: Record<string, any>): string {
    return `<ParaProvider
  config={{
    apiKey: ${props.appId || 'PARA_API_KEY'},
    paraClientConfig: {
      env: Environment.DEVELOPMENT,
    },
    embeddedWalletConfig: {
      createOnLogin: "all-users",
      showWalletUiOnLogin: true,
    }
  }}
>
  {children}
  {/* ⚠️ CRITICAL: ParaModal is REQUIRED - #1 missing piece in failed migrations */}
  <ParaModal />
</ParaProvider>`;
  }
}

/**
 * ReOwn to Para Replacement Strategy
 */
export class ReownToParaStrategy implements ReplacementStrategy {
  strategy = MigrationStrategy.REOWN_TO_PARA;

  async execute(state: ProjectState): Promise<ReplacementOperation[]> {
    const operations: ReplacementOperation[] = [];

    // 1. Remove ALL ReOwn dependencies (complete cleanup)
    const reownDependencies = [
      '@reown/appkit',
      '@reown/appkit-adapter-wagmi',
      '@reown/appkit-react',
      '@reown/appkit-siwe',
      '@web3modal/wagmi',
      '@web3modal/siwe',
      '@web3modal/ethereum',
    ];

    reownDependencies.forEach((dep) => {
      if (Object.keys(state.dependencies).includes(dep)) {
        operations.push({
          id: `remove-${dep.replace(/[@/]/g, '-')}`,
          type: 'dependency',
          oldValue: dep,
          newValue: '',
          critical: true,
        });
      }
    });

    // 2. Add Para dependency
    operations.push({
      id: 'add-para-react',
      type: 'dependency',
      oldValue: '',
      newValue: '@para-wallet/react',
      critical: true,
    });

    // 3. Replace ALL ReOwn/Web3Modal imports
    const reownImports = state.imports.filter(
      (i) => i.type === 'reown' || i.from.includes('reown') || i.from.includes('web3modal')
    );

    for (const importUsage of reownImports) {
      operations.push({
        id: `replace-import-${importUsage.file}-${importUsage.line}`,
        type: 'import',
        file: importUsage.file,
        line: importUsage.line,
        oldValue: importUsage.import,
        newValue: this.getParaImportReplacement(importUsage.import),
        critical: true,
      });
    }

    // 4. Replace ALL ReOwn providers (AppKit, Web3Modal, etc.)
    const reownProviders = state.providers.filter(
      (p) =>
        p.provider.includes('AppKit') ||
        p.provider.includes('Web3Modal') ||
        p.provider.includes('createWeb3Modal')
    );

    for (const provider of reownProviders) {
      operations.push({
        id: `replace-provider-${provider.file}-${provider.line}`,
        type: 'provider',
        file: provider.file,
        line: provider.line,
        oldValue: this.generateReownProvider(provider),
        newValue: this.generateParaProvider(provider.props),
        critical: true,
      });
    }

    // 5. Replace ReOwn hooks
    for (const hook of state.hooks.filter((h) => this.isReownHook(h.hook))) {
      const newHook = this.getReownHookReplacement(hook.hook);
      if (newHook) {
        operations.push({
          id: `replace-hook-${hook.file}-${hook.line}`,
          type: 'hook',
          file: hook.file,
          line: hook.line,
          oldValue: hook.usage,
          newValue: hook.usage.replace(hook.hook, newHook),
          critical: false, // hooks can be updated gradually
        });
      }
    }

    // 6. Add Para CSS imports (CRITICAL)
    for (const entryPoint of state.entryPoints) {
      operations.push({
        id: `add-para-css-${entryPoint}`,
        type: 'style',
        file: entryPoint,
        oldValue: '',
        newValue: "import '@para-wallet/react/styles.css'",
        critical: true,
      });
    }

    return operations;
  }

  async validate(state: ProjectState): Promise<boolean> {
    const reownPatterns = ['reown', 'web3modal', 'appkit'];

    const hasReownDeps = Object.keys(state.dependencies).some((dep) =>
      reownPatterns.some((pattern) => dep.includes(pattern))
    );

    const hasReownImports = state.imports.some((i) =>
      reownPatterns.some((pattern) => i.from.includes(pattern) || i.type === 'reown')
    );

    const hasReownProviders = state.providers.some((p) =>
      reownPatterns.some((pattern) => p.provider.toLowerCase().includes(pattern))
    );

    return hasReownDeps || hasReownImports || hasReownProviders;
  }

  getEstimatedTime(): number {
    return 150; // 2.5 minutes for ReOwn replacement
  }

  private getParaImportReplacement(reownImport: string): string {
    // ReOwn AppKit hook replacements
    if (reownImport.includes('useAppKit')) {
      return reownImport.replace('useAppKit', 'useModal');
    }
    if (reownImport.includes('useAppKitAccount')) {
      return reownImport.replace('useAppKitAccount', 'useAccount');
    }
    if (reownImport.includes('useAppKitTheme')) {
      return reownImport.replace('useAppKitTheme', 'useModal'); // Para handles theming differently
    }
    if (reownImport.includes('useAppKitState')) {
      return reownImport.replace('useAppKitState', 'useAccount');
    }
    if (reownImport.includes('useAppKitEvents')) {
      return reownImport.replace('useAppKitEvents', 'useWallet'); // Para event handling
    }

    // Web3Modal hook replacements
    if (reownImport.includes('useWeb3Modal')) {
      return reownImport.replace('useWeb3Modal', 'useModal');
    }
    if (reownImport.includes('useWeb3ModalAccount')) {
      return reownImport.replace('useWeb3ModalAccount', 'useAccount');
    }
    if (reownImport.includes('useWeb3ModalTheme')) {
      return reownImport.replace('useWeb3ModalTheme', 'useModal');
    }

    // Component replacements
    if (reownImport.includes('createAppKit')) {
      return reownImport.replace('createAppKit', 'ParaProvider, ParaModal');
    }
    if (reownImport.includes('createWeb3Modal')) {
      return reownImport.replace('createWeb3Modal', 'ParaProvider, ParaModal');
    }
    if (reownImport.includes('defaultWagmiConfig')) {
      return reownImport.replace('defaultWagmiConfig', 'wagmiConfig'); // Keep wagmi config
    }

    // Package replacements
    const packageMappings = {
      '@reown/appkit': '@para-wallet/react',
      '@reown/appkit-react': '@para-wallet/react',
      '@reown/appkit-adapter-wagmi': '@para-wallet/react',
      '@web3modal/wagmi': '@para-wallet/react',
      '@web3modal/siwe': '@para-wallet/react',
      '@web3modal/ethereum': '@para-wallet/react',
    };

    for (const [oldPkg, newPkg] of Object.entries(packageMappings)) {
      if (reownImport.includes(oldPkg)) {
        return reownImport.replace(oldPkg, newPkg);
      }
    }

    return reownImport; // fallback
  }

  private generateReownProvider(provider: any): string {
    if (provider.provider.includes('AppKit')) {
      return `<AppKit 
  projectId="${provider.props.projectId || 'REOWN_PROJECT_ID'}"
  wagmiConfig={wagmiConfig}
  metadata={metadata}
>
  {children}
</AppKit>`;
    }

    if (provider.provider.includes('Web3Modal')) {
      return `<Web3Modal 
  projectId="${provider.props.projectId || 'WEB3MODAL_PROJECT_ID'}"
  wagmiConfig={wagmiConfig}
>
  {children}
</Web3Modal>`;
    }

    return `${provider.provider} config={...}>{children}</${provider.provider}>`;
  }

  private generateParaProvider(props: Record<string, any>): string {
    return `<ParaProvider
  config={{
    apiKey: ${props.projectId || 'PARA_API_KEY'},
    paraClientConfig: {
      env: Environment.DEVELOPMENT,
    },
    embeddedWalletConfig: {
      createOnLogin: "all-users",
      showWalletUiOnLogin: true,
    },
    wagmiConfig // Keep existing Wagmi config
  }}
>
  {children}
  {/* ⚠️ CRITICAL: ParaModal is REQUIRED - #1 missing piece in failed migrations */}
  <ParaModal />
</ParaProvider>`;
  }

  private isReownHook(hookName: string): boolean {
    const reownHooks = [
      'useAppKit',
      'useAppKitAccount',
      'useAppKitTheme',
      'useAppKitState',
      'useAppKitEvents',
      'useWeb3Modal',
      'useWeb3ModalAccount',
      'useWeb3ModalTheme',
      'useWeb3ModalState',
    ];
    return reownHooks.includes(hookName);
  }

  private getReownHookReplacement(reownHook: string): string | null {
    const replacements: Record<string, string> = {
      useAppKit: 'useModal',
      useAppKitAccount: 'useAccount',
      useAppKitTheme: 'useModal',
      useAppKitState: 'useAccount',
      useAppKitEvents: 'useWallet',
      useWeb3Modal: 'useModal',
      useWeb3ModalAccount: 'useAccount',
      useWeb3ModalTheme: 'useModal',
      useWeb3ModalState: 'useAccount',
    };

    return replacements[reownHook] || null;
  }
}

/**
 * Web3Modal to Para Replacement Strategy
 */
export class Web3ModalToParaStrategy implements ReplacementStrategy {
  strategy = MigrationStrategy.WEB3MODAL_TO_PARA;

  async execute(state: ProjectState): Promise<ReplacementOperation[]> {
    const operations: ReplacementOperation[] = [];

    // Remove Web3Modal dependencies
    operations.push({
      id: 'remove-web3modal-wagmi',
      type: 'dependency',
      oldValue: '@web3modal/wagmi',
      newValue: '',
      critical: true,
    });

    operations.push({
      id: 'remove-web3modal-siwe',
      type: 'dependency',
      oldValue: '@web3modal/siwe',
      newValue: '',
      critical: true,
    });

    // Add Para dependency
    operations.push({
      id: 'add-para-react',
      type: 'dependency',
      oldValue: '',
      newValue: '@para-wallet/react',
      critical: true,
    });

    return operations;
  }

  async validate(state: ProjectState): Promise<boolean> {
    return Object.keys(state.dependencies).some((dep) => dep.includes('web3modal'));
  }

  getEstimatedTime(): number {
    return 120; // 2 minutes for Web3Modal replacement
  }
}

/**
 * Strategy Factory
 */
export class StrategyFactory {
  static createStrategy(strategy: MigrationStrategy): ReplacementStrategy {
    switch (strategy) {
      case MigrationStrategy.PRIVY_TO_PARA:
        return new PrivyToParaStrategy();
      case MigrationStrategy.REOWN_TO_PARA:
        return new ReownToParaStrategy();
      case MigrationStrategy.WEB3MODAL_TO_PARA:
        return new Web3ModalToParaStrategy();
      default:
        throw new Error(`Unsupported migration strategy: ${strategy}`);
    }
  }

  static detectStrategy(state: ProjectState): MigrationStrategy | null {
    const deps = Object.keys(state.dependencies);
    const imports = state.imports.map((i) => i.from);

    // Check for Privy
    if (deps.includes('@privy-io/react-auth') || imports.some((i) => i.includes('privy'))) {
      return MigrationStrategy.PRIVY_TO_PARA;
    }

    // Check for ReOwn
    if (deps.some((d) => d.includes('reown')) || imports.some((i) => i.includes('reown'))) {
      return MigrationStrategy.REOWN_TO_PARA;
    }

    // Check for Web3Modal
    if (deps.some((d) => d.includes('web3modal')) || imports.some((i) => i.includes('web3modal'))) {
      return MigrationStrategy.WEB3MODAL_TO_PARA;
    }

    return null;
  }
}
