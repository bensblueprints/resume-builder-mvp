/**
 * Runs inside Electron (spawned by test/smoke.js).
 * Renders the fixture resume with the real render engine and exports a real
 * PDF via printToPDF — the exact code path the Export PDF button uses.
 * Usage: electron test/pdf-runner.js <templateId> <outFile>
 */
'use strict';

const { app, BrowserWindow } = require('electron');
const fs = require('fs');
const path = require('path');
const { renderResumeHTML } = require('../lib/render');

const templateId = process.argv[2] || 'classic';
const outFile = process.argv[3] || path.join(__dirname, 'out', 'resume.pdf');

// Isolated userData so the test never collides with a running app instance.
app.setPath('userData', path.join(require('os').tmpdir(), 'resumecraft-pdf-test-' + process.pid));
app.disableHardwareAcceleration();

app.whenReady().then(async () => {
  try {
    const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'fixtures', 'sample-resume.json'), 'utf8'));
    const html = renderResumeHTML(data, templateId, { atsSafe: false });
    const win = new BrowserWindow({ show: false, webPreferences: { sandbox: false } });
    await win.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const pdf = await win.webContents.printToPDF({
      pageSize: 'Letter',
      printBackground: true,
      margins: { marginType: 'none' }
    });
    fs.mkdirSync(path.dirname(outFile), { recursive: true });
    fs.writeFileSync(outFile, pdf);
    console.log('PDF_OK ' + outFile + ' ' + pdf.length);
    app.exit(0);
  } catch (err) {
    console.error('PDF_FAIL ' + (err && err.stack || err));
    app.exit(1);
  }
});
