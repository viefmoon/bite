import { Exclude, Expose } from 'class-transformer';
import { Role } from '../../roles/domain/role';
import { GenderEnum } from '../enums/gender.enum';
import { PreparationScreen } from '../../preparation-screens/domain/preparation-screen';

export class User {
  @Expose()
  id: string;

  @Expose({ groups: ['me', 'admin'] })
  email: string | null;

  @Expose()
  username: string;

  @Exclude({ toPlainOnly: true })
  password?: string;

  @Expose()
  firstName: string | null;

  @Expose()
  lastName: string | null;

  @Expose({ groups: ['me', 'admin'] })
  birthDate: Date | null;

  @Expose({ groups: ['me', 'admin'] })
  gender: GenderEnum | null;

  @Expose({ groups: ['me', 'admin'] })
  phoneNumber: string | null;

  @Expose({ groups: ['me', 'admin'] })
  address: string | null;

  @Expose({ groups: ['me', 'admin'] })
  city: string | null;

  @Expose({ groups: ['me', 'admin'] })
  state: string | null;

  @Expose({ groups: ['me', 'admin'] })
  country: string | null;

  @Expose({ groups: ['me', 'admin'] })
  zipCode: string | null;

  @Expose({ groups: ['me', 'admin'] })
  emergencyContact: Record<string, any> | null;

  @Expose({ groups: ['me', 'admin'] })
  role: Role;

  @Expose({ groups: ['me', 'admin'] })
  isActive: boolean;

  @Expose({ groups: ['me', 'admin'] })
  preparationScreen?: PreparationScreen | null;

  @Expose({ groups: ['me', 'admin'] })
  createdAt: Date;

  @Expose({ groups: ['me', 'admin'] })
  updatedAt: Date;

  @Expose({ groups: ['me', 'admin'] })
  deletedAt: Date;
}
