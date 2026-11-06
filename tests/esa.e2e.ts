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
  'new patient completes an ESA letter through confirmation',
  { tags: ['checkout'], timeout: 1_800_000 },
  async ({ browser, agent, screen }) => {
    await keepPatient('esa', browser, async (patient, resumeUrl) => {
    if (!resumeUrl) {
    await browser.goto('https://beta-patient.wellnesswag.com/services/esa');

    await answerScreen(
      agent,
      browser,
      'Close Sophie if that dialog is open, then click the hero Get started link.',
      /\/esa\/welcome/,
    );
    await answerScreen(
      agent,
      browser,
      'Choose New Patient.',
      /\/esa\/choose-state/,
    );
    await answerScreen(
      agent,
      browser,
      'Open the state list, choose California, and continue.',
      /\/esa\/complaince/,
    );
    await answerScreen(
      agent,
      browser,
      'Acknowledge the California compliance page.',
      /\/esa\/onboarding$/,
    );
    await answerScreen(
      agent,
      browser,
      'On "Are you looking for an ESA letter?", choose Yes and then press Continue.',
      /step=esa_walkthrough/,
    );
    await answerScreen(
      agent,
      browser,
      'Continue past the ESA walkthrough.',
      /step=esa_reason/,
    );
    await answerScreen(
      agent,
      browser,
      'On the question about why you need an ESA letter, choose Housing.',
      /step=esa_fair_housing/,
    );
    await answerScreen(
      agent,
      browser,
      'Continue past the Fair Housing information.',
      /step=esa_moving_when/,
    );
    await answerScreen(
      agent,
      browser,
      'Choose In the future.',
      /step=esa_turnaround/,
    );
    await answerScreen(
      agent,
      browser,
      'Choose Within 2-3 Days.',
      /step=esa_age_confirmation/,
    );
    await answerScreen(
      agent,
      browser,
      'Answer Yes to being 18 or older.',
      /step=esa_date_of_birth/,
    );
    await expect(screen.getByRole('textbox', { name: 'MM/DD/YYYY' })).toBeVisible();

    await answerScreen(
      agent,
      browser,
      'Enter {dob} as the date of birth and continue.',
      /step=esa_additional_paperwork/,
      { dob: '04/12/1990' },
    );
    await answerScreen(
      agent,
      browser,
      'Answer No to extra paperwork so the standard letter continues.',
      /step=esa_got_you_covered/,
    );
    await answerScreen(
      agent,
      browser,
      'Continue past this information screen.',
      /step=esa_pet_count/,
    );
    await answerScreen(
      agent,
      browser,
      'Choose One pet.',
      /step=esa_pet_details/,
    );
    await answerScreen(
      agent,
      browser,
      'This pet screen is one form. Choose Dog. Enter name {petName}, breed {breed}, age {age}, and sex Male. In the note, enter {note}. Then continue.',
      /step=esa_pet_happiness/,
      {
        petName: 'Bella',
        breed: 'Golden Retriever',
        age: '3',
        note: 'Bella helps me stay calm and gives me a reason to get outside every day',
      },
    );
    await answerScreen(agent, browser, 'Answer Yes.', /step=esa_worry_events/);
    await answerScreen(agent, browser, 'Choose Sometimes.', /step=esa_irritable/);
    await answerScreen(agent, browser, 'Answer Yes.', /step=esa_worry_bad/);
    await answerScreen(agent, browser, 'Choose Sometimes.', /step=esa_sleep/);
    await answerScreen(agent, browser, 'Answer Yes.', /step=esa_muscle_tension/);
    await answerScreen(agent, browser, 'Choose Sometimes.', /step=esa_fatigue/);
    await answerScreen(agent, browser, 'Choose Sometimes.', /step=esa_interferes_life/);
    await answerScreen(
      agent,
      browser,
      'Answer Yes to whether worrying interferes with any major life activity.',
      /step=esa_symptoms/,
    );
    await answerScreen(
      agent,
      browser,
      'Choose only Anxiety, then press Continue. Stop when the page changes. Do not answer the next question.',
      /step=esa_symptoms_impact/,
    );
    await answerScreen(
      agent,
      browser,
      'Answer Yes on this screen only, then stop. Do not answer the pet question.',
      /step=esa_pet_assist/,
    );
    await answerScreen(
      agent,
      browser,
      'Answer Yes on this screen only, then stop. Do not type a name.',
      /\/esa\/register/,
    );
    await submitRegistration(screen, patient, '7372103830');
    await expect(browser).toHaveURL(/\/esa-letter-checkout\/add-to-cart/, {
      timeout: 60_000,
    });
    await rememberPatient(browser, 'esa');
    }

    let url = await browser.url();
    if (/\/esa\/processing(?:\/|$)/.test(url)) {
      await expect(browser).toHaveURL(/\/esa-letter-checkout\/add-to-cart/, {
        timeout: 60_000,
      });
      await rememberPatient(browser, 'esa');
      url = await browser.url();
    }
    if (/add-to-cart/.test(url)) {
      await chooseLetter(screen, /^ESA Letter \+ 24 Hour Delivery Included/);
      await expect(browser).toHaveURL(/\/esa-letter-checkout\/checkout/, {
        timeout: 60_000,
      });
      await rememberPatient(browser, 'esa');
      url = await browser.url();
    }
    if (/letter-checkout\/checkout(?:$|\?)/.test(url)) {
      await expect(screen.getByRole('button', { name: 'Pay $129.00' })).toBeVisible();
      await payWithTestCard(browser, screen, 'Pay $129.00');
      await rememberPatient(browser, 'esa');
    }
    await expectPaid(browser, screen, /\/esa-letter-checkout\/thank-you/);
    });
  },
);
