import type { InferSelectModel } from 'drizzle-orm';
import z from 'zod';

import type { userConfig } from './schema';

import {
  AllowedIpsSchema,
  DnsSchema,
  ISchema,
  JcSchema,
  JmaxSchema,
  JminSchema,
  MtuSchema,
  PersistentKeepaliveSchema,
  PortSchema,
  safeStringRefine,
  schemaForType,
  t,
} from '#server/utils/types';

export type UserConfigType = InferSelectModel<typeof userConfig>;

const host = z
  .string({ message: t('zod.userConfig.host') })
  .min(1, t('zod.userConfig.host'))
  .pipe(safeStringRefine);

export const UserConfigSetupSchema = z.object({
  host: host,
  port: PortSchema,
});

const defaultRouterOctet = z
  .number({ message: t('zod.userConfig.defaultRouterOctet') })
  .int()
  .min(1)
  .max(254);

const defaultClientOctet = z
  .number({ message: t('zod.userConfig.defaultClientOctet') })
  .int()
  .min(1)
  .max(254);

export type UserConfigUpdateType = Omit<
  UserConfigType,
  'id' | 'createdAt' | 'updatedAt'
>;

export const UserConfigUpdateSchema = schemaForType<UserConfigUpdateType>()(
  z.object({
    port: PortSchema,
    defaultMtu: MtuSchema,
    defaultPersistentKeepalive: PersistentKeepaliveSchema,
    defaultDns: DnsSchema,
    defaultAllowedIps: AllowedIpsSchema,
    defaultJC: JcSchema,
    defaultJMin: JminSchema,
    defaultJMax: JmaxSchema,
    defaultI1: ISchema,
    defaultI2: ISchema,
    defaultI3: ISchema,
    defaultI4: ISchema,
    defaultI5: ISchema,
    defaultRouterOctet: defaultRouterOctet,
    defaultClientOctet: defaultClientOctet,
    host: host,
  })
);
