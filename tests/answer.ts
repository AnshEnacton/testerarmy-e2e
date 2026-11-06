import type { Browser } from '@e2e-dev/web';
import { expect, type AgentParams } from 'e2e';

type Agent = {
  act(
    instruction: string,
    options?: { timeout?: number; params?: AgentParams },
  ): Promise<unknown>;
};

const RULE =
  'Do only what this says. If a Sophie dialog covers the control, close it. Do not answer a later question and do not go back.';

/** One agent.act for the current screen, then a check so the tap can replay. */
export async function answerScreen(
  agent: Agent,
  browser: Browser,
  instruction: string,
  next: RegExp | 'changes',
  params?: AgentParams,
  rule = RULE,
): Promise<void> {
  const before = next === 'changes' ? await browser.url() : '';
  await agent.act(`${instruction}\n${rule}`, {
    timeout: 120_000,
    ...(params ? { params } : {}),
  });
  if (next === 'changes') {
    await expect(browser).not.toHaveURL(before);
    return;
  }
  await expect(browser).toHaveURL(next);
}
