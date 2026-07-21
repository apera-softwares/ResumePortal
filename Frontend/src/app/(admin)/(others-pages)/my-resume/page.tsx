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
        const localRole = localStorage.getItem("role");
        if (localRole) {
          setUserRole(localRole);
        }
        toast.error("Failed to fetch profile details.");
      }
    } catch (err) {
      console.error("Error fetching profile:", err);
      const localRole = localStorage.getItem("role");
      if (localRole) {
        setUserRole(localRole);
      }
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
      <div className="min-h-[85vh] w-full flex flex-col items-center justify-center p-4 sm:p-6 bg-gray-50 dark:bg-gray-950 font-outfit transition-colors duration-300">
        <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          
          {/* Left Side: Value Proposition & Onboarding Guide */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-gradient-to-br from-blue-600 to-indigo-700 text-white rounded-3xl p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-indigo-500/30 rounded-full blur-3xl -ml-20 -mb-20"></div>
            
            <div className="relative z-10">
              <span className="bg-white/10 border border-white/20 text-xs font-semibold px-3 py-1.5 rounded-full uppercase tracking-wider">
                Getting Started
              </span>
              
              <h2 className="text-3xl sm:text-4xl font-extrabold mt-6 leading-tight">
                Unlock Your Next Career Move
              </h2>
              <p className="text-blue-100 mt-4 text-sm sm:text-base leading-relaxed">
                Upload your resume once to build a premium, recruiter-ready profile and start applying directly to active job openings.
              </p>
              
              {/* Features list */}
              <div className="mt-8 space-y-6">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/15">
                    <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white">AI-Powered Skill Tagging</h4>
                    <p className="text-xs text-blue-150 mt-1">Our system automatically parses your experience and suggests optimized matching skills.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/15">
                    <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white">Anonymized Client Sharing</h4>
                    <p className="text-xs text-blue-150 mt-1">Export clean PDF/Word formats with contact details hidden for safe recruiter submissions.</p>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center border border-white/15">
                    <svg className="w-5 h-5 text-blue-200" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-base text-white">Instant Notifications</h4>
                    <p className="text-xs text-blue-150 mt-1">Get real-time feedback and status alerts when hiring managers view your profile.</p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Visual representation card */}
            <div className="mt-8 pt-6 border-t border-white/10 relative z-10 hidden sm:block">
              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white text-indigo-700 flex items-center justify-center font-bold text-lg">
                    C
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-white">Your Professional Profile</p>
                    <p className="text-[10px] text-blue-200">Pending upload...</p>
                  </div>
                </div>
                <div className="w-16 h-1.5 bg-white/20 rounded-full overflow-hidden">
                  <div className="w-1/3 h-full bg-yellow-400 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Right Side: Form Card */}
          <div className="lg:col-span-7 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-xl overflow-hidden p-6 sm:p-8 flex flex-col justify-between">
            <div className="w-full">
              <ResumeUploadForm closeModal={fetchProfile} />
            </div>
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
