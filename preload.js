'use strict';

const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('resumecraft', {
  listResumes: () => ipcRenderer.invoke('resumes:list'),
  getResume: (id) => ipcRenderer.invoke('resumes:get', id),
  createResume: (name) => ipcRenderer.invoke('resumes:create', name),
  updateResume: (id, patch) => ipcRenderer.invoke('resumes:update', id, patch),
  duplicateResume: (id) => ipcRenderer.invoke('resumes:duplicate', id),
  removeResume: (id) => ipcRenderer.invoke('resumes:remove', id),
  listTemplates: () => ipcRenderer.invoke('templates:list'),
  renderHTML: (data, templateId, opts) => ipcRenderer.invoke('render:html', data, templateId, opts),
  exportPDF: (data, templateId, opts, name) => ipcRenderer.invoke('export:pdf', data, templateId, opts, name),
  exportText: (data, name) => ipcRenderer.invoke('export:text', data, name),
  plainText: (data) => ipcRenderer.invoke('clipboard:text', data)
});
