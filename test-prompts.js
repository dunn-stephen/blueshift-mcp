#!/usr/bin/env node

const { spawn } = require('child_process');

// Test script to verify MCP server prompts
async function testMCPServer() {
  console.log('Testing Blueshift MCP Server prompts...\n');
  
  const server = spawn('node', ['dist/index.js'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  // Capture stderr for logs
  server.stderr.on('data', (data) => {
    console.log('Server log:', data.toString().trim());
  });

  // Send list prompts request
  const listPromptsRequest = JSON.stringify({
    jsonrpc: "2.0",
    id: 1,
    method: "prompts/list"
  }) + '\n';

  console.log('Sending prompts/list request...');
  server.stdin.write(listPromptsRequest);

  // Listen for response
  server.stdout.on('data', (data) => {
    try {
      const response = JSON.parse(data.toString());
      console.log('\nResponse received:');
      console.log(JSON.stringify(response, null, 2));
      
      if (response.result && response.result.prompts) {
        console.log(`\nFound ${response.result.prompts.length} prompts:`);
        response.result.prompts.forEach((prompt, i) => {
          console.log(`${i + 1}. ${prompt.name} - ${prompt.description}`);
        });
      }
    } catch (e) {
      console.log('Raw output:', data.toString());
    }
  });

  // Give it time to respond then exit
  setTimeout(() => {
    console.log('\nTest complete. Shutting down server...');
    server.kill();
    process.exit(0);
  }, 2000);
}

testMCPServer().catch(console.error);