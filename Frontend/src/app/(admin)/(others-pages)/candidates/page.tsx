"use client";

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import EditResume from "@/components/UsersModels/resumeEditModel/EditResume";
import { SquarePen, Trash } from "lucide-react";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import { Squada_One } from "next/font/google";

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
  skills: { name: string }[];
  job?: {
    id: number;
    title: string;
    createdById: number;
  };
  status?: string;
}

function CandidatesContent() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:3001` : "http://localhost:3001");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const candidateIdParam = searchParams.get("candidateId");
  const modeParam = searchParams.get("mode");

  const [role, setRole] = useState<string | null>(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("role");
    }
    return null;
  });
  const [userId, setUserId] = useState<number | null>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("userId");
      return stored ? Number(stored) : null;
    }
    return null;
  });
  const [candidatesData, setCandidatesData] = useState<Candidate[]>([]);
  const [filtercandidate, setFiltercandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expFilter, setExpFilter] = useState("");
  const [skillFilter, setSkillFilter] = useState("");
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  const ITEMS_PER_PAGE = 8;

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
        setEditingCandidate(cached);
      } else {
        const fetchOneCandidate = async () => {
          try {
            const res = await fetch(`${API_URL}/candidates/${candidateIdParam}`);
            if (res.ok) {
              const data = await res.json();
              setEditingCandidate(data);
            }
          } catch (error) {
            console.error("Error fetching single candidate:", error);
          }
        };
        fetchOneCandidate();
      }
    } else {
      setEditingCandidate(null);
    }
  }, [candidateIdParam, candidatesData, API_URL]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, expFilter, skillFilter]);

  useEffect(() => {
    const isCompanyUser = role && role !== "ADMIN";
    if (isCompanyUser && userId === null) {
      return;
    }

    const fetchData = async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("page", String(currentPage));
        queryParams.append("limit", String(ITEMS_PER_PAGE));
        if (searchTerm) queryParams.append("search", searchTerm);
        if (skillFilter) queryParams.append("skill", skillFilter);
        if (expFilter) queryParams.append("experience", expFilter);
        if (role) queryParams.append("role", role);
        if (userId) queryParams.append("userId", String(userId));

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
          setFiltercandidates(data.data || []);
          setTotalCount(data.total);
        } else {
          const arr = Array.isArray(data) ? data : (data.data || []);
          setCandidatesData(arr);
          setFiltercandidates(arr);
          setTotalCount(arr.length);
        }
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
    };

    fetchData();
  }, [API_URL, currentPage, searchTerm, expFilter, skillFilter, role, userId]);

  const executeDelete = async (candidatesID: number) => {
    const url = `${API_URL}/candidates/${candidatesID}`;
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" }
      });
      if (!res.ok) throw new Error("FAILED TO DELETE");
      setFiltercandidates((prev) => prev.filter((cand) => cand.id !== candidatesID));
      setCandidatesData((prev) => prev.filter((cand) => cand.id !== candidatesID));
      setTotalCount((prev) => Math.max(0, prev - 1));
      toast.success("Candidate deleted successfully!");
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast.error("Failed to delete candidate.");
    }
  };

  // Dynamic initial-based avatars
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

  if (editingCandidate) {
    return (
      <div className="min-h-[80vh] w-full flex flex-col gap-6 font-outfit px-4 sm:px-6 py-6 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
        <EditResume
          candidate={editingCandidate}
          isInline={true}
          onClose={() => router.push(pathname)}
          initialMode={modeParam === "edit" ? "edit" : "original"}
          onSave={(updatedCandidate) => {
            setCandidatesData((prev) =>
              prev.map((c) =>
                c.id === editingCandidate.id ? { ...c, ...updatedCandidate } : c
              )
            );
            setFiltercandidates((prev) =>
              prev.map((c) =>
                c.id === editingCandidate.id ? { ...c, ...updatedCandidate } : c
              )
            );
          }}
        />
      </div>
    );
  }

  return (
    <div className="min-h-[80vh] w-full flex flex-col gap-6 font-outfit px-4 sm:px-6 py-6 bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      {/* Search Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-3xl shadow-xs">
        <div>
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
            Candidate Database
          </h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Search candidates by name, email, tagged skills, experience, or keywords in their resume.
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          {/* Skill Filter */}
          <select
            value={skillFilter}
            onChange={(e) => setSkillFilter(e.target.value)}
            onFocus={fetchAvailableSkills}
            className="px-3 py-2.5 text-sm text-gray-900 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all cursor-pointer font-semibold"
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
            className="px-3 py-2.5 text-sm text-gray-900 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white transition-all cursor-pointer font-semibold"
          >
            <option value="">All Experience</option>
            <option value="0-2">0 - 2 Years</option>
            <option value="3-5">3 - 5 Years</option>
            <option value="6-9">6 - 9 Years</option>
            <option value="10+">10+ Years</option>
          </select>

          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-950 dark:text-white transition-all"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="min-h-[70vh] flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
        <div className="max-w-full overflow-x-auto flex-1">
          <div className="min-w-[1102px]">
            <Table>
              {/* Header */}
              <TableHeader className="border-b border-gray-200/40 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/50">
                <TableRow className="h-14">
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Candidate Name</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Email</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Mobile No</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Yrs of Exp</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Skills</TableCell>
                  {/* <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Status</TableCell> */}
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-center">Resume</TableCell>
                  {role === "CLIENT" ? null : (
                    <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-center">Actions</TableCell>
                  )}
                </TableRow>
              </TableHeader>

              {/* Body */}
              <TableBody className="divide-y divide-gray-200/40 dark:divide-gray-800/60">
                {filtercandidate.length > 0 ? (
                  filtercandidate.map((user) => {
                    const avatar = getAvatarStyle(user.firstName, user.lastName);
                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all border-b border-gray-200/40 dark:border-gray-800/60">
                        {/* Name & Avatar */}
                        <TableCell className="px-6 py-4 text-start">
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 flex items-center justify-center rounded-full font-bold bg-gradient-to-br ${avatar.gradient}`}>
                              {avatar.initial}
                            </div>
                            <div>
                              <span className="block font-semibold text-gray-900 dark:text-white">
                                {user.firstName} {user.lastName}
                              </span>
                              <span className="block text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                                Notice: {user.noticePeriod} days
                              </span>
                            </div>
                          </div>
                        </TableCell>

                        {/* Email */}
                        <TableCell className="px-6 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                          {user.email}
                        </TableCell>

                        {/* Mobile */}
                        <TableCell className="px-6 py-4 text-start text-sm text-gray-700 dark:text-gray-300 font-mono">
                          {user.mobile || "-"}
                        </TableCell>

                        {/* Experience */}
                        <TableCell className="px-6 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                            {user.yearsOfExperience} Yrs
                          </span>
                        </TableCell>

                        {/* Skills */}
                        <TableCell className="px-6 py-4 text-start max-w-[200px]">
                          <div className="flex flex-wrap gap-1.5">
                            {user.skills && user.skills.length > 0 ? (
                              user.skills.map((s, i) => (
                                <span key={i} className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-md text-xs border border-gray-200/50 dark:border-gray-700">
                                  {s.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Resume View */}
                        <TableCell className="px-6 py-4 text-center">
                          <div className="inline-flex justify-center">
                            <button
                              onClick={() => router.push(`${pathname}?candidateId=${user.id}&mode=view`)}
                              className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                            >
                              View
                            </button>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        {role === "CLIENT" ? null : (
                          <TableCell className="px-6 py-4 text-center">
                            <div className="flex items-center justify-center gap-3">
                              {/* Edit Tooltip Wrapper */}
                              <div className="relative group">
                                <button
                                  onClick={() => router.push(`${pathname}?candidateId=${user.id}&mode=edit`)}
                                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                                >
                                  <SquarePen className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2 py-1 rounded-lg bg-gray-900 dark:bg-gray-800 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                                  edit resume
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-gray-900 dark:border-t-gray-800" />
                                </div>
                              </div>

                              {/* Delete Tooltip Wrapper */}
                              <div className="relative group">
                                <button
                                  onClick={() => setDeleteConfirmId(user.id)}
                                  className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-rose-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                                >
                                  <Trash className="h-4 w-4" />
                                </button>
                                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2.5 px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                                  delete candidate
                                  <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-rose-600" />
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <td colSpan={role === "CLIENT" ? 8 : 9} className="py-36 text-center text-gray-400 dark:text-gray-500 text-sm">
                      No candidates found.
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Premium Pagination Bar */}
        {totalCount > 0 && (
          <div className="flex flex-col sm:flex-row justify-end items-center border-t border-gray-200/40 dark:border-gray-800/60 bg-white dark:bg-gray-900 pt-6 mt-6">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                disabled={currentPage === 1}
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
                  if (currentPage > 3) pages.push("... ");
                  const start = Math.max(2, currentPage - 1);
                  const end = Math.min(totalPages - 1, currentPage + 1);
                  for (let i = start; i <= end; i++) pages.push(i);
                  if (currentPage < totalPages - 2) pages.push(" ...");
                  pages.push(totalPages);
                }
                return pages.map((page, idx) => {
                  if (typeof page === "string") {
                    return (
                      <span key={`ellipse-${idx}`} className="text-gray-400 dark:text-gray-600 px-1.5 font-semibold text-xs select-none">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${currentPage === page
                        ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                        : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800"
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
                className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-750 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId !== null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-gray-950/60 dark:bg-black/80 backdrop-blur-xs transition-opacity duration-300"
            onClick={() => setDeleteConfirmId(null)}
          />

          {/* Modal Container */}
          <div className="relative w-full max-w-sm transform overflow-hidden rounded-2xl bg-white dark:bg-gray-900 p-6 text-center align-middle shadow-2xl transition-all border border-gray-100 dark:border-gray-800 scale-100 opacity-100 duration-300">
            {/* Warning Circle Icon */}
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-955/20 text-rose-600 dark:text-rose-400 mb-4">
              <Trash className="h-6 w-6" />
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-6 mb-2">
              Are you sure?
            </h3>

            {/* Message */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Do you really want to delete this candidate? This action is permanent and cannot be undone.
            </p>

            {/* Action Buttons */}
            <div className="flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs font-semibold rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  const id = deleteConfirmId;
                  setDeleteConfirmId(null);
                  await executeDelete(id);
                }}
                className="px-4 py-2 text-xs font-semibold rounded-xl text-white bg-rose-600 hover:bg-rose-700 active:bg-rose-800 shadow-xs transition-all hover:scale-[1.01] active:scale-[0.99]"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Candidates() {
  return (
    <Suspense fallback={
      <div className="min-h-[80vh] w-full flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="flex flex-col items-center gap-3">
          <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="text-sm font-semibold text-gray-500">Loading Candidate Database...</span>
        </div>
      </div>
    }>
      <CandidatesContent />
    </Suspense>
  );
}
