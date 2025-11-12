// src/server.js
import app from './server/app.js';

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`[INFO] API escuchando en :${PORT}`);
});
