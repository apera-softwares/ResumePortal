"use client";

import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import Joblisting from "@/components/joblisting/Joblisting";

interface Job {
  id: string;
  company?: string;
  title: string;
  description: string;
  client?: string;
  skills: string[];
  internalSalary?: number;
  salary: number;
  location: string;
  type: string;
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  skills: { skill: { name: string } }[];
  appliedJobs: { jobId: string; status: string }[];
}

export default function SavedJobsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

  const [jData, setJData] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const ITEMS_PER_PAGE = 8;

  const [candidateProfile, setCandidateProfile] = useState<Candidate | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  // Apply Modal & Upload Form State
  const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
  const [applyJobId, setApplyJobId] = useState<string | null>(null);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    firstName: "",
    lastName: "",
    mobile: "",
    yearsOfExperience: 2,
    education: "",
    noticePeriod: 30,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch Candidate Profile
  const fetchCandidateProfile = async () => {
    const userRole = localStorage.getItem("role") || "";
    const userEmail = localStorage.getItem("email") || "";

    if (userRole === "CANDIDATE" && userEmail) {
      try {
        const candRes = await fetch(`${API_URL}/candidates/my-applications?email=${encodeURIComponent(userEmail)}`);
        if (candRes.ok) {
          const candData = await candRes.json();
          const profiles = Array.isArray(candData) ? candData : [];
          if (profiles.length > 0) {
            const activeProfile = profiles[0];
            setCandidateProfile(activeProfile);

            const appliedIds = new Set<string>();
            activeProfile.appliedJobs?.forEach((app: any) => {
              if (app.jobId) appliedIds.add(app.jobId);
            });
            setAppliedJobIds(appliedIds);
          }
        }
      } catch (error) {
        console.error("Error fetching candidate profile:", error);
      }
    }
  };

  // Fetch Saved Jobs
  useEffect(() => {
    const fetchSavedJobs = async () => {
      try {
        // Get saved job IDs from localStorage
        const saved = localStorage.getItem("saved_jobs");
        const savedIds: string[] = saved ? JSON.parse(saved) : [];

        if (savedIds.length === 0) {
          setJData([]);
          setTotalCount(0);
          return;
        }

        // Fetch all jobs
        const res = await fetch(`${API_URL}/jobs`);
        if (!res.ok) throw new Error("Failed to fetch jobs");
        const jobsData = await res.json();
        const allJobs: Job[] = jobsData.data || [];

        // Filter jobs matching saved IDs
        let filtered = allJobs.filter((job) => savedIds.includes(job.id));

        // Search filter client side
        if (searchTerm) {
          const query = searchTerm.toLowerCase();
          filtered = filtered.filter(
            (job) =>
              job.title.toLowerCase().includes(query) ||
              (job.client || "").toLowerCase().includes(query) ||
              job.description.toLowerCase().includes(query) ||
              job.skills.some((sk) => sk.toLowerCase().includes(query))
          );
        }

        setTotalCount(filtered.length);

        // Paginate client side
        const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
        const paginated = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

        setJData(paginated);
      } catch (error) {
        console.error("Error fetching saved jobs:", error);
      }
    };

    fetchSavedJobs();
    fetchCandidateProfile();
  }, [API_URL, currentPage, searchTerm, refreshTrigger]);

  const handleApplyClick = (jobId: string) => {
    if (candidateProfile) {
      applyDirectly(candidateProfile.id, jobId);
    } else {
      setApplyJobId(jobId);
      setIsApplyModalOpen(true);
    }
  };

  const applyDirectly = async (candidateId: string, jobId: string) => {
    try {
      const res = await fetch(`${API_URL}/candidates/${candidateId}/apply`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Applied successfully!");
        setAppliedJobIds((prev) => {
          const updated = new Set(prev);
          updated.add(jobId);
          return updated;
        });
      } else {
        toast.error(data.message || "Failed to submit application");
      }
    } catch (e) {
      console.error(e);
      toast.error("Application submission failed");
    }
  };

  const handleResumeUploadApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      toast.error("Please upload a resume file (PDF)");
      return;
    }
    if (!applyJobId) return;

    setUploadLoading(true);
    try {
      const email = localStorage.getItem("email") || "";
      const userId = localStorage.getItem("userId") || "";

      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("firstName", uploadForm.firstName);
      formData.append("lastName", uploadForm.lastName);
      formData.append("email", email);
      formData.append("mobile", uploadForm.mobile);
      formData.append("yearsOfExperience", String(uploadForm.yearsOfExperience));
      formData.append("education", uploadForm.education);
      formData.append("noticePeriod", String(uploadForm.noticePeriod));
      formData.append("jobId", applyJobId);
      if (userId) formData.append("userId", userId);

      const res = await fetch(`${API_URL}/candidates/uploadMedia`, {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        toast.success("Resume uploaded and applied successfully!");
        setAppliedJobIds((prev) => {
          const updated = new Set(prev);
          updated.add(applyJobId);
          return updated;
        });
        setIsApplyModalOpen(false);
        setRefreshTrigger((prev) => prev + 1);
      } else {
        const errorData = await res.json();
        toast.error(errorData.message || "Failed to upload resume and apply");
      }
    } catch (e) {
      console.error(e);
      toast.error("An error occurred during upload");
    } finally {
      setUploadLoading(false);
    }
  };

  return (
    <>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-3xl mb-6 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">❤️ Saved Jobs</h2>
        <p className="text-xs text-gray-550 mt-1">View and apply to jobs you have saved for later.</p>
      </div>

      <Joblisting
        jData={jData}
        onCreateJob={() => {}}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalCount={totalCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        itemsPerPage={ITEMS_PER_PAGE}
        onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
        role="CANDIDATE"
        appliedJobIds={appliedJobIds}
        onApply={handleApplyClick}
      />

      {/* ──── MODAL: UPLOAD RESUME & APPLY ──── */}
      {isApplyModalOpen && applyJobId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/60 backdrop-blur-xs">
          <div className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-750 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col">
            
            <div className="p-6 border-b border-gray-100 dark:border-gray-700/80 flex justify-between items-center bg-gray-55 dark:bg-gray-900">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">Create Candidate Profile & Apply</h2>
              <button
                onClick={() => setIsApplyModalOpen(false)}
                className="text-gray-400 hover:text-gray-655 dark:hover:text-white"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleResumeUploadApply} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">First Name</label>
                  <input
                    type="text"
                    required
                    value={uploadForm.firstName}
                    onChange={(e) => setUploadForm({ ...uploadForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-905 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Last Name</label>
                  <input
                    type="text"
                    required
                    value={uploadForm.lastName}
                    onChange={(e) => setUploadForm({ ...uploadForm, lastName: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-905 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Mobile Number</label>
                  <input
                    type="tel"
                    required
                    value={uploadForm.mobile}
                    onChange={(e) => setUploadForm({ ...uploadForm, mobile: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-905 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Years of Experience</label>
                  <input
                    type="number"
                    min={0}
                    max={50}
                    required
                    value={uploadForm.yearsOfExperience}
                    onChange={(e) => setUploadForm({ ...uploadForm, yearsOfExperience: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-905 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Education</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. B.Tech in CSE"
                    value={uploadForm.education}
                    onChange={(e) => setUploadForm({ ...uploadForm, education: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-905 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-gray-400 uppercase">Notice Period (Days)</label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={uploadForm.noticePeriod}
                    onChange={(e) => setUploadForm({ ...uploadForm, noticePeriod: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-905 border border-gray-200 dark:border-gray-700 rounded-xl text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase">Upload Resume (PDF only)</label>
                <div className="border-2 border-dashed border-gray-200 dark:border-gray-750 rounded-2xl p-6 text-center bg-gray-55 dark:bg-gray-905 cursor-pointer relative hover:border-blue-400 dark:hover:border-blue-800 transition-colors">
                  <input
                    type="file"
                    accept=".pdf"
                    required
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        setSelectedFile(e.target.files[0]);
                      }
                    }}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z" />
                  </svg>
                  <span className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                    {selectedFile ? selectedFile.name : "Select or drag your PDF resume here"}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  type="button"
                  onClick={() => setIsApplyModalOpen(false)}
                  className="px-4 py-2 bg-white hover:bg-gray-50 dark:bg-gray-850 dark:hover:bg-gray-900 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-750 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadLoading}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
                >
                  {uploadLoading ? "Uploading & Applying..." : "Upload & Apply"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
