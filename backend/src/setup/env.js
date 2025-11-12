import fs from 'fs'; import path from 'path'; import url from 'url';
const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '../../'); const envFile = path.join(root, '.env');
if (fs.existsSync(envFile)) {
  const txt = fs.readFileSync(envFile, 'utf8');
  for (const line of txt.split(/\r?\n/)) {
    const m = line.match(/^([^#=]+)=(.*)$/); if (m && !(m[1] in process.env)) process.env[m[1]] = m[2];
  }
}
