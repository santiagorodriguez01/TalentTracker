import swaggerUi from 'swagger-ui-express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const specPath = path.resolve(__dirname, '../../docs/openapi.json');
const spec = JSON.parse(fs.readFileSync(specPath, 'utf8'));

export function mountDocs(app) {
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
}
