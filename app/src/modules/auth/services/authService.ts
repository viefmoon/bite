import apiClient from "../../../app/services/apiClient";
import { handleApiResponse, handleApiResponseVoid } from "../../../app/lib/apiHelpers";
import { API_PATHS } from "../../../app/constants/apiPaths";
import {
  AuthEmailLoginDto,
  LoginResponseDto,
  LoginFormInputs,
  RegisterFormInputs,
} from "../schema/auth.schema";

class AuthService {
  async login(loginData: LoginFormInputs): Promise<LoginResponseDto> {
    const isEmail = loginData.emailOrUsername.includes("@");
    const payload: AuthEmailLoginDto = {
      password: loginData.password,
      ...(isEmail
        ? { email: loginData.emailOrUsername }
        : { username: loginData.emailOrUsername }),
    };

    const response = await apiClient.post<LoginResponseDto>(
      API_PATHS.AUTH_EMAIL_LOGIN,
      payload
    );

    return handleApiResponse(response);
  }

  async register(data: RegisterFormInputs): Promise<void> {
    const response = await apiClient.post<{ message?: string }>(
      API_PATHS.AUTH_EMAIL_REGISTER,
      data
    );

    handleApiResponseVoid(response);
  }

  async verifyToken(): Promise<boolean> {
    try {
      const response = await apiClient.get("/auth/me");
      return response.status === 200;
    } catch (error) {
      console.log("[AuthService] Token inválido o expirado");
      return false;
    }
  }

}

export const authService = new AuthService();
