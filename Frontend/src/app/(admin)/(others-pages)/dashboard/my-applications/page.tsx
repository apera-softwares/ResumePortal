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

export default function MyApplicationsPage() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3003";

  const [jData, setJData] = useState<Job[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const ITEMS_PER_PAGE = 8;

  const [candidateProfile, setCandidateProfile] = useState<Candidate | null>(null);
  const [appliedJobIds, setAppliedJobIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Fetch Candidate Profile and Applied Jobs
  useEffect(() => {
    const fetchMyApplications = async () => {
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

              if (appliedIds.size === 0) {
                setJData([]);
                setTotalCount(0);
                return;
              }

              // Fetch all jobs
              const res = await fetch(`${API_URL}/jobs`);
              if (!res.ok) throw new Error("Failed to fetch jobs");
              const jobsData = await res.json();
              const allJobs: Job[] = jobsData.data || [];

              // Filter jobs matching applied IDs
              let filtered = allJobs.filter((job) => appliedIds.has(job.id));

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
            }
          }
        } catch (error) {
          console.error("Error fetching applied jobs:", error);
        }
      }
    };

    fetchMyApplications();
  }, [API_URL, currentPage, searchTerm, refreshTrigger]);

  return (
    <>
      <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-3xl mb-6 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">📄 My Applications</h2>
        <p className="text-xs text-gray-500 mt-1">Review all active career opportunities you have applied for.</p>
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
        onApply={() => {}}
      />
    </>
  );
}
