import { test } from '@e2e-dev/web';
import { credentials, expect } from 'e2e';

// Exact steps. Use these when the words, the error, or the URL must be specific.
test.describe('sign in', { tags: ['smoke'] }, () => {
  test('rejects an empty sign-in form', async ({ app, screen }) => {
    await app.open('/login');
    await screen.getByRole('button', 'Sign in').tap();
    await expect(screen.getByRole('alert')).toHaveText('Enter your email and password.');
    await expect(screen.getByRole('heading', 'Sign in')).toBeVisible();
  });

  test('rejects a password that does not match', async ({ app, screen }) => {
    await app.open('/login');
    await screen.getByLabel('Email').fill('qa@clinic.test');
    await screen.getByLabel('Password').fill('wrong-password');
    await screen.getByRole('button', 'Sign in').tap();
    await expect(screen.getByRole('alert')).toHaveText('That password does not match.');
  });

  test('signs in with the practice account', async ({ app, screen, browser }) => {
    const receptionist = credentials.user('receptionist');
    await app.open('/login');
    await screen.getByLabel('Email').fill(receptionist.username);
    await screen.getByLabel('Password').fill(receptionist.password);
    await screen.getByRole('button', 'Sign in').tap();
    await expect(browser).toHaveURL('/board');
    await expect(screen.getByRole('heading', "Today's board")).toBeVisible();
  });

  test('signs in when Enter is pressed in the password field', async ({ app, screen, browser }) => {
    const receptionist = credentials.user('receptionist');
    await app.open('/login');
    await screen.getByLabel('Email').fill(receptionist.username);
    await screen.getByLabel('Password').fill(receptionist.password);
    await screen.getByLabel('Password').press('Enter');
    await expect(browser).toHaveURL('/board');
  });

  test('signs out and blocks the board', async ({ app, screen, browser }) => {
    const receptionist = credentials.user('receptionist');
    await app.open('/login');
    await screen.getByLabel('Email').fill(receptionist.username);
    await screen.getByLabel('Password').fill(receptionist.password);
    await screen.getByRole('button', 'Sign in').tap();
    await screen.getByRole('button', 'Sign out').tap();
    await expect(browser).toHaveURL('/login');
    await app.open('/board');
    await expect(browser).toHaveURL('/login');
    await expect(screen.getByRole('heading', 'Sign in')).toBeVisible();
  });

  test('sends a signed-out visit to the board back to sign-in', async ({ app, screen, browser }) => {
    await app.open('/board');
    await expect(browser).toHaveURL('/login');
    await expect(screen.getByRole('heading', 'Sign in')).toBeVisible();
  });
});
