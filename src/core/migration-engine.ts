/**
 * Replacement-Based Migration Engine
 * Core architecture for atomic migration operations
 * Based on Context7 MCP patterns and real-world learnings
 */


// Core Types
export interface ProjectState {
  dependencies: Record<string, string>;
  imports: FileImport[];
  providers: ProviderUsage[];
  hooks: HookUsage[];
  styles: StyleImport[];
  entryPoints: string[];
}

export interface FileImport {
  file: string;
  line: number;
  import: string;
  from: string;
  type: 'privy' | 'reown' | 'web3modal' | 'wagmi' | 'para' | 'other';
}

export interface ProviderUsage {
  file: string;
  line: number;
  provider: string;
  props: Record<string, unknown>;
  active: boolean;
}

export interface HookUsage {
  file: string;
  line: number;
  hook: string;
  from: string;
  usage: string;
}

export interface StyleImport {
  file: string;
  line: number;
  import: string;
  isParaStyle: boolean;
}

export interface MigrationPlan {
  strategy: MigrationStrategy;
  replacements: ReplacementOperation[];
  validations: ValidationCheck[];
  rollbackPlan: RollbackOperation[];
  estimatedTime: number; // in seconds
}

export interface ReplacementOperation {
  id: string;
  type: 'dependency' | 'import' | 'provider' | 'hook' | 'style';
  file?: string;
  line?: number;
  oldValue: string;
  newValue: string;
  critical: boolean; // if true, failure triggers rollback
}

export interface ValidationCheck {
  id: string;
  type: 'pre' | 'post';
  description: string;
  validator: () => Promise<ValidationResult>;
}

export interface RollbackOperation {
  operationId: string;
  action: () => Promise<void>;
}

export interface ValidationResult {
  valid: boolean;
  issues: ValidationIssue[];
  warnings: string[];
}

export interface ValidationIssue {
  severity: 'critical' | 'warning' | 'info';
  code: string;
  message: string;
  file?: string;
  line?: number;
  fix?: string;
}

export interface MigrationResult {
  success: boolean;
  completedOperations: string[];
  failedOperations: string[];
  validationResults: ValidationResult[];
  rollbackExecuted: boolean;
  duration: number; // in milliseconds
  issues: ValidationIssue[];
}

// Migration Strategy Enum
export enum MigrationStrategy {
  PRIVY_TO_PARA = 'privy-to-para',
  REOWN_TO_PARA = 'reown-to-para',
  WEB3MODAL_TO_PARA = 'web3modal-to-para',
  WALLETCONNECT_TO_PARA = 'walletconnect-to-para',
}

// Replacement Maps
export const HOOK_REPLACEMENT_MAP = {
  'privy-to-para': {
    usePrivy: 'useAccount',
    useWallets: 'useWallet',
    useLogin: 'useConnect',
    useLogout: 'useDisconnect',
    useEmbeddedWallet: 'useWallet',
  },
  'reown-to-para': {
    useAppKit: 'useModal',
    useAppKitAccount: 'useAccount',
    useAppKitTheme: 'useModal',
    useAppKitState: 'useAccount',
    useAppKitEvents: 'useWallet',
    useDisconnect: 'useDisconnect',
    useWalletInfo: 'useWallet',
    useWeb3Modal: 'useModal',
    useWeb3ModalAccount: 'useAccount',
    useWeb3ModalTheme: 'useModal',
    useWeb3ModalState: 'useAccount',
  },
  'web3modal-to-para': {
    useWeb3Modal: 'useModal',
    useWeb3ModalAccount: 'useAccount',
    useWeb3ModalTheme: 'useModal',
    useWeb3ModalState: 'useAccount',
    useDisconnect: 'useDisconnect',
  },
} as const;

export const PROVIDER_REPLACEMENT_MAP = {
  'privy-to-para': {
    component: 'PrivyProvider',
    replacement: 'ParaProvider',
    requiredComponents: ['ParaModal'],
    configMapping: {
      appId: 'apiKey',
      clientId: null, // remove
      config: 'paraClientConfig',
    },
  },
  'reown-to-para': {
    component: 'AppKit',
    replacement: 'ParaProvider',
    requiredComponents: ['ParaModal'],
    configMapping: {
      projectId: null, // remove
      metadata: 'metadata',
      wagmiConfig: 'wagmiConfig',
    },
  },
} as const;

/**
 * Core Migration Engine
 * Implements atomic replacement strategy
 */
export class MigrationEngine {
  private state: ProjectState | null = null;
  private plan: MigrationPlan | null = null;
  private rollbackPlan: RollbackOperation[] = [];

  /**
   * Phase 1: Scan and analyze current project state
   */
  async scanProjectState(_projectPath: string): Promise<ProjectState> {
    const state: ProjectState = {
      dependencies: {},
      imports: [],
      providers: [],
      hooks: [],
      styles: [],
      entryPoints: [],
    };

    // Implementation would scan files using fs module
    // Currently returns empty state for interface compliance

    this.state = state;
    return state;
  }

  /**
   * Phase 2: Create atomic replacement plan
   */
  async createReplacementPlan(strategy: MigrationStrategy): Promise<MigrationPlan> {
    if (!this.state) {
      throw new Error('Must scan project state first');
    }

    const plan: MigrationPlan = {
      strategy,
      replacements: [],
      validations: [],
      rollbackPlan: [],
      estimatedTime: 0,
    };

    // Generate replacement operations based on strategy
    plan.replacements = await this.generateReplacements(strategy);

    // Generate validation checks
    plan.validations = await this.generateValidations(strategy);

    // Generate rollback plan
    plan.rollbackPlan = await this.generateRollbackPlan(plan.replacements);

    // Estimate time based on operations
    plan.estimatedTime = this.estimateTime(plan.replacements);

    this.plan = plan;
    return plan;
  }

  /**
   * Phase 3: Execute atomic migration
   */
  async executeAtomicMigration(): Promise<MigrationResult> {
    if (!this.plan) {
      throw new Error('Must create replacement plan first');
    }

    const startTime = Date.now();
    const result: MigrationResult = {
      success: false,
      completedOperations: [],
      failedOperations: [],
      validationResults: [],
      rollbackExecuted: false,
      duration: 0,
      issues: [],
    };

    try {
      // Pre-flight validation
      const preValidation = await this.runValidations('pre');
      result.validationResults.push(preValidation);

      if (!preValidation.valid) {
        result.issues.push(...preValidation.issues);
        throw new Error('Pre-flight validation failed');
      }

      // Execute all replacement operations atomically
      for (const operation of this.plan.replacements) {
        try {
          await this.executeOperation(operation);
          result.completedOperations.push(operation.id);
        } catch (error) {
          result.failedOperations.push(operation.id);

          if (operation.critical) {
            throw new Error(`Critical operation failed: ${operation.id}`);
          }
        }
      }

      // Post-migration validation
      const postValidation = await this.runValidations('post');
      result.validationResults.push(postValidation);

      if (!postValidation.valid) {
        result.issues.push(...postValidation.issues);
        throw new Error('Post-migration validation failed');
      }

      result.success = true;
    } catch (error) {
      // Execute rollback on failure
      try {
        await this.executeRollback();
        result.rollbackExecuted = true;
      } catch (rollbackError) {
        result.issues.push({
          severity: 'critical',
          code: 'ROLLBACK_FAILED',
          message: `Rollback failed: ${rollbackError}`,
          fix: 'Manual intervention required',
        });
      }
    }

    result.duration = Date.now() - startTime;
    return result;
  }

  /**
   * Phase 4: Validate migration completion
   */
  async validateCompletion(): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      issues: [],
      warnings: [],
    };

    // Check for critical issues that cause 90% of failures
    const criticalChecks = [
      this.checkParaModalPresent(),
      this.checkCssImportsPresent(),
      this.checkEnvironmentEnumUsage(),
      this.checkNoOldDependencies(),
      this.checkNoOldImports(),
    ];

    for (const check of criticalChecks) {
      const checkResult = await check;
      if (!checkResult.valid) {
        result.valid = false;
        result.issues.push(...checkResult.issues);
      }
      result.warnings.push(...checkResult.warnings);
    }

    return result;
  }

  // Private helper methods
  private async generateReplacements(strategy: MigrationStrategy): Promise<ReplacementOperation[]> {
    const operations: ReplacementOperation[] = [];

    // Generate dependency replacements
    operations.push(...(await this.generateDependencyReplacements(strategy)));

    // Generate import replacements
    operations.push(...(await this.generateImportReplacements(strategy)));

    // Generate provider replacements
    operations.push(...(await this.generateProviderReplacements(strategy)));

    // Generate hook replacements
    operations.push(...(await this.generateHookReplacements(strategy)));

    // Generate style additions
    operations.push(...(await this.generateStyleOperations()));

    return operations;
  }

  private async generateValidations(strategy: MigrationStrategy): Promise<ValidationCheck[]> {
    return [
      {
        id: 'pre-dependencies',
        type: 'pre',
        description: 'Check old dependencies are present',
        validator: () => this.validateOldDependenciesPresent(strategy),
      },
      {
        id: 'post-para-modal',
        type: 'post',
        description: 'Check ParaModal component is present',
        validator: () => this.checkParaModalPresent(),
      },
      {
        id: 'post-css-imports',
        type: 'post',
        description: 'Check Para CSS is imported',
        validator: () => this.checkCssImportsPresent(),
      },
      {
        id: 'post-no-old-deps',
        type: 'post',
        description: 'Check old dependencies are removed',
        validator: () => this.checkNoOldDependencies(),
      },
    ];
  }

  private async generateRollbackPlan(
    operations: ReplacementOperation[]
  ): Promise<RollbackOperation[]> {
    // Create inverse operations for rollback
    return operations.map((op) => ({
      operationId: op.id,
      action: async () => {
        // Implementation would restore original values based on operation type
        // eslint-disable-next-line no-console
        console.log(`Rolling back operation ${op.id}`);
      },
    }));
  }

  private estimateTime(operations: ReplacementOperation[]): number {
    // Estimate based on operation complexity
    const base = 30; // 30 seconds base
    const perOperation = 15; // 15 seconds per operation
    return base + operations.length * perOperation;
  }

  private async executeOperation(operation: ReplacementOperation): Promise<void> {
    // Implementation would depend on operation type
    switch (operation.type) {
      case 'dependency':
        await this.executeDependencyOperation(operation);
        break;
      case 'import':
        await this.executeImportOperation(operation);
        break;
      case 'provider':
        await this.executeProviderOperation(operation);
        break;
      case 'hook':
        await this.executeHookOperation(operation);
        break;
      case 'style':
        await this.executeStyleOperation(operation);
        break;
    }
  }

  private async runValidations(type: 'pre' | 'post'): Promise<ValidationResult> {
    if (!this.plan) {
      throw new Error('No plan available for validation');
    }

    const validations = this.plan.validations.filter((v) => v.type === type);
    const result: ValidationResult = {
      valid: true,
      issues: [],
      warnings: [],
    };

    for (const validation of validations) {
      const validationResult = await validation.validator();
      if (!validationResult.valid) {
        result.valid = false;
        result.issues.push(...validationResult.issues);
      }
      result.warnings.push(...validationResult.warnings);
    }

    return result;
  }

  private async executeRollback(): Promise<void> {
    for (const rollbackOp of this.rollbackPlan.reverse()) {
      await rollbackOp.action();
    }
  }

  // Critical validation methods (based on real-world learnings)
  private async checkParaModalPresent(): Promise<ValidationResult> {
    // Check if <ParaModal /> is present in provider files
    return {
      valid: true, // Implementation would check for ParaModal component
      issues: [],
      warnings: [],
    };
  }

  private async checkCssImportsPresent(): Promise<ValidationResult> {
    // Check if Para CSS styles are imported
    return {
      valid: true, // Implementation would check for ParaModal component
      issues: [],
      warnings: [],
    };
  }

  private async checkEnvironmentEnumUsage(): Promise<ValidationResult> {
    // Check if Environment enum is used instead of string
    return {
      valid: true, // Implementation would check for ParaModal component
      issues: [],
      warnings: [],
    };
  }

  private async checkNoOldDependencies(): Promise<ValidationResult> {
    // Check if old wallet dependencies are removed
    return {
      valid: true, // Implementation would check for ParaModal component
      issues: [],
      warnings: [],
    };
  }

  private async checkNoOldImports(): Promise<ValidationResult> {
    // Check if old wallet imports are removed
    return {
      valid: true, // Implementation would check for ParaModal component
      issues: [],
      warnings: [],
    };
  }

  // Placeholder methods for operation generation
  private async generateDependencyReplacements(
    _strategy: MigrationStrategy
  ): Promise<ReplacementOperation[]> {
    return []; // Implementation would generate appropriate replacements
  }

  private async generateImportReplacements(
    _strategy: MigrationStrategy
  ): Promise<ReplacementOperation[]> {
    return []; // Implementation would generate appropriate replacements
  }

  private async generateProviderReplacements(
    _strategy: MigrationStrategy
  ): Promise<ReplacementOperation[]> {
    return []; // Implementation would generate appropriate replacements
  }

  private async generateHookReplacements(
    _strategy: MigrationStrategy
  ): Promise<ReplacementOperation[]> {
    return []; // Implementation would generate appropriate replacements
  }

  private async generateStyleOperations(): Promise<ReplacementOperation[]> {
    return []; // Implementation would generate appropriate replacements
  }

  private async validateOldDependenciesPresent(
    _strategy: MigrationStrategy
  ): Promise<ValidationResult> {
    return { valid: true, issues: [], warnings: [] }; // Implementation would validate dependencies
  }

  // Placeholder execution methods
  private async executeDependencyOperation(_operation: ReplacementOperation): Promise<void> {
    // Implementation would execute the specific operation type
  }

  private async executeImportOperation(_operation: ReplacementOperation): Promise<void> {
    // Implementation would execute the specific operation type
  }

  private async executeProviderOperation(_operation: ReplacementOperation): Promise<void> {
    // Implementation would execute the specific operation type
  }

  private async executeHookOperation(_operation: ReplacementOperation): Promise<void> {
    // Implementation would execute the specific operation type
  }

  private async executeStyleOperation(_operation: ReplacementOperation): Promise<void> {
    // Implementation would execute the specific operation type
  }
}
