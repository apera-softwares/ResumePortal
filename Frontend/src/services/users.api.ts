const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface FetchUsersParams {
  page?: number;
  limit?: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  role: string;
  password?: string;
}

export interface UpdateUserPayload {
  name?: string;
  email?: string;
  role?: string;
  password?: string;
}

/**
 * Fetch paginated users list
 */
export const getUsers = async (params: FetchUsersParams = { page: 1, limit: 10 }) => {
  const response = await fetch(`${API_URL}/users?page=${params.page}&limit=${params.limit}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch users");
  }
  return data;
};

/**
 * Fetch single user by ID
 */
export const getUserById = async (userId: string) => {
  const response = await fetch(`${API_URL}/users/${userId}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch user details");
  }
  return data;
};

/**
 * Create a new user
 */
export const createUser = async (payload: CreateUserPayload) => {
  const response = await fetch(`${API_URL}/users/create`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create user");
  }
  return data;
};

/**
 * Update user profile/role
 */
export const updateUser = async (userId: string, payload: UpdateUserPayload) => {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update user");
  }
  return data;
};

/**
 * Delete a user
 */
export const deleteUser = async (userId: string) => {
  const response = await fetch(`${API_URL}/users/${userId}`, {
    method: "DELETE",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete user");
  }
  return data;
};
