const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserResponseData {
  id: string;
  name: string;
  email: string;
  role: string;
  token: string;
}

export interface LoginResponse {
  statusCode?: number;
  message?: string;
  data: UserResponseData;
}

export interface SendOtpPayload {
  email: string;
}

export interface VerifyOtpPayload {
  email: string;
  otp: string;
}

export interface ResetPasswordPayload {
  email: string;
  otp: string;
  newPassword: string;
}

/**
 * Authenticates user credentials against the backend API
 */
export const loginUser = async (payload: LoginPayload): Promise<LoginResponse> => {
  const response = await fetch(`${API_URL}/users/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "include",
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Invalid credentials. Please try again.");
  }

  return data;
};

/**
 * Sends OTP to user's email
 */
export const sendOtp = async (payload: SendOtpPayload) => {
  const response = await fetch(`${API_URL}/otp/send`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to send OTP");
  }

  return data;
};

/**
 * Verifies OTP code
 */
export const verifyOtp = async (payload: VerifyOtpPayload) => {
  const response = await fetch(`${API_URL}/otp/verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Invalid or expired OTP. Please try again.");
  }

  return data;
};

/**
 * Resets user password with OTP verification
 */
export const resetPassword = async (payload: ResetPasswordPayload) => {
  const response = await fetch(`${API_URL}/users/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.message || "Failed to reset password");
  }

  return data;
};
