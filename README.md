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

## Quick Start

1. **Clone and install dependencies**:
   ```bash
   git clone <repository-url>
   cd cloudflare-ddns
   npm install
   ```

2. **Set up your environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Configure your settings** in `.env`:
   ```env
   CLOUDFLARE_API_TOKEN=your_api_token_here
   DOMAIN=example.com
   RECORD_NAME=home.example.com
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
- `RECORD_NAME`: The DNS record to update (e.g., `home.example.com` or `@` for root)

### Optional Environment Variables

- `TTL`: DNS record TTL in seconds (default: 1 for automatic)
- `CHECK_INTERVAL`: How often to check for IP changes in seconds (default: 300)
- `LOG_LEVEL`: Logging level - ERROR, WARN, INFO, DEBUG (default: INFO)

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

### Run Once
```bash
npm run dev -- --once
```

### Run Continuously
```bash
npm start
```

### Build and Run Production
```bash
npm run build
node dist/index.js
```

## How It Works

1. **IP Detection**: Checks your current public IP using multiple reliable services
2. **DNS Lookup**: Retrieves your current DNS record from Cloudflare
3. **Comparison**: Only updates if the IP has actually changed
4. **Update**: Creates or updates the DNS record with the new IP
5. **Repeat**: Continues monitoring at the configured interval

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

### Debug Mode

Set `LOG_LEVEL=DEBUG` for detailed API interactions and troubleshooting information.

## License

MIT License - see LICENSE file for details.