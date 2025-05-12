import cron from 'node-cron';
import { syncUsersFromDepartments } from '../admin/sync.service';

cron.schedule('*/30 * * * *', async () => {
  console.log('Running sync job');
  await syncUsersFromDepartments();
});
