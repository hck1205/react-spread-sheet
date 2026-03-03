import { execSync } from 'node:child_process';
import path from 'node:path';

const FORBIDDEN_FILES = new Set([
  'index.html',
  'src/dev-main.tsx'
]);

function getPackedFiles() {
  const output = execSync('npm pack --dry-run --json', {
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_cache: path.join(process.cwd(), '.npm-cache')
    }
  });
  const packs = JSON.parse(output);

  if (!Array.isArray(packs) || packs.length === 0 || !Array.isArray(packs[0]?.files)) {
    throw new Error('Unable to read npm pack --dry-run result.');
  }

  return packs[0].files.map((file) => file.path);
}

const packedFiles = getPackedFiles();
const leaked = packedFiles.filter((path) => FORBIDDEN_FILES.has(path));

if (leaked.length > 0) {
  console.error('Publish blocked. Local test files were found in npm package:');
  for (const file of leaked) {
    console.error(`- ${file}`);
  }
  process.exit(1);
}

console.log('Publish package check passed. No local test files included.');
