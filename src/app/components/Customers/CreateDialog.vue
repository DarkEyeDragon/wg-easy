<template>
  <BaseDialog :trigger-class="triggerClass">
    <template #trigger>
      <slot />
    </template>
    <template #title>
      {{ $t('customer.new') }}
    </template>
    <template #description>
      <div class="flex flex-col">
        <FormTextField id="name" v-model="name" :label="$t('customer.name')" />
      </div>
    </template>
    <template #actions>
      <DialogClose as-child>
        <BaseSecondaryButton>{{ $t('dialog.cancel') }}</BaseSecondaryButton>
      </DialogClose>
      <DialogClose as-child>
        <BasePrimaryButton @click="createCustomer">
          {{ $t('customer.create') }}
        </BasePrimaryButton>
      </DialogClose>
    </template>
  </BaseDialog>
</template>

<script lang="ts" setup>
const name = ref<string>('');
const customersStore = useCustomersStore();

const { t } = useI18n();

defineProps<{ triggerClass?: string }>();

function createCustomer() {
  return _createCustomer({ name: name.value });
}

const _createCustomer = useSubmit(
  (data) =>
    $fetch('/api/customer', {
      method: 'post',
      body: data,
    }),
  {
    revert: () => customersStore.refresh(),
    successMsg: t('customer.created'),
  }
);
</script>
