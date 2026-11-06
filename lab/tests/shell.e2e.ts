import { describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('shell', { session: 'receptionist', tags: ['shell'] }, () => {
  test('collapses the nav on a phone-sized window', async ({ app, screen, browser }) => {
    await browser.setViewport({ width: 390, height: 844 });
    await app.open('/board');
    await expect(screen.getByRole('button', 'Open menu')).toBeVisible();
    await expect(screen.getByRole('link', 'Patients')).toBeHidden();

    await screen.getByRole('button', 'Open menu').tap();
    await expect(screen.getByRole('link', 'Patients')).toBeVisible();
    await screen.getByRole('link', 'Patients').tap();
    await expect(browser).toHaveURL('/patients');
    await expect(screen.getByRole('heading', 'Patients')).toBeVisible();
  });

  test('explains a missing page and links home', async ({ app, screen, browser }) => {
    await app.open('/not-a-page');
    await expect(screen.getByRole('heading', 'That page is not on the desk')).toBeVisible();
    await screen.getByRole('link', 'Back to the board').tap();
    await expect(browser).toHaveURL('/board');
    await expect(screen.getByRole('heading', "Today's board")).toBeVisible();
  });
});
