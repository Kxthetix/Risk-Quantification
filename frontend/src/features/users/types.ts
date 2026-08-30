export * from "@/types/user";

export interface UserInvitePayload {
  email: string;
  full_name: string;
  role: "ADMIN" | "SECURITY_ANALYST" | "MANAGER" | "VIEWER";
  message?: string;
}

export interface UserUpdateRolePayload {
  role: "ADMIN" | "SECURITY_ANALYST" | "MANAGER" | "VIEWER";
}

export interface UserStatusUpdatePayload {
  status: "ACTIVE" | "SUSPENDED" | "INVITED" | "DEACTIVATED";
  reason?: string;
}

export interface UserFilterParams {
  [key: string]: string | number | boolean | undefined | null;
  skip?: number;
  limit?: number;
  search?: string;
  role?: string;
  status?: string;
}
