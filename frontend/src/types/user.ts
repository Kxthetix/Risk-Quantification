export type UserRole = "ADMIN" | "SECURITY_ANALYST" | "MANAGER" | "VIEWER";
export type UserStatus = "ACTIVE" | "SUSPENDED" | "INVITED" | "DEACTIVATED";

export interface User {
  id: string;
  organization_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  status?: UserStatus;
  created_at: string;
  updated_at: string;
}

export interface UserSession {
  id: string;
  user_id: string;
  device_info?: string;
  ip_address?: string;
  expires_at: string;
  revoked: boolean;
  created_at: string;
}
