const KEY = 'harbor-desk';
const ACCOUNT = { email: 'qa@clinic.test', password: 'clinic-pass' };

const SEED = {
  user: null,
  tasks: [
    { id: 't1', title: 'Walk the lobby', done: false },
    { id: 't2', title: 'Print the roster', done: true },
  ],
  intakes: [],
  settings: { digests: false, compact: false, night: false },
};

const PATIENTS = [
  { name: 'Maya Chen', reason: 'Follow-up', status: 'Waiting' },
  { name: 'Luis Ortega', reason: 'Sick visit', status: 'In room' },
  { name: 'Priya Shah', reason: 'Forms', status: 'Checked out' },
  { name: 'Jonah Hale', reason: 'Sick visit', status: 'Waiting' },
];

const REASONS = ['Sick visit', 'Follow-up', 'Forms'];
const PROVIDERS = ['Dr. Ibarra', 'Dr. Okonkwo', 'Dr. Singh'];

const state = load();
const view = {
  taskFilter: 'all',
  taskError: '',
  loginError: '',
  patientQuery: '',
  patientStatus: 'All statuses',
  sort: 'none',
  intakeStep: 1,
  intakeError: '',
  draft: blankDraft(),
  receipt: null,
  dialog: null,
  menuOpen: false,
  queue: 'Not checked yet',
  queueBusy: false,
};

const app = document.getElementById('app');
app.addEventListener('click', onClick);
app.addEventListener('submit', onSubmit);
app.addEventListener('change', onChange);
app.addEventListener('input', onInput);
document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && view.dialog) {
    event.preventDefault();
    view.dialog = null;
    render();
  }
});
window.addEventListener('resize', applyChrome);

boot();

function blankDraft() {
  return { first: '', last: '', email: '', reason: '', provider: '', consent: false, fileName: '' };
}

function load() {
  const raw = localStorage.getItem(KEY);
  if (!raw) return structuredClone(SEED);
  try {
    const parsed = JSON.parse(raw);
    return {
      user: parsed.user ?? null,
      tasks: Array.isArray(parsed.tasks) ? parsed.tasks : structuredClone(SEED.tasks),
      intakes: Array.isArray(parsed.intakes) ? parsed.intakes : [],
      settings: { ...SEED.settings, ...(parsed.settings ?? {}) },
    };
  } catch {
    return structuredClone(SEED);
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
}

function boot() {
  const path = location.pathname;
  if (!state.user && path !== '/login') history.replaceState({}, '', '/login');
  if (state.user && (path === '/' || path === '/login')) history.replaceState({}, '', '/board');
  if (!state.user && path === '/') history.replaceState({}, '', '/login');
  applySettings();
  render();
}

function pathNow() {
  return location.pathname;
}

function esc(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;',
  })[char]);
}

function render() {
  const path = pathNow();
  if (!state.user) {
    document.title = 'Sign in · Harbor Desk';
    app.innerHTML = loginPage();
    document.getElementById('email')?.focus();
    return;
  }
  const page = pageFor(path);
  document.title = `${page.title} · Harbor Desk`;
  app.innerHTML = shell(page.title, page.body);
  applyChrome();
  document.querySelector('[role="dialog"] [data-autofocus]')?.focus();
}

function pageFor(path) {
  if (path === '/board') return { title: "Today's board", body: boardPage() };
  if (path === '/patients') return { title: 'Patients', body: patientsPage() };
  if (path === '/intake') return { title: 'New intake', body: intakePage() };
  if (path === '/settings') return { title: 'Settings', body: settingsPage() };
  return { title: 'That page is not on the desk', body: missingPage() };
}

function loginPage() {
  return `<main class="login">
    <section class="card stack">
      <p class="kicker">Harbor Desk</p>
      <h1>Sign in</h1>
      <p class="lede">The front desk for a small clinic. This copy is only for practice.</p>
      ${view.loginError ? `<p id="login-alert" class="alert" role="alert">${esc(view.loginError)}</p>` : ''}
      <form class="stack" data-action="login-form">
        <label>Email <input id="email" type="email" autocomplete="username" data-autofocus></label>
        <label>Password <input id="password" type="password" autocomplete="current-password"></label>
        <button type="submit">Sign in</button>
      </form>
      <p class="hint">Practice account <strong>qa@clinic.test</strong> / <strong>clinic-pass</strong>.</p>
      <p><a href="/guide.html">Open the lesson</a></p>
    </section>
  </main>`;
}

function shell(title, body) {
  const links = [
    ['/board', 'Board'],
    ['/patients', 'Patients'],
    ['/intake', 'Intake'],
    ['/settings', 'Settings'],
  ];
  const path = pathNow();
  return `<div class="shell">
    <header class="top">
      <a class="brand" href="/board">Harbor Desk</a>
      <button type="button" id="open-menu" data-action="menu" hidden>Open menu</button>
      <nav id="primary-nav" aria-label="Primary">
        ${links.map(([href, label]) => `<a href="${href}" ${path === href ? 'aria-current="page"' : ''}>${label}</a>`).join('')}
      </nav>
      <a class="quiet" href="/guide.html">Lesson</a>
      <button type="button" class="ghost" data-action="sign-out">Sign out</button>
    </header>
    <main>
      <section class="panel">
        <h1>${esc(title)}</h1>
        ${body}
      </section>
    </main>
  </div>`;
}

function boardPage() {
  const tabs = [
    ['all', 'All'],
    ['open', 'Open'],
    ['done', 'Done'],
  ];
  return `
    <p id="open-count" class="count" role="status" aria-label="Open tasks">${esc(openLabel())}</p>
    <form class="row" data-action="add-task-form">
      <label class="field">New task
        <input id="new-task" type="text" placeholder="Walk the lobby">
      </label>
      <button type="submit">Add task</button>
    </form>
    <p id="task-alert" class="alert" role="alert" ${view.taskError ? '' : 'hidden'}>${esc(view.taskError)}</p>
    <div class="tabs" role="tablist" aria-label="Task filter">
      ${tabs.map(([id, label]) => `<button type="button" role="tab" data-action="filter" data-filter="${id}" aria-selected="${view.taskFilter === id}">${label}</button>`).join('')}
    </div>
    <ul id="task-list" class="tasks" aria-label="Tasks">
      ${state.tasks.map(taskItem).join('')}
    </ul>
    <p id="empty-tasks" ${visibleTasks().length ? 'hidden' : ''}>No tasks on this filter.</p>
    <p class="row"><button type="button" class="ghost" id="clear-finished" data-action="clear-finished" ${state.tasks.some((task) => task.done) ? '' : 'disabled'}>Clear finished</button></p>
    ${deleteDialog()}`;
}

function taskItem(task) {
  return `<li class="task" data-task="${task.id}" ${taskMatchesFilter(task) ? '' : 'hidden'}>
    <label>
      <input type="checkbox" data-action="toggle-task" data-id="${task.id}" ${task.done ? 'checked' : ''}>
      <span>${esc(task.title)}</span>
    </label>
    <button type="button" class="ghost" data-action="delete-task" data-id="${task.id}" aria-label="Delete ${esc(task.title)}">Delete</button>
  </li>`;
}

function deleteDialog() {
  if (view.dialog?.type !== 'delete') return '';
  const task = state.tasks.find((item) => item.id === view.dialog.id);
  if (!task) return '';
  return `<div class="overlay"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="delete-title" tabindex="-1">
    <h2 id="delete-title">Delete this task?</h2>
    <p>${esc(task.title)} will be removed from the board.</p>
    <div class="row">
      <button type="button" class="ghost" data-action="cancel-dialog" data-autofocus>Keep task</button>
      <button type="button" class="danger" data-action="confirm-delete">Delete task</button>
    </div>
  </div></div>`;
}

function patientsPage() {
  return `
    <div class="toolbar">
      <label class="field">Search patients
        <input id="patient-search" type="search" value="${esc(view.patientQuery)}">
      </label>
      <label class="field">Status
        <select id="patient-status">
          ${['All statuses', 'Waiting', 'In room', 'Checked out'].map((status) => `<option ${view.patientStatus === status ? 'selected' : ''}>${status}</option>`).join('')}
        </select>
      </label>
      <button type="button" id="sort-name" data-action="sort-name" aria-pressed="${view.sort !== 'none'}">Sort by name</button>
      <button type="button" data-action="refresh-queue" ${view.queueBusy ? 'disabled' : ''}>Refresh queue</button>
      <span class="tip">
        <button type="button" class="ghost" aria-describedby="queue-tip">Queue legend</button>
        <span role="tooltip" id="queue-tip">Waiting means the patient is still in the lobby.</span>
      </span>
      <button type="button" class="ghost" data-action="export-csv">Export CSV</button>
    </div>
    <p id="sort-status" role="status" aria-label="Sort">${esc(sortLabel())}</p>
    <p id="patient-results" role="status" aria-label="Patient results">${esc(resultsLabel(visiblePatients()))}</p>
    <div role="progressbar" aria-label="Checking the queue" ${view.queueBusy ? '' : 'hidden'}></div>
    <p id="queue-status" role="status" aria-label="Queue">${esc(view.queue)}</p>
    <table>
      <caption>Patients on today's list</caption>
      <thead>
        <tr>
          <th scope="col">Name</th>
          <th scope="col">Reason</th>
          <th scope="col">Status</th>
          <th scope="col">Slip</th>
        </tr>
      </thead>
      <tbody id="patient-rows">${visiblePatients().map(patientRow).join('')}</tbody>
    </table>
    ${slipDialog()}`;
}

function patientRow(patient) {
  return `<tr>
    <th scope="row">${esc(patient.name)}</th>
    <td>${esc(patient.reason)}</td>
    <td>${esc(patient.status)}</td>
    <td><button type="button" class="ghost" data-action="open-slip" data-name="${esc(patient.name)}">Slip for ${esc(patient.name)}</button></td>
  </tr>`;
}

function slipDialog() {
  if (view.dialog?.type !== 'slip') return '';
  const name = view.dialog.name;
  return `<div class="overlay"><div class="dialog" role="dialog" aria-modal="true" aria-labelledby="slip-title" tabindex="-1">
    <h2 id="slip-title">Visit slip</h2>
    <iframe title="Visit slip" src="/slip.html?name=${encodeURIComponent(name)}"></iframe>
    <p class="row"><button type="button" class="ghost" data-action="cancel-dialog" data-autofocus>Close slip</button></p>
  </div></div>`;
}

function intakePage() {
  if (view.receipt) return receipt(view.receipt);
  const step = view.intakeStep;
  return `
    <p role="status" aria-label="Progress">Step ${step} of 3</p>
    ${view.intakeError ? `<p class="alert" role="alert">${esc(view.intakeError)}</p>` : ''}
    ${step === 1 ? stepOne() : ''}
    ${step === 2 ? stepTwo() : ''}
    ${step === 3 ? stepThree() : ''}`;
}

function stepOne() {
  const draft = view.draft;
  return `<form class="stack" data-action="intake-next">
    <h2>Who is the patient?</h2>
    <label>First name <input id="draft-first" value="${esc(draft.first)}" autocomplete="given-name"></label>
    <label>Last name <input id="draft-last" value="${esc(draft.last)}" autocomplete="family-name"></label>
    <label>Email <input id="draft-email" type="email" value="${esc(draft.email)}" autocomplete="email"></label>
    <p class="row"><button type="submit">Next</button></p>
  </form>`;
}

function stepTwo() {
  const draft = view.draft;
  return `<form class="stack" data-action="intake-next">
    <h2>Why are they here?</h2>
    <fieldset class="choices">
      <legend>Visit reason</legend>
      ${REASONS.map((reason) => `<label><input type="radio" name="reason" value="${esc(reason)}" ${draft.reason === reason ? 'checked' : ''}> ${esc(reason)}</label>`).join('')}
    </fieldset>
    <label>Provider
      <select id="provider">
        <option value="">Choose a provider</option>
        ${PROVIDERS.map((provider) => `<option value="${esc(provider)}" ${draft.provider === provider ? 'selected' : ''}>${esc(provider)}</option>`).join('')}
      </select>
    </label>
    <p class="row">
      <button type="button" class="ghost" data-action="intake-back">Back</button>
      <button type="submit">Next</button>
    </p>
  </form>`;
}

function stepThree() {
  const draft = view.draft;
  const attachment = draft.fileName ? `Attached ${draft.fileName}` : 'No file attached';
  return `<form class="stack" data-action="intake-save">
    <h2>Consent</h2>
    <label class="file">Insurance card <input id="insurance" type="file"></label>
    <p id="attachment" role="status" aria-label="Attachment">${esc(attachment)}</p>
    <label><input id="consent" type="checkbox" ${draft.consent ? 'checked' : ''}> Patient consented to treatment</label>
    <p class="row">
      <button type="button" class="ghost" data-action="intake-back">Back</button>
      <button type="submit">Save intake</button>
    </p>
  </form>`;
}

function receipt(intake) {
  return `
    <p role="status" aria-label="Intake">Saved intake for ${esc(intake.patient)}.</p>
    <dl class="receipt">
      <dt>Patient</dt><dd>${esc(intake.patient)}</dd>
      <dt>Visit reason</dt><dd>${esc(intake.reason)}</dd>
      <dt>Provider</dt><dd>${esc(intake.provider)}</dd>
      <dt>Insurance card</dt><dd>${esc(intake.fileName || 'None')}</dd>
    </dl>
    <p class="row"><button type="button" data-action="intake-reset">Start another intake</button></p>`;
}

function settingsPage() {
  return `
    <p id="appearance" role="status" aria-label="Appearance">${esc(appearance())}</p>
    ${switchRow('digests', 'Email digests')}
    ${switchRow('compact', 'Compact rows')}
    ${switchRow('night', 'Night theme')}`;
}

function switchRow(key, label) {
  return `<label class="switch"><input type="checkbox" role="switch" data-setting="${key}" ${state.settings[key] ? 'checked' : ''}> <span>${label}</span></label>`;
}

function missingPage() {
  return `<p>Nothing is published at this address.</p><p><a href="/board">Back to the board</a></p>`;
}

function onClick(event) {
  const actionEl = event.target.closest('[data-action]');
  if (!actionEl || actionEl.closest('form') && actionEl.type === 'submit') return;
  const action = actionEl.dataset.action;
  if (action === 'menu') {
    view.menuOpen = !view.menuOpen;
    applyChrome();
  } else if (action === 'sign-out') {
    state.user = null;
    save();
    location.assign('/login');
  } else if (action === 'filter') {
    view.taskFilter = actionEl.dataset.filter;
    for (const tab of document.querySelectorAll('[role="tab"]')) {
      tab.setAttribute('aria-selected', String(tab.dataset.filter === view.taskFilter));
    }
    applyTaskFilter();
  } else if (action === 'delete-task') {
    view.dialog = { type: 'delete', id: actionEl.dataset.id };
    render();
  } else if (action === 'cancel-dialog') {
    view.dialog = null;
    render();
  } else if (action === 'confirm-delete') {
    const id = view.dialog?.id;
    state.tasks = state.tasks.filter((task) => task.id !== id);
    view.dialog = null;
    save();
    render();
  } else if (action === 'clear-finished') {
    clearFinished();
  } else if (action === 'sort-name') {
    view.sort = view.sort === 'az' ? 'za' : 'az';
    paintPatients();
  } else if (action === 'refresh-queue') {
    void refreshQueue();
  } else if (action === 'export-csv') {
    exportCsv();
  } else if (action === 'open-slip') {
    view.dialog = { type: 'slip', name: actionEl.dataset.name };
    render();
  } else if (action === 'intake-back') {
    captureIntake();
    view.intakeError = '';
    view.intakeStep = Math.max(1, view.intakeStep - 1);
    render();
  } else if (action === 'intake-reset') {
    view.receipt = null;
    view.draft = blankDraft();
    view.intakeStep = 1;
    view.intakeError = '';
    render();
  }
}

function onSubmit(event) {
  const form = event.target;
  const action = form.dataset?.action;
  if (!action) return;
  event.preventDefault();
  if (action === 'login-form') signIn();
  else if (action === 'add-task-form') addTask();
  else if (action === 'intake-next') goNext();
  else if (action === 'intake-save') saveIntake();
}

function onChange(event) {
  const input = event.target;
  if (input.dataset.action === 'toggle-task') {
    const task = state.tasks.find((item) => item.id === input.dataset.id);
    if (!task) return;
    task.done = input.checked;
    save();
    const count = document.getElementById('open-count');
    if (count) count.textContent = openLabel();
    const clear = document.getElementById('clear-finished');
    if (clear) clear.disabled = !state.tasks.some((item) => item.done);
    applyTaskFilter();
    return;
  }
  if (input.dataset.setting) {
    state.settings[input.dataset.setting] = input.checked;
    save();
    applySettings();
    const status = document.getElementById('appearance');
    if (status) status.textContent = appearance();
    return;
  }
  if (input.id === 'patient-status') {
    view.patientStatus = input.value;
    paintPatients();
    return;
  }
  if (input.id === 'insurance') {
    const file = input.files && input.files[0];
    view.draft.fileName = file ? file.name : '';
    const status = document.getElementById('attachment');
    if (status) status.textContent = file ? `Attached ${file.name}` : 'No file attached';
  }
}

function onInput(event) {
  if (event.target.id !== 'patient-search') return;
  view.patientQuery = event.target.value;
  paintPatients();
}

function signIn() {
  const email = document.getElementById('email').value.trim().toLowerCase();
  const password = document.getElementById('password').value;
  if (!email || !password) {
    view.loginError = 'Enter your email and password.';
    render();
    return;
  }
  if (email !== ACCOUNT.email || password !== ACCOUNT.password) {
    view.loginError = 'That password does not match.';
    render();
    return;
  }
  state.user = email;
  save();
  location.assign('/board');
}

function addTask() {
  const input = document.getElementById('new-task');
  const title = input.value.trim();
  const alert = document.getElementById('task-alert');
  if (!title) {
    view.taskError = 'Enter a task before adding it.';
    alert.hidden = false;
    alert.textContent = view.taskError;
    return;
  }
  view.taskError = '';
  alert.hidden = true;
  const task = { id: uid(), title, done: false };
  state.tasks.unshift(task);
  save();
  input.value = '';
  document.getElementById('task-list').insertAdjacentHTML('afterbegin', taskItem(task));
  document.getElementById('open-count').textContent = openLabel();
  const clear = document.getElementById('clear-finished');
  if (clear) clear.disabled = false;
  applyTaskFilter();
}

function clearFinished() {
  if (!state.tasks.some((task) => task.done)) return;
  if (!confirm('Remove every finished task?')) return;
  const removed = state.tasks.filter((task) => task.done);
  state.tasks = state.tasks.filter((task) => !task.done);
  save();
  for (const task of removed) document.querySelector(`[data-task="${task.id}"]`)?.remove();
  document.getElementById('open-count').textContent = openLabel();
  const clear = document.getElementById('clear-finished');
  if (clear) clear.disabled = true;
  applyTaskFilter();
}

function applyTaskFilter() {
  for (const item of document.querySelectorAll('[data-task]')) {
    const task = state.tasks.find((entry) => entry.id === item.dataset.task);
    item.hidden = !(task && taskMatchesFilter(task));
  }
  const empty = document.getElementById('empty-tasks');
  if (empty) empty.hidden = visibleTasks().length > 0;
}

function taskMatchesFilter(task) {
  if (view.taskFilter === 'open') return !task.done;
  if (view.taskFilter === 'done') return task.done;
  return true;
}

function visibleTasks() {
  return state.tasks.filter(taskMatchesFilter);
}

function openLabel() {
  return `${state.tasks.filter((task) => !task.done).length} open`;
}

function visiblePatients() {
  const query = view.patientQuery.trim().toLowerCase();
  let rows = PATIENTS.filter((patient) => {
    const matchesQuery = !query
      || patient.name.toLowerCase().includes(query)
      || patient.reason.toLowerCase().includes(query);
    const matchesStatus = view.patientStatus === 'All statuses' || patient.status === view.patientStatus;
    return matchesQuery && matchesStatus;
  });
  if (view.sort === 'az') rows = [...rows].sort((a, b) => a.name.localeCompare(b.name));
  if (view.sort === 'za') rows = [...rows].sort((a, b) => b.name.localeCompare(a.name));
  return rows;
}

function paintPatients() {
  const rows = visiblePatients();
  const tbody = document.getElementById('patient-rows');
  const results = document.getElementById('patient-results');
  const sort = document.getElementById('sort-status');
  const button = document.getElementById('sort-name');
  if (tbody) tbody.innerHTML = rows.map(patientRow).join('');
  if (results) results.textContent = resultsLabel(rows);
  if (sort) sort.textContent = sortLabel();
  if (button) button.setAttribute('aria-pressed', String(view.sort !== 'none'));
}

function resultsLabel(rows) {
  if (rows.length === 0) return 'No patients match.';
  if (rows.length === 1) return '1 patient';
  return `${rows.length} patients`;
}

function sortLabel() {
  if (view.sort === 'az') return 'Sorted A to Z';
  if (view.sort === 'za') return 'Sorted Z to A';
  return 'Not sorted';
}

async function refreshQueue() {
  view.queueBusy = true;
  render();
  try {
    const response = await fetch('/api/queue');
    if (!response.ok) throw new Error('Queue request failed');
    const data = await response.json();
    view.queue = data.phrase || 'The queue could not be checked.';
  } catch {
    view.queue = 'The queue could not be checked.';
  } finally {
    view.queueBusy = false;
    render();
  }
}

function exportCsv() {
  const lines = ['Name,Reason,Status', ...visiblePatients().map((patient) => `${patient.name},${patient.reason},${patient.status}`)];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'patients.csv';
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

function captureIntake() {
  if (view.intakeStep === 1) {
    const first = document.getElementById('draft-first');
    const last = document.getElementById('draft-last');
    const email = document.getElementById('draft-email');
    if (!first) return;
    view.draft.first = first.value;
    view.draft.last = last.value;
    view.draft.email = email.value;
  }
  if (view.intakeStep === 2) {
    const provider = document.getElementById('provider');
    if (!provider) return;
    const checked = document.querySelector('input[name="reason"]:checked');
    view.draft.reason = checked ? checked.value : '';
    view.draft.provider = provider.value;
  }
  if (view.intakeStep === 3) {
    const consent = document.getElementById('consent');
    if (consent) view.draft.consent = consent.checked;
  }
}

function goNext() {
  captureIntake();
  if (!intakeStepValid()) {
    render();
    return;
  }
  view.intakeError = '';
  view.intakeStep += 1;
  render();
}

function intakeStepValid() {
  if (view.intakeStep === 1) {
    const email = view.draft.email.trim();
    const emailOk = email.includes('@') && email.includes('.');
    if (!view.draft.first.trim() || !view.draft.last.trim() || !emailOk) {
      view.intakeError = 'Enter a first name, last name, and email.';
      return false;
    }
  }
  if (view.intakeStep === 2 && (!view.draft.reason || !view.draft.provider)) {
    view.intakeError = 'Choose a visit reason and a provider.';
    return false;
  }
  return true;
}

function saveIntake() {
  captureIntake();
  if (!view.draft.consent) {
    view.intakeError = 'Confirm the patient consented before saving.';
    render();
    return;
  }
  const intake = {
    patient: `${view.draft.first.trim()} ${view.draft.last.trim()}`,
    reason: view.draft.reason,
    provider: view.draft.provider,
    fileName: view.draft.fileName,
  };
  state.intakes.unshift(intake);
  save();
  view.receipt = intake;
  view.intakeError = '';
  render();
}

function appearance() {
  const theme = state.settings.night ? 'Night theme' : 'Day theme';
  const rows = state.settings.compact ? 'compact rows' : 'regular rows';
  const mail = state.settings.digests ? 'digests on' : 'digests off';
  return `${theme}, ${rows}, ${mail}`;
}

function applySettings() {
  document.documentElement.classList.toggle('night', state.settings.night);
  document.documentElement.classList.toggle('compact', state.settings.compact);
}

function applyChrome() {
  const menu = document.getElementById('open-menu');
  const nav = document.getElementById('primary-nav');
  if (!menu || !nav) return;
  const narrow = window.matchMedia('(max-width: 720px)').matches;
  menu.hidden = !narrow;
  const open = narrow && view.menuOpen;
  menu.setAttribute('aria-expanded', String(open));
  menu.textContent = open ? 'Close menu' : 'Open menu';
  nav.hidden = narrow && !view.menuOpen;
}

function uid() {
  return `t${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}
