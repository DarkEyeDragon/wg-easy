import { getValidatedRouterParams, readValidatedBody } from 'h3';

import Database from '#server/utils/Database';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import {
  CustomerGetSchema,
  CustomerUpdateSchema,
} from '#db/repositories/customer/types';

export default definePermissionEventHandler(
  'customers',
  'update',
  async ({ event }) => {
    const { customerId } = await getValidatedRouterParams(
      event,
      validateZod(CustomerGetSchema, event)
    );

    const { name } = await readValidatedBody(
      event,
      validateZod(CustomerUpdateSchema, event)
    );

    await Database.customers.update(customerId, name);

    return { success: true };
  }
);
