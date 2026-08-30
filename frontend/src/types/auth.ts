import { User } from "./user";
import { Organization } from "./organization";

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  refresh_expires_in?: number;
}

export interface RefreshTokenRequest {
  refresh_token: string;
}

export interface DecodedTokenPayload {
  sub: string;
  organization_id: string;
  role: string;
  exp: number;
  iat?: number;
  jti?: string;
  type?: string;
}

export interface AuthState {
  user: User | null;
  organization: Organization | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}
