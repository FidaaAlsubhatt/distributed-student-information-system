import { env, envFilePath } from './config/env';

console.log('Loading .env from:', envFilePath);
console.log('PORT from .env:', env.port);

import './jobs/scheduler'; // Starts background sync jobs
import app from './app';

const port = env.port;
console.log('Using PORT:', port);
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
