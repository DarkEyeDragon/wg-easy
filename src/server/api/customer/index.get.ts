import Database from '#server/utils/Database';
import { definePermissionEventHandler } from '#server/utils/handler';

export default definePermissionEventHandler('customers', 'view', async () => {
  return Database.customers.getAll();
});
