import { Customer } from './customer';

export class Address {
  id: string;

  customerId: string;

  street: string;

  number: string;

  interiorNumber?: string;

  neighborhood?: string;

  city?: string;

  state?: string;

  zipCode?: string;

  country?: string;

  references?: string;

  latitude?: number;

  longitude?: number;

  isDefault: boolean;

  customer: Customer;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date | null;
}
