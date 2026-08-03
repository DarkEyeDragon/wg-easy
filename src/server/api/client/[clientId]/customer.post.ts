import { getValidatedRouterParams, readValidatedBody } from 'h3';

import Database from '#server/utils/Database';
import { definePermissionEventHandler } from '#server/utils/handler';
import { validateZod } from '#server/utils/types';
import {
  ClientGetSchema,
  ClientSetCustomerSchema,
} from '#db/repositories/client/types';

export default definePermissionEventHandler(
  'clients',
  'update',
  async ({ event, checkPermissions }) => {
    const { clientId } = await getValidatedRouterParams(
      event,
      validateZod(ClientGetSchema, event)
    );

    const { customerId } = await readValidatedBody(
      event,
      validateZod(ClientSetCustomerSchema, event)
    );

    const client = await Database.clients.get(clientId);
    checkPermissions(client);

    await Database.clients.setCustomer(clientId, customerId);

    return { success: true };
  }
);
