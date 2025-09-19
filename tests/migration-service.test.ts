import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { promises as fs } from 'fs';
import { MigrationService } from '../src/services/migration-service.js';

// Mock fs module
jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    readdir: jest.fn(),
    access: jest.fn(),
  },
}));

const mockFs = fs as jest.Mocked<typeof fs>;

describe('MigrationService', () => {
  let migrationService: MigrationService;

  beforeEach(() => {
    migrationService = new MigrationService();
    jest.clearAllMocks();
  });

  describe('analyzeProject', () => {
    it('should analyze a project with ReOwn packages', async () => {
      const mockPackageJson = {
        dependencies: {
          '@web3modal/wagmi': '^3.5.7',
          'wagmi': '^1.4.12',
          'react': '^18.0.0',
        },
        devDependencies: {
          'typescript': '^5.0.0',
        },
      };

      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(mockPackageJson));
      mockFs.readdir.mockResolvedValue([]);

      const result = await migrationService.analyzeProject('/test/project');

      expect(result.content[0].text).toContain('@web3modal/wagmi');
      expect(result.content[0].text).toContain('totalPackagesToMigrate');
    });

    it('should handle projects without Web3 packages', async () => {
      const mockPackageJson = {
        dependencies: {
          'react': '^18.0.0',
          'typescript': '^5.0.0',
        },
      };

      mockFs.readFile.mockResolvedValueOnce(JSON.stringify(mockPackageJson));
      mockFs.readdir.mockResolvedValue([]);

      const result = await migrationService.analyzeProject('/test/project');

      expect(result.content[0].text).toContain('totalPackagesToMigrate": 0');
    });
  });

  describe('generateMigrationConfig', () => {
    it('should generate valid migration configuration', async () => {
      const config = {
        paraApiKey: 'test-api-key',
        environment: 'development' as const,
        supportedChains: [1, 137],
        wallets: ['METAMASK', 'COINBASE'] as const,
      };

      const result = await migrationService.generateMigrationConfig(config);
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.migrationConfig.paraApiKey).toBe('test-api-key');
      expect(parsedResult.migrationConfig.environment).toBe('development');
      expect(parsedResult.migrationSteps).toHaveLength(3);
    });

    it('should reject invalid configuration', async () => {
      const invalidConfig = {
        paraApiKey: '', // Invalid: empty API key
        environment: 'development' as const,
        supportedChains: [1],
        wallets: ['METAMASK'] as const,
      };

      await expect(
        migrationService.generateMigrationConfig(invalidConfig)
      ).rejects.toThrow();
    });
  });

  describe('createMigrationGuide', () => {
    it('should create a migration guide', async () => {
      const result = await migrationService.createMigrationGuide('Test Project');
      const parsedResult = JSON.parse(result.content[0].text);

      expect(parsedResult.projectName).toBe('Test Project');
      expect(parsedResult.migrationGuide.overview).toContain('migration guide');
      expect(parsedResult.migrationGuide.steps).toHaveLength(5);
    });

    it('should include project-specific configuration', async () => {
      const targetConfig = {
        paraApiKey: 'test-key',
        environment: 'production',
      };

      const result = await migrationService.createMigrationGuide(
        'Test Project',
        {},
        targetConfig
      );

      expect(result.content[0].text).toContain('Test Project');
    });
  });
});

describe('MigrationService Integration', () => {
  let migrationService: MigrationService;

  beforeEach(() => {
    migrationService = new MigrationService();
  });

  it('should handle complete migration workflow', async () => {
    // Mock a typical Web3 project structure
    const mockPackageJson = {
      dependencies: {
        '@web3modal/wagmi': '^3.5.7',
        'wagmi': '^1.4.12',
        'viem': '^1.19.11',
      },
    };

    mockFs.readFile.mockResolvedValueOnce(JSON.stringify(mockPackageJson));
    mockFs.readdir.mockResolvedValue([]);

    // Analyze project
    const analysis = await migrationService.analyzeProject('/test/project');
    const analysisResult = JSON.parse(analysis.content[0].text);

    expect(analysisResult.analysis.packageJsonAnalysis.reownPackages).toContain('@web3modal/wagmi');
    expect(analysisResult.analysis.migrationComplexity).toBeDefined();

    // Generate configuration
    const config = {
      paraApiKey: 'test-api-key',
      environment: 'development' as const,
      supportedChains: [1],
      wallets: ['METAMASK'] as const,
    };

    const migrationConfig = await migrationService.generateMigrationConfig(config);
    const configResult = JSON.parse(migrationConfig.content[0].text);

    expect(configResult.migrationConfig.paraApiKey).toBe('test-api-key');
    expect(configResult.migrationSteps).toHaveLength(3);

    // Create migration guide
    const guide = await migrationService.createMigrationGuide(
      'Test Project',
      analysisResult.analysis,
      configResult.migrationConfig
    );

    const guideResult = JSON.parse(guide.content[0].text);
    expect(guideResult.migrationGuide.steps).toHaveLength(5);
  });
});