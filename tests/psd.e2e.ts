import { test } from '@e2e-dev/web';
import { expect } from 'e2e';
import { answerScreen } from './answer.ts';
import {
  chooseLetter,
  expectPaid,
  payWithTestCard,
  submitRegistration,
} from './checkout.ts';
import { keepPatient, rememberPatient } from './patient-run.ts';

test(
  'new patient completes a PSD letter through confirmation',
  { tags: ['checkout'], timeout: 1_800_000 },
  async ({ browser, agent, screen }) => {
    await keepPatient('psd', browser, async (patient, resumeUrl) => {
    if (!resumeUrl) {
    await browser.goto('https://beta-patient.wellnesswag.com/services');

    await answerScreen(
      agent,
      browser,
      'Open PSD letter from the PSD letter shortcut or the PSD letter card. Do not open ESA or any other service.',
      /\/services\/psd/,
    );
    await answerScreen(
      agent,
      browser,
      'Close Sophie if that dialog is open, then click the primary Get started link.',
      /\/psd\/welcome/,
    );
    await answerScreen(
      agent,
      browser,
      'Choose New Patient.',
      /\/psd\/choose-state/,
    );
    await answerScreen(
      agent,
      browser,
      'Open the state list, choose California, and continue.',
      /\/psd\/complaince/,
    );
    await answerScreen(
      agent,
      browser,
      'Acknowledge the compliance page.',
      /\/psd\/onboarding$/,
    );
    await answerScreen(
      agent,
      browser,
      'Answer Yes to needing a PSD letter.',
      /step=psd_walkthrough/,
    );
    await answerScreen(
      agent,
      browser,
      'Continue past the walkthrough.',
      /step=psd_reason/,
    );
    await answerScreen(
      agent,
      browser,
      'Choose Travel as the reason.',
      /step=psd_trained/,
    );
    await answerScreen(
      agent,
      browser,
      'Answer No, the dog is not already trained.',
      /step=psd_acaa_compliant/,
    );
    await answerScreen(
      agent,
      browser,
      'Continue past the Air Carrier Access Act information.',
      /step=psd_turnaround/,
    );
    await answerScreen(
      agent,
      browser,
      'Choose Within 2-3 Days.',
      /step=psd_age_confirmation/,
    );
    await answerScreen(
      agent,
      browser,
      'Answer Yes to being 18 or older.',
      /step=psd_date_of_birth/,
    );
    await expect(screen.getByRole('textbox', { name: 'MM/DD/YYYY' })).toBeVisible();

    await answerScreen(
      agent,
      browser,
      'Enter {dob} as the date of birth and continue.',
      /step=psd_additional_paperwork/,
      { dob: '04/12/1990' },
    );
    await answerScreen(
      agent,
      browser,
      'Answer No to extra paperwork.',
      /step=psd_pet_details/,
    );
    await answerScreen(
      agent,
      browser,
      'This dog screen is one form. Enter name {dogName}, breed {breed}, age {age}, and sex {sex}. In the training note, enter {note}. Then continue.',
      /step=psd_depression_sad/,
      {
        dogName: 'Scout',
        breed: 'Labrador Retriever',
        age: '4',
        sex: 'Female',
        note: 'Not yet trained',
      },
    );
    await answerScreen(
      agent,
      browser,
      'Answer Yes about feeling sad.',
      /step=psd_depression_enjoyment/,
    );
    await answerScreen(
      agent,
      browser,
      'Answer Yes about enjoyment.',
      /step=psd_irritable/,
    );
    await answerScreen(
      agent,
      browser,
      'Answer No about being irritable.',
      /step=psd_sleep/,
    );
    await answerScreen(
      agent,
      browser,
      'Choose Just not sleeping well.',
      /step=psd_anxiety_worried/,
    );
    await answerScreen(
      agent,
      browser,
      'Choose Sometimes about anxiety.',
      /step=psd_anxiety_panicked/,
    );
    await answerScreen(
      agent,
      browser,
      'Answer Yes about feeling panicked.',
      /step=psd_impulsive/,
    );
    await answerScreen(
      agent,
      browser,
      'Answer No about being impulsive.',
      /step=psd_avoidance/,
    );
    await answerScreen(
      agent,
      browser,
      'Choose Often about avoidance.',
      /step=psd_hallucinations/,
    );
    await answerScreen(
      agent,
      browser,
      'Answer No about hallucinations.',
      /step=psd_paranoid/,
    );
    await answerScreen(
      agent,
      browser,
      'Choose Never for this question about paranoia or danger.',
      /step=psd_suicide_thoughts/,
    );
    await answerScreen(
      agent,
      browser,
      'Answer No for this question about self-harm or danger.',
      /step=psd_suicide_plan/,
    );
    await answerScreen(
      agent,
      browser,
      'Answer No on this last screening question.',
      /\/psd\/register/,
    );
    await expect(screen.getByRole('textbox', { name: /first name/i })).toBeVisible();

    await submitRegistration(screen, patient, '7372103830');
    await expect(browser).toHaveURL(/\/psd-letter-checkout\/add-to-cart/, {
      timeout: 60_000,
    });
    await rememberPatient(browser, 'psd');
    }

    let url = await browser.url();
    if (/\/psd\/processing(?:\/|$)/.test(url)) {
      await expect(browser).toHaveURL(/\/psd-letter-checkout\/add-to-cart/, {
        timeout: 60_000,
      });
      await rememberPatient(browser, 'psd');
      url = await browser.url();
    }
    if (/add-to-cart/.test(url)) {
      await chooseLetter(screen, /^PSD Letter Up to 2 Pets \+ 24 Hour Delivery Included/);
      await expect(browser).toHaveURL(/\/psd-letter-checkout\/checkout/, {
        timeout: 60_000,
      });
      await rememberPatient(browser, 'psd');
      url = await browser.url();
    }
    if (/letter-checkout\/checkout(?:$|\?)/.test(url)) {
      await expect(screen.getByRole('button', { name: 'Pay $149.00' })).toBeVisible();
      await payWithTestCard(browser, screen, 'Pay $149.00');
      await rememberPatient(browser, 'psd');
    }
    await expectPaid(browser, screen, /\/psd-letter-checkout\/thank-you/);
    });
  },
);
