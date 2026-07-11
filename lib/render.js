/**
 * Resumecraft — pure rendering engine.
 * Turns structured resume data into a full standalone HTML document
 * (used for the live preview iframe AND for Electron printToPDF),
 * or into an ATS-friendly plain-text export.
 *
 * No Electron, no DOM — plain Node/browser-safe JS so it can be smoke-tested.
 */

'use strict';

const TEMPLATES = [
  { id: 'classic',   name: 'Classic',   twoColumn: false, description: 'Single-column, serif headings. The safest ATS choice.' },
  { id: 'modern',    name: 'Modern',    twoColumn: true,  description: 'Two-column with a tinted sidebar for skills & contact.' },
  { id: 'minimal',   name: 'Minimal',   twoColumn: false, description: 'Lots of whitespace, thin rules, understated.' },
  { id: 'executive', name: 'Executive', twoColumn: false, description: 'Centered header, small caps, formal.' },
  { id: 'compact',   name: 'Compact',   twoColumn: false, description: 'Tighter spacing to fit more on one page.' },
  { id: 'tech',      name: 'Tech',      twoColumn: true,  description: 'Monospace accents, skills-forward sidebar.' },
  { id: 'elegant',   name: 'Elegant',   twoColumn: false, description: 'Accent color band, refined typography.' }
];

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function emptyResumeData() {
  return {
    contact: { name: '', title: '', email: '', phone: '', location: '', website: '', linkedin: '' },
    summary: '',
    experience: [], // { company, role, location, start, end, bullets: [] }
    education: [],  // { school, degree, location, start, end, notes }
    skills: [],     // strings
    projects: [],   // { name, link, description }
    custom: []      // { title, body }
  };
}

/* ---------------- section fragments (shared across templates) ---------------- */

function contactLine(c) {
  return [c.email, c.phone, c.location, c.website, c.linkedin]
    .filter(Boolean).map(esc).join('<span class="sep"> &bull; </span>');
}

function expHTML(items) {
  if (!items || !items.length) return '';
  return items.map(e => `
    <div class="item">
      <div class="item-head">
        <span class="item-role">${esc(e.role)}</span>
        <span class="item-dates">${esc(e.start)}${e.start || e.end ? ' – ' : ''}${esc(e.end)}</span>
      </div>
      <div class="item-sub">${esc(e.company)}${e.location ? ' · ' + esc(e.location) : ''}</div>
      ${e.bullets && e.bullets.filter(Boolean).length
        ? `<ul>${e.bullets.filter(Boolean).map(b => `<li>${esc(b)}</li>`).join('')}</ul>` : ''}
    </div>`).join('');
}

function eduHTML(items) {
  if (!items || !items.length) return '';
  return items.map(e => `
    <div class="item">
      <div class="item-head">
        <span class="item-role">${esc(e.degree)}</span>
        <span class="item-dates">${esc(e.start)}${e.start || e.end ? ' – ' : ''}${esc(e.end)}</span>
      </div>
      <div class="item-sub">${esc(e.school)}${e.location ? ' · ' + esc(e.location) : ''}</div>
      ${e.notes ? `<div class="item-notes">${esc(e.notes)}</div>` : ''}
    </div>`).join('');
}

function projHTML(items) {
  if (!items || !items.length) return '';
  return items.map(p => `
    <div class="item">
      <div class="item-head">
        <span class="item-role">${esc(p.name)}</span>
        ${p.link ? `<span class="item-dates">${esc(p.link)}</span>` : ''}
      </div>
      ${p.description ? `<div class="item-notes">${esc(p.description)}</div>` : ''}
    </div>`).join('');
}

function customHTML(items) {
  if (!items || !items.length) return '';
  return items.map(c => `
    <section>
      <h2>${esc(c.title || 'Section')}</h2>
      <div class="item-notes prewrap">${esc(c.body)}</div>
    </section>`).join('');
}

function skillsHTML(skills, style) {
  const list = (skills || []).filter(Boolean);
  if (!list.length) return '';
  if (style === 'tags') {
    return `<div class="skill-tags">${list.map(s => `<span class="tag">${esc(s)}</span>`).join('')}</div>`;
  }
  return `<div class="skills-line">${list.map(esc).join(' &bull; ')}</div>`;
}

/* ---------------- template CSS ---------------- */

const BASE_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  html, body { background: #fff; }
  body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a1a; font-size: 10.5pt; line-height: 1.42; }
  .page { width: 8.5in; min-height: 11in; margin: 0 auto; padding: 0.55in 0.65in; }
  h1 { font-size: 21pt; font-weight: 700; letter-spacing: 0.2px; }
  .headline { font-size: 11.5pt; color: #444; margin-top: 2px; }
  .contact { font-size: 9pt; color: #555; margin-top: 6px; }
  .sep { color: #999; }
  h2 { font-size: 10.5pt; text-transform: uppercase; letter-spacing: 1.4px; margin: 14px 0 6px; }
  section { margin-bottom: 4px; }
  .item { margin-bottom: 8px; }
  .item-head { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; }
  .item-role { font-weight: 600; }
  .item-dates { font-size: 9pt; color: #666; white-space: nowrap; }
  .item-sub { font-size: 9.5pt; color: #444; }
  .item-notes { font-size: 9.5pt; color: #333; margin-top: 2px; }
  .prewrap { white-space: pre-wrap; }
  ul { margin: 3px 0 0 16px; }
  li { margin-bottom: 2px; font-size: 9.8pt; }
  .summary { font-size: 10pt; color: #2a2a2a; }
  .skills-line { font-size: 9.8pt; }
  .skill-tags { display: flex; flex-wrap: wrap; gap: 5px; }
  .tag { border: 1px solid #ccc; border-radius: 4px; padding: 1px 7px; font-size: 8.8pt; }
  @page { size: letter; margin: 0; }
`;

const TEMPLATE_CSS = {
  classic: `
    h1, h2 { font-family: Georgia, 'Times New Roman', serif; }
    h2 { border-bottom: 1.5px solid #1a1a1a; padding-bottom: 2px; }
  `,
  modern: `
    .page { display: flex; gap: 0.35in; padding: 0; }
    .side { width: 2.5in; background: #eef2f7; padding: 0.55in 0.3in; min-height: 11in; }
    .main { flex: 1; padding: 0.55in 0.5in 0.55in 0; }
    h1 { font-size: 19pt; color: #1d3a5f; }
    h2 { color: #1d3a5f; border-bottom: 2px solid #1d3a5f; padding-bottom: 2px; }
    .side h2 { border-color: #b9c7d8; }
    .side .contact { margin-top: 0; }
    .side .contact div { margin-bottom: 4px; word-break: break-word; }
  `,
  minimal: `
    body { font-weight: 300; }
    h1 { font-weight: 400; font-size: 20pt; }
    h2 { font-weight: 500; letter-spacing: 2.5px; color: #888; border-bottom: 1px solid #e2e2e2; padding-bottom: 3px; }
    .item-role { font-weight: 500; }
  `,
  executive: `
    .header { text-align: center; border-bottom: 3px double #1a1a1a; padding-bottom: 10px; }
    h1 { font-family: Georgia, serif; font-variant: small-caps; letter-spacing: 1.5px; }
    h2 { font-family: Georgia, serif; text-align: center; letter-spacing: 3px; }
    .contact { text-align: center; }
  `,
  compact: `
    body { font-size: 9.5pt; line-height: 1.3; }
    .page { padding: 0.4in 0.5in; }
    h1 { font-size: 17pt; }
    h2 { margin: 9px 0 4px; border-bottom: 1px solid #333; padding-bottom: 1px; }
    .item { margin-bottom: 5px; }
    li { margin-bottom: 1px; font-size: 9.2pt; }
  `,
  tech: `
    .page { display: flex; gap: 0.35in; padding: 0; }
    .side { width: 2.4in; background: #101820; color: #dce3ea; padding: 0.55in 0.3in; min-height: 11in; }
    .main { flex: 1; padding: 0.55in 0.5in 0.55in 0; }
    .side h2 { color: #58c7a5; border-bottom: 1px solid #2c3945; }
    .side .contact { color: #aab6c2; }
    .side .contact div { margin-bottom: 4px; word-break: break-word; }
    .side .tag { border-color: #33424f; color: #cdd6de; }
    h1 { font-family: Consolas, 'Courier New', monospace; font-size: 18pt; }
    h2 { font-family: Consolas, monospace; color: #0c6b52; }
    .item-dates { font-family: Consolas, monospace; }
  `,
  elegant: `
    .band { background: #40355e; color: #fff; margin: -0.55in -0.65in 14px; padding: 0.45in 0.65in 0.35in; }
    .band h1 { color: #fff; }
    .band .headline { color: #d4cde8; }
    .band .contact { color: #c3bad9; }
    h2 { color: #40355e; border-bottom: 2px solid #40355e; padding-bottom: 2px; }
  `
};

const ATS_CSS = `
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; color: #000; font-size: 10.5pt; line-height: 1.45; background: #fff; }
  .page { width: 8.5in; min-height: 11in; margin: 0 auto; padding: 0.6in 0.7in; }
  h1 { font-size: 18pt; } .headline { font-size: 11pt; }
  .contact { font-size: 9.5pt; margin-top: 4px; }
  h2 { font-size: 11pt; text-transform: uppercase; margin: 12px 0 5px; border-bottom: 1px solid #000; padding-bottom: 2px; }
  .item { margin-bottom: 8px; }
  .item-head { display: block; }
  .item-role { font-weight: bold; }
  .item-dates { font-size: 9.5pt; }
  .item-sub { font-size: 10pt; }
  .item-notes { font-size: 10pt; }
  .prewrap { white-space: pre-wrap; }
  ul { margin: 3px 0 0 18px; }
  li { margin-bottom: 2px; }
  .skills-line { font-size: 10pt; }
  @page { size: letter; margin: 0; }
`;

/* ---------------- main HTML renderer ---------------- */

function bodySections(d, opts) {
  const parts = [];
  if (d.summary) parts.push(`<section><h2>Summary</h2><div class="summary prewrap">${esc(d.summary)}</div></section>`);
  if (d.experience && d.experience.length) parts.push(`<section><h2>Experience</h2>${expHTML(d.experience)}</section>`);
  if (d.education && d.education.length) parts.push(`<section><h2>Education</h2>${eduHTML(d.education)}</section>`);
  if (!opts.skillsInSidebar && d.skills && d.skills.filter(Boolean).length)
    parts.push(`<section><h2>Skills</h2>${skillsHTML(d.skills, opts.tags ? 'tags' : 'line')}</section>`);
  if (d.projects && d.projects.length) parts.push(`<section><h2>Projects</h2>${projHTML(d.projects)}</section>`);
  parts.push(customHTML(d.custom));
  return parts.join('\n');
}

function renderResumeHTML(data, templateId, options) {
  const opts = options || {};
  const d = Object.assign(emptyResumeData(), data || {});
  d.contact = Object.assign(emptyResumeData().contact, d.contact || {});
  const atsSafe = !!opts.atsSafe;
  const tpl = TEMPLATES.find(t => t.id === templateId) || TEMPLATES[0];
  const useTwoCol = !atsSafe && tpl.twoColumn;

  let inner;
  if (useTwoCol) {
    const contactBlock = [d.contact.email, d.contact.phone, d.contact.location, d.contact.website, d.contact.linkedin]
      .filter(Boolean).map(v => `<div>${esc(v)}</div>`).join('');
    inner = `
      <div class="page">
        <div class="side">
          <h1>${esc(d.contact.name)}</h1>
          <div class="headline">${esc(d.contact.title)}</div>
          <h2>Contact</h2><div class="contact">${contactBlock}</div>
          ${d.skills && d.skills.filter(Boolean).length ? `<h2>Skills</h2>${skillsHTML(d.skills, 'tags')}` : ''}
        </div>
        <div class="main">${bodySections(d, { skillsInSidebar: true })}</div>
      </div>`;
  } else {
    const headerOpen = tpl.id === 'executive' ? '<div class="header">' : (tpl.id === 'elegant' && !atsSafe ? '<div class="band">' : '<div>');
    inner = `
      <div class="page">
        ${headerOpen}
          <h1>${esc(d.contact.name)}</h1>
          ${d.contact.title ? `<div class="headline">${esc(d.contact.title)}</div>` : ''}
          <div class="contact">${contactLine(d.contact)}</div>
        </div>
        ${bodySections(d, { tags: false })}
      </div>`;
  }

  const css = atsSafe ? ATS_CSS : (BASE_CSS + (TEMPLATE_CSS[tpl.id] || ''));
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>${esc(d.contact.name || 'Resume')}</title>
<style>${css}</style></head>
<body>${inner}</body></html>`;
}

/* ---------------- plain-text export (for job portals) ---------------- */

function renderPlainText(data) {
  const d = Object.assign(emptyResumeData(), data || {});
  d.contact = Object.assign(emptyResumeData().contact, d.contact || {});
  const L = [];
  const rule = (t) => { L.push(''); L.push(t.toUpperCase()); L.push('-'.repeat(t.length)); };
  if (d.contact.name) L.push(d.contact.name.toUpperCase());
  if (d.contact.title) L.push(d.contact.title);
  const cl = [d.contact.email, d.contact.phone, d.contact.location, d.contact.website, d.contact.linkedin].filter(Boolean).join(' | ');
  if (cl) L.push(cl);
  if (d.summary) { rule('Summary'); L.push(d.summary); }
  if (d.experience && d.experience.length) {
    rule('Experience');
    d.experience.forEach(e => {
      L.push(`${e.role || ''}${e.company ? ' — ' + e.company : ''}${e.location ? ', ' + e.location : ''}`);
      if (e.start || e.end) L.push(`${e.start || ''} - ${e.end || ''}`);
      (e.bullets || []).filter(Boolean).forEach(b => L.push('* ' + b));
      L.push('');
    });
    L.pop();
  }
  if (d.education && d.education.length) {
    rule('Education');
    d.education.forEach(e => {
      L.push(`${e.degree || ''}${e.school ? ' — ' + e.school : ''}${e.location ? ', ' + e.location : ''}`);
      if (e.start || e.end) L.push(`${e.start || ''} - ${e.end || ''}`);
      if (e.notes) L.push(e.notes);
    });
  }
  if (d.skills && d.skills.filter(Boolean).length) { rule('Skills'); L.push(d.skills.filter(Boolean).join(', ')); }
  if (d.projects && d.projects.length) {
    rule('Projects');
    d.projects.forEach(p => {
      L.push(`${p.name || ''}${p.link ? ' (' + p.link + ')' : ''}`);
      if (p.description) L.push(p.description);
    });
  }
  (d.custom || []).forEach(c => { rule(c.title || 'Section'); if (c.body) L.push(c.body); });
  return L.join('\n').trim() + '\n';
}

module.exports = { TEMPLATES, emptyResumeData, renderResumeHTML, renderPlainText, esc };
