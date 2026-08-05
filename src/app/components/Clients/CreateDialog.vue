<template>
  <BaseDialog :trigger-class="triggerClass">
    <template #trigger>
      <slot />
    </template>
    <template #title>
      {{ $t('client.new') }}
    </template>
    <template #description>
      <div class="flex flex-col gap-2">
        <FormTextField id="name" v-model="name" :label="$t('client.name')" />
        <FormDateField
          id="expiresAt"
          v-model="expiresAt"
          :label="$t('client.expireDate')"
        />

        <div>
          <FormLabel for="customer">{{ $t('customer.customer') }}</FormLabel>
          <SelectRoot v-model="customerSelectValue">
            <SelectTrigger
              id="customer"
              class="inline-flex h-8 w-full items-center justify-between gap-2 rounded bg-gray-200 px-3 text-sm leading-none dark:bg-neutral-500 dark:text-neutral-200"
            >
              <SelectValue :placeholder="$t('customer.none')" />
              <IconsArrowDown class="size-3" />
            </SelectTrigger>
            <SelectPortal>
              <SelectContent
                class="z-[100] min-w-28 rounded bg-gray-300 dark:bg-neutral-500"
              >
                <SelectViewport class="p-2">
                  <SelectItem
                    value="none"
                    class="relative flex h-6 items-center rounded px-3 text-sm leading-none outline-none hover:bg-red-800 hover:text-white dark:text-white"
                  >
                    <SelectItemText>{{ $t('customer.none') }}</SelectItemText>
                  </SelectItem>
                  <SelectItem
                    v-for="option in customersStore.customers"
                    :key="option.id"
                    :value="String(option.id)"
                    class="relative flex h-6 items-center rounded px-3 text-sm leading-none outline-none hover:bg-red-800 hover:text-white dark:text-white"
                  >
                    <SelectItemText>{{ option.name }}</SelectItemText>
                  </SelectItem>
                </SelectViewport>
              </SelectContent>
            </SelectPortal>
          </SelectRoot>
        </div>

        <FormSwitchField
          v-if="showRoleToggle"
          id="isRouter"
          v-model="isRouter"
          :label="$t('client.isRouter')"
          :description="$t('client.isRouterDesc')"
        />
      </div>
    </template>
    <template #actions>
      <DialogClose as-child>
        <BaseSecondaryButton>{{ $t('dialog.cancel') }}</BaseSecondaryButton>
      </DialogClose>
      <DialogClose as-child>
        <BasePrimaryButton @click="createClient">
          {{ $t('client.create') }}
        </BasePrimaryButton>
      </DialogClose>
    </template>
  </BaseDialog>
</template>

<script lang="ts" setup>
const name = ref<string>('');
const expiresAt = ref<string | null>(null);
const customerSelectValue = ref<string>('none');
const isRouter = ref(false);

const clientsStore = useClientsStore();
const customersStore = useCustomersStore();
const globalStore = useGlobalStore();
customersStore.refresh();

const { t } = useI18n();

defineProps<{ triggerClass?: string }>();

const rangeEligible = computed(() => {
  const cidr = globalStore.information?.ipv4Cidr;
  if (!cidr) {
    return false;
  }
  const prefix = Number(cidr.split('/').at(-1));
  return Number.isFinite(prefix) && prefix <= 16;
});

const showRoleToggle = computed(
  () => customerSelectValue.value !== 'none' && rangeEligible.value
);

function createClient() {
  return _createClient({
    name: name.value,
    expiresAt: expiresAt.value,
    customerId:
      customerSelectValue.value === 'none'
        ? null
        : Number(customerSelectValue.value),
    type: showRoleToggle.value ? (isRouter.value ? 'router' : 'client') : null,
  });
}

const _createClient = useSubmit(
  (data) =>
    $fetch('/api/client', {
      method: 'post',
      body: data,
    }),
  {
    revert: () => clientsStore.refresh(),
    successMsg: t('client.created'),
  }
);
</script>
