import { eq, sql } from 'drizzle-orm';

import { customer } from './schema';

import type { ID } from '#server/utils/types';
import type { DBType } from '#db/sqlite';
import { client } from '#db/schema';

const clientColumns = {
  privateKey: false,
  preSharedKey: false,
} as const;

function createPreparedStatement(db: DBType) {
  return {
    create: db
      .insert(customer)
      .values({ name: sql.placeholder('name') })
      .returning({ id: customer.id })
      .prepare(),
    update: db
      .update(customer)
      .set({ name: sql.placeholder('name') as never as string })
      .where(eq(customer.id, sql.placeholder('id')))
      .prepare(),
  };
}

export class CustomerService {
  #db: DBType;
  #statements: ReturnType<typeof createPreparedStatement>;

  constructor(db: DBType) {
    this.#db = db;
    this.#statements = createPreparedStatement(db);
  }

  getAll() {
    return this.#db.query.customer.findMany({
      with: { clients: { columns: clientColumns } },
      orderBy: (t, { asc }) => asc(t.name),
    });
  }

  get(id: ID) {
    return this.#db.query.customer.findFirst({
      where: eq(customer.id, id),
      with: { clients: { columns: clientColumns } },
    });
  }

  create(name: string) {
    return this.#statements.create.execute({ name });
  }

  update(id: ID, name: string) {
    return this.#statements.update.execute({ id, name });
  }

  delete(id: ID) {
    return this.#db.transaction(async (tx) => {
      await tx
        .update(client)
        .set({ customerId: null })
        .where(eq(client.customerId, id))
        .execute();

      await tx.delete(customer).where(eq(customer.id, id)).execute();
    });
  }
}
