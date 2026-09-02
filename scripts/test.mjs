import { spawnSync } from 'node:child_process';

const build = spawnSync('npm', ['run', 'build'], { stdio: 'inherit', shell: false });
if (build.status !== 0) process.exit(build.status ?? 1);

const tests = spawnSync('npx', ['playwright', 'test', ...process.argv.slice(2)], {
  stdio: 'inherit',
  shell: false,
});
process.exit(tests.status ?? 1);
