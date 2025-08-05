# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Build**: `npm run build` - Compiles TypeScript to JavaScript in `dist/` directory
- **Development**: `npm run dev` - Runs the service directly with ts-node
- **Production**: `npm start` - Builds and runs the compiled JavaScript
- **Single run**: `npm run dev -- --once` - Executes one DDNS update and exits

## Architecture Overview

This is a TypeScript-based Cloudflare DDNS service that automatically updates DNS records when public IP addresses change.

### Core Components

- **Entry Point** (`src/index.ts`): Main CLI application with argument parsing and error handling
- **Configuration** (`src/config.ts`): Environment variable management with validation via `ConfigManager` class
- **Scheduler** (`src/scheduler.ts`): Handles periodic updates and signal management via `DDNSScheduler` class
- **DDNS Core** (`src/cloudflare-ddns.ts`): Main business logic for Cloudflare API interactions via `CloudflareDDNS` class
- **IP Detection** (`src/ip-service.ts`): Multi-provider IP detection with fallback via `IPService` class
- **Logging** (`src/logger.ts`): Structured logging with configurable levels via `Logger` class
- **Types** (`src/types.ts`): TypeScript interfaces for all data structures

### Configuration

The service uses environment variables loaded via dotenv:

**Required**:
- `CLOUDFLARE_API_TOKEN`: API token with Zone:Read and DNS:Edit permissions
- `DOMAIN`: Root domain (e.g., `example.com`)
- `RECORD_NAME`: DNS record to update (e.g., `subdomain.example.com`)

**Optional**:
- `TTL`: DNS record TTL in seconds (default: 1)
- `CHECK_INTERVAL`: Update interval in seconds (default: 300)
- `LOG_LEVEL`: ERROR, WARN, INFO, DEBUG (default: INFO)

### Service Flow

1. **Initialization**: Load and validate configuration from environment variables
2. **IP Detection**: Query multiple IP services with fallback handling
3. **Zone Resolution**: Get Cloudflare zone ID for the domain
4. **Record Management**: Check existing DNS record, compare with current IP
5. **Update Logic**: Only update DNS when IP actually changes
6. **Scheduling**: Run continuously with configurable intervals or once with `--once` flag

### Key Classes

- `ConfigManager`: Static methods for loading/validating environment configuration
- `DDNSScheduler`: Manages periodic execution and graceful shutdown
- `CloudflareDDNS`: Handles all Cloudflare API operations (zones, DNS records)
- `IPService`: Provides current public IP with multiple service fallbacks
- `Logger`: Structured logging with timestamp and level filtering

### Error Handling

The service includes comprehensive error handling with:
- API response validation for all Cloudflare operations
- Fallback IP detection across multiple services
- Graceful degradation and detailed error messages
- Process signal handling for clean shutdown

### Dependencies

- `axios`: HTTP client for API calls
- `dotenv`: Environment variable loading
- TypeScript development stack with `ts-node` for development