<template>
  <NuxtLink
    v-for="customer in customersStore.customers"
    :key="customer.id"
    :to="`/customers/${customer.id}`"
    class="flex items-center justify-between gap-3 border-b border-solid border-gray-100 px-3 py-3 last:border-b-0 hover:bg-gray-50 md:py-5 dark:border-neutral-600 dark:hover:bg-neutral-600"
  >
    <span class="font-medium">{{ customer.name }}</span>
    <span class="text-sm text-gray-400 dark:text-neutral-400">
      {{ $t('customer.clientCount', customer.clients.length) }}
    </span>
  </NuxtLink>
</template>

<script setup lang="ts">
const customersStore = useCustomersStore();
</script>
