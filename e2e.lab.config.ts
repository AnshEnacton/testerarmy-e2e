import { existsSync } from 'node:fs';
import process from 'node:process';
import type { E2EConfig } from 'e2e';
import { web } from '@e2e-dev/web';
import { grok } from 'e2e/oauth/grok';

// The lab has its own config so `npx e2e run` still uses e2e.config.ts.
// Agent tests use the SuperGrok login from `npx e2e login spacexai`. Exact tests do not.
if (existsSync('.env')) process.loadEnvFile('.env');

export default {
  projectId: 'harbor-desk-lab',
  tests: 'lab/tests/**/*.e2e.ts',
  output: '.e2e-lab',
  workers: 1,
  targets: [
    {
      name: 'harbor',
      engine: web(),
      app: {
        // Port 0 asks the runner for a free port, so `npm run lab` can stay open on 4317.
        url: 'http://127.0.0.1:0',
        command: {
          executable: process.execPath,
          args: ['lab/server.mjs'],
          env: { PORT: '{port}' },
          log: '.e2e/logs/lab.log',
          startupTimeout: 30_000,
        },
      },
    },
  ],
  credentials: {
    receptionist: {
      username: 'qa@clinic.test',
      password: 'clinic-pass',
    },
  },
  agents: {
    default: {
      model: grok('grok-4.7'),
      system:
        'You are a careful QA agent. Use the words printed on the screen. Stop when the one goal is done.',
      context:
        "Harbor Desk is a clinic front desk. Tasks are on Today's board. The task filters are tabs named All, Open, and Done. Open tasks are the ones whose checkbox is unchecked.",
    },
  },
} satisfies E2EConfig;
