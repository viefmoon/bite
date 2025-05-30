import { Address } from './address';

export class Customer {
  id: string;
  firstName: string;
  lastName: string;
  phoneNumber: string | null;
  email: string | null;
  addresses: Address[];
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}
