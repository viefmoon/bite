export enum GenderEnum {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export interface User {
  id: string;
  email?: string | null;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
  birthDate?: string | null;
  gender?: GenderEnum | null;
  phoneNumber?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
  country?: string | null;
  zipCode?: string | null;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  } | null;
  isActive: boolean;
  role?: Role;
  preparationScreen?: {
    id: string;
    name: string;
    description?: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export interface Role {
  id: number;
  name: string;
}

export enum RoleEnum {
  ADMIN = 1,
  MANAGER = 2,
  CASHIER = 3,
  WAITER = 4,
  KITCHEN = 5,
  DELIVERY = 6,
}

export interface CreateUserDto {
  email?: string;
  username: string;
  password: string;
  firstName: string;
  lastName: string;
  birthDate?: string;
  gender?: GenderEnum;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  role: {
    id: number;
  };
}

export interface UpdateUserDto {
  email?: string;
  username?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
  birthDate?: string;
  gender?: GenderEnum;
  phoneNumber?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  zipCode?: string;
  emergencyContact?: {
    name?: string;
    phone?: string;
    relationship?: string;
  };
  isActive?: boolean;
  role?: {
    id: number;
  };
}

export interface UsersQuery {
  page?: number;
  limit?: number;
  filters?: {
    isActive?: boolean;
    roles?: { id: number }[];
  };
  search?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface UsersResponse {
  data: User[];
  hasNextPage: boolean;
}
