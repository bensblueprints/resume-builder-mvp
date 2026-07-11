'use strict';

const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { renderResumeHTML, renderPlainText, TEMPLATES } = require('./lib/render');
const { ResumeStore } = require('./lib/store');

let win = null;
let store = null;

function createWindow() {
  win = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 1000,
    minHeight: 640,
    backgroundColor: '#0b0e14',
    title: 'Resumecraft',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    }
  });
  win.removeMenu();
  win.loadFile(path.join(__dirname, 'renderer', 'index.html'));
}

app.whenReady().then(() => {
  store = new ResumeStore(path.join(app.getPath('userData'), 'data'));
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });

/* ---------------- IPC: storage ---------------- */
ipcMain.handle('resumes:list', () => store.list());
ipcMain.handle('resumes:get', (e, id) => store.get(id));
ipcMain.handle('resumes:create', (e, name) => store.create(name));
ipcMain.handle('resumes:update', (e, id, patch) => store.update(id, patch));
ipcMain.handle('resumes:duplicate', (e, id) => store.duplicate(id));
ipcMain.handle('resumes:remove', (e, id) => store.remove(id));
ipcMain.handle('templates:list', () => TEMPLATES);

/* ---------------- IPC: preview render ---------------- */
ipcMain.handle('render:html', (e, data, templateId, opts) =>
  renderResumeHTML(data, templateId, opts));

/* ---------------- IPC: exports ---------------- */
ipcMain.handle('export:pdf', async (e, data, templateId, opts, suggestedName) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Export PDF',
    defaultPath: (suggestedName || 'resume') + '.pdf',
    filters: [{ name: 'PDF', extensions: ['pdf'] }]
  });
  if (canceled || !filePath) return { ok: false, canceled: true };

  const html = renderResumeHTML(data, templateId, opts);
  const printWin = new BrowserWindow({ show: false, webPreferences: { sandbox: false } });
  try {
    await printWin.loadURL('data:text/html;charset=utf-8,' + encodeURIComponent(html));
    const pdf = await printWin.webContents.printToPDF({
      pageSize: 'Letter',
      printBackground: true,
      margins: { marginType: 'none' }
    });
    fs.writeFileSync(filePath, pdf);
    return { ok: true, path: filePath };
  } catch (err) {
    return { ok: false, error: String(err && err.message || err) };
  } finally {
    printWin.destroy();
  }
});

ipcMain.handle('export:text', async (e, data, suggestedName) => {
  const { canceled, filePath } = await dialog.showSaveDialog(win, {
    title: 'Export plain text (ATS)',
    defaultPath: (suggestedName || 'resume') + '.txt',
    filters: [{ name: 'Text', extensions: ['txt'] }]
  });
  if (canceled || !filePath) return { ok: false, canceled: true };
  fs.writeFileSync(filePath, renderPlainText(data), 'utf8');
  return { ok: true, path: filePath };
});

ipcMain.handle('clipboard:text', (e, data) => renderPlainText(data));
