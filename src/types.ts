import { z } from 'zod';

// Migration configuration schema
export const MigrationConfigSchema = z.object({
  paraApiKey: z.string().min(1, 'Para API key is required'),
  environment: z.enum(['development', 'production']).default('development'),
  supportedChains: z.array(z.number()).default([1]), // Ethereum mainnet by default
  wallets: z.array(z.enum(['METAMASK', 'COINBASE', 'WALLETCONNECT', 'RAINBOW'])).default(['METAMASK', 'COINBASE', 'WALLETCONNECT']),
});

export type MigrationConfig = z.infer<typeof MigrationConfigSchema>;

// Wallet connection schema
export const WalletConnectionSchema = z.object({
  address: z.string().regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  chainId: z.number(),
  connector: z.string(),
});

export type WalletConnection = z.infer<typeof WalletConnectionSchema>;

// Asset information schema
export const AssetSchema = z.object({
  contractAddress: z.string().optional(),
  tokenId: z.string().optional(),
  amount: z.string(),
  decimals: z.number().default(18),
  symbol: z.string(),
  type: z.enum(['native', 'erc20', 'erc721', 'erc1155']),
});

export type Asset = z.infer<typeof AssetSchema>;

// Migration step result schema
export const MigrationStepResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
});

export type MigrationStepResult = z.infer<typeof MigrationStepResultSchema>;

// Migration report schema
export const MigrationReportSchema = z.object({
  timestamp: z.string(),
  fromProvider: z.string(),
  toProvider: z.string(),
  walletAddress: z.string().optional(),
  steps: z.array(z.object({
    step: z.string(),
    result: MigrationStepResultSchema,
  })),
  overall: z.object({
    success: z.boolean(),
    totalSteps: z.number(),
    completedSteps: z.number(),
    failedSteps: z.number(),
  }),
});

export type MigrationReport = z.infer<typeof MigrationReportSchema>;