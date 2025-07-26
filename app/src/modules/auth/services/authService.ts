import apiClient from '@/app/services/apiClient';
import { API_PATHS } from '@/app/constants/apiPaths';
import {
  AuthEmailLoginDto,
  LoginResponseDto,
  LoginFormInputs,
} from '../schema/auth.schema';

async function login(loginData: LoginFormInputs): Promise<LoginResponseDto> {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const isEmail = emailRegex.test(loginData.emailOrUsername);
  const sanitizedInput = loginData.emailOrUsername.trim().toLowerCase();

  const payload: AuthEmailLoginDto = {
    password: loginData.password,
    ...(isEmail ? { email: sanitizedInput } : { username: sanitizedInput }),
  };

  const response = await apiClient.post<LoginResponseDto>(
    API_PATHS.AUTH_EMAIL_LOGIN,
    payload,
  );

  return response.data;
}

interface RegisterData {
  username: string;
  email?: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: { id: number };
  isActive: boolean;
}

async function register(data: RegisterData): Promise<void> {
  await apiClient.post<{ message?: string }>(
    API_PATHS.AUTH_EMAIL_REGISTER,
    data,
  );
}

async function verifyToken(): Promise<boolean> {
  try {
    const response = await apiClient.get(API_PATHS.AUTH_ME);
    return response.status === 200;
  } catch (error) {
    return false;
  }
}

export const authService = {
  login,
  register,
  verifyToken,
};
