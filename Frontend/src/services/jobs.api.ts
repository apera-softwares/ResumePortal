const API_URL = process.env.NEXT_PUBLIC_API_URL;

export interface FetchJobsParams {
  page?: number;
  limit?: number;
  search?: string;
  location?: string;
  type?: string;
}

export interface JobPayload {
  title: string;
  companyName?: string;
  location?: string;
  jobType?: string;
  experience?: string;
  salaryRange?: string;
  description?: string;
  requirements?: string;
  skills?: string[];
}

/**
 * Fetch paginated or filtered list of jobs
 */
export const getJobs = async (params: FetchJobsParams = {}) => {
  const queryParams = new URLSearchParams();
  if (params.page) queryParams.set("page", String(params.page));
  if (params.limit) queryParams.set("limit", String(params.limit));
  if (params.search) queryParams.set("search", params.search);
  if (params.location) queryParams.set("location", params.location);
  if (params.type) queryParams.set("type", params.type);

  const response = await fetch(`${API_URL}/jobs?${queryParams.toString()}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch jobs");
  }
  return data;
};

/**
 * Get job details by ID
 */
export const getJobById = async (jobId: string) => {
  const response = await fetch(`${API_URL}/jobs/${jobId}`);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to fetch job details");
  }
  return data;
};

/**
 * Create a new job posting
 */
export const createJob = async (payload: JobPayload) => {
  const response = await fetch(`${API_URL}/jobs`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to create job");
  }
  return data;
};

/**
 * Update an existing job
 */
export const updateJob = async (jobId: string, payload: Partial<JobPayload>) => {
  const response = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to update job");
  }
  return data;
};

/**
 * Delete a job posting
 */
export const deleteJob = async (jobId: string) => {
  const response = await fetch(`${API_URL}/jobs/${jobId}`, {
    method: "DELETE",
  });
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || "Failed to delete job");
  }
  return data;
};
