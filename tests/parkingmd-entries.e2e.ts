import { test, type Browser } from '@e2e-dev/web';
import { expect, type AgentParams, type Screen } from 'e2e';
import { answerScreen } from './answer.ts';

type MarketState = { name: string; slug: string; code: string };

const states: MarketState[] = [
  { name: 'Alabama', slug: 'alabama', code: 'al' },
  { name: 'Alaska', slug: 'alaska', code: 'ak' },
  { name: 'Arizona', slug: 'arizona', code: 'az' },
  { name: 'Arkansas', slug: 'arkansas', code: 'ar' },
  { name: 'California', slug: 'california', code: 'ca' },
  { name: 'Colorado', slug: 'colorado', code: 'co' },
  { name: 'Connecticut', slug: 'connecticut', code: 'ct' },
  { name: 'Delaware', slug: 'delaware', code: 'de' },
  { name: 'Florida', slug: 'florida', code: 'fl' },
  { name: 'Georgia', slug: 'georgia', code: 'ga' },
  { name: 'Hawaii', slug: 'hawaii', code: 'hi' },
  { name: 'Idaho', slug: 'idaho', code: 'id' },
  { name: 'Illinois', slug: 'illinois', code: 'il' },
  { name: 'Indiana', slug: 'indiana', code: 'in' },
  { name: 'Iowa', slug: 'iowa', code: 'ia' },
  { name: 'Kansas', slug: 'kansas', code: 'ks' },
  { name: 'Kentucky', slug: 'kentucky', code: 'ky' },
  { name: 'Louisiana', slug: 'louisiana', code: 'la' },
  { name: 'Maine', slug: 'maine', code: 'me' },
  { name: 'Maryland', slug: 'maryland', code: 'md' },
  { name: 'Massachusetts', slug: 'massachusetts', code: 'ma' },
  { name: 'Michigan', slug: 'michigan', code: 'mi' },
  { name: 'Minnesota', slug: 'minnesota', code: 'mn' },
  { name: 'Mississippi', slug: 'mississippi', code: 'ms' },
  { name: 'Missouri', slug: 'missouri', code: 'mo' },
  { name: 'Montana', slug: 'montana', code: 'mt' },
  { name: 'Nebraska', slug: 'nebraska', code: 'ne' },
  { name: 'Nevada', slug: 'nevada', code: 'nv' },
  { name: 'New Hampshire', slug: 'new-hampshire', code: 'nh' },
  { name: 'New Jersey', slug: 'new-jersey', code: 'nj' },
  { name: 'New Mexico', slug: 'new-mexico', code: 'nm' },
  { name: 'New York', slug: 'new-york', code: 'ny' },
  { name: 'North Carolina', slug: 'north-carolina', code: 'nc' },
  { name: 'North Dakota', slug: 'north-dakota', code: 'nd' },
  { name: 'Ohio', slug: 'ohio', code: 'oh' },
  { name: 'Oklahoma', slug: 'oklahoma', code: 'ok' },
  { name: 'Oregon', slug: 'oregon', code: 'or' },
  { name: 'Pennsylvania', slug: 'pennsylvania', code: 'pa' },
  { name: 'Rhode Island', slug: 'rhode-island', code: 'ri' },
  { name: 'South Carolina', slug: 'south-carolina', code: 'sc' },
  { name: 'South Dakota', slug: 'south-dakota', code: 'sd' },
  { name: 'Tennessee', slug: 'tennessee', code: 'tn' },
  { name: 'Texas', slug: 'texas', code: 'tx' },
  { name: 'Utah', slug: 'utah', code: 'ut' },
  { name: 'Vermont', slug: 'vermont', code: 'vt' },
  { name: 'Virginia', slug: 'virginia', code: 'va' },
  { name: 'Washington', slug: 'washington', code: 'wa' },
  { name: 'West Virginia', slug: 'west-virginia', code: 'wv' },
  { name: 'Wisconsin', slug: 'wisconsin', code: 'wi' },
  { name: 'Wyoming', slug: 'wyoming', code: 'wy' },
];

const portalStates = [...states, { name: 'Washington DC', code: 'dc' }];

const picked = process.env.STATE?.trim().toLowerCase();

function wanted(row: { name: string; code?: string; slug?: string }) {
  if (!picked) return true;
  return (
    picked === row.name.toLowerCase() ||
    picked === row.code ||
    picked === row.slug
  );
}

const selectedStates = states.filter(wanted);
const selectedPortalStates = portalStates.filter(wanted);

if (picked && selectedStates.length === 0 && selectedPortalStates.length === 0) {
  throw new Error(`No ParkingMD state matches STATE=${process.env.STATE}`);
}

const texas = states.find((row) => row.code === 'tx');
if (!texas) throw new Error('Texas is missing from the state list');

const PARKING_RULE =
  'Do only what this says. If a cookie notice or a Sarah chat covers the control, close it. Do not send Sarah a message. Do not answer a later question and do not go back. Do not click Pay.';

type Agent = {
  act(
    instruction: string,
    options?: { timeout?: number; params?: AgentParams },
  ): Promise<unknown>;
};

const welcomeWithoutState = /https:\/\/patient\.parkingmd\.com\/placard\/welcome\/?$/;
const chooseWithoutState = /https:\/\/patient\.parkingmd\.com\/placard\/choose-state\/?$/;
const onboarding = /https:\/\/patient\.parkingmd\.com\/placard\/onboarding\/?$/;

function answerParking(agent: Agent, browser: Browser, instruction: string, next: RegExp) {
  return answerScreen(agent, browser, instruction, next, undefined, PARKING_RULE);
}

function eligibility(name: string) {
  return new RegExp(`Your eligibility in ${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`);
}

function statePage(row: MarketState) {
  return new RegExp(
    `https://parkingmd\\.com/${row.slug}/handicap-placard/?(?:$|[?#])`,
  );
}

function welcomeWithState(code: string) {
  return new RegExp(
    `https://patient\\.parkingmd\\.com/placard/welcome\\?state=${code}$`,
  );
}

function chooseWithState(code: string) {
  return new RegExp(
    `https://patient\\.parkingmd\\.com/placard/choose-state\\?state=${code}$`,
  );
}

function stateLink(code: string) {
  return new RegExp(`[?&]state=${code}(?:&|$)`);
}

async function dismissParkingNotices(screen: Screen) {
  const gotIt = screen.getByRole('button', 'Got it');
  if (await gotIt.isVisible()) await gotIt.tap();
  const sarah = screen.getByRole('dialog', 'Message from Sarah');
  if (await sarah.isVisible()) await sarah.getByRole('button', 'Close').tap();
}

async function expectStateLinks(screen: Screen, code: string) {
  const href = stateLink(code);
  await expect(screen.getByRole('link', 'See if I Qualify').first()).toHaveAttribute(
    'href',
    href,
  );
  await expect(screen.getByRole('link', 'See if I Qualify').last()).toHaveAttribute(
    'href',
    href,
  );
  await expect(
    screen.getByRole('link', 'Qualify Now', { visible: true }).first(),
  ).toHaveAttribute('href', href);
  await expect(
    screen.getByRole('link', 'Get Started', { visible: true }).first(),
  ).toHaveAttribute('href', href);
}

async function stopAtWalkingQuestion(screen: Screen, name: string) {
  await expect(screen.getByRole('heading', eligibility(name))).toBeVisible();
  await expect(screen.getByText(/difficulty walking 200 feet/i)).toBeVisible();
  await expect(screen.getByRole('button', 'Continue')).toBeDisabled();
}

async function enterFromStatePage(browser: Browser, screen: Screen, row: MarketState) {
  await dismissParkingNotices(screen);
  await screen.getByRole('link', 'See if I Qualify', { visible: true }).first().tap();
  await expect(browser).toHaveURL(welcomeWithState(row.code));
  await dismissParkingNotices(screen);
  await screen.getByRole('button', 'New Patient').tap();
  await expect(browser).toHaveURL(chooseWithState(row.code));
  await dismissParkingNotices(screen);
  await expect(screen.getByRole('combobox', 'Select State')).toHaveValue(row.name, {
    timeout: 30_000,
  });
  await expect(screen.getByRole('heading', eligibility(row.name))).toBeVisible();
  await screen.getByRole('button', 'Continue').tap();
  await expect(browser).toHaveURL(onboarding);
  await stopAtWalkingQuestion(screen, row.name);
}

if (wanted(texas)) {
  test(
    'first Type your state field carries Texas into the portal address',
    { tags: ['parkingmd'], timeout: 300_000 },
    async ({ browser, agent, screen }) => {
      await browser.goto('https://parkingmd.com/');
      await answerParking(
        agent,
        browser,
        'Use the first Type your state field. Type Texas and press Enter. If a cookie notice closes the list, dismiss it and finish choosing Texas.',
        statePage(texas),
      );
      await expectStateLinks(screen, texas.code);
      await enterFromStatePage(browser, screen, texas);
    },
  );

  test(
    'second Type your state field opens the Texas page',
    { tags: ['parkingmd'], timeout: 300_000 },
    async ({ browser, agent, screen }) => {
      await browser.goto('https://parkingmd.com/');
      await answerParking(
        agent,
        browser,
        'Use the second Type your state field. Type Texas and press Enter. If a cookie notice closes the list, dismiss it and finish choosing Texas.',
        statePage(texas),
      );
      await expectStateLinks(screen, texas.code);
    },
  );
}

function chunks<T>(rows: T[], size: number) {
  const groups: T[][] = [];
  for (let index = 0; index < rows.length; index += size) {
    groups.push(rows.slice(index, index + size));
  }
  return groups;
}

function groupTitle(rows: { name: string }[]) {
  if (rows.length === 1) return rows[0].name;
  return `${rows[0].name} through ${rows[rows.length - 1].name}`;
}

function failureText(error: unknown) {
  return error instanceof Error ? error.message : String(error);
}

async function chooseLoadedState(screen: Screen, name: string) {
  const combobox = screen.getByRole('combobox', 'Select State');
  const option = screen.getByRole('option', name);
  for (let attempt = 0; attempt < 5; attempt += 1) {
    await combobox.tap();
    try {
      await expect(option).toBeVisible({ timeout: 2_000 });
      await option.tap();
      return;
    } catch {
      const dismiss = screen.getByRole('button', 'Dismiss');
      if (await dismiss.isVisible()) await dismiss.tap();
      else await combobox.press('Escape');
    }
  }
  await combobox.tap();
  await option.tap();
}

async function chooseStateFromBlankPage(browser: Browser, screen: Screen, name: string) {
  await dismissParkingNotices(screen);
  await expect(screen.getByRole('combobox', 'Select State')).toBeVisible({
    timeout: 30_000,
  });
  await dismissParkingNotices(screen);
  await chooseLoadedState(screen, name);
  await expect(screen.getByRole('combobox', 'Select State')).toHaveValue(name);
  await expect(browser).toHaveURL(chooseWithoutState);
  await expect(screen.getByRole('heading', eligibility(name))).toBeVisible();
  await screen.getByRole('button', 'Continue').tap();
  if (name === 'Washington DC') {
    await expect(screen.getByText(/not open in your state right now/i)).toBeVisible();
    await expect(browser).toHaveURL(chooseWithoutState);
    return;
  }
  await expect(browser).toHaveURL(onboarding);
  await stopAtWalkingQuestion(screen, name);
}

const homeButtons = ['Apply Now', 'Start Now', 'Get Started'] as const;

test(
  'homepage Apply Now, Start Now, and Get Started open welcome with no state',
  { tags: ['parkingmd'], timeout: 180_000 },
  async ({ browser, screen }) => {
    const failures: string[] = [];
    for (const label of homeButtons) {
      try {
        await browser.goto('https://parkingmd.com/');
        await dismissParkingNotices(screen);
        await screen.getByRole('link', label, { visible: true }).first().tap();
        await expect(browser).toHaveURL(welcomeWithoutState);
      } catch (error) {
        failures.push(`${label}: ${failureText(error)}`);
      }
    }
    if (failures.length > 0) throw new Error(failures.join('\n'));
  },
);

const groupSize = 10;

for (const group of chunks(selectedStates, groupSize)) {
  test(
    `${groupTitle(group)} pages carry the state code into the questions page`,
    { tags: ['parkingmd'], timeout: 600_000 },
    async ({ browser, screen }) => {
      const failures: string[] = [];
      for (const row of group) {
        try {
          await browser.goto(`https://parkingmd.com/${row.slug}/handicap-placard`);
          await expect(browser).toHaveURL(statePage(row));
          await expectStateLinks(screen, row.code);
          await enterFromStatePage(browser, screen, row);
        } catch (error) {
          failures.push(`${row.name}: ${failureText(error)}`);
        }
      }
      if (failures.length > 0) throw new Error(failures.join('\n'));
    },
  );
}

for (const group of chunks(selectedPortalStates, groupSize)) {
  test(
    group.length === 1 && group[0].name === 'Washington DC'
      ? 'Qualify Now shows Washington DC is not open'
      : `Qualify Now carries ${groupTitle(group)} to the questions page`,
    { tags: ['parkingmd'], timeout: 600_000 },
    async ({ browser, screen }) => {
      const failures: string[] = [];
      let enteredFromHomepage = false;
      for (const row of group) {
        try {
          if (!enteredFromHomepage) {
            await browser.goto('https://parkingmd.com/');
            await dismissParkingNotices(screen);
            await screen.getByRole('link', 'Qualify Now', { visible: true }).first().tap();
            await expect(browser).toHaveURL(welcomeWithoutState);
            await dismissParkingNotices(screen);
            await screen.getByRole('button', 'New Patient').tap();
            await expect(browser).toHaveURL(chooseWithoutState);
            enteredFromHomepage = true;
          } else {
            await browser.goto('https://patient.parkingmd.com/placard/choose-state');
            await expect(browser).toHaveURL(chooseWithoutState);
          }
          await chooseStateFromBlankPage(browser, screen, row.name);
        } catch (error) {
          failures.push(`${row.name}: ${failureText(error)}`);
          enteredFromHomepage = false;
        }
      }
      if (failures.length > 0) throw new Error(failures.join('\n'));
    },
  );
}
