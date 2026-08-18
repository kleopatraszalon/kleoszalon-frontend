'use strict';

const fs = require('fs');
const path = require('path');

const gitCommit = String(
  process.env.RENDER_GIT_COMMIT ||
  process.env.GITHUB_SHA ||
  process.env.REACT_APP_RENDER_GIT_COMMIT ||
  'unknown',
).trim();

const repository = String(
  process.env.RENDER_GIT_REPO_SLUG ||
  process.env.GITHUB_REPOSITORY ||
  'kleopatraszalon/kleoszalon-frontend',
).trim();

const branch = String(
  process.env.RENDER_GIT_BRANCH ||
  process.env.GITHUB_REF_NAME ||
  'unknown',
).trim();

const target = path.join(process.cwd(), 'public', 'release-meta.json');
fs.mkdirSync(path.dirname(target), { recursive: true });
fs.writeFileSync(
  target,
  `${JSON.stringify({
    component: 'frontend',
    repository,
    branch,
    git_commit: gitCommit,
  }, null, 2)}\n`,
  'utf8',
);

console.log(`Frontend release metadata written: ${gitCommit}`);
