import { Exclude, Expose } from 'class-transformer';
import { Role } from '../../roles/domain/role';
import { GenderEnum } from '../enums/gender.enum';

export class User {
  id: string;

  @Expose({ groups: ['me', 'admin'] })
  email: string | null;

  @Expose({ groups: ['me', 'admin'] })
  username: string;

  @Exclude({ toPlainOnly: true })
  password?: string;

  firstName: string | null;

  lastName: string | null;

  birthDate: Date | null;

  gender: GenderEnum | null;

  phoneNumber: string | null;

  address: string | null;

  city: string | null;

  state: string | null;

  country: string | null;

  zipCode: string | null;

  emergencyContact: Record<string, any> | null;


  role: Role

  isActive: boolean;

  createdAt: Date;

  updatedAt: Date;

  deletedAt: Date;
}
