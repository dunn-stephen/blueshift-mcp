# Blueshift MCP Server

A Model Context Protocol (MCP) server that provides a unified interface for interacting with multiple Blueshift accounts through Claude Desktop.

## Features

- **Multi-Account Support**: Manage multiple Blueshift sites with automatic API key routing
- **Complete API Coverage**: Support for all major Blueshift API endpoints
- **Intelligent Site Matching**: Flexible site name matching with partial search
- **Regional Support**: Automatic routing to US or EU API endpoints
- **Error Handling**: Clear error messages and authentication failure detection
- **Type Safety**: Full TypeScript implementation with proper type definitions

## Installation

### Prerequisites

- Node.js 18+ 
- Claude Desktop
- Blueshift API credentials (User and Event API keys)

### Setup Steps

1. **Clone and build the project:**
```bash
git clone <repository-url>
cd blueshift-mcp-server
npm install
npm run build
```

2. **Create your accounts configuration:**

Create `accounts.json` with your Blueshift credentials:
```json
{
  "accounts": {
    "demo.acme.com": {
      "site": "demo.acme.com",
      "userApiKey": "your_user_api_key",
      "eventApiKey": "your_event_api_key"
    },
    "prod.acme.com": {
      "site": "prod.acme.com", 
      "userApiKey": "your_user_api_key",
      "eventApiKey": "your_event_api_key",
      "region": "eu"
    }
  },
  "defaultAccount": "demo.acme.com"
}
```

3. **Configure Claude Desktop:**

Add to your Claude Desktop configuration:

**macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "blueshift": {
      "command": "node",
      "args": ["/absolute/path/to/blueshift-mcp-server/dist/index.js"],
      "env": {
        "BLUESHIFT_ACCOUNTS_CONFIG": "/absolute/path/to/accounts.json",
        "DEBUG": "false"
      }
    }
  }
}
```

4. **Restart Claude Desktop** to load the MCP server.

## Usage

### Account Management

```
# List all configured accounts
"List all Blueshift accounts"

# The server will show available sites and the default account
```

### Customer Operations

```
# Create/update customer
"Create a customer with email john@example.com, first name John, last name Doe"

# Search for customer
"Search for customer with email john@example.com"

# Delete customer (GDPR)
"Delete all data for customer john@example.com"

# Merge duplicate profiles
"Merge customer ID old123 into customer ID new456"
```

### Event Tracking

```
# Track purchase event
"Track a purchase event for john@example.com with order value $99.99 and order ID 12345"

# Track custom event
"Track a newsletter_signup event for jane@example.com with source homepage"

# Bulk event tracking
"Track bulk events: purchase for john@example.com amount $50, view for jane@example.com product_id ABC123"
```

### Campaign Management

```
# Trigger a campaign
"Execute campaign UUID abc-123-def for customer john@example.com"

# List campaigns
"List all active email campaigns"

# Get campaign details
"Get detailed stats for campaign UUID abc-123-def"
```

### Templates

```
# List email templates
"List all email templates"

# Send test email
"Send test email using template UUID xyz-789 to test@example.com"

# Create SMS template
"Create SMS template named 'Order Confirmation' with message 'Your order {order_id} is confirmed'"
```

### Working with Multiple Sites

```
# Specify site explicitly
"Create customer john@example.com in demo.acme.com"

# Use partial matching (if unique)
"List campaigns in acme"  # Works if only one site contains 'acme'

# Default site is used when not specified
"Track purchase event for john@example.com"  # Uses defaultAccount
```

## API Endpoints Supported

### Campaign Management
- Execute campaigns
- Bulk execute campaigns  
- List campaigns
- Get campaign details

### Customer Management
- Create/update customers
- Search customers
- Get customer by UUID
- Bulk update customers
- Delete customer (GDPR)
- Forget/unforget customer
- Merge customers

### Event Tracking
- Send single event
- Send bulk events
- Get recent event
- Get event summary

### Catalog Management
- Create catalog
- List catalogs
- Add catalog items

### Segments
- List segments
- Get segment users

### Templates
- Email templates (list, create, test)
- SMS templates (list, create, test)
- Push templates (list, create, test)

### Custom User Lists
- Create user list
- Add users to list
- Bulk add users
- Get seed lists

### Other Features
- Live content recommendations
- List adapters
- List tags
- Get customer event history

## Development

### Running Tests
```bash
npm test
```

### Debug Mode
Enable debug logging by setting `DEBUG=true` in your Claude Desktop config.

### Building from Source
```bash
npm run build
```

## Troubleshooting

### Server Won't Start
- Check that `accounts.json` exists at the specified path
- Verify the JSON syntax is valid
- Ensure all required API keys are present

### Authentication Errors
- Verify your API keys are correct
- Check that User API Key is used for management operations
- Check that Event API Key is used for event tracking

### Multiple Site Matches
Be more specific with site names when you have similar names:
```
"... in demo.acme.com"  # Instead of "... in demo"
```

## License

MIT