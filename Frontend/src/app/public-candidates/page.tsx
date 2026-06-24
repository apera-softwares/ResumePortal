"use client";

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import EditResume from "@/components/UsersModels/resumeEditModel/EditResume";
import ResumeUploadForm from "@/components/ResumeUploadForm/ResumeUploadForm";
import { Modal } from "@/components/ui/modal";
import { useModal } from "@/hooks/useModal";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";

interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  yearsOfExperience: number;
  education?: string;
  noticePeriod: number;
  resume: string;
  resumeText?: string;
  cleanedResume?: string;
  isPublic?: boolean;
  skills: { name: string }[];
  job?: {
    id: number;
    title: string;
    location: string;
    salary: number;
  };
}

function PublicCandidatesContent() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const candidateIdParam = searchParams.get("candidateId");

  const [candidatesData, setCandidatesData] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expFilter, setExpFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewingCandidate, setViewingCandidate] = useState<Candidate | null>(null);
  const [totalCount, setTotalCount] = useState(0);

  const ITEMS_PER_PAGE = 8;
  const { isOpen, openModal, closeModal } = useModal();
  const [isDarkMode, setIsDarkMode] = useState(true);

  // Sync theme on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      const isDark = savedTheme === "dark";
      setIsDarkMode(isDark);
      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    } else {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    }
  }, []);

  const toggleTheme = () => {
    const newTheme = !isDarkMode;
    setIsDarkMode(newTheme);
    if (newTheme) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const fetchAvailableSkills = async () => {
    try {
      const res = await fetch(`${API_URL}/skills`);
      if (res.ok) {
        const data = await res.json();
        const extracted = Array.isArray(data)
          ? data.map((item: any) => item.name)
          : [];
        const unique = Array.from(new Set(extracted.filter(Boolean) as string[])).sort();
        setAvailableSkills(unique);
      }
    } catch (error) {
      console.error("Error fetching skills list:", error);
    }
  };

  useEffect(() => {
    fetchAvailableSkills();
  }, [API_URL]);

  useEffect(() => {
    if (candidateIdParam) {
      const cached = candidatesData.find((c) => c.id === Number(candidateIdParam));
      if (cached) {
        setViewingCandidate(cached);
      } else {
        const fetchOneCandidate = async () => {
          try {
            const res = await fetch(`${API_URL}/candidates/${candidateIdParam}`);
            if (res.ok) {
              const data = await res.json();
              setViewingCandidate(data);
            }
          } catch (error) {
            console.error("Error fetching single candidate:", error);
          }
        };
        fetchOneCandidate();
      }
    } else {
      setViewingCandidate(null);
    }
  }, [candidateIdParam, candidatesData, API_URL]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, expFilter, skillFilter]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("page", String(currentPage));
        queryParams.append("limit", String(ITEMS_PER_PAGE));
        queryParams.append("isPublic", "true");
        if (searchTerm) queryParams.append("search", searchTerm);
        if (skillFilter) queryParams.append("skill", skillFilter);
        if (expFilter) queryParams.append("experience", expFilter);

        const res = await fetch(`${API_URL}/candidates?${queryParams.toString()}`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          throw new Error("Something went wrong while fetching candidates");
        }
        const data = await res.json();
        if (data && typeof data.total === "number") {
          setCandidatesData(data.data || []);
          setTotalCount(data.total);
        } else {
          const arr = Array.isArray(data) ? data : (data.data || []);
          setCandidatesData(arr);
          setTotalCount(arr.length);
        }
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
    };

    fetchData();
  }, [API_URL, currentPage, searchTerm, expFilter, skillFilter]);

  const getAvatarStyle = (firstName: string, lastName: string) => {
    const name = `${firstName} ${lastName}`.trim();
    const gradients = [
      "from-blue-600 to-blue-700 text-white",
      "from-gray-700 to-gray-800 text-white dark:from-gray-800 dark:to-gray-900",
      "from-slate-800 to-slate-950 text-white border border-gray-700/50 dark:border-gray-800",
      "from-blue-500 to-indigo-600 text-white",
      "from-zinc-700 to-zinc-900 text-white",
      "from-blue-700 to-slate-900 text-white",
    ];
    let hash = 0;
    const cleanName = name || "Candidate";
    for (let i = 0; i < cleanName.length; i++) {
      hash = cleanName.charCodeAt(i) + ((hash << 5) - hash);
    }
    const gradient = gradients[Math.abs(hash) % gradients.length];
    const initial = cleanName.charAt(0).toUpperCase();
    return { gradient, initial };
  };

  if (viewingCandidate) {
    return (
      <div className="min-h-screen w-full flex flex-col relative bg-gray-50 dark:bg-[#0b0a19] transition-colors duration-300">
        <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-[#0b0a19]/80 border-b border-gray-100 dark:border-[#1c1b2e] transition-all duration-300">
          <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 h-16 sm:h-20">
            <div className="flex items-center">
              <img 
                src="/images/brand/brand-logo-png.png" 
                alt="Brand Logo" 
                className="h-9 sm:h-11 w-auto object-contain cursor-pointer" 
                onClick={() => router.push("/")}
              />
            </div>
            <div className="flex items-center gap-2.5">
              <button
                onClick={() => router.push("/public-candidates")}
                className="px-4 py-2 text-sm font-semibold rounded-xl border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 dark:border-[#222138] dark:bg-[#121124] dark:text-gray-200 dark:hover:bg-[#1c1b35] transition-all shadow-sm"
              >
                Back to List
              </button>
            </div>
          </div>
        </header>

        <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <EditResume
            candidate={viewingCandidate}
            isInline={true}
            onClose={() => router.push(pathname)}
            initialMode="preview"
            isPublicPage={true}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col relative bg-gray-50 dark:bg-[#0b0a19] transition-colors duration-300">
      {/* Premium Glassmorphic Header */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-md bg-white/80 dark:bg-[#0b0a19]/80 border-b border-gray-100 dark:border-[#1c1b2e] transition-all duration-300">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 sm:px-6 lg:px-8 h-16 sm:h-20">
          <div className="flex items-center gap-4">
            <img 
              src="/images/brand/brand-logo-png.png" 
              alt="Brand Logo" 
              className="h-9 sm:h-11 w-auto object-contain cursor-pointer" 
              onClick={() => router.push("/")}
            />
            <button 
              onClick={() => router.push("/")}
              className="px-3.5 py-2 sm:px-4.5 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 dark:border-[#222138] bg-white dark:bg-[#121124] hover:bg-gray-50 dark:hover:bg-[#1c1b35]/80 text-gray-700 dark:text-gray-200 shadow-sm transition-all"
            >
              Home
            </button>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-3.5">
            <button
              onClick={toggleTheme}
              className="p-2 sm:p-2.5 rounded-xl border border-gray-200 dark:border-[#222138] bg-white dark:bg-[#121124] text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-[#1c1b35] transition-all shadow-sm"
              aria-label="Toggle Theme"
            >
              {isDarkMode ? (
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m0-12.728l.707.707m12.728 12.728l.707.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
                </svg>
              ) : (
                <svg className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                </svg>
              )}
            </button>

            <button 
              onClick={() => router.push('/public-candidates')} 
              className="px-3.5 py-2 sm:px-4.5 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-blue-500 dark:border-violet-500 bg-blue-50/30 dark:bg-violet-950/10 text-blue-600 dark:text-violet-400 shadow-sm transition-all"
            >
              Candidate
            </button>

            <button 
              onClick={openModal} 
              className="group flex items-center gap-2 px-3.5 py-2 sm:px-4.5 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl border border-gray-200 dark:border-[#222138] bg-white dark:bg-[#121124] hover:bg-gray-50 dark:hover:bg-[#1c1b35]/80 text-gray-700 dark:text-gray-200 shadow-sm transition-all"
            >
              <svg className="w-4 h-4 text-gray-500 dark:text-gray-400 group-hover:text-blue-500 dark:group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              <span>Upload Resume</span>
            </button>
            
            <button 
              onClick={() => router.push('/login')} 
              className="flex items-center gap-1.5 px-4 py-2 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 shadow-md shadow-violet-500/10 hover:shadow-lg hover:shadow-violet-500/20 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99]"
            >
              <span>LogIn</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col gap-6">
          
          {/* Header Section */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-[#121124] border border-gray-200 dark:border-[#222138] rounded-3xl shadow-xs">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Public Candidate Database
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Browse candidate details, skills, location, notice period, and yrs of experience.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              {/* Skill Filter */}
              <select
                value={skillFilter}
                onChange={(e) => setSkillFilter(e.target.value)}
                onFocus={fetchAvailableSkills}
                className="px-3 py-2.5 text-sm text-gray-900 bg-gray-50 dark:bg-[#0b0a19] border border-gray-200 dark:border-[#222138] rounded-2xl focus:outline-none dark:text-gray-200 transition-all cursor-pointer font-semibold"
              >
                <option value="">All Skills</option>
                {availableSkills.map((skill) => (
                  <option key={skill} value={skill}>{skill}</option>
                ))}
              </select>

              {/* Experience Filter */}
              <select
                value={expFilter}
                onChange={(e) => setExpFilter(e.target.value)}
                className="px-3 py-2.5 text-sm text-gray-900 bg-gray-50 dark:bg-[#0b0a19] border border-gray-200 dark:border-[#222138] rounded-2xl focus:outline-none dark:text-gray-200 transition-all cursor-pointer font-semibold"
              >
                <option value="">All Experience</option>
                <option value="0-2">0 - 2 Years</option>
                <option value="3-5">3 - 5 Years</option>
                <option value="6-9">6 - 9 Years</option>
                <option value="10+">10+ Years</option>
              </select>

              {/* Search Box */}
              <div className="relative w-full sm:w-80">
                <input
                  type="text"
                  placeholder="Search candidates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-gray-50 dark:bg-[#0b0a19] border border-gray-200 dark:border-[#222138] rounded-2xl focus:outline-none focus:bg-white dark:focus:bg-[#0b0a19] dark:text-gray-200 transition-all"
                />
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </span>
              </div>
            </div>
          </div>

          {/* Table Container */}
          <div className="flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200 dark:border-[#222138] bg-white dark:bg-[#121124] shadow-xs">
            <div className="max-w-full overflow-x-auto h-[70vh] overflow-y-auto relative scrollbar-thin">
              <Table>
                <TableHeader className="sticky top-0 z-10 backdrop-blur-md bg-white/95 dark:bg-[#121124]/95 border-b border-gray-200/40 dark:border-[#222138]/60">
                  <TableRow className="h-14">
                    <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Id</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">First Name</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-center">View Resume</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Skills</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Location</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Notice Period</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Budget</TableCell>
                    <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Yrs of Exp</TableCell>
                  </TableRow>
                </TableHeader>

                <TableBody className="divide-y divide-gray-200/40 dark:divide-[#222138]/60">
                  {candidatesData.length > 0 ? (
                    candidatesData.map((cand) => {
                      const avatar = getAvatarStyle(cand.firstName, cand.lastName);
                      const displayBudget = cand.job?.salary 
                        ? `$${cand.job.salary.toLocaleString()}` 
                        : "N/A";
                      const displayLocation = cand.job?.location || "Remote";
                      
                      return (
                        <TableRow key={cand.id} className="hover:bg-gray-50/50 dark:hover:bg-[#1c1b35]/20 transition-all border-b border-gray-200/40 dark:border-[#222138]/60">
                          {/* Id */}
                          <TableCell className="px-6 py-4 text-start text-sm font-semibold text-gray-500 dark:text-gray-400">
                            #{cand.id}
                          </TableCell>

                          {/* First Name & Avatar */}
                          <TableCell className="px-6 py-4 text-start">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 flex items-center justify-center rounded-full font-bold bg-gradient-to-br ${avatar.gradient} text-xs`}>
                                {avatar.initial}
                              </div>
                              <span className="font-semibold text-gray-900 dark:text-white">
                                {cand.firstName}
                              </span>
                            </div>
                          </TableCell>

                          {/* View Resume */}
                          <TableCell className="px-6 py-4 text-center">
                            <button
                              onClick={() => router.push(`${pathname}?candidateId=${cand.id}`)}
                              className="px-4 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-[#2d2c4b] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121124] hover:bg-gray-50 dark:hover:bg-[#1c1b35] transition-all shadow-xs"
                            >
                              View
                            </button>
                          </TableCell>

                          {/* Skills */}
                          <TableCell className="px-6 py-4 text-start max-w-[200px]">
                            <div className="flex flex-wrap gap-1.5">
                              {cand.skills && cand.skills.length > 0 ? (
                                cand.skills.map((s, i) => (
                                  <span key={i} className="bg-gray-100 dark:bg-[#1c1b35] text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md text-xs border border-gray-200/50 dark:border-[#2d2c4b]">
                                    {s.name}
                                  </span>
                                ))
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </div>
                          </TableCell>

                          {/* Location */}
                          <TableCell className="px-6 py-4 text-start text-sm text-gray-700 dark:text-gray-300 font-medium">
                            <span className="capitalize">
                              {displayLocation.toLowerCase()}
                            </span>
                          </TableCell>

                          {/* Notice Period */}
                          <TableCell className="px-6 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                            {cand.noticePeriod} days
                          </TableCell>

                          {/* Budget */}
                          <TableCell className="px-6 py-4 text-start text-sm text-gray-700 dark:text-gray-300 font-medium">
                            {displayBudget}
                          </TableCell>

                          {/* Years of Experience */}
                          <TableCell className="px-6 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                            <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-[#1a233d]/50 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-[#23315a]/50">
                              {cand.yearsOfExperience} Yrs
                            </span>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  ) : (
                    <TableRow>
                      <td colSpan={8} className="py-24 text-center text-gray-400 dark:text-gray-500 text-sm">
                        No candidates found.
                      </td>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Pagination Controls */}
            {totalCount > 0 && (
              <div className="flex flex-col sm:flex-row justify-between items-center gap-4 px-6 py-4 border-t border-gray-200/40 dark:border-[#222138]/60 bg-gray-50/50 dark:bg-[#0b0a19]/40">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to {Math.min(currentPage * ITEMS_PER_PAGE, totalCount)} of {totalCount} candidates
                </span>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-[#222138] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121124] hover:bg-gray-50 dark:hover:bg-[#1c1b35] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Prev
                  </button>

                  {(() => {
                    const totalPages = Math.ceil(totalCount / ITEMS_PER_PAGE);
                    const pages: (number | string)[] = [];
                    if (totalPages <= 5) {
                      for (let i = 1; i <= totalPages; i++) pages.push(i);
                    } else {
                      pages.push(1);
                      if (currentPage > 3) pages.push("...");
                      const start = Math.max(2, currentPage - 1);
                      const end = Math.min(totalPages - 1, currentPage + 1);
                      for (let i = start; i <= end; i++) pages.push(i);
                      if (currentPage < totalPages - 2) pages.push("...");
                      pages.push(totalPages);
                    }

                    return pages.map((page, idx) => {
                      if (typeof page === "string") {
                        return (
                          <span key={idx} className="px-2 text-gray-400 dark:text-gray-500 text-xs">
                            {page}
                          </span>
                        );
                      }
                      return (
                        <button
                          key={idx}
                          onClick={() => setCurrentPage(page)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                            currentPage === page
                              ? "bg-gradient-to-r from-violet-600 to-indigo-650 text-white border-0"
                              : "border border-gray-200 dark:border-[#222138] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121124] hover:bg-gray-50 dark:hover:bg-[#1c1b35]"
                          }`}
                        >
                          {page}
                        </button>
                      );
                    });
                  })()}

                  <button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, Math.ceil(totalCount / ITEMS_PER_PAGE)))}
                    disabled={currentPage === Math.ceil(totalCount / ITEMS_PER_PAGE)}
                    className="px-3 py-1.5 rounded-xl text-xs font-semibold border border-gray-200 dark:border-[#222138] text-gray-700 dark:text-gray-200 bg-white dark:bg-[#121124] hover:bg-gray-50 dark:hover:bg-[#1c1b35] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
        <ResumeUploadForm closeModal={closeModal} />
      </Modal>
    </div>
  );
}

export default function PublicCandidates() {
  return (
    <Suspense fallback={
      <div className="min-h-screen w-full flex items-center justify-center bg-gray-50 dark:bg-[#0b0a19]">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-violet-600 dark:text-violet-550" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-gray-500">Loading Candidate Database...</span>
        </div>
      </div>
    }>
      <PublicCandidatesContent />
    </Suspense>
  );
}
