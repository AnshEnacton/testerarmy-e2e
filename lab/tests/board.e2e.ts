import { beforeEach, describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('board', { session: 'receptionist', tags: ['board'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/board');
  });

  test('adds a task and counts it', { tags: ['smoke'] }, async ({ screen }) => {
    await screen.getByLabel('New task').fill('Call the lab');
    await screen.getByRole('button', 'Add task').tap();
    await expect(screen.getByRole('checkbox', 'Call the lab')).toBeVisible();
    await expect(screen.getByRole('status', 'Open tasks')).toHaveText('2 open');
  });

  test('ignores an empty task', async ({ screen }) => {
    await screen.getByRole('button', 'Add task').tap();
    await expect(screen.getByRole('alert')).toHaveText('Enter a task before adding it.');
    await expect(screen.getByRole('checkbox')).toHaveCount(2);
  });

  test('adds a task when you press Enter', async ({ screen }) => {
    await screen.getByLabel('New task').fill('Restock tea');
    await screen.getByLabel('New task').press('Enter');
    await expect(screen.getByRole('checkbox', 'Restock tea')).toBeVisible();
    await expect(screen.getByRole('status', 'Open tasks')).toHaveText('2 open');
  });

  test('marks a task done and filters the list', async ({ screen }) => {
    await screen.getByRole('checkbox', 'Walk the lobby').check();
    await expect(screen.getByRole('checkbox', 'Walk the lobby')).toBeChecked();
    await expect(screen.getByRole('status', 'Open tasks')).toHaveText('0 open');

    await screen.getByRole('tab', 'Done').tap();
    await expect(screen.getByRole('tab', 'Done')).toHaveAttribute('aria-selected', 'true');
    await expect(screen.getByRole('checkbox', 'Walk the lobby')).toBeVisible();
    await expect(screen.getByRole('checkbox', 'Print the roster')).toBeVisible();

    await screen.getByRole('tab', 'Open').tap();
    await expect(screen.getByText('No tasks on this filter.')).toBeVisible();
    await expect(screen.getByRole('checkbox', 'Walk the lobby')).toBeHidden();
  });

  test('asks before it deletes a task', async ({ screen }) => {
    await screen.getByRole('button', 'Delete Walk the lobby').tap();
    await expect(screen.getByRole('dialog', 'Delete this task?')).toBeVisible();
    await expect(screen.getByText('Walk the lobby will be removed from the board.')).toBeVisible();
    await screen.getByRole('button', 'Keep task').tap();
    await expect(screen.getByRole('dialog', 'Delete this task?')).toBeHidden();
    await expect(screen.getByRole('checkbox', 'Walk the lobby')).toBeVisible();

    await screen.getByRole('button', 'Delete Walk the lobby').tap();
    await screen.getByRole('button', 'Delete task').tap();
    await expect(screen.getByRole('checkbox', 'Walk the lobby')).toHaveCount(0);
    await expect(screen.getByRole('status', 'Open tasks')).toHaveText('0 open');
  });

  test('closes the delete dialog with Escape', async ({ screen }) => {
    await screen.getByRole('button', 'Delete Print the roster').tap();
    await screen.getByRole('dialog', 'Delete this task?').press('Escape');
    await expect(screen.getByRole('dialog', 'Delete this task?')).toBeHidden();
    await expect(screen.getByRole('checkbox', 'Print the roster')).toBeVisible();
  });

  test('clears finished tasks only after you confirm', async ({ screen, browser }) => {
    const dismiss = await browser.onDialog(async (dialog) => {
      expect(dialog.message).toBe('Remove every finished task?');
      await dialog.dismiss();
    });
    await screen.getByRole('button', 'Clear finished').tap();
    await expect(screen.getByRole('checkbox', 'Print the roster')).toBeVisible();
    await dismiss();

    await browser.onDialog(async (dialog) => {
      await dialog.accept();
    });
    await screen.getByRole('button', 'Clear finished').tap();
    await expect(screen.getByRole('checkbox', 'Print the roster')).toHaveCount(0);
    await expect(screen.getByRole('checkbox', 'Walk the lobby')).toBeVisible();
  });
});
