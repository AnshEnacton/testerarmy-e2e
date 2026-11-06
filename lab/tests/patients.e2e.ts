import { readFile } from 'node:fs/promises';
import { beforeEach, describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('patients', { session: 'receptionist', tags: ['patients'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/patients');
  });

  test('finds a patient as you type', async ({ screen }) => {
    await screen.getByLabel('Search patients').pressSequentially('Maya');
    await expect(screen.getByRole('status', 'Patient results')).toHaveText('1 patient');
    await expect(screen.getByRole('rowheader')).toHaveText(['Maya Chen']);
  });

  test('shows an empty state when nothing matches', async ({ screen }) => {
    await screen.getByLabel('Search patients').fill('zzzz');
    await expect(screen.getByRole('status', 'Patient results')).toHaveText('No patients match.');
    await expect(screen.getByRole('rowheader')).toHaveCount(0);
  });

  test('filters patients by status', async ({ screen }) => {
    await screen.getByLabel('Status').selectOption({ label: 'Waiting' });
    await expect(screen.getByRole('status', 'Patient results')).toHaveText('2 patients');
    await expect(screen.getByRole('rowheader')).toHaveText(['Maya Chen', 'Jonah Hale']);
  });

  test('sorts patients by name', async ({ screen }) => {
    await screen.getByRole('button', 'Sort by name').tap();
    await expect(screen.getByRole('status', 'Sort')).toHaveText('Sorted A to Z');
    await expect(screen.getByRole('rowheader')).toHaveText([
      'Jonah Hale',
      'Luis Ortega',
      'Maya Chen',
      'Priya Shah',
    ]);

    await screen.getByRole('button', 'Sort by name').tap();
    await expect(screen.getByRole('status', 'Sort')).toHaveText('Sorted Z to A');
    await expect(screen.getByRole('rowheader')).toHaveText([
      'Priya Shah',
      'Maya Chen',
      'Luis Ortega',
      'Jonah Hale',
    ]);
  });

  test('exports the rows that are on screen', async ({ screen, browser }) => {
    await screen.getByLabel('Status').selectOption({ label: 'Waiting' });
    const download = await browser.waitForDownload(async () => {
      await screen.getByRole('button', 'Export CSV').tap();
    });
    expect(download.suggestedFilename).toBe('patients.csv');
    const csv = await readFile(download.absolutePath, 'utf8');
    expect(csv).toContain('Maya Chen');
    expect(csv).toContain('Jonah Hale');
    expect(csv).not.toContain('Luis Ortega');
    expect(csv).not.toContain('Priya Shah');
  });

  test('refreshes the queue from the api', async ({ screen, browser }) => {
    const pending = browser.waitForResponse('**/api/queue');
    await screen.getByRole('button', 'Refresh queue').tap();
    await expect(screen.getByRole('progressbar', 'Checking the queue')).toBeVisible();
    const response = await pending;
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ waiting: 4, phrase: '4 people waiting' });
    await expect(screen.getByRole('progressbar', 'Checking the queue')).toBeHidden();
    await expect(screen.getByRole('status', 'Queue')).toHaveText('4 people waiting');
  });

  test('shows an error when the queue request fails', async ({ screen, browser }) => {
    await browser.route('**/api/queue', (route) => route.abort());
    await screen.getByRole('button', 'Refresh queue').tap();
    await expect(screen.getByRole('status', 'Queue')).toHaveText('The queue could not be checked.');
  });

  test('shows the queue payload you stub', async ({ screen, browser }) => {
    await browser.route('**/api/queue', (route) =>
      route.fulfill({ json: { waiting: 0, phrase: 'Nobody is waiting' } }),
    );
    await screen.getByRole('button', 'Refresh queue').tap();
    await expect(screen.getByRole('status', 'Queue')).toHaveText('Nobody is waiting');
  });

  test('explains the queue legend', async ({ screen }) => {
    await screen.getByRole('button', 'Queue legend').hover();
    await expect(screen.getByRole('tooltip')).toHaveText(
      'Waiting means the patient is still in the lobby.',
    );
  });

  test('opens a visit slip inside a frame', async ({ screen, browser }) => {
    await screen.getByRole('button', 'Slip for Maya Chen').tap();
    await expect(screen.getByRole('dialog', 'Visit slip')).toBeVisible();
    const slip = browser.frameLocator('iframe[title="Visit slip"]');
    await expect(slip.getByRole('heading', 'Visit slip')).toBeVisible();
    await expect(slip.getByText('Maya Chen')).toBeVisible();
    await screen.getByRole('button', 'Close slip').tap();
    await expect(screen.getByRole('dialog', 'Visit slip')).toBeHidden();
  });
});
