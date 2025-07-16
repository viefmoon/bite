import ApiClientWrapper from '../../../app/services/apiClientWrapper';
import {
  handleApiResponse,
  handleApiResponseVoid,
} from '../../../app/lib/apiHelpers';
import { API_PATHS } from '../../../app/constants/apiPaths';
import {
  AuthEmailLoginDto,
  LoginResponseDto,
  LoginFormInputs,
  RegisterFormInputs,
} from '../schema/auth.schema';

class AuthService {
  async login(loginData: LoginFormInputs): Promise<LoginResponseDto> {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const isEmail = emailRegex.test(loginData.emailOrUsername);
    const sanitizedInput = loginData.emailOrUsername.trim().toLowerCase();

    const payload: AuthEmailLoginDto = {
      password: loginData.password,
      ...(isEmail ? { email: sanitizedInput } : { username: sanitizedInput }),
    };

    const response = await ApiClientWrapper.post<LoginResponseDto>(
      API_PATHS.AUTH_EMAIL_LOGIN,
      payload,
    );

    return handleApiResponse(response);
  }

  async register(data: RegisterFormInputs): Promise<void> {
    const response = await ApiClientWrapper.post<{ message?: string }>(
      API_PATHS.AUTH_EMAIL_REGISTER,
      data,
    );

    handleApiResponseVoid(response);
  }

  async verifyToken(): Promise<boolean> {
    try {
      const response = await ApiClientWrapper.get(API_PATHS.AUTH_ME);
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}

export const authService = new AuthService();
