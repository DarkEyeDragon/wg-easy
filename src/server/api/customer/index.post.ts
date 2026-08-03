import { readValidatedBody } from 'h3';

import Database from '#server/utils/Database';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import { CustomerCreateSchema } from '#db/repositories/customer/types';

export default definePermissionEventHandler(
  'customers',
  'create',
  async ({ event }) => {
    const { name } = await readValidatedBody(
      event,
      validateZod(CustomerCreateSchema, event)
    );

    const result = await Database.customers.create(name);
    const customerId = result[0]!.id;
    return { success: true, customerId };
  }
);
