import { beforeEach, describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('settings', { session: 'receptionist', tags: ['settings'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/settings');
  });

  test('remembers the email digest switch', async ({ screen }) => {
    await expect(screen.getByRole('status', 'Appearance')).toHaveText(
      'Day theme, regular rows, digests off',
    );
    await screen.getByRole('switch', 'Email digests').check();
    await expect(screen.getByRole('status', 'Appearance')).toHaveText(
      'Day theme, regular rows, digests on',
    );

    await screen.getByRole('link', 'Board').tap();
    await expect(screen.getByRole('heading', "Today's board")).toBeVisible();
    await screen.getByRole('link', 'Settings').tap();
    await expect(screen.getByRole('switch', 'Email digests')).toBeChecked();
    await expect(screen.getByRole('status', 'Appearance')).toHaveText(
      'Day theme, regular rows, digests on',
    );
  });

  test('applies the night theme', async ({ screen, browser }) => {
    await screen.getByRole('switch', 'Night theme').check();
    await expect(screen.getByRole('status', 'Appearance')).toHaveText(
      'Night theme, regular rows, digests off',
    );
    await expect(browser).toHaveClass(browser.locator('html'), /night/);

    await browser.reload();
    await expect(screen.getByRole('switch', 'Night theme')).toBeChecked();
    await expect(screen.getByRole('status', 'Appearance')).toHaveText(
      'Night theme, regular rows, digests off',
    );
    await expect(browser).toHaveClass(browser.locator('html'), /night/);
  });
});
