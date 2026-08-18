import fs from 'fs';
import path from 'path';

const read = (file: string) => fs.readFileSync(path.join(process.cwd(), file), 'utf8');

const workflows = [
  '.github/workflows/frontend-build.yml',
  '.github/workflows/render-deploy.yml',
  '.github/workflows/vir-frontend-regression.yml',
];

test('frontend release workflows use deterministic lockfile installs', () => {
  for (const file of workflows) {
    const source = read(file);
    expect(source).toContain('npm ci --no-audit --no-fund');
    expect(source).toContain('git diff --exit-code -- package-lock.json package.json');
    expect(source).not.toContain('npm install --no-audit --no-fund');
  }
});

test('frontend release workflows enforce typecheck and zero-warning lint', () => {
  for (const file of workflows) {
    const source = read(file);
    expect(source).toContain('npm run typecheck');
    expect(source).toContain('npm run lint:strict');
  }

  const pkg = JSON.parse(read('package.json'));
  expect(pkg.scripts.typecheck).toBe('tsc --noEmit --pretty false');
  expect(pkg.scripts['lint:strict']).toContain('--max-warnings=0');
  expect(pkg.scripts['quality:strict']).toContain('npm run typecheck');
  expect(pkg.scripts['quality:strict']).toContain('npm run lint:strict');
});

test('production builds are never allowed to downgrade CI strictness', () => {
  for (const file of workflows) {
    const source = read(file);
    expect(source).not.toMatch(/CI:\s*['"]?false['"]?/);
  }
});
