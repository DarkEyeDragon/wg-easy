<template>
  <template v-for="group in groupedClients" :key="group.customer?.id ?? 'none'">
    <div
      v-if="showHeaders"
      class="flex items-center justify-between border-b border-solid border-gray-100 bg-gray-50 px-3 py-2 text-sm font-medium text-gray-500 dark:border-neutral-600 dark:bg-neutral-800 dark:text-neutral-400"
    >
      <span>{{
        group.customer ? group.customer.name : $t('customer.ungrouped')
      }}</span>
      <NuxtLink
        v-if="group.customer"
        :to="`/customers/${group.customer.id}`"
        class="text-xs font-normal text-gray-400 hover:text-red-800 dark:text-neutral-400 dark:hover:text-red-800"
      >
        {{ $t('customer.manage') }}
      </NuxtLink>
    </div>
    <div
      v-for="client in group.clients"
      :key="client.id"
      class="relative overflow-hidden border-b border-solid border-gray-100 last:border-b-0 dark:border-neutral-600"
    >
      <ClientCard :client="client" />
    </div>
  </template>
</template>

<script setup lang="ts">
const clientsStore = useClientsStore();
const customersStore = useCustomersStore();

customersStore.refresh();

const groupedClients = computed(() => {
  const clients = clientsStore.clients ?? [];
  const customers = customersStore.customers ?? [];

  const byCustomer = new Map<number, LocalClient[]>();
  const unassigned: LocalClient[] = [];

  for (const client of clients) {
    if (client.customerId == null) {
      unassigned.push(client);
      continue;
    }
    const bucket = byCustomer.get(client.customerId) ?? [];
    bucket.push(client);
    byCustomer.set(client.customerId, bucket);
  }

  const groups: { customer: LocalCustomer | null; clients: LocalClient[] }[] =
    customers
      .filter((customer) => byCustomer.has(customer.id))
      .sort((a, b) => a.name.localeCompare(b.name))
      .map((customer) => ({
        customer,
        clients: byCustomer.get(customer.id)!,
      }));

  if (unassigned.length > 0) {
    groups.push({ customer: null, clients: unassigned });
  }

  return groups;
});

// Only label groups once there's an actual customer to distinguish from —
// a user who's never used the feature still sees a plain flat list.
const showHeaders = computed(() =>
  groupedClients.value.some((group) => group.customer !== null)
);
</script>
