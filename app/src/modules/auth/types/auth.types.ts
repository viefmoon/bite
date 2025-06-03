import type { AuthResponse, LoginFormInputs } from "../schema/auth.schema";

// Pure TypeScript interfaces/types remain here
export interface AuthState {
  token: string | null;
  user: AuthResponse["user"] | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: LoginFormInputs) => Promise<void>;
  logout: () => void;
  clearError: () => void;
}

export interface RegisterResponseDto {
  message: string;
}

// Zod schemas (loginSchema, authResponseSchema, etc.)
// are defined in ../schema/auth.schema.ts
