/**
 * PM2 Ecosystem Config
 * Manages all AgentSQL background processes on EC2.
 *
 * Usage:
 *   pm2 start ecosystem.config.js      ← first time
 *   pm2 reload ecosystem.config.js     ← zero-downtime reload on deploy
 *   pm2 save                           ← persist so services survive reboot
 *   pm2 startup                        ← auto-start PM2 on EC2 reboot
 */

module.exports = {
  apps: [
    // ── Node.js Express Server ─────────────────────────────────────────────────
    {
      name: 'agentsql-server',
      script: 'server.js',
      cwd: '/home/ubuntu/agentsql/server',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
      },
    },

    // ── Python FastAPI Agent ───────────────────────────────────────────────────
    {
      name: 'agentsql-agent',
      // Use the Python 3.12 venv — system Python 3.14 is too new for pydantic-core/pandas
      script: '/home/ubuntu/agentsql-venv/bin/python3',
      args: '-m uvicorn app:app --host 127.0.0.1 --port 8000',
      cwd: '/home/ubuntu/agentsql/agent',
      interpreter: 'none',      // tell PM2 not to use node as interpreter
      autorestart: true,
      watch: false,
      max_memory_restart: '400M',
      env: {
        PYTHONUNBUFFERED: '1',
        VIRTUAL_ENV: '/home/ubuntu/agentsql-venv',
      },
    },
  ],
};
