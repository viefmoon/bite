import {
  HttpStatus,
  Inject,
  Injectable,
  UnprocessableEntityException,
} from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { NullableType } from '../utils/types/nullable.type';
import { FilterUserDto, SortUserDto } from './dto/query-user.dto';
import { UserRepository } from './infrastructure/persistence/user.repository';
import { User } from './domain/user';
import bcrypt from 'bcryptjs';
import { RoleEnum } from '../roles/roles.enum';
import { USER_REPOSITORY } from '../common/tokens';
import { IPaginationOptions } from '../utils/types/pagination-options';
import { Role } from '../roles/domain/role';
import { UpdateUserDto } from './dto/update-user.dto';
import { ERROR_CODES } from '../common/constants/error-codes.constants';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly usersRepository: UserRepository,
  ) {}

  async create(createUserDto: CreateUserDto): Promise<User> {

    let password: string | undefined = undefined;

    if (createUserDto.password) {
      const salt = await bcrypt.genSalt();
      password = await bcrypt.hash(createUserDto.password, salt);
    }

    let email: string | null = null;

    if (createUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(
        createUserDto.email,
      );
      if (userObject) {
        throw new UnprocessableEntityException({
          code: ERROR_CODES.AUTH_DUPLICATE_EMAIL,
          message: 'El correo electrónico ya está registrado.',
          details: { field: 'email' },
        });
      }
      email = createUserDto.email;
    }

    const userByUsername = await this.usersRepository.findByUsername(
      createUserDto.username,
    );
    if (userByUsername) {
      throw new UnprocessableEntityException({
        code: ERROR_CODES.AUTH_DUPLICATE_USERNAME,
        message: 'El nombre de usuario ya está en uso.',
        details: { field: 'username' },
      });
    }

    const roleExists = Object.values(RoleEnum)
      .map(String)
      .includes(String(createUserDto.role.id));

    if (!roleExists) {
      throw new UnprocessableEntityException({
        status: HttpStatus.UNPROCESSABLE_ENTITY,
        errors: {
          role: 'roleNotExists',
        },
      });
    }

    const role: Role = {
      id: createUserDto.role.id,
      name: null,
    };

    let birthDate: Date | null = null;
    if (createUserDto.birthDate) {
      birthDate = new Date(createUserDto.birthDate);
    }

    return this.usersRepository.create({
      // Do not remove comment below.
      // <creating-property-payload />
      firstName: createUserDto.firstName,
      lastName: createUserDto.lastName,
      email: email,
      username: createUserDto.username,
      password: password,
      role: role,
      birthDate: birthDate,
      gender: createUserDto.gender || null,
      phoneNumber: createUserDto.phoneNumber || null,
      address: createUserDto.address || null,
      city: createUserDto.city || null,
      state: createUserDto.state || null,
      country: createUserDto.country || null,
      zipCode: createUserDto.zipCode || null,
      emergencyContact: createUserDto.emergencyContact || null,
      isActive: true,
    });
  }

  findManyWithPagination({
    filterOptions,
    sortOptions,
    paginationOptions,
  }: {
    filterOptions?: FilterUserDto | null;
    sortOptions?: SortUserDto[] | null;
    paginationOptions: IPaginationOptions;
  }): Promise<User[]> {
    return this.usersRepository.findManyWithPagination({
      filterOptions,
      sortOptions,
      paginationOptions,
    });
  }

  findById(id: User['id']): Promise<NullableType<User>> {
    return this.usersRepository.findById(id);
  }

  findByIds(ids: User['id'][]): Promise<User[]> {
    return this.usersRepository.findByIds(ids);
  }

  findByEmail(email: User['email']): Promise<NullableType<User>> {
    return this.usersRepository.findByEmail(email);
  }

  findByUsername(username: User['username']): Promise<NullableType<User>> {
    return this.usersRepository.findByUsername(username);
  }

  async update(
    id: User['id'],
    updateUserDto: UpdateUserDto,
  ): Promise<User | null> {
    // Do not remove comment below.
    // <updating-property />

    let password: string | undefined = undefined;

    if (updateUserDto.password) {
      const userObject = await this.usersRepository.findById(id);

      if (userObject && userObject?.password !== updateUserDto.password) {
        const salt = await bcrypt.genSalt();
        password = await bcrypt.hash(updateUserDto.password, salt);
      }
    }

    let email: string | null | undefined = undefined;

    if (updateUserDto.email) {
      const userObject = await this.usersRepository.findByEmail(
        updateUserDto.email,
      );

      if (userObject && userObject.id !== id) {
        throw new UnprocessableEntityException({
          code: ERROR_CODES.AUTH_DUPLICATE_EMAIL,
          message: 'El correo electrónico ya está registrado por otro usuario.',
          details: { field: 'email' },
        });
      }

      email = updateUserDto.email;
    } else if (updateUserDto.email === null) {
      email = null;
    }

    let username: string | undefined = undefined;

    if (updateUserDto.username) {
      const userObject = await this.usersRepository.findByUsername(
        updateUserDto.username,
      );

      if (userObject && userObject.id !== id) {
        throw new UnprocessableEntityException({
          code: ERROR_CODES.AUTH_DUPLICATE_USERNAME,
          message: 'El nombre de usuario ya está en uso por otro usuario.',
          details: { field: 'username' },
        });
      }

      username = updateUserDto.username;
    }

    let role: Role | undefined = undefined;

    if (updateUserDto.role?.id) {
      const roleObject = Object.values(RoleEnum)
        .map(String)
        .includes(String(updateUserDto.role.id));
      if (!roleObject) {
        throw new UnprocessableEntityException({
          status: HttpStatus.UNPROCESSABLE_ENTITY,
          errors: {
            role: 'roleNotExists',
          },
        });
      }

      role = {
        id: updateUserDto.role.id,
        name: null,
      };
    }

    let birthDate: Date | null | undefined = undefined;
    if (updateUserDto.birthDate) {
      birthDate = updateUserDto.birthDate;
    } else if (updateUserDto.birthDate === null) {
      birthDate = null;
    }

    const updatePayload: Partial<User> = {
      // Do not remove comment below.
      // <updating-property-payload />
      firstName: updateUserDto.firstName,
      lastName: updateUserDto.lastName,
      email: email,
      username: username,
      password: password,
      role: role,
      birthDate: birthDate,
      gender: updateUserDto.gender,
      phoneNumber: updateUserDto.phoneNumber,
      address: updateUserDto.address,
      city: updateUserDto.city,
      state: updateUserDto.state,
      country: updateUserDto.country,
      zipCode: updateUserDto.zipCode,
      emergencyContact: updateUserDto.emergencyContact,
      ...(updateUserDto.isActive !== undefined && { isActive: updateUserDto.isActive }),
    };

    const filteredPayload: Partial<User> = {};
    for (const key in updatePayload) {
      if (Object.prototype.hasOwnProperty.call(updatePayload, key)) {
        const value = updatePayload[key as keyof Partial<User>];
        if (value !== undefined) {
          filteredPayload[key as keyof Partial<User>] = value as any;
        }
      }
    }

    const updatedUser = await this.usersRepository.update(id, filteredPayload);

    return updatedUser;
  }

  async remove(id: User['id']): Promise<void> {
    await this.usersRepository.remove(id);
  }
}
