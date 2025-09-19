# Using the MCP Server with Claude Code

This guide shows how to use the ReOwn to Para migration MCP server with Claude Code.

## Setup

1. **Install the MCP server**
   ```bash
   git clone <repository>
   cd mcp-reown-para-migration
   npm install
   npm run build
   ```

2. **Configure Claude Code to use the MCP server**
   Add to your Claude Code configuration:
   ```json
   {
     "mcpServers": {
       "reown-para-migration": {
         "command": "node",
         "args": ["/path/to/mcp-reown-para-migration/dist/index.js"],
         "env": {}
       }
     }
   }
   ```

## Example Usage Session

### Step 1: Analyze Your Project

**You:** "Help me migrate my React app from ReOwn to Para. First, analyze my project at `/Users/dev/my-web3-app`"

**Claude with MCP:**
```typescript
// Claude will use the analyze_project tool
{
  "tool": "analyze_project",
  "arguments": {
    "projectPath": "/Users/dev/my-web3-app"
  }
}
```

**Result:** Claude receives detailed analysis of your project including:
- Which ReOwn/WalletConnect packages are installed
- Usage patterns in your source code
- Migration complexity assessment
- Specific recommendations

### Step 2: Generate Migration Configuration

**You:** "Generate a Para configuration for development with support for Ethereum mainnet and Polygon"

**Claude with MCP:**
```typescript
{
  "tool": "generate_migration_config",
  "arguments": {
    "paraApiKey": "your-para-api-key",
    "environment": "development",
    "supportedChains": [1, 137],
    "wallets": ["METAMASK", "COINBASE", "WALLETCONNECT"]
  }
}
```

**Result:** Claude provides complete migration configuration and step-by-step instructions.

### Step 3: Generate Provider Component

**You:** "Create a TypeScript provider component for Para"

**Claude with MCP:**
```typescript
{
  "tool": "generate_provider_component",
  "arguments": {
    "config": {
      "paraApiKey": "your-para-api-key",
      "environment": "development",
      "supportedChains": [1, 137],
      "wallets": ["METAMASK", "COINBASE", "WALLETCONNECT"]
    },
    "typescript": true
  }
}
```

**Result:** Claude generates a complete React provider component with TypeScript types.

### Step 4: Generate Connect Button

**You:** "Create a connect button component with Tailwind CSS styling"

**Claude with MCP:**
```typescript
{
  "tool": "generate_connect_button",
  "arguments": {
    "typescript": true,
    "styling": "tailwind"
  }
}
```

**Result:** Claude creates a fully styled connect button component with TypeScript.

### Step 5: Validate Migration

**You:** "Validate my migration setup and check for issues"

**Claude with MCP:**
```typescript
{
  "tool": "validate_migration",
  "arguments": {
    "projectPath": "/Users/dev/my-web3-app",
    "config": {
      "paraApiKey": "your-para-api-key",
      "environment": "development",
      "supportedChains": [1, 137],
      "wallets": ["METAMASK", "COINBASE", "WALLETCONNECT"]
    }
  }
}
```

**Result:** Claude provides validation results and recommendations for fixing any issues.

### Step 6: Check Wagmi Compatibility

**You:** "Check if my existing Wagmi hooks will work with Para"

**Claude with MCP:**
```typescript
{
  "tool": "check_compatibility",
  "arguments": {
    "projectPath": "/Users/dev/my-web3-app"
  }
}
```

**Result:** Claude analyzes your Wagmi hook usage and confirms compatibility (spoiler: they all work!).

### Step 7: Create Migration Guide

**You:** "Create a complete migration guide for my project"

**Claude with MCP:**
```typescript
{
  "tool": "create_migration_guide",
  "arguments": {
    "projectName": "My Web3 App",
    "currentSetup": {
      "packages": ["@web3modal/wagmi"],
      "chains": [1, 137]
    },
    "targetConfig": {
      "paraApiKey": "your-para-api-key",
      "environment": "development"
    }
  }
}
```

**Result:** Claude creates a comprehensive, project-specific migration guide.

## Common Conversation Flows

### Quick Migration
**You:** "I want to migrate my Web3 app from ReOwn to Para. My project is at `/path/to/project` and I have a Para API key `para_123abc`"

Claude will:
1. Analyze your project
2. Generate migration config
3. Create provider and button components
4. Validate everything
5. Provide step-by-step instructions

### Debugging Migration Issues
**You:** "My Para migration isn't working. Can you help debug?"

Claude will:
1. Validate your current setup
2. Check for common issues
3. Verify Wagmi compatibility
4. Provide specific fixes

### Understanding Para Benefits
**You:** "Why should I migrate to Para? What are the benefits?"

Claude will explain:
- Universal embedded wallet support
- Better user experience
- Continued Wagmi compatibility
- Enhanced mobile support

## Tips for Best Results

1. **Provide your project path** for accurate analysis
2. **Have your Para API key ready** for complete setup
3. **Specify your requirements** (chains, wallets, styling preferences)
4. **Ask for validation** to catch issues early
5. **Request step-by-step guides** for complex migrations

## Troubleshooting

**Issue:** "Claude says it can't find the MCP server"
**Solution:** Verify the MCP server is properly configured in your Claude Code settings and the build was successful.

**Issue:** "Migration validation fails"
**Solution:** Ask Claude to run detailed validation and follow the provided recommendations.

**Issue:** "Generated code doesn't match my project structure"
**Solution:** Provide more context about your project structure and ask Claude to customize the output.