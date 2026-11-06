# Tester Army end-to-end tests

Browser tests for the WellnessWag patient portal and ParkingMD. They use the [e2e](https://www.npmjs.com/package/e2e) runner: an agent handles screens that change, and exact checks cover URLs, buttons, and form fields.

WellnessWag tests run against the beta portal. ParkingMD tests run against the live site. Read the command list before you run anything.

## Setup

Install dependencies, then sign in once with a SuperGrok or X Premium+ account. The agent uses that login. It is stored by the e2e CLI on your machine, not in this repo.

```powershell
npm install
npx e2e login spacexai
```

`.env` is optional. The config loads it only when the file exists. Copy `.env.example` to `.env` if you need local variables. `.env` is gitignored. Do not put keys in the repo.

The first run downloads Chromium. Later runs reuse it.

Agent replays are committed in `.e2e/cache/`. A first run replays those steps and does not call the model when the screen still matches. Keep the package name `testerarmy-e2e`. That name is part of the replay key. Do not rename an agent instruction, or that step misses the replay and calls the model. A login is still required for any step the replay cannot finish.

## Commands

| Command | What it runs |
| --- | --- |
| `npm run test:portal` | WellnessWag ESA and PSD, one browser. These tests pay with Stripe's test card. |
| `npm run test:e2e` | Every test except the `checkout` and `parkingmd` tags. |
| `npm run test:parkingmd` | California placard flow, through the Pay $179.00 page. Does not click Pay. |
| `npm run test:parkingmd:headed` | The same California flow, with a visible browser. |
| `npm run test:parkingmd:entries` | All 50 states plus the homepage entry buttons. Four browsers. Does not create an account or click Pay. |

`npm run` does not forward `--headed`. Use the headed script, or call the runner directly:

```powershell
npx e2e run tests/parkingmd-entries.e2e.ts --workers 4 --headed
```

One state from the entry suite, in PowerShell:

```powershell
$env:STATE = 'tx'
npm run test:parkingmd:entries
Remove-Item Env:STATE
```

`tx`, `texas`, and `Texas` all select Texas. A value that matches nothing stops the run before the browser opens. Clear `STATE` before a full run.

Watch one entry-suite browser:

```powershell
npx e2e run tests/parkingmd-entries.e2e.ts --workers 1 --headed
```

## WellnessWag ESA and PSD

`npm run test:portal` runs `tests/esa.e2e.ts` and `tests/psd.e2e.ts` against `https://beta-patient.wellnesswag.com`.

Each test starts a new patient, answers the questionnaire, picks the letter, and pays with Stripe's test card `4242 4242 4242 4242`, expiry `12/34`, CVC `123`. The phone number is `7372103830`.

Names and email come from `tests/patient.ts`:

- ESA: first name `QA` plus the time, last name `Esa` plus the time, email `avdesai+esa-regression-...@enacton.email`.
- PSD: the same pattern with `Psd` and `psd` in the email.

A failed run keeps that patient in `.e2e/patients/esa.json` or `psd.json` and continues from the saved page on the next run. A passed run deletes the file, so the next run creates a new patient. Those files hold login cookies. They are gitignored.

## ParkingMD California checkout

`npm run test:parkingmd` runs `tests/parkingmd-placard.e2e.ts` on the live site.

The path starts at https://parkingmd.com, types California, and follows See if I Qualify through the questionnaire to checkout. It stops when **Pay $179.00** is visible. It does not click Pay and does not enter a card.

The patient name is `QAAvdesai` plus the time, last name `Placard` plus the time, email `ansh05testing+placard-...@gmail.com`. Mail for that plus-address arrives at `ansh05testing@gmail.com`. The phone number is `7372103830`.

A failed run reuses that patient from `.e2e/patients/placard.json`. Delete that file when you want a new patient instead of the saved one.

## ParkingMD entry suite

`npm run test:parkingmd:entries` runs `tests/parkingmd-entries.e2e.ts`. A patient can start in two ways, and the suite checks both.

**Choose a state first.** Both "Type your state" fields are used for Texas. The address becomes `/texas/handicap-placard`, and the links include `?state=tx`. The first field is followed through to the first medical question. Every other state is opened directly at `/{state}/handicap-placard`. See if I Qualify, Qualify Now, and Get Started on that page must include that state's code. See if I Qualify is followed to the walking question.

**Enter without a state.** Apply Now, Start Now, and Get Started are clicked from the homepage. Each one must open the welcome page with no state in the address. Qualify Now does the same, then each state is chosen from the portal list. The questions page must show that state, and the address still has no `?state=` code.

Washington DC is only in the portal list. After it is selected, the site says it is not open there. The test expects that message and does not look for the questions page.

The suite stops on the first question. Continue stays disabled. No name, email, phone, or card is entered.

## Local files

These stay on your machine:

| Path | What it is |
| --- | --- |
| `.env` | Optional local variables. Gitignored. |
| `.e2e/cache/` | Committed agent replays. A passing run leaves a matching replay as it is. |
| `.e2e/patients/` | Patient name and login after a failed checkout run. |
| `.e2e/results/` and `.e2e/report.json` | The latest run, screenshots, and traces. |

## Harbor Desk lab

`lab/` is a local practice app. It is not WellnessWag or ParkingMD.

```powershell
npm run lab
npm run test:lab
```

The lab login is `qa@clinic.test` / `clinic-pass`. It only exists inside that app.
