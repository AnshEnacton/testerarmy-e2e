import { beforeEach, describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { z } from 'zod';

// These two tests call a model. Run them with: npm run test:lab:agent
// The first passing run is recorded. The next run replays it without a model call.
describe('agent on the board', { session: 'receptionist', tags: ['agent'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/board');
  });

  test('adds a task and marks it done', { timeout: 180_000 }, async ({ agent, screen }) => {
    await agent.act('add a task named {title}', { params: { title: 'Call the lab' } });
    await expect(screen.getByRole('checkbox', 'Call the lab')).toBeVisible();
    await expect(screen.getByRole('status', 'Open tasks')).toHaveText('2 open');

    await agent.act('mark the task "Call the lab" as done');
    await expect(screen.getByRole('checkbox', 'Call the lab')).toBeChecked();
    await expect(screen.getByRole('status', 'Open tasks')).toHaveText('1 open');
  });

  test('reads the open tasks from the list', { timeout: 180_000 }, async ({ agent, screen }) => {
    await agent.act('show only the open tasks');
    await expect(screen.getByRole('tab', 'Open')).toHaveAttribute('aria-selected', 'true');

    const listed = await agent.extract('the task titles shown in the list', {
      schema: z.object({ titles: z.array(z.string()) }),
    });
    expect(listed.titles).toContain('Walk the lobby');

    await agent.assert('the list does not include the task "Print the roster"');
  });
});
