/**
 * Resumecraft — local JSON storage for resume versions.
 * One file per profile at <dataDir>/resumes.json. 100% local, no network.
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { emptyResumeData } = require('./render');

class ResumeStore {
  constructor(dataDir) {
    this.dataDir = dataDir;
    this.file = path.join(dataDir, 'resumes.json');
    this._load();
  }

  _load() {
    try {
      this.db = JSON.parse(fs.readFileSync(this.file, 'utf8'));
      if (!Array.isArray(this.db.resumes)) this.db = { resumes: [] };
    } catch (e) {
      this.db = { resumes: [] };
    }
  }

  _save() {
    fs.mkdirSync(this.dataDir, { recursive: true });
    const tmp = this.file + '.tmp';
    fs.writeFileSync(tmp, JSON.stringify(this.db, null, 2), 'utf8');
    fs.renameSync(tmp, this.file);
  }

  list() {
    return this.db.resumes.map(r => ({
      id: r.id, name: r.name, template: r.template, updatedAt: r.updatedAt
    }));
  }

  get(id) {
    return this.db.resumes.find(r => r.id === id) || null;
  }

  create(name) {
    const r = {
      id: 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
      name: name || 'Untitled resume',
      template: 'classic',
      atsSafe: false,
      data: emptyResumeData(),
      updatedAt: new Date().toISOString()
    };
    this.db.resumes.unshift(r);
    this._save();
    return r;
  }

  update(id, patch) {
    const r = this.get(id);
    if (!r) return null;
    if (patch.name !== undefined) r.name = patch.name;
    if (patch.template !== undefined) r.template = patch.template;
    if (patch.atsSafe !== undefined) r.atsSafe = !!patch.atsSafe;
    if (patch.data !== undefined) r.data = patch.data;
    r.updatedAt = new Date().toISOString();
    this._save();
    return r;
  }

  duplicate(id) {
    const r = this.get(id);
    if (!r) return null;
    const copy = JSON.parse(JSON.stringify(r));
    copy.id = 'r_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
    copy.name = r.name + ' (copy)';
    copy.updatedAt = new Date().toISOString();
    this.db.resumes.unshift(copy);
    this._save();
    return copy;
  }

  remove(id) {
    const before = this.db.resumes.length;
    this.db.resumes = this.db.resumes.filter(r => r.id !== id);
    this._save();
    return this.db.resumes.length < before;
  }
}

module.exports = { ResumeStore };
