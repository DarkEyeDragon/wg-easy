import type { InferSelectModel } from 'drizzle-orm';
import z from 'zod';

import type { customer } from './schema';

import { controlStringRefine, safeStringRefine, t } from '#server/utils/types';

export type CustomerType = InferSelectModel<typeof customer>;

const name = z
  .string({ message: t('zod.customer.name') })
  .min(1, t('zod.customer.name'))
  .pipe(safeStringRefine)
  .pipe(controlStringRefine);

export const CustomerCreateSchema = z.object({
  name: name,
});

export const CustomerUpdateSchema = z.object({
  name: name,
});

const customerId = z.coerce.number({ message: t('zod.customer.id') });

export const CustomerGetSchema = z.object({
  customerId: customerId,
});
