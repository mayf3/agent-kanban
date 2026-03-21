#!/usr/bin/env node

/**
 * Agent Monitor Service
 * 
 * Real-time monitoring service for OpenClaw agent sessions.
 * Provides REST API and WebSocket updates.
 */

const express = require('express');
const { Server } = require('ws');
const { exec } = require('child_process');
const cors = require('cors');
const path = require('path');

const HTTP_PORT = 3000;
const WS_PORT = 3001;
const POLL_INTERVAL = 10000; // 10 seconds

// State
let currentState = {
  sessions: [],
  summary: {
    total: 0,
    active: 0,
    agents: 0,
    byType: {},
    byModel: {},
    lastUpdate: null
  }
};

// Express App
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Execute openclaw command and parse JSON output
 */
function fetchSessions() {
  return new Promise((resolve, reject) => {
    exec('openclaw sessions list --json --limit 50', (error, stdout, stderr) => {
      if (error) {
        console.error('Error executing openclaw command:', error.message);
        return reject(error);
      }
      if (stderr) {
        console.error('stderr:', stderr);
        return reject(new Error(stderr));
      }
      try {
        const data = JSON.parse(stdout);
        resolve(data);
      } catch (e) {
        console.error('Error parsing JSON:', e.message);
        reject(e);
      }
    });
  });
}

/**
 * Calculate summary statistics
 */
function calculateSummary(sessions) {
  const agentSet = new Set();
  const byType = {};
  const byModel = {};
  let active = 0;

  sessions.forEach(session => {
    // Count unique agents
    if (session.agent) {
      agentSet.add(session.agent);
    }

    // Count by type
    const type = session.type || 'unknown';
    byType[type] = (byType[type] || 0) + 1;

    // Count by model
    const model = session.model || 'unknown';
    byModel[model] = (byModel[model] || 0) + 1;

    // Count active sessions (modified in last 5 minutes)
    if (session.modified) {
      const modifiedTime = new Date(session.modified);
      const now = new Date();
      const diffMs = now - modifiedTime;
      const diffMins = diffMs / 1000 / 60;
      if (diffMins < 5) {
        active++;
      }
    }
  });

  return {
    total: sessions.length,
    active: active,
    agents: agentSet.size,
    byType: byType,
    byModel: byModel,
    lastUpdate: new Date().toISOString()
  };
}

/**
 * Update state and notify WebSocket clients
 */
function updateState() {
  fetchSessions()
    .then(sessions => {
      currentState.sessions = sessions;
      currentState.summary = calculateSummary(sessions);
      
      console.log(`[${new Date().toISOString()}] Updated: ${sessions.length} sessions, ${currentState.summary.active} active`);
      
      // Notify all WebSocket clients
      broadcast({
        type: 'state-update',
        data: currentState
      });
    })
    .catch(error => {
      console.error('Failed to update state:', error.message);
      
      // Send error notification
      broadcast({
        type: 'error',
        message: error.message
      });
    });
}

/**
 * Broadcast message to all WebSocket clients
 */
function broadcast(message) {
  const data = JSON.stringify(message);
  wss.clients.forEach(client => {
    if (client.readyState === 1) { // OPEN
      client.send(data);
    }
  });
}

// REST API Routes
app.get('/api/state', (req, res) => {
  res.json(currentState);
});

app.get('/api/sessions', (req, res) => {
  res.json(currentState.sessions);
});

app.get('/api/summary', (req, res) => {
  res.json(currentState.summary);
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    lastUpdate: currentState.summary.lastUpdate
  });
});

// WebSocket Server
const wss = new Server({ port: WS_PORT });

wss.on('listening', () => {
  console.log(`WebSocket server listening on port ${WS_PORT}`);
});

wss.on('connection', (ws, req) => {
  console.log(`New WebSocket connection from ${req.socket.remoteAddress}`);
  
  // Send current state immediately
  ws.send(JSON.stringify({
    type: 'state-update',
    data: currentState
  }));
  
  ws.on('close', () => {
    console.log('WebSocket connection closed');
  });
  
  ws.on('error', (error) => {
    console.error('WebSocket error:', error.message);
  });
});

// Start HTTP Server
app.listen(HTTP_PORT, () => {
  console.log(`Agent Monitor Service started`);
  console.log(`HTTP server: http://localhost:${HTTP_PORT}`);
  console.log(`WebSocket server: ws://localhost:${WS_PORT}`);
  console.log(`Polling interval: ${POLL_INTERVAL / 1000}s`);
});

// Start polling
updateState(); // Initial fetch
setInterval(updateState, POLL_INTERVAL);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('\nReceived SIGINT, shutting down...');
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});
