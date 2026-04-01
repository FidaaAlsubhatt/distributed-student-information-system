import dotenv from 'dotenv';
import path from 'path';

console.log('Loading .env from:', path.resolve(__dirname, '../.env'));
dotenv.config({ path: path.resolve(__dirname, '../.env') });
console.log('PORT from .env:', process.env.PORT);

import './jobs/scheduler'; // Starts background sync jobs
import app from './app';

const port = process.env.PORT || 3001;
console.log('Using PORT:', port);
app.listen(port, () => {
  console.log(`🚀 Server running at http://localhost:${port}`);
});
