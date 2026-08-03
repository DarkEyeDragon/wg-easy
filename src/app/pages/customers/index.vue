<template>
  <main>
    <Panel>
      <PanelHead>
        <PanelHeadTitle>
          {{ $t('pages.customers') }}
        </PanelHeadTitle>
        <PanelHeadBoat>
          <CustomersNew />
        </PanelHeadBoat>
      </PanelHead>

      <div>
        <CustomersList
          v-if="customersStore.customers && customersStore.customers.length > 0"
        />
      </div>
      <CustomersEmpty
        v-if="customersStore.customers && customersStore.customers.length === 0"
      />
      <div
        v-if="customersStore.customers === null"
        class="p-5 text-gray-200 dark:text-red-300"
      >
        <IconsLoading class="mx-auto w-5 animate-spin" />
      </div>
    </Panel>
  </main>
</template>

<script setup lang="ts">
const customersStore = useCustomersStore();

customersStore.refresh();
</script>
