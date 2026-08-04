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
            <FormHeading>
              {{ $t('form.sectionGeneral') }}
            </FormHeading>
            <FormTextField
              id="name"
              v-model="data.name"
              :label="$t('general.name')"
            />
            <FormSwitchField
              id="enabled"
              v-model="data.enabled"
              :label="$t('client.enabled')"
            />
            <FormDateField
              id="expiresAt"
              v-model="data.expiresAt"
              :description="$t('client.expireDateDesc')"
              :label="$t('client.expireDate')"
            />
          </FormGroup>
          <FormGroup>
            <FormHeading>{{ $t('customer.customer') }}</FormHeading>
            <div class="col-span-full">
              <SelectRoot
                :model-value="customerSelectValue"
                @update:model-value="onCustomerChange"
              >
                <SelectTrigger
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
                        <SelectItemText>{{
                          $t('customer.none')
                        }}</SelectItemText>
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
          </FormGroup>
          <FormGroup>
            <FormHeading>{{ $t('client.address') }}</FormHeading>
            <FormTextField
              id="ipv4Address"
              v-model="data.ipv4Address"
              label="IPv4"
            />
            <FormTextField
              id="ipv6Address"
              v-model="data.ipv6Address"
              label="IPv6"
            />
            <FormInfoField
              id="endpoint"
              :data="data.endpoint ?? $t('client.notConnected')"
              :label="$t('client.endpoint')"
              :description="$t('client.endpointDesc')"
            />
          </FormGroup>
          <FormGroup>
            <FormHeading :description="$t('client.allowedIpsDesc')">
              {{ $t('general.allowedIps') }}
            </FormHeading>
            <FormNullArrayField v-model="data.allowedIps" name="allowedIps" />
          </FormGroup>
          <FormGroup>
            <FormHeading :description="$t('client.serverAllowedIpsDesc')">
              {{ $t('client.serverAllowedIps') }}
            </FormHeading>
            <FormArrayField
              v-model="data.serverAllowedIps"
              name="serverAllowedIps"
            />
          </FormGroup>
          <FormGroup v-if="globalStore.information?.firewallEnabled">
            <FormHeading :description="$t('client.firewallIpsDesc')">
              {{ $t('client.firewallIps') }}
            </FormHeading>
            <FormNullArrayField v-model="data.firewallIps" name="firewallIps" />
          </FormGroup>
          <FormGroup>
            <FormHeading :description="$t('client.dnsDesc')">
              {{ $t('general.dns') }}
            </FormHeading>
            <FormNullArrayField v-model="data.dns" name="dns" />
          </FormGroup>
          <FormGroup>
            <FormHeading>{{ $t('form.sectionAdvanced') }}</FormHeading>
            <FormNumberField
              id="mtu"
              v-model="data.mtu"
              :description="$t('client.mtuDesc')"
              :label="$t('general.mtu')"
            />
            <FormNumberField
              id="persistentKeepalive"
              v-model="data.persistentKeepalive"
              :description="$t('client.persistentKeepaliveDesc')"
              :label="$t('general.persistentKeepalive')"
            />
          </FormGroup>
          <FormGroup v-if="globalStore.information?.isAwg">
            <FormHeading>{{ $t('awg.obfuscationParameters') }}</FormHeading>

            <FormNullNumberField
              id="jC"
              v-model="data.jC"
              :label="$t('awg.jCLabel')"
              :description="$t('awg.jCDescription')"
            />
            <FormNullNumberField
              id="Jmin"
              v-model="data.jMin"
              :label="$t('awg.jMinLabel')"
              :description="$t('awg.jMinDescription')"
            />
            <FormNullNumberField
              id="Jmax"
              v-model="data.jMax"
              :label="$t('awg.jMaxLabel')"
              :description="$t('awg.jMaxDescription')"
            />

            <div class="col-span-full text-sm">* {{ $t('awg.mtuNote') }}</div>

            <FormNullTextField
              id="i1"
              v-model="data.i1"
              :label="$t('awg.i1Label')"
              :description="$t('awg.i1Description')"
            />
            <FormNullTextField
              id="i2"
              v-model="data.i2"
              :label="$t('awg.i2Label')"
              :description="$t('awg.i2Description')"
            />
            <FormNullTextField
              id="i3"
              v-model="data.i3"
              :label="$t('awg.i3Label')"
              :description="$t('awg.i3Description')"
            />
            <FormNullTextField
              id="i4"
              v-model="data.i4"
              :label="$t('awg.i4Label')"
              :description="$t('awg.i4Description')"
            />
            <FormNullTextField
              id="i5"
              v-model="data.i5"
              :label="$t('awg.i5Label')"
              :description="$t('awg.i5Description')"
            />
          </FormGroup>
          <FormGroup>
            <FormHeading :description="$t('client.hooksDescription')">
              {{ $t('client.hooks') }}
            </FormHeading>
            <FormTextArea
              id="PreUp"
              v-model="data.preUp"
              :description="$t('client.hooksLeaveEmpty')"
              :label="$t('hooks.preUp')"
            />
            <FormTextArea
              id="PostUp"
              v-model="data.postUp"
              :description="$t('client.hooksLeaveEmpty')"
              :label="$t('hooks.postUp')"
            />
            <FormTextArea
              id="PreDown"
              v-model="data.preDown"
              :description="$t('client.hooksLeaveEmpty')"
              :label="$t('hooks.preDown')"
            />
            <FormTextArea
              id="PostDown"
              v-model="data.postDown"
              :description="$t('client.hooksLeaveEmpty')"
              :label="$t('hooks.postDown')"
            />
          </FormGroup>
          <FormGroup>
            <FormHeading>{{ $t('form.actions') }}</FormHeading>
            <FormPrimaryActionField type="submit" :label="$t('form.save')" />
            <FormSecondaryActionField
              :label="$t('form.revert')"
              @click="revert"
            />
            <ClientsDeleteDialog
              trigger-class="col-span-2"
              :client-name="data.name"
              @delete="deleteClient"
            >
              <FormSecondaryActionField
                :label="$t('client.delete')"
                class="inline-block w-full"
                as="span"
              />
            </ClientsDeleteDialog>
            <ClientsConfigDialog
              trigger-class="col-span-2"
              :client-id="data.id"
            >
              <FormSecondaryActionField
                :label="$t('client.viewConfig')"
                class="inline-block w-full"
                as="span"
              />
            </ClientsConfigDialog>
          </FormGroup>
        </FormElement>
      </PanelBody>
    </Panel>
  </main>
</template>

<script lang="ts" setup>
const globalStore = useGlobalStore();

const route = useRoute();
const id = route.params.id as string;

const { data: _data, refresh } = await useFetch(`/api/client/${id}`, {
  method: 'get',
});
const data = toRef(_data.value);

const customersStore = useCustomersStore();
customersStore.refresh();

// Locally staged, only sent to the server (via a separate call, since
// customerId isn't part of ClientUpdateSchema) when Save is pressed.
const originalCustomerId = ref<number | null>(data.value?.customerId ?? null);

const customerSelectValue = computed(() =>
  data.value?.customerId != null ? String(data.value.customerId) : 'none'
);

function onCustomerChange(value: string | undefined) {
  if (value === undefined || !data.value) {
    return;
  }
  data.value.customerId = value === 'none' ? null : Number(value);
}

const _submit = useSubmit(
  async (payload) => {
    const { customerId } = payload as { customerId: number | null };

    await $fetch(`/api/client/${id}`, {
      method: 'post',
      body: payload,
    });

    if (customerId !== originalCustomerId.value) {
      await $fetch(`/api/client/${id}/customer`, {
        method: 'post',
        body: { customerId },
      });
    }
  },
  {
    revert: async (success) => {
      if (success) {
        await navigateTo('/');
      } else {
        await revert();
      }
    },
  }
);

function submit() {
  return _submit(data.value);
}

async function revert() {
  await refresh();
  data.value = toRef(_data.value).value;
  originalCustomerId.value = data.value?.customerId ?? null;
}

const _deleteClient = useSubmit(
  (data) =>
    $fetch(`/api/client/${id}`, {
      method: 'delete',
      body: data,
    }),
  {
    revert: async () => {
      await navigateTo('/');
    },
  }
);

function deleteClient() {
  return _deleteClient(undefined);
}
</script>
