"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import Joblisting from "@/components/joblisting/Joblisting";
import { Modal } from "@/components/ui/modal";
import ResumeUploadForm from "@/components/ResumeUploadForm/ResumeUploadForm";

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

export default function BrowseJobsPage() {
  const router = useRouter();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

  // Data & Pagination State
  const [jData, setJData] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const ITEMS_PER_PAGE = 8;

  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());
  const [isResumeAlertOpen, setIsResumeAlertOpen] = useState(false);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch Candidate Profile and Job Applications
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

  // Fetch Jobs List
  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("page", String(currentPage));
        queryParams.append("limit", String(ITEMS_PER_PAGE));
        if (searchTerm) {
          queryParams.append("search", searchTerm);
        }

        const res = await fetch(`${API_URL}/jobs?${queryParams.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        if (!res.ok) throw new Error("Something went wrong");

        const jobsData = await res.json();
        if (jobsData && typeof jobsData.total === "number") {
          setJData(jobsData.data || []);
          setTotalCount(jobsData.total);
        } else {
          const arr = Array.isArray(jobsData) ? jobsData : (jobsData.data || []);
          setJData(arr);
          setTotalCount(arr.length);
        }
      } catch (error) {
        console.error("Error fetching jobs:", error);
      }
    };

    fetchJobs();
    fetchCandidateProfile();
  }, [API_URL, currentPage, searchTerm, refreshTrigger]);

  const getAuthToken = () => {
    if (typeof window === "undefined") return "";
    const localToken = localStorage.getItem("token");
    if (localToken) return localToken;

    // Fallback to cookies
    const cookies = document.cookie.split(";");
    for (let i = 0; i < cookies.length; i++) {
      const [key, value] = cookies[i].split("=");
      if (key.trim() === "token") {
        return decodeURIComponent(value);
      }
    }
    return "";
  };

  const handleApplyClick = async (jobId: string) => {
    const token = getAuthToken();
    if (!token) {
      toast.error("Please login to apply for this job.");
      router.push("/login");
      return;
    }

    const applyToast = toast.loading("Submitting your application...");

    try {
      const res = await fetch(`${API_URL}/jobs/apply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobId }),
      });
      const data = await res.json();
      toast.dismiss(applyToast);

      if (res.ok) {
        toast.success("Successfully applied to the job!");
        setAppliedJobIds((prev) => {
          const updated = new Set(prev);
          updated.add(jobId);
          return updated;
        });
      } else {
        if (res.status === 404 || data.message?.toLowerCase().includes("resume") || data.message?.toLowerCase().includes("profile")) {
          setIsResumeAlertOpen(true);
        } else {
          toast.error(data.message || "Failed to submit application.");
        }
      }
    } catch (e) {
      console.error(e);
      toast.dismiss(applyToast);
      toast.error("An error occurred while submitting your application.");
    }
  };

  return (
    <>
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

      {/* ──── MODAL: RESUME REQUIRED ALERT ──── */}
      {isResumeAlertOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-950/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800/80 w-full max-w-md rounded-3xl overflow-hidden shadow-2xl p-6 text-center animate-in fade-in zoom-in-95 duration-200">
            {/* Warning Circle Icon */}
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 text-amber-500 dark:text-amber-400 mb-4 border border-amber-100/50 dark:border-amber-900/30">
              <svg className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
              Please submit the resume first
            </h3>

            {/* Message */}
            <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed mb-6">
              You haven't uploaded a resume yet. To apply for this job, please submit your resume first to complete your candidate profile.
            </p>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <button
                type="button"
                onClick={() => setIsResumeAlertOpen(false)}
                className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-850 text-gray-750 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsResumeAlertOpen(false);
                  setIsUploadModalOpen(true);
                }}
                className="flex-1 px-4 py-2.5 text-xs font-semibold rounded-xl text-white bg-blue-600 hover:bg-blue-700 shadow-sm transition-all cursor-pointer flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
                </svg>
                <span>Upload Resume</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Resume Modal */}
      <Modal isOpen={isUploadModalOpen} onClose={() => setIsUploadModalOpen(false)} className="max-w-[700px] m-4">
        <ResumeUploadForm closeModal={() => { setIsUploadModalOpen(false); setRefreshTrigger((prev) => prev + 1); }} />
      </Modal>
    </>
  );
}
