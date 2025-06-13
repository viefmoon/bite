#!/usr/bin/env node

// Simple health check script to verify the service can start
const http = require('http');

const port = process.env.PORT || 5000;
const healthPath = '/api/sync/health';

console.log(`Attempting to connect to http://localhost:${port}${healthPath}`);

const checkHealth = () => {
  const options = {
    hostname: 'localhost',
    port: port,
    path: healthPath,
    method: 'GET',
    timeout: 5000
  };

  const req = http.request(options, (res) => {
    console.log(`Health check response: ${res.statusCode}`);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log('Response body:', data);
      process.exit(res.statusCode === 200 ? 0 : 1);
    });
  });

  req.on('error', (e) => {
    console.error(`Health check failed: ${e.message}`);
    process.exit(1);
  });

  req.on('timeout', () => {
    console.error('Health check timed out');
    req.destroy();
    process.exit(1);
  });

  req.end();
};

// Wait a bit for the service to start
setTimeout(checkHealth, 3000);