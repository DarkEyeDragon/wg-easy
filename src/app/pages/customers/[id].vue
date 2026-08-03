<template>
  <main v-if="data">
    <Panel>
      <PanelHead>
        <PanelHeadTitle>
          {{ data.name }}
        </PanelHeadTitle>
      </PanelHead>
      <PanelBody>
        <FormElement @submit.prevent="submit">
          <FormGroup>
            <FormHeading>{{ $t('form.sectionGeneral') }}</FormHeading>
            <FormTextField
              id="name"
              v-model="data.name"
              :label="$t('customer.name')"
            />
          </FormGroup>
          <FormGroup class="mt-4">
            <FormHeading>{{ $t('customer.clients') }}</FormHeading>

            <p
              v-if="stagedClients.length === 0"
              class="col-span-full text-sm text-gray-400 dark:text-neutral-400"
            >
              {{ $t('customer.noClients') }}
            </p>

            <div
              v-for="linkedClient in stagedClients"
              :key="linkedClient.id"
              class="col-span-full flex items-center justify-between gap-3 border-b border-solid border-gray-100 py-2 last:border-b-0 dark:border-neutral-600"
            >
              <span>{{ linkedClient.name }}</span>
              <BaseSecondaryButton @click="removeClient(linkedClient.id)">
                {{ $t('customer.remove') }}
              </BaseSecondaryButton>
            </div>

            <div class="col-span-full mt-3 flex items-center gap-2">
              <SelectRoot v-model="selectedClientId">
                <SelectTrigger
                  class="inline-flex h-8 flex-1 items-center justify-between gap-2 rounded bg-gray-200 px-3 text-sm leading-none dark:bg-neutral-500 dark:text-neutral-200"
                >
                  <SelectValue :placeholder="$t('customer.pickClient')" />
                  <IconsArrowDown class="size-3" />
                </SelectTrigger>
                <SelectPortal>
                  <SelectContent
                    class="z-[100] min-w-28 rounded bg-gray-300 dark:bg-neutral-500"
                  >
                    <SelectViewport class="p-2">
                      <SelectItem
                        v-for="option in availableClients"
                        :key="option.id"
                        :value="String(option.id)"
                        class="relative flex h-6 items-center rounded px-3 text-sm leading-none outline-none hover:bg-red-800 hover:text-white dark:text-white"
                      >
                        <SelectItemText>{{ option.label }}</SelectItemText>
                      </SelectItem>
                    </SelectViewport>
                  </SelectContent>
                </SelectPortal>
              </SelectRoot>
              <BasePrimaryButton
                :disabled="!selectedClientId"
                @click="addClient"
              >
                {{ $t('customer.add') }}
              </BasePrimaryButton>
            </div>
          </FormGroup>
          <FormGroup>
            <FormHeading>{{ $t('form.actions') }}</FormHeading>
            <FormPrimaryActionField type="submit" :label="$t('form.save')" />
            <FormSecondaryActionField
              :label="$t('form.revert')"
              @click="revert"
            />
            <CustomersDeleteDialog
              trigger-class="col-span-2"
              :customer-name="data.name"
              @delete="deleteCustomer"
            >
              <FormSecondaryActionField
                :label="$t('customer.delete')"
                class="inline-block w-full"
                as="span"
              />
            </CustomersDeleteDialog>
          </FormGroup>
        </FormElement>
      </PanelBody>
    </Panel>
  </main>
</template>

<script lang="ts" setup>
const route = useRoute();
const id = route.params.id as string;

const { data: _data, refresh } = await useFetch(`/api/customer/${id}`, {
  method: 'get',
});
const data = toRef(_data.value);

// Locally staged client membership, edited by Add/Remove below and only
// persisted (as a diff against the last-saved state) when Save is pressed.
const stagedClients = ref<{ id: number; name: string }[]>(
  (data.value?.clients ?? []).map((c) => ({ id: c.id, name: c.name }))
);

function syncStagedClients() {
  stagedClients.value = (data.value?.clients ?? []).map((c) => ({
    id: c.id,
    name: c.name,
  }));
}

const clientsStore = useClientsStore();
const customersStore = useCustomersStore();
clientsStore.refresh();
customersStore.refresh();

const { t } = useI18n();

const selectedClientId = ref<string | undefined>(undefined);

const availableClients = computed(() => {
  if (!clientsStore.clients) {
    return [];
  }

  const stagedIds = new Set(stagedClients.value.map((c) => c.id));

  return clientsStore.clients
    .filter((c) => !stagedIds.has(c.id))
    .map((c) => {
      const currentCustomer = customersStore.customers?.find(
        (customer) => customer.id === c.customerId
      );
      return {
        id: c.id,
        label: currentCustomer
          ? t('customer.pickClientElsewhere', {
              name: c.name,
              customer: currentCustomer.name,
            })
          : c.name,
      };
    });
});

const _submit = useSubmit(
  async (payload) => {
    const { name, added, removed } = payload as {
      name: string;
      added: number[];
      removed: number[];
    };

    await $fetch(`/api/customer/${id}`, {
      method: 'post',
      body: { name },
    });

    await Promise.all([
      ...added.map((clientId) =>
        $fetch(`/api/client/${clientId}/customer`, {
          method: 'post',
          body: { customerId: Number(id) },
        })
      ),
      ...removed.map((clientId) =>
        $fetch(`/api/client/${clientId}/customer`, {
          method: 'post',
          body: { customerId: null },
        })
      ),
    ]);
  },
  {
    revert: async (success) => {
      if (success) {
        await clientsStore.refresh();
      }
      await revert();
    },
  }
);

function submit() {
  const currentIds = new Set(stagedClients.value.map((c) => c.id));
  const originalIds = new Set((data.value?.clients ?? []).map((c) => c.id));

  const added = [...currentIds].filter((cid) => !originalIds.has(cid));
  const removed = [...originalIds].filter((cid) => !currentIds.has(cid));

  return _submit({ name: data.value!.name, added, removed });
}

async function revert() {
  await refresh();
  data.value = toRef(_data.value).value;
  syncStagedClients();
  selectedClientId.value = undefined;
}

const _deleteCustomer = useSubmit(
  () =>
    $fetch(`/api/customer/${id}`, {
      method: 'delete',
    }),
  {
    revert: async () => {
      await navigateTo('/customers');
    },
  }
);

function deleteCustomer() {
  return _deleteCustomer(undefined);
}

function addClient() {
  if (!selectedClientId.value) {
    return;
  }
  const clientId = Number(selectedClientId.value);
  const client = clientsStore.clients?.find((c) => c.id === clientId);
  if (!client) {
    return;
  }
  stagedClients.value = [
    ...stagedClients.value,
    { id: client.id, name: client.name },
  ];
  selectedClientId.value = undefined;
}

function removeClient(clientId: number) {
  stagedClients.value = stagedClients.value.filter((c) => c.id !== clientId);
}
</script>
