import type { Browser } from '@e2e-dev/web';
import { expect, type Screen } from 'e2e';

const CARD = '4242424242424242';
const EXPIRY = '1234';
const CVC = '123';

/**
 * Stripe mounts more than one iframe with this title. Mark the visible one
 * so the card fields have a single frame to fill.
 */
async function visibleStripeFrame(browser: Browser) {
  const deadline = Date.now() + 30_000;
  while (Date.now() < deadline) {
    const marked = await browser.evaluate<string>(`() => {
      const frames = Array.from(
        document.querySelectorAll('iframe[title="Secure payment input frame"]'),
      );
      for (const frame of frames) frame.removeAttribute('data-e2e-stripe');
      let best = null;
      let bestArea = 0;
      for (const frame of frames) {
        const box = frame.getBoundingClientRect();
        const style = getComputedStyle(frame);
        const area = box.width * box.height;
        if (
          area > bestArea &&
          style.visibility !== 'hidden' &&
          style.display !== 'none'
        ) {
          best = frame;
          bestArea = area;
        }
      }
      if (!best || bestArea < 400) return '';
      best.setAttribute('data-e2e-stripe', 'card');
      return 'card';
    }`);
    if (marked === 'card') {
      return browser.frameLocator('iframe[data-e2e-stripe="card"]');
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error('The checkout page did not show one visible Stripe card frame.');
}

/**
 * Pays with the Stripe test card.
 * The card fields are in a cross-site frame. An agent can only reach them
 * by pixel clicks, and those clicks are a replay gap, so this step makes
 * no model call.
 */
/** Types the known register form. An agent replay of this page deletes itself when the next page's labels arrive late. */
export async function submitRegistration(
  screen: Screen,
  patient: { firstName: string; lastName: string; email: string },
  phone: string,
): Promise<void> {
  await screen.getByRole('textbox', { name: 'First Name' }).fill(patient.firstName);
  await screen.getByRole('textbox', { name: 'Last Name' }).fill(patient.lastName);
  await screen.getByRole('textbox', { name: 'Phone Number' }).fill(phone);
  await screen.getByRole('textbox', { name: 'Email' }).fill(patient.email);
  await screen
    .getByRole('checkbox', { name: /Service Terms and Informed Consent/ })
    .check();
  await screen.getByRole('button', { name: 'Continue' }).tap();
}

/** Chooses one letter plan by the start of its accessible name. */
export async function chooseLetter(screen: Screen, name: RegExp): Promise<void> {
  await screen.getByRole('button', { name }).tap();
}

/** The confirmation heading is "Payment Successful!" on the current portal, and was "Congratulations!" earlier. */
export async function expectPaid(
  browser: Browser,
  screen: Screen,
  path: RegExp,
): Promise<void> {
  await expect(browser).toHaveURL(path, { timeout: 60_000 });
  await expect(
    screen.getByRole('heading', { name: /Payment Successful!|Congratulations!/ }),
  ).toBeVisible({ timeout: 30_000 });
  await expect(screen.getByText(/pre-?qualified/i)).toBeVisible();
}

export async function payWithTestCard(
  browser: Browser,
  screen: Screen,
  payLabel: string,
): Promise<void> {
  await screen
    .getByRole('checkbox', { name: /Service Terms and Informed Consent/ })
    .check();

  const stripe = await visibleStripeFrame(browser);
  await stripe.locator('input[name="number"]').fill(CARD, { timeout: 30_000 });
  await stripe.locator('input[name="expiry"]').fill(EXPIRY);
  await stripe.locator('input[name="cvc"]').fill(CVC);
  await screen.getByRole('button', { name: payLabel }).tap();
}
