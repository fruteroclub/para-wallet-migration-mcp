/**
 * Atomic Validation System
 * Implements proper validation gates for migration operations
 * Based on Context7 MCP patterns and real-world failure analysis
 */

import { ValidationResult, ProjectState, ValidationIssue } from './migration-engine.js';

/**
 * Atomic Validator
 * Provides comprehensive validation for migration operations
 */
export class AtomicValidator {
  /**
   * Pre-flight validation - ensures migration can proceed
   */
  async validatePreFlight(projectState: ProjectState): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      issues: [],
      warnings: [],
    };

    // Check 1: Ensure we have something to migrate
    const hasMigratableContent = this.checkMigratableContent(projectState);
    if (!hasMigratableContent.valid) {
      result.valid = false;
      result.issues.push(...hasMigratableContent.issues);
    }

    // Check 2: Ensure project structure is supported
    const hasValidStructure = this.checkProjectStructure(projectState);
    if (!hasValidStructure.valid) {
      result.valid = false;
      result.issues.push(...hasValidStructure.issues);
    }

    // Check 3: Detect potential conflicts
    const conflictCheck = this.checkForConflicts(projectState);
    if (!conflictCheck.valid) {
      result.valid = false;
      result.issues.push(...conflictCheck.issues);
    }

    return result;
  }

  /**
   * Post-migration validation - ensures migration was successful
   */
  async validatePostMigration(projectState: ProjectState): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      issues: [],
      warnings: [],
    };

    // Critical Issue #1: ParaModal Component Check
    const paraModalCheck = this.validateParaModalPresent(projectState);
    if (!paraModalCheck.valid) {
      result.valid = false;
      result.issues.push(...paraModalCheck.issues);
    }

    // Critical Issue #2: CSS Imports Check
    const cssCheck = this.validateParaCssImports(projectState);
    if (!cssCheck.valid) {
      result.valid = false;
      result.issues.push(...cssCheck.issues);
    }

    // Critical Issue #3: Environment Enum Check
    const envCheck = this.validateEnvironmentEnum(projectState);
    if (!envCheck.valid) {
      result.valid = false;
      result.issues.push(...envCheck.issues);
    }

    // Critical Issue #4: Old Dependencies Removed
    const oldDepsCheck = this.validateOldDependenciesRemoved(projectState);
    if (!oldDepsCheck.valid) {
      result.valid = false;
      result.issues.push(...oldDepsCheck.issues);
    }

    // Critical Issue #5: Para Dependencies Present
    const paraDepsCheck = this.validateParaDependenciesPresent(projectState);
    if (!paraDepsCheck.valid) {
      result.valid = false;
      result.issues.push(...paraDepsCheck.issues);
    }

    return result;
  }

  /**
   * Completion validation - final check that everything is working
   */
  async validateCompletion(projectState: ProjectState): Promise<ValidationResult> {
    const result: ValidationResult = {
      valid: true,
      issues: [],
      warnings: [],
    };

    // Check 1: No old imports remain
    const importsCheck = this.validateNoOldImports(projectState);
    if (!importsCheck.valid) {
      result.valid = false;
      result.issues.push(...importsCheck.issues);
    }

    // Check 2: Para hooks are properly used
    const hooksCheck = this.validateParaHooksUsage(projectState);
    if (!hooksCheck.valid) {
      result.valid = false;
      result.issues.push(...hooksCheck.issues);
    }

    // Check 3: Provider is properly configured
    const providerCheck = this.validateParaProviderConfig(projectState);
    if (!providerCheck.valid) {
      result.valid = false;
      result.issues.push(...providerCheck.issues);
    }

    return result;
  }

  // Pre-flight validation methods
  private checkMigratableContent(state: ProjectState): ValidationResult {
    const result: ValidationResult = { valid: true, issues: [], warnings: [] };

    const oldWalletDeps = Object.keys(state.dependencies).filter(
      (dep) =>
        dep.includes('privy') ||
        dep.includes('reown') ||
        dep.includes('web3modal') ||
        dep.includes('walletconnect')
    );

    if (oldWalletDeps.length === 0) {
      result.valid = false;
      result.issues.push({
        severity: 'critical',
        code: 'NO_MIGRATABLE_CONTENT',
        message: 'No wallet providers detected for migration',
        fix: 'Ensure the project uses Privy, ReOwn, Web3Modal, or WalletConnect',
      });
    }

    return result;
  }

  private checkProjectStructure(state: ProjectState): ValidationResult {
    const result: ValidationResult = { valid: true, issues: [], warnings: [] };

    if (state.entryPoints.length === 0) {
      result.valid = false;
      result.issues.push({
        severity: 'critical',
        code: 'NO_ENTRY_POINTS',
        message: 'No entry points detected (main.tsx, App.tsx, index.tsx)',
        fix: 'Ensure project has a valid React entry point',
      });
    }

    return result;
  }

  private checkForConflicts(state: ProjectState): ValidationResult {
    const result: ValidationResult = { valid: true, issues: [], warnings: [] };

    // Check if Para is already present
    const hasParaDep = Object.keys(state.dependencies).some((dep) => dep.includes('para'));
    if (hasParaDep) {
      result.warnings.push(
        'Para SDK already present - migration may overwrite existing configuration'
      );
    }

    return result;
  }

  // Post-migration validation methods (Critical Issues from real-world experience)
  private validateParaModalPresent(state: ProjectState): ValidationResult {
    const result: ValidationResult = { valid: true, issues: [], warnings: [] };

    // Check if ParaModal is imported and used in provider files
    const hasParaModalImport = state.imports.some(
      (imp) => imp.import.includes('ParaModal') && imp.from.includes('para')
    );

    if (!hasParaModalImport) {
      result.valid = false;
      result.issues.push({
        severity: 'critical',
        code: 'MISSING_PARA_MODAL',
        message: '❌ CRITICAL ISSUE #1: ParaModal component missing',
        fix: 'Add <ParaModal /> inside your <ParaProvider>. Import: import { ParaModal } from "@para-wallet/react"',
      });
    }

    return result;
  }

  private validateParaCssImports(state: ProjectState): ValidationResult {
    const result: ValidationResult = { valid: true, issues: [], warnings: [] };

    const hasParaCss = state.styles.some((style) => style.isParaStyle);

    if (!hasParaCss) {
      result.valid = false;
      result.issues.push({
        severity: 'critical',
        code: 'MISSING_PARA_CSS',
        message: '❌ CRITICAL ISSUE #2: Para SDK CSS not imported',
        fix: 'Add import "@para-wallet/react/styles.css" to your main entry point (main.tsx, layout.tsx, or _app.tsx)',
      });
    }

    return result;
  }

  private validateEnvironmentEnum(state: ProjectState): ValidationResult {
    const result: ValidationResult = { valid: true, issues: [], warnings: [] };

    // Check for string usage instead of Environment enum
    const hasStringEnv = state.providers.some(
      (provider) =>
        (provider.provider === 'ParaProvider' &&
          JSON.stringify(provider.props).includes('"development"')) ||
        JSON.stringify(provider.props).includes('"production"')
    );

    if (hasStringEnv) {
      result.valid = false;
      result.issues.push({
        severity: 'critical',
        code: 'STRING_ENVIRONMENT',
        message: '❌ CRITICAL ISSUE #3: Using string instead of Environment enum',
        fix: 'Import Environment from "@para-wallet/core" and use Environment.DEVELOPMENT instead of "development"',
      });
    }

    return result;
  }

  private validateOldDependenciesRemoved(state: ProjectState): ValidationResult {
    const result: ValidationResult = { valid: true, issues: [], warnings: [] };

    const oldDeps = Object.keys(state.dependencies).filter(
      (dep) => dep.includes('privy') || dep.includes('reown') || dep.includes('web3modal')
    );

    if (oldDeps.length > 0) {
      result.valid = false;
      result.issues.push({
        severity: 'critical',
        code: 'OLD_DEPENDENCIES_PRESENT',
        message: `❌ CRITICAL ISSUE #4: Old wallet dependencies still present: ${oldDeps.join(', ')}`,
        fix: `Run: npm uninstall ${oldDeps.join(' ')}`,
      });
    }

    return result;
  }

  private validateParaDependenciesPresent(state: ProjectState): ValidationResult {
    const result: ValidationResult = { valid: true, issues: [], warnings: [] };

    const hasParaDep = Object.keys(state.dependencies).some((dep) => dep.includes('para'));

    if (!hasParaDep) {
      result.valid = false;
      result.issues.push({
        severity: 'critical',
        code: 'MISSING_PARA_DEPENDENCY',
        message: '❌ CRITICAL ISSUE #5: Para SDK dependency missing',
        fix: 'Run: npm install @para-wallet/react',
      });
    }

    return result;
  }

  // Completion validation methods
  private validateNoOldImports(state: ProjectState): ValidationResult {
    const result: ValidationResult = { valid: true, issues: [], warnings: [] };

    const oldImports = state.imports.filter(
      (imp) => imp.type === 'privy' || imp.type === 'reown' || imp.type === 'web3modal'
    );

    if (oldImports.length > 0) {
      result.valid = false;
      oldImports.forEach((imp) => {
        result.issues.push({
          severity: 'critical',
          code: 'OLD_IMPORT_PRESENT',
          message: `Old wallet import detected: ${imp.import} in ${imp.file}:${imp.line}`,
          file: imp.file,
          line: imp.line,
          fix: 'Replace with Para SDK equivalent import',
        });
      });
    }

    return result;
  }

  private validateParaHooksUsage(state: ProjectState): ValidationResult {
    const result: ValidationResult = { valid: true, issues: [], warnings: [] };

    const paraHooks = state.hooks.filter((hook) => hook.from.includes('para'));

    if (paraHooks.length === 0) {
      result.warnings.push('No Para hooks detected - ensure Para hooks are being used');
    }

    return result;
  }

  private validateParaProviderConfig(state: ProjectState): ValidationResult {
    const result: ValidationResult = { valid: true, issues: [], warnings: [] };

    const paraProviders = state.providers.filter((p) => p.provider === 'ParaProvider');

    if (paraProviders.length === 0) {
      result.valid = false;
      result.issues.push({
        severity: 'critical',
        code: 'NO_PARA_PROVIDER',
        message: 'No ParaProvider detected',
        fix: 'Replace old wallet provider with ParaProvider',
      });
    } else if (paraProviders.length > 1) {
      result.warnings.push('Multiple ParaProviders detected - ensure only one is active');
    }

    return result;
  }

  /**
   * Calculate migration success percentage
   */
  calculateMigrationSuccess(state: ProjectState): number {
    let score = 0;
    const maxScore = 100;

    // Dependencies (30 points)
    const hasParaDep = Object.keys(state.dependencies).some((dep) => dep.includes('para'));
    const hasOldDeps = Object.keys(state.dependencies).some(
      (dep) => dep.includes('privy') || dep.includes('reown') || dep.includes('web3modal')
    );

    if (hasParaDep) score += 15;
    if (!hasOldDeps) score += 15;

    // Imports (25 points)
    const hasParaImports = state.imports.some((imp) => imp.from.includes('para'));
    const hasOldImports = state.imports.some(
      (imp) => imp.type === 'privy' || imp.type === 'reown' || imp.type === 'web3modal'
    );

    if (hasParaImports) score += 15;
    if (!hasOldImports) score += 10;

    // Provider (25 points)
    const hasParaProvider = state.providers.some((p) => p.provider === 'ParaProvider');
    const hasParaModal = state.imports.some((imp) => imp.import.includes('ParaModal'));

    if (hasParaProvider) score += 15;
    if (hasParaModal) score += 10;

    // CSS (10 points)
    const hasParaCss = state.styles.some((style) => style.isParaStyle);
    if (hasParaCss) score += 10;

    // Hooks (10 points)
    const hasParaHooks = state.hooks.some((hook) => hook.from.includes('para'));
    if (hasParaHooks) score += 10;

    return Math.round((score / maxScore) * 100);
  }
}
