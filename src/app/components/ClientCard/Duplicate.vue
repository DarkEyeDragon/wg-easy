<template>
  <button
    class="rounded bg-gray-100 p-2 align-middle transition hover:bg-red-800 hover:text-white dark:bg-neutral-600 dark:text-neutral-300 dark:hover:bg-red-800 dark:hover:text-white"
    :title="$t('client.duplicate')"
    @click="duplicateClient"
  >
    <IconsDuplicate class="w-5" />
  </button>
</template>

<script setup lang="ts">
const props = defineProps<{
  client: LocalClient;
}>();

const clientsStore = useClientsStore();
const { t } = useI18n();

const _duplicateClient = useSubmit(
  (data) =>
    $fetch(`/api/client/${props.client.id}/duplicate`, {
      method: 'post',
      body: data,
    }),
  {
    revert: async (success, res) => {
      await clientsStore.refresh();
      if (success && res) {
        await navigateTo(`/clients/${res.clientId}`);
      }
    },
    successMsg: t('client.duplicated'),
  }
);

function duplicateClient() {
  return _duplicateClient(undefined);
}
</script>
