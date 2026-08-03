<template>
  <BaseDialog :trigger-class="triggerClass">
    <template #trigger><slot /></template>
    <template #title>{{ $t('customer.deleteCustomer') }}</template>
    <template #description>
      {{ $t('customer.deleteDialog1') }}
      <strong>{{ customerName }}</strong
      >? {{ $t('customer.deleteDialog2') }}
    </template>
    <template #actions>
      <DialogClose as-child>
        <BasePrimaryButton>{{ $t('dialog.cancel') }}</BasePrimaryButton>
      </DialogClose>
      <DialogClose as-child>
        <BaseSecondaryButton @click="$emit('delete')">
          {{ $t('customer.deleteCustomer') }}
        </BaseSecondaryButton>
      </DialogClose>
    </template>
  </BaseDialog>
</template>

<script lang="ts" setup>
defineEmits(['delete']);
defineProps<{ triggerClass?: string; customerName: string }>();
</script>
