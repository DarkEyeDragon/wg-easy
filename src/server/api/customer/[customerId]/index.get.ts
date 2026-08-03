import { createError, getValidatedRouterParams } from 'h3';

import Database from '#server/utils/Database';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import { CustomerGetSchema } from '#db/repositories/customer/types';

export default definePermissionEventHandler(
  'customers',
  'view',
  async ({ event }) => {
    const { customerId } = await getValidatedRouterParams(
      event,
      validateZod(CustomerGetSchema, event)
    );

    const result = await Database.customers.get(customerId);

    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Customer not found',
      });
    }

    return result;
  }
);
