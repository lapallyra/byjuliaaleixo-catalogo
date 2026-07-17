import { Customer, CustomerAddress } from '../types';

export const normalizeCustomerAddresses = (customer: Customer): CustomerAddress[] => {
  if (customer.addresses && customer.addresses.length > 0) return customer.addresses;
  
  // Legacy fallback
  if (customer.address) {
    return [{
      id: 'legacy-' + customer.id,
      street: customer.address,
      number: customer.number || '',
      neighborhood: customer.neighborhood || '',
      city: customer.city || '',
      state: customer.state || '',
      zipCode: customer.zipCode || '',
      isMain: true
    }];
  }
  return [];
};

export const syncAddressesToLegacy = (addresses: CustomerAddress[]): Partial<Customer> => {
  const mainAddress = addresses.find(a => a.isMain) || addresses[0];
  if (!mainAddress) return {};
  
  return {
    address: mainAddress.street,
    number: mainAddress.number,
    neighborhood: mainAddress.neighborhood,
    city: mainAddress.city,
    state: mainAddress.state,
    zipCode: mainAddress.zipCode
  };
};
