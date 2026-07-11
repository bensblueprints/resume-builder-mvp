'use strict';
/* Resumecraft renderer — form editor + live preview, all state through preload API. */

const api = window.resumecraft;

let current = null;        // full resume record { id, name, template, atsSafe, data }
let saveTimer = null;
let renderTimer = null;

const $ = (sel) => document.querySelector(sel);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text !== undefined) n.textContent = text;
  return n;
};

function toast(msg, ms = 2200) {
  const t = $('#toast');
  t.textContent = msg;
  t.classList.remove('hidden');
  clearTimeout(toast._t);
  toast._t = setTimeout(() => t.classList.add('hidden'), ms);
}

/* ---------------- sidebar list ---------------- */

async function refreshList() {
  const list = await api.listResumes();
  const box = $('#resume-list');
  box.innerHTML = '';
  list.forEach(r => {
    const item = el('div', 'resume-item' + (current && r.id === current.id ? ' active' : ''));
    item.appendChild(el('div', 'ri-name', r.name));
    item.appendChild(el('div', 'ri-meta', `${r.template} · ${new Date(r.updatedAt).toLocaleDateString()}`));
    item.onclick = () => openResume(r.id);
    box.appendChild(item);
  });
}

async function openResume(id) {
  current = await api.getResume(id);
  if (!current) return;
  $('#empty-state').classList.add('hidden');
  $('#editor-body').classList.remove('hidden');
  populateForm();
  await refreshList();
  schedulePreview(true);
}

function showEmpty() {
  current = null;
  $('#empty-state').classList.remove('hidden');
  $('#editor-body').classList.add('hidden');
  $('#preview-frame').srcdoc = '<html><body style="font-family:sans-serif;color:#999;display:flex;align-items:center;justify-content:center;height:100vh">No resume selected</body></html>';
}

/* ---------------- form <-> data ---------------- */

function populateForm() {
  const d = current.data;
  $('#resume-name').value = current.name;
  document.querySelectorAll('[data-c]').forEach(inp => { inp.value = (d.contact && d.contact[inp.dataset.c]) || ''; });
  $('#f-summary').value = d.summary || '';
  $('#f-skills').value = (d.skills || []).join('\n');
  $('#template-select').value = current.template;
  $('#ats-toggle').checked = !!current.atsSafe;
  renderExpList(); renderEduList(); renderProjList(); renderCustomList();
}

function collectContactAndText() {
  const d = current.data;
  d.contact = d.contact || {};
  document.querySelectorAll('[data-c]').forEach(inp => { d.contact[inp.dataset.c] = inp.value; });
  d.summary = $('#f-summary').value;
  d.skills = $('#f-skills').value.split(/[\n,]/).map(s => s.trim()).filter(Boolean);
}

function onFormChanged() {
  if (!current) return;
  collectContactAndText();
  scheduleSave();
  schedulePreview();
}

function scheduleSave() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(async () => {
    if (!current) return;
    await api.updateResume(current.id, {
      name: $('#resume-name').value,
      template: current.template,
      atsSafe: current.atsSafe,
      data: current.data
    });
    refreshList();
  }, 450);
}

/* ---------------- experience entries ---------------- */

function entryToolbar(arr, i, rerender) {
  const head = el('div', 'entry-head');
  const up = el('button', 'btn', '↑'); up.title = 'Move up';
  const down = el('button', 'btn', '↓'); down.title = 'Move down';
  const del = el('button', 'btn btn-danger', '✕'); del.title = 'Remove';
  up.onclick = () => { if (i > 0) { [arr[i - 1], arr[i]] = [arr[i], arr[i - 1]]; rerender(); onFormChanged(); } };
  down.onclick = () => { if (i < arr.length - 1) { [arr[i + 1], arr[i]] = [arr[i], arr[i + 1]]; rerender(); onFormChanged(); } };
  del.onclick = () => { arr.splice(i, 1); rerender(); onFormChanged(); };
  head.append(up, down, del);
  return head;
}

function fieldInput(obj, key, placeholder, labelText) {
  const lab = el('label', null, labelText);
  const inp = el('input');
  inp.placeholder = placeholder;
  inp.value = obj[key] || '';
  inp.oninput = () => { obj[key] = inp.value; onFormChanged(); };
  lab.appendChild(inp);
  return lab;
}

function renderExpList() {
  const d = current.data;
  d.experience = d.experience || [];
  const box = $('#exp-list');
  box.innerHTML = '';
  d.experience.forEach((e2, i) => {
    const card = el('div', 'entry');
    card.appendChild(entryToolbar(d.experience, i, renderExpList));
    const g = el('div', 'grid2');
    g.append(
      fieldInput(e2, 'role', 'Senior Engineer', 'Role'),
      fieldInput(e2, 'company', 'Acme Corp', 'Company'),
      fieldInput(e2, 'location', 'Remote', 'Location'),
      fieldInput(e2, 'start', 'Jan 2022', 'Start'),
      fieldInput(e2, 'end', 'Present', 'End')
    );
    card.appendChild(g);

    e2.bullets = e2.bullets || [];
    const bulletsBox = el('div');
    const renderBullets = () => {
      bulletsBox.innerHTML = '';
      e2.bullets.forEach((b, bi) => {
        const row = el('div', 'bullet-row');
        const inp = el('input');
        inp.placeholder = 'Achievement with a number (e.g. Cut build times 40%)';
        inp.value = b;
        inp.oninput = () => { e2.bullets[bi] = inp.value; onFormChanged(); };
        const rm = el('button', 'btn', '✕');
        rm.onclick = () => { e2.bullets.splice(bi, 1); renderBullets(); onFormChanged(); };
        row.append(inp, rm);
        bulletsBox.appendChild(row);
      });
    };
    renderBullets();
    card.appendChild(bulletsBox);
    const addB = el('button', 'btn btn-add', '+ Bullet point');
    addB.onclick = () => { e2.bullets.push(''); renderBullets(); onFormChanged(); };
    card.appendChild(addB);
    box.appendChild(card);
  });
}

function renderEduList() {
  const d = current.data;
  d.education = d.education || [];
  const box = $('#edu-list');
  box.innerHTML = '';
  d.education.forEach((e2, i) => {
    const card = el('div', 'entry');
    card.appendChild(entryToolbar(d.education, i, renderEduList));
    const g = el('div', 'grid2');
    g.append(
      fieldInput(e2, 'degree', 'B.S. Computer Science', 'Degree'),
      fieldInput(e2, 'school', 'State University', 'School'),
      fieldInput(e2, 'location', 'Austin, TX', 'Location'),
      fieldInput(e2, 'start', '2016', 'Start'),
      fieldInput(e2, 'end', '2020', 'End'),
      fieldInput(e2, 'notes', 'GPA 3.8, Dean’s List', 'Notes')
    );
    card.appendChild(g);
    box.appendChild(card);
  });
}

function renderProjList() {
  const d = current.data;
  d.projects = d.projects || [];
  const box = $('#proj-list');
  box.innerHTML = '';
  d.projects.forEach((p, i) => {
    const card = el('div', 'entry');
    card.appendChild(entryToolbar(d.projects, i, renderProjList));
    const g = el('div', 'grid2');
    g.append(fieldInput(p, 'name', 'Side Project', 'Name'), fieldInput(p, 'link', 'github.com/you/project', 'Link'));
    card.appendChild(g);
    const lab = el('label', null, 'Description');
    const ta = el('textarea');
    ta.rows = 2;
    ta.value = p.description || '';
    ta.oninput = () => { p.description = ta.value; onFormChanged(); };
    lab.appendChild(ta);
    card.appendChild(lab);
    box.appendChild(card);
  });
}

function renderCustomList() {
  const d = current.data;
  d.custom = d.custom || [];
  const box = $('#custom-list');
  box.innerHTML = '';
  d.custom.forEach((c, i) => {
    const card = el('div', 'entry');
    card.appendChild(entryToolbar(d.custom, i, renderCustomList));
    card.appendChild(fieldInput(c, 'title', 'Certifications', 'Section title'));
    const lab = el('label', null, 'Content');
    const ta = el('textarea');
    ta.rows = 3;
    ta.value = c.body || '';
    ta.oninput = () => { c.body = ta.value; onFormChanged(); };
    lab.appendChild(ta);
    card.appendChild(lab);
    box.appendChild(card);
  });
}

/* ---------------- preview + overflow warning ---------------- */

function schedulePreview(immediate) {
  clearTimeout(renderTimer);
  renderTimer = setTimeout(renderPreview, immediate ? 0 : 220);
}

async function renderPreview() {
  if (!current) return;
  const html = await api.renderHTML(current.data, current.template, { atsSafe: current.atsSafe });
  const frame = $('#preview-frame');
  frame.srcdoc = html;
  frame.onload = () => {
    try {
      const doc = frame.contentDocument;
      const pageHeightPx = 11 * 96; // Letter at 96dpi
      const contentH = doc.body.scrollHeight;
      $('#overflow-warning').classList.toggle('hidden', contentH <= pageHeightPx + 4);
    } catch (e) { /* cross-origin shouldn't happen with srcdoc */ }
  };
}

/* ---------------- toolbar wiring ---------------- */

async function init() {
  // templates dropdown
  const templates = await api.listTemplates();
  const sel = $('#template-select');
  templates.forEach(t => {
    const o = el('option', null, t.name + (t.twoColumn ? ' (2-col)' : ''));
    o.value = t.id;
    o.title = t.description;
    sel.appendChild(o);
  });

  sel.onchange = () => { if (current) { current.template = sel.value; scheduleSave(); schedulePreview(true); } };
  $('#ats-toggle').onchange = (e) => { if (current) { current.atsSafe = e.target.checked; scheduleSave(); schedulePreview(true); } };

  $('#btn-new').onclick = async () => {
    const r = await api.createResume('Untitled resume');
    await openResume(r.id);
    $('#resume-name').focus();
    $('#resume-name').select();
  };

  $('#btn-duplicate').onclick = async () => {
    if (!current) return;
    const copy = await api.duplicateResume(current.id);
    toast('Duplicated — tailor this copy for the next application');
    await openResume(copy.id);
  };

  $('#btn-delete').onclick = async () => {
    if (!current) return;
    if (!confirm(`Delete "${current.name}"? This cannot be undone.`)) return;
    await api.removeResume(current.id);
    showEmpty();
    await refreshList();
  };

  $('#resume-name').oninput = scheduleSave;
  $('#f-summary').oninput = onFormChanged;
  $('#f-skills').oninput = onFormChanged;
  document.querySelectorAll('[data-c]').forEach(inp => { inp.oninput = onFormChanged; });

  $('#btn-add-exp').onclick = () => { current.data.experience.push({ role: '', company: '', location: '', start: '', end: '', bullets: [''] }); renderExpList(); onFormChanged(); };
  $('#btn-add-edu').onclick = () => { current.data.education.push({ degree: '', school: '', location: '', start: '', end: '', notes: '' }); renderEduList(); onFormChanged(); };
  $('#btn-add-proj').onclick = () => { current.data.projects.push({ name: '', link: '', description: '' }); renderProjList(); onFormChanged(); };
  $('#btn-add-custom').onclick = () => { current.data.custom.push({ title: '', body: '' }); renderCustomList(); onFormChanged(); };

  $('#btn-export-pdf').onclick = async () => {
    if (!current) return;
    const res = await api.exportPDF(current.data, current.template, { atsSafe: current.atsSafe }, current.name.replace(/[^\w\- ]+/g, ''));
    if (res.ok) toast('PDF saved → ' + res.path);
    else if (!res.canceled) toast('Export failed: ' + res.error);
  };

  $('#btn-export-txt').onclick = async () => {
    if (!current) return;
    const res = await api.exportText(current.data, current.name.replace(/[^\w\- ]+/g, ''));
    if (res.ok) toast('Text saved → ' + res.path);
  };

  $('#btn-copy-text').onclick = async () => {
    if (!current) return;
    const txt = await api.plainText(current.data);
    await navigator.clipboard.writeText(txt);
    toast('Plain-text resume copied to clipboard');
  };

  // open first resume or show empty state
  const list = await api.listResumes();
  await refreshList();
  if (list.length) await openResume(list[0].id);
  else showEmpty();
}

init();
