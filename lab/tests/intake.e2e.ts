import { beforeEach, describe, test } from '@e2e-dev/web';
import { expect } from 'e2e';

describe('intake', { session: 'receptionist', tags: ['intake'] }, () => {
  beforeEach(async ({ app }) => {
    await app.open('/intake');
  });

  test('stays on step 1 until the name and email are valid', async ({ screen }) => {
    await screen.getByRole('button', 'Next').tap();
    await expect(screen.getByRole('alert')).toHaveText('Enter a first name, last name, and email.');
    await expect(screen.getByRole('status', 'Progress')).toHaveText('Step 1 of 3');

    await screen.getByLabel('First name').fill('Maya');
    await screen.getByLabel('Last name').fill('Chen');
    await screen.getByLabel('Email').fill('maya');
    await screen.getByRole('button', 'Next').tap();
    await expect(screen.getByRole('alert')).toHaveText('Enter a first name, last name, and email.');
    await expect(screen.getByRole('heading', 'Who is the patient?')).toBeVisible();
  });

  test('asks for a reason and a provider', async ({ screen }) => {
    await screen.getByLabel('First name').fill('Maya');
    await screen.getByLabel('Last name').fill('Chen');
    await screen.getByLabel('Email').fill('maya.chen@example.test');
    await screen.getByRole('button', 'Next').tap();
    await screen.getByRole('button', 'Next').tap();
    await expect(screen.getByRole('alert')).toHaveText('Choose a visit reason and a provider.');
    await expect(screen.getByRole('status', 'Progress')).toHaveText('Step 2 of 3');
  });

  test('keeps what you typed when you go back', async ({ screen }) => {
    await screen.getByLabel('First name').fill('Maya');
    await screen.getByLabel('Last name').fill('Chen');
    await screen.getByLabel('Email').fill('maya.chen@example.test');
    await screen.getByRole('button', 'Next').tap();
    await screen.getByRole('radio', 'Sick visit').check();
    await screen.getByLabel('Provider').selectOption({ label: 'Dr. Ibarra' });
    await screen.getByRole('button', 'Back').tap();

    await expect(screen.getByLabel('First name')).toHaveValue('Maya');
    await expect(screen.getByLabel('Last name')).toHaveValue('Chen');
    await expect(screen.getByLabel('Email')).toHaveValue('maya.chen@example.test');

    await screen.getByRole('button', 'Next').tap();
    await expect(screen.getByRole('radio', 'Sick visit')).toBeChecked();
    await expect(screen.getByLabel('Provider')).toHaveValue('Dr. Ibarra');
  });

  test('saves an intake with consent and an uploaded card', async ({ screen }) => {
    await screen.getByLabel('First name').fill('Maya');
    await screen.getByLabel('Last name').fill('Chen');
    await screen.getByLabel('Email').fill('maya.chen@example.test');
    await screen.getByRole('button', 'Next').tap();
    await expect(screen.getByRole('status', 'Progress')).toHaveText('Step 2 of 3');

    await screen.getByRole('radio', 'Sick visit').check();
    await screen.getByLabel('Provider').selectOption({ label: 'Dr. Ibarra' });
    await screen.getByRole('button', 'Next').tap();
    await expect(screen.getByRole('status', 'Progress')).toHaveText('Step 3 of 3');

    await screen.getByLabel('Insurance card').setInputFiles('lab/fixtures/card.txt');
    await expect(screen.getByRole('status', 'Attachment')).toHaveText('Attached card.txt');
    await screen.getByRole('checkbox', 'Patient consented to treatment').check();
    await screen.getByRole('button', 'Save intake').tap();

    await expect(screen.getByRole('status', 'Intake')).toHaveText('Saved intake for Maya Chen.');
    await expect(screen.getByText('Dr. Ibarra')).toBeVisible();
    await expect(screen.getByText('card.txt')).toBeVisible();
  });
});
