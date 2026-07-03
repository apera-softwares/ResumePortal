"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import EditResume from "@/components/UsersModels/resumeEditModel/EditResume";
import ResumeUploadForm from "@/components/ResumeUploadForm/ResumeUploadForm";
import toast from "react-hot-toast";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  resume: string;
  resumeText?: string;
  cleanedResume?: string;
  editedHtml?: string;
  isPublic?: boolean;
}

export default function MyResumePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");

  const fetchProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch(`${API_URL}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const result = await response.json();
        const { user, candidate: cand } = result.data;
        setUserRole(user.role);

        if (user.role !== "CANDIDATE") {
          toast.error("Access denied. Only candidates can access this page.");
          router.push("/dashboard");
          return;
        }

        if (cand && cand.resume) {
          setCandidate(cand);
        } else {
          setCandidate(null);
        }
      } else {
        toast.error("Failed to fetch profile details.");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      toast.error("An error occurred while loading your resume page.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="min-h-[80vh] flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-950 font-outfit">
        <div className="flex flex-col items-center gap-4 p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-150 dark:border-gray-800 shadow-xl max-w-sm w-full text-center">
          <div className="relative w-16 h-16">
            <div className="absolute inset-0 rounded-full border-4 border-blue-500/20 animate-pulse"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-blue-600 animate-spin"></div>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white">
            Loading Your Resume
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Please wait while we fetch your resume profile and documents.
          </p>
        </div>
      </div>
    );
  }

  if (userRole !== "CANDIDATE") {
    return null;
  }

  if (!candidate) {
    return (
      <div className="min-h-[80vh] w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 font-outfit transition-colors duration-300">
        <div className="w-full max-w-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8 flex flex-col items-center text-center">
          <div className="w-16 h-16 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Upload Your Resume
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mb-8">
            You haven't uploaded a resume yet. Upload your resume now to build your profile, tag your skills, and start applying to active job openings!
          </p>
          <div className="w-full border-t border-gray-100 dark:border-gray-800/80 pt-6">
            <ResumeUploadForm closeModal={fetchProfile} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] w-full flex flex-col gap-6 font-outfit px-2 sm:px-4 py-2 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <EditResume
        candidate={candidate}
        isInline={true}
        onClose={() => router.push("/dashboard")}
        initialMode="original"
        onSave={(updatedCandidate) => {
          setCandidate({ ...candidate, ...updatedCandidate });
        }}
      />
    </div>
  );
}
