#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ListResourcesRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { AccountManager } from './account-manager';
import { createAllTools } from './tools';
import { handleToolExecution } from './tools/handlers';
import { Logger } from './utils/logger';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
// Suppress dotenv output by temporarily redirecting stdout
const originalWrite = process.stdout.write;
process.stdout.write = () => true;
dotenv.config();
process.stdout.write = originalWrite;

// Server metadata
const SERVER_NAME = 'blueshift-mcp';
const SERVER_VERSION = '1.0.0';
const SERVER_DESCRIPTION = 'MCP server for Blueshift API integration with multi-account support';

async function main() {
  try {
    // Get configuration path
    const configPath = process.env.BLUESHIFT_ACCOUNTS_CONFIG || 
                      path.join(process.cwd(), 'accounts.json');
    
    Logger.info(`Starting ${SERVER_NAME} v${SERVER_VERSION}`);
    Logger.info(`Loading configuration from: ${configPath}`);
    
    // Initialize account manager
    const accountManager = new AccountManager(configPath);
    
    // Create MCP server
    const server = new Server(
      {
        name: SERVER_NAME,
        version: SERVER_VERSION,
        description: SERVER_DESCRIPTION
      },
      {
        capabilities: {
          tools: {},
          resources: {}
        }
      }
    );
    
    // Create all tools
    const tools = createAllTools(accountManager);
    Logger.info(`Loaded ${tools.length} tools`);
    
    // Handle list tools request
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      return { tools };
    });
    
    // Handle list resources request (return empty array)
    server.setRequestHandler(ListResourcesRequestSchema, async () => {
      return { resources: [] };
    });
    
    // Handle tool execution
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        const result = await handleToolExecution(accountManager, name, args || {});
        
        // Add metadata to response
        const response = {
          ...result,
          _metadata: {
            tool: name,
            site: args?.site || accountManager.getDefaultAccount(),
            timestamp: new Date().toISOString()
          }
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(response, null, 2)
            }
          ]
        };
      } catch (error: any) {
        Logger.error(`Tool execution failed: ${name}`, error);
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                error: error.message,
                tool: name,
                site: args?.site
              }, null, 2)
            }
          ],
          isError: true
        };
      }
    });
    
    // Start server
    const transport = new StdioServerTransport();
    await server.connect(transport);
    
    Logger.info('Server started successfully');
    
    // Handle shutdown
    process.on('SIGINT', () => {
      Logger.info('Shutting down server');
      process.exit(0);
    });
    
  } catch (error) {
    Logger.error('Failed to start server', error);
    // Don't use console.error as it might interfere with MCP protocol
    // The Logger.error above will still log to stderr
    process.exit(1);
  }
}

// Run the server
main();