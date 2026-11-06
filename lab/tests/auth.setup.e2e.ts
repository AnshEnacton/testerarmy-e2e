import { test } from '@e2e-dev/web';
import { credentials, expect } from 'e2e';

// Signs in once and saves the browser storage. Every test tagged with
// session: 'receptionist' starts already signed in. Login tests do not use it.
test.setup(
  'sign in as the receptionist',
  { sessions: ['receptionist'] },
  async ({ app, screen, session, browser }) => {
    const receptionist = credentials.user('receptionist');
    await app.open('/login');
    await screen.getByLabel('Email').fill(receptionist.username);
    await screen.getByLabel('Password').fill(receptionist.password);
    await screen.getByRole('button', 'Sign in').tap();
    await expect(browser).toHaveURL('/board');
    await expect(screen.getByRole('heading', "Today's board")).toBeVisible();
    await session.save('receptionist');
  },
);
