import { execSync } from 'node:child_process';

const ignoredOutdated = new Set(['eslint', '@eslint/js']);
const npmBin = process.platform === 'win32' ? 'npm.cmd' : 'npm';

let raw = '{}';
try {
  raw = execSync(`${npmBin} outdated --json`, { stdio: ['ignore', 'pipe', 'pipe'] }).toString().trim() || '{}';
} catch (error) {
  const stdout = error?.stdout?.toString?.().trim();
  raw = stdout || '{}';
}

const outdated = JSON.parse(raw || '{}');
const names = Object.keys(outdated);

if (names.length === 0) {
  console.log('All dependencies are up to date.');
  process.exit(0);
}

const actionable = names.filter((name) => !ignoredOutdated.has(name));
const ignored = names.filter((name) => ignoredOutdated.has(name));

if (ignored.length > 0) {
  console.log('Ignored known compatibility-blocked packages:');
  for (const name of ignored) {
    const dep = outdated[name];
    console.log(`- ${name}: current=${dep.current}, latest=${dep.latest}`);
  }
}

if (actionable.length > 0) {
  console.error('Outdated dependencies require action:');
  for (const name of actionable) {
    const dep = outdated[name];
    console.error(`- ${name}: current=${dep.current}, wanted=${dep.wanted}, latest=${dep.latest}`);
  }
  process.exit(1);
}

console.log('No actionable outdated dependencies.');
