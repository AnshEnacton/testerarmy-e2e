import { existsSync } from 'node:fs';
import type { E2EConfig } from 'e2e';
import process from 'node:process';
import { web } from '@e2e-dev/web';
import { grok } from 'e2e/oauth/grok';

if (existsSync('.env')) process.loadEnvFile('.env');

export default {
  projectId: 'testerarmy-e2e',
  targets: [
    {
      engine: web(),
      app: {
        url:
          process.env.APP_URL ??
          'https://beta-patient.wellnesswag.com/services/esa',
      },
    },
  ],

  agents: {
    default: {
      model: grok('grok-4.7'),
      maxSteps: 80,
      maxModelCalls: 80,
      system:
        'You are a careful QA agent. Verify every outcome on screen.',
    },
  },
} satisfies E2EConfig;