import { sql, relations } from 'drizzle-orm';
import { int, sqliteTable, text } from 'drizzle-orm/sqlite-core';

import { client } from '../client/schema';

export const customer = sqliteTable('customers_table', {
  id: int().primaryKey({ autoIncrement: true }),
  name: text().notNull(),
  /** third octet of this customer's address block, e.g. 5 for 10.8.5.x. Assigned lazily on first use. */
  ipv4RangeOctet: int('ipv4_range_octet'),
  createdAt: text('created_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`),
  updatedAt: text('updated_at')
    .notNull()
    .default(sql`(CURRENT_TIMESTAMP)`)
    .$onUpdate(() => sql`(CURRENT_TIMESTAMP)`),
});

export const customersRelations = relations(customer, ({ many }) => ({
  clients: many(client),
}));
