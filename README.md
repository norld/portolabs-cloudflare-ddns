# Cloudflare DDNS Service

Automatically update your Cloudflare DNS records when your public IP address changes. Perfect for home servers, self-hosted services, or any scenario where you need dynamic DNS functionality with Cloudflare.

## Features

- 🚀 Automatic IP detection from multiple sources
- 🔄 Configurable check intervals
- 🛡️ TypeScript for type safety
- 📊 Comprehensive logging
- ⚡ Efficient - only updates when IP actually changes
- 🔧 Easy configuration via environment variables
- 💾 Supports both continuous monitoring and one-time updates
- 🔍 Auto-discovery mode for pattern-based DNS record management
- 📦 Bulk operations for multiple DNS records

## Quick Start

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd portolabs-cloudflare-ddns
   npm install
   ```

2. **Set up your environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Configure your settings** in `.env`:
   
   **Option A - Specific Records:**
   ```env
   CLOUDFLARE_API_TOKEN=your_api_token_here
   DOMAIN=example.com
   RECORD_NAMES=home.example.com,server.example.com
   TTL=1
   CHECK_INTERVAL=300
   ```
   
   **Option B - Auto-Discovery Mode:**
   ```env
   CLOUDFLARE_API_TOKEN=your_api_token_here
   DOMAIN=example.com
   AUTO_DISCOVER_LOCAL=true
   DNS_PATTERN=local
   TTL=1
   CHECK_INTERVAL=300
   ```

4. **Run the service**:
   ```bash
   # Run once
   npm run dev -- --once
   
   # Run continuously
   npm start
   ```

## Configuration

### Required Environment Variables

- `CLOUDFLARE_API_TOKEN`: Your Cloudflare API token with Zone:Read and DNS:Edit permissions
- `DOMAIN`: Your root domain (e.g., `example.com`)
- `RECORD_NAMES`: Comma-separated DNS records to update (e.g., `home.example.com,server.example.com`) - **Required unless AUTO_DISCOVER_LOCAL is enabled**

### Optional Environment Variables

- `TTL`: DNS record TTL in seconds (default: 1 for automatic)
- `CHECK_INTERVAL`: How often to check for IP changes in seconds (default: 300)
- `LOG_LEVEL`: Logging level - ERROR, WARN, INFO, DEBUG (default: INFO)
- `AUTO_DISCOVER_LOCAL`: Enable auto-discovery mode (default: false)
- `DNS_PATTERN`: Pattern to match when auto-discovery is enabled (default: local)
- `NEW_SUBDOMAIN_PATTERN`: New pattern for renaming operations (optional)

### Creating a Cloudflare API Token

1. Go to [Cloudflare API Tokens](https://dash.cloudflare.com/profile/api-tokens)
2. Click "Create Token"
3. Use the "Custom token" template
4. Set permissions:
   - Zone:Read for your domain zone
   - DNS:Edit for your domain zone
5. Add zone resources for your specific domain
6. Copy the token to your `.env` file

## Usage

### Basic Operations

```bash
# Run once to update records
npm run dev -- --once

# Run continuously
npm start

# Build and run production
npm run build
node dist/index.js
```

### Advanced Operations

```bash
# Rename all DNS records matching your pattern
# (requires NEW_SUBDOMAIN_PATTERN in .env)
npm run dev -- --rename-local
```

## How It Works

### Standard Mode
1. **IP Detection**: Checks your current public IP using multiple reliable services
2. **DNS Lookup**: Retrieves specified DNS records from Cloudflare
3. **Comparison**: Only updates if the IP has actually changed
4. **Update**: Creates or updates the DNS records with the new IP
5. **Repeat**: Continues monitoring at the configured interval

### Auto-Discovery Mode
1. **Pattern Matching**: Automatically discovers all DNS records matching your specified pattern (e.g., `local.*`)
2. **Bulk Processing**: Updates all matching records simultaneously
3. **Dynamic Management**: No need to manually specify record names

## Configuration Examples

### Example 1: Single Record
```env
CLOUDFLARE_API_TOKEN=your_token
DOMAIN=example.com
RECORD_NAMES=home.example.com
```

### Example 2: Multiple Specific Records
```env
CLOUDFLARE_API_TOKEN=your_token
DOMAIN=example.com
RECORD_NAMES=home.example.com,server.example.com,api.example.com
```

### Example 3: Auto-Discovery for Local Development
```env
CLOUDFLARE_API_TOKEN=your_token
DOMAIN=example.com
AUTO_DISCOVER_LOCAL=true
DNS_PATTERN=local
```
This will automatically find and update all `local.*` records like:
- `local.project.example.com`
- `local.api.example.com`
- `local.web.example.com`

### Example 4: Auto-Discovery for Staging Environment
```env
CLOUDFLARE_API_TOKEN=your_token
DOMAIN=example.com
AUTO_DISCOVER_LOCAL=true
DNS_PATTERN=staging
```
This will automatically find and update all `staging.*` records.

## Logging

The service provides detailed logging with timestamps:

- ✅ Successful updates with old and new IP
- ℹ️ No-change notifications
- ❌ Error messages with details
- 📋 Configuration summary on startup

## Docker Support

You can also run this service in Docker:

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist/ ./dist/
CMD ["node", "dist/index.js"]
```

## Troubleshooting

### Common Issues

1. **"Zone not found"** - Check your `DOMAIN` setting matches exactly
2. **"Authentication failed"** - Verify your API token has correct permissions
3. **"Record not found"** - The service will create the record if it doesn't exist
4. **Rate limiting** - Cloudflare has rate limits; default 5-minute interval should be safe
5. **"No records found"** - In auto-discovery mode, check your DNS_PATTERN matches existing records
6. **Pattern matching issues** - DNS_PATTERN is case-insensitive and matches from the start of the record name

### Debug Mode

Set `LOG_LEVEL=DEBUG` for detailed API interactions and troubleshooting information.

## License

MIT License - see LICENSE file for details.