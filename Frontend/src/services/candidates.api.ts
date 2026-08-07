const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface FetchCandidatesParams {
  page?: number;
  limit?: number;
  search?: string;
}

/**
 * Fetch candidates list
 */
export const getCandidates = async (params: FetchCandidatesParams = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.search) queryParams.set("search", params.search);

  const response = await fetch(`${API_URL}/candidates?${queryParams.toString()}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch candidates");
  }
  return data;
};

/**
 * Fetch candidate details by ID
 */
export const getCandidateById = async (id: string) => {
  const response = await fetch(`${API_URL}/candidates/${id}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch candidate details");
  }
  return data;
};

/**
 * Create a candidate (handles multipart form data for resume uploads)
 */
export const createCandidate = async (formData: FormData) => {
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const response = await fetch(`${API_URL}/candidates/create`, {
    method: "POST",
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: formData,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create candidate");
  }
  return data;
};

/**
 * Update candidate data
 */
export const updateCandidate = async (id: string, payload: any) => {
  const response = await fetch(`${API_URL}/candidates/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update candidate");
  }
  return data;
};

/**
 * Reparse candidate resume text using AI
 */
export const reparseCandidateResume = async (id: string) => {
  const response = await fetch(`${API_URL}/candidates/${id}/reparse-resume`, {
    method: "POST",
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to reparse resume");
  }
  return data;
};

/**
 * Export candidate resume to PDF
 */
export const exportCandidatePdf = async (payload: any) => {
  const response = await fetch(`${API_URL}/candidates/export-pdf`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to export PDF");
  }
  return response.blob();
};

/**
 * Export candidate resume to DOCX
 */
export const exportCandidateDocx = async (payload: any) => {
  const response = await fetch(`${API_URL}/candidates/export-docx`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error("Failed to export DOCX");
  }
  return response.blob();
};
