import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Browser, Cookie } from '@e2e-dev/web';
import { patientIdentity } from './patient.ts';

export type Service = 'esa' | 'psd' | 'placard';

export type Patient = {
  firstName: string;
  lastName: string;
  email: string;
};

type SavedCookie = {
  name: string;
  value: string;
  domain: string;
  path: string;
  expires?: number;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: 'Strict' | 'Lax' | 'None';
};

type Resume = {
  url: string;
  cookies: SavedCookie[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
};

type SavedRun = {
  status: 'in-progress';
  patient: Patient;
  resume: Resume | null;
};

const directory = path.join(
  fileURLToPath(new URL('.', import.meta.url)),
  '../.e2e/patients',
);

function fileFor(service: Service) {
  return path.join(directory, `${service}.json`);
}

function readRun(service: Service): SavedRun | null {
  try {
    const parsed = JSON.parse(readFileSync(fileFor(service), 'utf8')) as SavedRun;
    if (!parsed?.patient?.email || parsed.status !== 'in-progress') return null;
    return parsed;
  } catch {
    return null;
  }
}

function writeRun(service: Service, run: SavedRun) {
  mkdirSync(directory, { recursive: true });
  writeFileSync(fileFor(service), JSON.stringify(run));
}

function accountUrl(service: Service, url: string) {
  let pathname = url;
  try {
    pathname = new URL(url).pathname;
  } catch {
    // A non-absolute URL is matched as given.
  }
  if (service === 'placard') return /\/task\/\d+/.test(pathname);
  if (service === 'esa') {
    return /\/esa-letter-checkout\//.test(pathname) || /\/esa\/processing(?:\/|$)/.test(pathname);
  }
  return /\/psd-letter-checkout\//.test(pathname) || /\/psd\/processing(?:\/|$)/.test(pathname);
}

function savedCookie(cookie: Cookie): SavedCookie | null {
  const domain = cookie.domain ?? (cookie.url ? new URL(cookie.url).hostname : '');
  if (!domain) return null;
  return {
    name: cookie.name,
    value: cookie.value,
    domain,
    path: cookie.path ?? '/',
    ...(cookie.expires === undefined || cookie.expires < 0 ? {} : { expires: cookie.expires }),
    ...(cookie.httpOnly === undefined ? {} : { httpOnly: cookie.httpOnly }),
    ...(cookie.secure === undefined ? {} : { secure: cookie.secure }),
    ...(cookie.sameSite === undefined ? {} : { sameSite: cookie.sameSite }),
  };
}

/** Reuse the patient from a failed run. A passed run, or no saved run, starts a new one. */
export function openPatient(service: Service): { patient: Patient; resumeUrl: string | null } {
  const existing = readRun(service);
  if (existing) {
    return { patient: existing.patient, resumeUrl: existing.resume?.url ?? null };
  }
  const patient = patientIdentity(service);
  writeRun(service, { status: 'in-progress', patient, resume: null });
  return { patient, resumeUrl: null };
}

/** Save the login and the current task page once the account exists. */
export async function rememberPatient(browser: Browser, service: Service) {
  const existing = readRun(service);
  if (!existing) return;
  try {
    const url = await browser.url();
    if (!accountUrl(service, url)) return;
    const cookies = (await browser.cookies())
      .map((cookie) => savedCookie(cookie))
      .filter((cookie): cookie is SavedCookie => cookie !== null);
    const storage = await browser.evaluate(() => {
      const dump = (store: Storage) => {
        const values: Record<string, string> = {};
        for (let index = 0; index < store.length; index += 1) {
          const key = store.key(index);
          if (key) values[key] = store.getItem(key) ?? '';
        }
        return values;
      };
      return {
        localStorage: dump(localStorage),
        sessionStorage: dump(sessionStorage),
      };
    });
    writeRun(service, {
      ...existing,
      resume: {
        url,
        cookies,
        localStorage: storage.localStorage,
        sessionStorage: storage.sessionStorage,
      },
    });
  } catch {
    // Keep the patient record when the page cannot be read.
  }
}

/** Open the saved task with the login from the failed run. */
export async function restorePatient(browser: Browser, service: Service) {
  const resume = readRun(service)?.resume;
  if (!resume) return;
  await browser.addInitScript((stores) => {
    const write = (store: Storage, values: Record<string, string>) => {
      for (const [key, value] of Object.entries(values)) store.setItem(key, value);
    };
    try {
      write(localStorage, stores.localStorage);
      write(sessionStorage, stores.sessionStorage);
    } catch {
      // Payment iframes do not share the patient's storage.
    }
  }, {
    localStorage: resume.localStorage,
    sessionStorage: resume.sessionStorage,
  });
  if (resume.cookies.length > 0) await browser.setCookies(resume.cookies);
  await browser.goto(resume.url);
}

export function markPatientPassed(service: Service) {
  rmSync(fileFor(service), { force: true });
}

export async function keepPatient(
  service: Service,
  browser: Browser,
  body: (patient: Patient, resumeUrl: string | null) => Promise<void>,
) {
  const { patient, resumeUrl } = openPatient(service);
  try {
    if (resumeUrl) await restorePatient(browser, service);
    await body(patient, resumeUrl);
    markPatientPassed(service);
  } catch (error) {
    await rememberPatient(browser, service);
    throw error;
  }
}
