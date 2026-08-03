<template>
  <p class="m-10 text-center text-sm text-gray-400 dark:text-neutral-400">
    {{ $t('customer.empty') }}<br /><br />
    <CustomersCreateDialog>
      <BaseSecondaryButton as="span">
        <IconsPlus class="mr-2 w-4" />
        <span class="text-sm">{{ $t('customer.new') }}</span>
      </BaseSecondaryButton>
    </CustomersCreateDialog>
  </p>
</template>
