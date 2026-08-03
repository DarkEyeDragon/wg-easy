import { getValidatedRouterParams } from 'h3';

import Database from '#server/utils/Database';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import { CustomerGetSchema } from '#db/repositories/customer/types';

export default definePermissionEventHandler(
  'customers',
  'delete',
  async ({ event }) => {
    const { customerId } = await getValidatedRouterParams(
      event,
      validateZod(CustomerGetSchema, event)
    );

    await Database.customers.delete(customerId);

    return { success: true };
  }
);
