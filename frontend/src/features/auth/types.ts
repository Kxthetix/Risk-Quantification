export * from "@/types/auth";
export * from "@/types/user";

export interface ChangePasswordPayload {
  current_password: string;
  new_password: string;
}

export interface UserProfileUpdatePayload {
  full_name?: string;
  timezone?: string;
}
