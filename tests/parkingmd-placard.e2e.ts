import { test, type Browser } from '@e2e-dev/web';
import { expect, type AgentParams } from 'e2e';
import { answerScreen } from './answer.ts';
import { keepPatient, rememberPatient } from './patient-run.ts';

const phone = '7372103830';

const PARKING_RULE =
  'Do only what this says. If a cookie notice or a Sarah chat covers the control, close it. Do not send Sarah a message. Do not answer a later question and do not go back. Do not click Pay.';

type Agent = {
  act(
    instruction: string,
    options?: { timeout?: number; params?: AgentParams },
  ): Promise<unknown>;
};

function answerParking(
  agent: Agent,
  browser: Browser,
  instruction: string,
  next: RegExp,
) {
  return answerScreen(agent, browser, instruction, next, undefined, PARKING_RULE);
}

test(
  'new patient reaches ParkingMD placard checkout',
  { tags: ['parkingmd'], timeout: 1_800_000 },
  async ({ browser, agent, screen }) => {
    await keepPatient('placard', browser, async (patient, resumeUrl) => {
    if (!resumeUrl) {
    await browser.goto('https://parkingmd.com/');

    await answerParking(
      agent,
      browser,
      'Use the first Type your state field. Type California and press Enter. If a cookie notice closes the list, dismiss it and finish choosing California.',
      /\/california\/handicap-placard/,
    );
    await answerParking(
      agent,
      browser,
      'Click the first See if I Qualify link.',
      /\/placard\/welcome\?state=ca/,
    );
    await answerParking(
      agent,
      browser,
      'Choose New Patient.',
      /\/placard\/choose-state/,
    );
    await answerParking(
      agent,
      browser,
      'California is already selected. Dismiss the cookie notice if it is open, then press Continue.',
      /\/placard\/onboarding$/,
    );
    await answerParking(
      agent,
      browser,
      'On the question about difficulty walking 200 feet, choose Yes, then press Continue. Stop when the page changes.',
      /step=conditions/,
    );
    await answerParking(
      agent,
      browser,
      'Choose only Severe arthritis, neurological, or orthopedic condition limiting mobility, then press Continue. Stop when the page changes.',
      /step=permit_type/,
    );
    await answerParking(
      agent,
      browser,
      'Choose Temporary Permit (for disabilities lasting 6 months or less), then press Continue. Stop when the page changes.',
      /\/placard\/why/,
    );
    await answerParking(
      agent,
      browser,
      'Press Continue on this comparison screen.',
      /\/placard\/register$/,
    );

    await screen.getByRole('textbox', { name: 'First Name' }).fill(patient.firstName);
    await screen.getByRole('textbox', { name: 'Last Name' }).fill(patient.lastName);
    await screen.getByRole('button', { name: 'Continue' }).tap();
    await expect(browser).toHaveURL(/step=phone/);

    await screen.getByRole('textbox', { name: 'Phone Number' }).fill(phone);
    await screen.getByRole('button', { name: 'Continue' }).tap();
    await expect(browser).toHaveURL(/step=email/);

    await screen.getByRole('textbox', { name: 'Email' }).fill(patient.email);
    await screen
      .getByRole('checkbox', { name: /Service Terms and Informed Consent/ })
      .check();
    await screen.getByRole('button', { name: 'Continue' }).tap();
    await expect(browser).toHaveURL(/\/task\/\d+\/summary/, { timeout: 60_000 });
    await rememberPatient(browser, 'placard');
    }

    let url = await browser.url();
    if (/\/summary(?:$|\?)/.test(url)) {
      await expect(screen.getByText(`Hi ${patient.firstName},`)).toBeVisible();
      await screen.getByRole('link', { name: 'Continue to Payment' }).tap();
      await expect(browser).toHaveURL(/\/task\/\d+\/checkout/, { timeout: 60_000 });
      await rememberPatient(browser, 'placard');
    }
    await expect(browser).toHaveURL(/\/task\/\d+\/checkout/);
    await expect(screen.getByRole('button', { name: 'Pay $179.00' })).toBeVisible();
    await expect(
      screen.getByText(/fill out your secure medical intake form/i),
    ).toBeVisible();
    });
  },
);
