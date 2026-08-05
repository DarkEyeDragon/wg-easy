import { eq, sql, or, like, and } from 'drizzle-orm';
import { containsCidr, parseCidr } from 'cidr-tools';

import { client } from './schema';
import type {
  ClientCreateFromExistingType,
  ClientCreateType,
  ClientQueryType,
  UpdateClientType,
} from './types';

import Database from '#server/utils/Database';
import {
  buildRangeAddress,
  isRangeEligible,
  nextClientOctetInRange,
  nextIP,
  nextRangeOctet,
} from '#server/utils/ip';
import type { ID } from '#server/utils/types';
import { wg } from '#server/utils/wgHelper';
import type { DBType } from '#db/sqlite';
import { wgInterface, userConfig, customer } from '#db/schema';

function nextCopyName(name: string, existingNames: string[]) {
  const taken = new Set(existingNames);

  let candidate = `${name} (copy)`;
  let n = 2;

  while (taken.has(candidate)) {
    candidate = `${name} (copy) (${n})`;
    n++;
  }

  return candidate;
}

function createPreparedStatement(db: DBType) {
  return {
    findAll: db.query.client
      .findMany({
        with: {
          oneTimeLink: true,
        },
      })
      .prepare(),
    findById: db.query.client
      .findFirst({ where: eq(client.id, sql.placeholder('id')) })
      .prepare(),
    toggle: db
      .update(client)
      .set({ enabled: sql.placeholder('enabled') as never as boolean })
      .where(eq(client.id, sql.placeholder('id')))
      .prepare(),
    setCustomer: db
      .update(client)
      .set({
        customerId: sql.placeholder('customerId') as never as number | null,
      })
      .where(eq(client.id, sql.placeholder('id')))
      .prepare(),
    delete: db
      .delete(client)
      .where(eq(client.id, sql.placeholder('id')))
      .prepare(),
  };
}

export class ClientService {
  #db: DBType;
  #statements: ReturnType<typeof createPreparedStatement>;

  constructor(db: DBType) {
    this.#db = db;
    this.#statements = createPreparedStatement(db);
  }

  /**
   * Never return values directly from this function. Use {@link getAllPublic} instead.
   */
  async getAll() {
    const result = await this.#statements.findAll.execute();
    return result.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  /**
   * Returns all clients without sensitive data
   */
  async getAllPublic({ filter, sort }: ClientQueryType) {
    const filters = [];

    if (filter?.trim()) {
      const filterPattern = `%${filter?.toLowerCase()}%`;
      filters.push(
        or(
          like(client.name, filterPattern),
          like(client.ipv4Address, filterPattern),
          like(client.ipv6Address, filterPattern)
        )
      );
    }

    const result = await this.#db.query.client
      .findMany({
        with: {
          oneTimeLink: true,
        },
        where: and(...filters),
        columns: {
          privateKey: false,
          preSharedKey: false,
        },
        orderBy: (t, { asc, desc }) => {
          if (sort === 'desc') {
            return desc(t.name);
          } else {
            // default to asc
            return asc(t.name);
          }
        },
      })
      .execute();

    return result.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  /**
   * Returns all clients without sensitive data belonging to user
   */
  async getAllForUser(userId: ID, { filter, sort }: ClientQueryType) {
    const filters = [];

    if (filter?.trim()) {
      const filterPattern = `%${filter?.toLowerCase()}%`;
      filters.push(
        or(
          like(client.name, filterPattern),
          like(client.ipv4Address, filterPattern),
          like(client.ipv6Address, filterPattern)
        )
      );
    }

    const result = await this.#db.query.client
      .findMany({
        where: and(eq(client.userId, userId), ...filters),
        with: { oneTimeLink: true },
        columns: {
          privateKey: false,
          preSharedKey: false,
        },
        orderBy: (t, { asc, desc }) => {
          if (sort === 'desc') {
            return desc(t.name);
          } else {
            // default to asc
            return asc(t.name);
          }
        },
      })
      .execute();

    return result.map((row) => ({
      ...row,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    }));
  }

  get(id: ID) {
    return this.#statements.findById.execute({ id });
  }

  async create({ name, expiresAt, customerId, type }: ClientCreateType) {
    const privateKey = await wg.generatePrivateKey();
    const publicKey = await wg.getPublicKey(privateKey);
    const preSharedKey = await wg.generatePreSharedKey();

    return this.#db.transaction(async (tx) => {
      const clients = await tx.query.client.findMany().execute();
      const clientInterface = await tx.query.wgInterface
        .findFirst({
          where: eq(wgInterface.name, 'wg0'),
        })
        .execute();

      if (!clientInterface) {
        throw new Error('WireGuard interface not found');
      }

      const clientConfig = await tx.query.userConfig
        .findFirst({
          where: eq(userConfig.id, clientInterface.name),
        })
        .execute();

      if (!clientConfig) {
        throw new Error('WireGuard interface configuration not found');
      }

      const ipv4Cidr = parseCidr(clientInterface.ipv4Cidr);
      const ipv6Cidr = parseCidr(clientInterface.ipv6Cidr);
      const ipv6Address = nextIP(6, ipv6Cidr, clients);

      let ipv4Address: string;

      if (customerId != null && isRangeEligible(ipv4Cidr)) {
        const customerRow = await tx.query.customer
          .findFirst({ where: eq(customer.id, customerId) })
          .execute();

        if (!customerRow) {
          throw new Error('Customer not found');
        }

        let rangeOctet = customerRow.ipv4RangeOctet;

        if (rangeOctet == null) {
          const otherCustomers = await tx.query.customer.findMany().execute();
          const usedRangeOctets = new Set(
            otherCustomers
              .map((c) => c.ipv4RangeOctet)
              .filter((octet) => octet != null)
          );
          rangeOctet = nextRangeOctet(usedRangeOctets);

          await tx
            .update(customer)
            .set({ ipv4RangeOctet: rangeOctet })
            .where(eq(customer.id, customerId))
            .execute();
        }

        const lastOctet =
          type === 'router'
            ? clientConfig.defaultRouterOctet
            : nextClientOctetInRange(
                clientConfig.defaultClientOctet,
                new Set([clientConfig.defaultRouterOctet]),
                new Set(
                  clients
                    .filter((c) => c.customerId === customerId)
                    .map((c) => Number(c.ipv4Address.split('.').at(-1)))
                )
              );

        ipv4Address = buildRangeAddress(ipv4Cidr, rangeOctet, lastOctet);

        if (clients.some((c) => c.ipv4Address === ipv4Address)) {
          throw new Error(`IPv4 address ${ipv4Address} is already in use`, {
            cause: 'IPv4 address already assigned',
          });
        }
      } else {
        ipv4Address = nextIP(4, ipv4Cidr, clients);
      }

      return await tx
        .insert(client)
        .values({
          name,
          // TODO: properly assign user id
          userId: 1,
          interfaceId: 'wg0',
          customerId: customerId ?? null,
          expiresAt,
          privateKey,
          publicKey,
          preSharedKey,
          ipv4Address,
          ipv6Address,
          mtu: clientConfig.defaultMtu,
          jC: clientConfig.defaultJC,
          jMin: clientConfig.defaultJMin,
          jMax: clientConfig.defaultJMax,
          i1: clientConfig.defaultI1,
          i2: clientConfig.defaultI2,
          i3: clientConfig.defaultI3,
          i4: clientConfig.defaultI4,
          i5: clientConfig.defaultI5,
          persistentKeepalive: clientConfig.defaultPersistentKeepalive,
          serverAllowedIps: [],
          enabled: true,
        })
        .returning({ clientId: client.id })
        .execute();
    });
  }

  async duplicate(id: ID) {
    const source = await this.get(id);

    if (!source) {
      throw new Error('Client not found');
    }

    const privateKey = await wg.generatePrivateKey();
    const publicKey = await wg.getPublicKey(privateKey);
    const preSharedKey = await wg.generatePreSharedKey();

    return this.#db.transaction(async (tx) => {
      const clients = await tx.query.client.findMany().execute();
      const clientInterface = await tx.query.wgInterface
        .findFirst({
          where: eq(wgInterface.name, source.interfaceId),
        })
        .execute();

      if (!clientInterface) {
        throw new Error('WireGuard interface not found');
      }

      const ipv4Cidr = parseCidr(clientInterface.ipv4Cidr);
      const ipv4Address = nextIP(4, ipv4Cidr, clients);
      const ipv6Cidr = parseCidr(clientInterface.ipv6Cidr);
      const ipv6Address = nextIP(6, ipv6Cidr, clients);

      const name = nextCopyName(
        source.name,
        clients.map((c) => c.name)
      );

      return await tx
        .insert(client)
        .values({
          name,
          userId: source.userId,
          interfaceId: source.interfaceId,
          customerId: source.customerId,
          expiresAt: null,
          privateKey,
          publicKey,
          preSharedKey,
          ipv4Address,
          ipv6Address,
          preUp: source.preUp,
          postUp: source.postUp,
          preDown: source.preDown,
          postDown: source.postDown,
          allowedIps: source.allowedIps,
          serverAllowedIps: source.serverAllowedIps,
          firewallIps: source.firewallIps,
          mtu: source.mtu,
          jC: source.jC,
          jMin: source.jMin,
          jMax: source.jMax,
          i1: source.i1,
          i2: source.i2,
          i3: source.i3,
          i4: source.i4,
          i5: source.i5,
          persistentKeepalive: source.persistentKeepalive,
          serverEndpoint: source.serverEndpoint,
          dns: source.dns,
          enabled: true,
        })
        .returning({ clientId: client.id })
        .execute();
    });
  }

  toggle(id: ID, enabled: boolean) {
    return this.#statements.toggle.execute({ id, enabled });
  }

  setCustomer(id: ID, customerId: ID | null) {
    return this.#statements.setCustomer.execute({ id, customerId });
  }

  delete(id: ID) {
    return this.#statements.delete.execute({ id });
  }

  update(id: ID, data: UpdateClientType) {
    return this.#db.transaction(async (tx) => {
      const clientInterface = await tx.query.wgInterface
        .findFirst({
          where: eq(wgInterface.name, 'wg0'),
        })
        .execute();

      if (!clientInterface) {
        throw new Error('WireGuard interface not found');
      }

      if (!containsCidr(clientInterface.ipv4Cidr, data.ipv4Address)) {
        throw new Error('IPv4 address is not within the CIDR range');
      }

      if (!containsCidr(clientInterface.ipv6Cidr, data.ipv6Address)) {
        throw new Error('IPv6 address is not within the CIDR range');
      }

      await tx.update(client).set(data).where(eq(client.id, id)).execute();
    });
  }

  async createFromExisting({
    name,
    enabled,
    ipv4Address,
    ipv6Address,
    preSharedKey,
    privateKey,
    publicKey,
  }: ClientCreateFromExistingType) {
    const clientConfig = await Database.userConfigs.get();

    return this.#db
      .insert(client)
      .values({
        name,
        userId: 1,
        interfaceId: 'wg0',
        privateKey,
        publicKey,
        preSharedKey,
        ipv4Address,
        ipv6Address,
        mtu: clientConfig.defaultMtu,
        jC: clientConfig.defaultJC,
        jMin: clientConfig.defaultJMin,
        jMax: clientConfig.defaultJMax,
        i1: clientConfig.defaultI1,
        i2: clientConfig.defaultI2,
        i3: clientConfig.defaultI3,
        i4: clientConfig.defaultI4,
        allowedIps: clientConfig.defaultAllowedIps,
        dns: clientConfig.defaultDns,
        persistentKeepalive: clientConfig.defaultPersistentKeepalive,
        serverAllowedIps: [],
        enabled,
      })
      .execute();
  }
}
