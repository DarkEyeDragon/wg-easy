import { defineStore } from 'pinia';
import type { TypedInternalResponse } from 'nitropack/types';

export type LocalCustomer = TypedInternalResponse<
  '/api/customer',
  unknown,
  'get'
>[number];

export const useCustomersStore = defineStore('Customers', () => {
  const customers = ref<null | LocalCustomer[]>(null);

  const { data: _customers, refresh: _refresh } = useFetch('/api/customer', {
    method: 'get',
  });

  async function refresh() {
    await _refresh();
    customers.value = _customers.value ?? null;
  }

  return { customers, refresh, _customers };
});
