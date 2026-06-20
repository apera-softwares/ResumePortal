"use client";

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import EditResume from "@/components/UsersModels/resumeEditModel/EditResume";
import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

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

export default function Candidates() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:3001` : "http://localhost:3001");
  const [role, setRole] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [candidatesData, setCandidatesData] = useState<Candidate[]>([]);
  const [filtercandidate, setFiltercandidates] = useState<Candidate[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [expFilter, setExpFilter] = useState("");
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(localStorage.getItem("role"));
      const storedUserId = localStorage.getItem("userId");
      if (storedUserId) {
        setUserId(Number(storedUserId));
      }
    }
  }, []);

  useEffect(() => {
    const isCompanyUser = role && role !== "ADMIN";
    
    let filtered = candidatesData.filter((cand) => {
      if (isCompanyUser) {
        return cand.job?.createdById === userId;
      }
      return true;
    });

    // Apply Experience Range Filter
    if (expFilter) {
      filtered = filtered.filter((cand) => {
        const exp = cand.yearsOfExperience;
        if (expFilter === "0-2") return exp >= 0 && exp <= 2;
        if (expFilter === "3-5") return exp >= 3 && exp <= 5;
        if (expFilter === "6-9") return exp >= 6 && exp <= 9;
        if (expFilter === "10+") return exp >= 10;
        return true;
      });
    }

    // Apply Search Term Filter (removed education, added experience number match)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter((cand) => {
        const nameMatch = `${cand.firstName} ${cand.lastName}`.toLowerCase().includes(term);
        const emailMatch = cand.email.toLowerCase().includes(term);
        const mobileMatch = cand.mobile?.toLowerCase().includes(term) || false;
        const skillsMatch = cand.skills?.some((s) => s.name.toLowerCase().includes(term)) || false;
        const eduMatch = cand.education?.toLowerCase().includes(term) || false;
        const resumeTextCleaned = (cand as any).resumeText?.replace(/<[^>]*>/g, '').toLowerCase() || '';
        const resumeTextMatch = resumeTextCleaned.includes(term);
        return nameMatch || emailMatch || mobileMatch || eduMatch || skillsMatch || resumeTextMatch;
      });
    }

    setFiltercandidates(filtered);
  }, [searchTerm, expFilter, candidatesData, role, userId]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/candidates`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) {
          throw new Error("Something went wrong while fetching candidates");
        }
        const data = await res.json();
        const candidatesArray = Array.isArray(data.data) ? data.data : data; 
        setCandidatesData(candidatesArray || []);
      } catch (error) {
        console.error("Error fetching candidates:", error);
      }
    };

    fetchData();
  }, [API_URL]);

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
      toast.success("Candidate deleted successfully!");
    } catch (error) {
      console.error("Error deleting candidate:", error);
      toast.error("Failed to delete candidate.");
    }
  };

  const handleDelete = (candidatesID: number) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="text-sm font-medium text-gray-900">
          Are you sure you want to delete this candidate?
        </p>
        <div className="flex justify-end gap-2">
          <button
            onClick={() => toast.dismiss(t.id)}
            className="px-3 py-1 text-xs text-gray-500 hover:text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              await executeDelete(candidatesID);
            }}
            className="px-3 py-1 text-xs text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors shadow-xs"
          >
            Delete
          </button>
        </div>
      </div>
    ), {
      duration: 5000,
      position: "top-center",
    });
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
          onClose={() => setEditingCandidate(null)}
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

      <div className="overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-[1102px]">
            <Table>
              {/* Header */}
              <TableHeader className="border-b border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
                <TableRow className="h-14">
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Candidate Name</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Email</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Mobile No</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Years of Experience</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Skills</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Applied Position</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Status</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-center">Resume</TableCell>
                  {role === "CLIENT" ? null : (
                    <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-center">Actions</TableCell>
                  )}
                </TableRow>
              </TableHeader>

              {/* Body */}
              <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filtercandidate.length > 0 ? (
                  filtercandidate.map((user) => {
                    const avatar = getAvatarStyle(user.firstName, user.lastName);
                    return (
                      <TableRow key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-all border-b border-gray-100 dark:border-gray-850">
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

                        {/* Applied Job */}
                        <TableCell className="px-6 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                          {user.job ? (
                            <span className="font-semibold text-blue-600 dark:text-blue-400">
                              {user.job.title}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-600 italic">General Upload</span>
                          )}
                        </TableCell>

                        {/* Status Select */}
                        <TableCell className="px-6 py-4 text-start text-sm">
                          <select
                            value={user.status || "Applied"}
                            onChange={async (e) => {
                              const newStatus = e.target.value;
                              try {
                                const response = await fetch(`${API_URL}/candidates/${user.id}/status`, {
                                  method: "PUT",
                                  headers: {
                                    "Content-Type": "application/json",
                                    Authorization: `Bearer ${localStorage.getItem("token") || ""}`,
                                  },
                                  body: JSON.stringify({ status: newStatus }),
                                });
                                if (response.ok) {
                                  toast.success(`Candidate status updated to ${newStatus}`);
                                  setCandidatesData((prev) =>
                                    prev.map((c) =>
                                      c.id === user.id ? { ...c, status: newStatus } : c
                                    )
                                  );
                                  setFiltercandidates((prev) =>
                                    prev.map((c) =>
                                      c.id === user.id ? { ...c, status: newStatus } : c
                                    )
                                  );
                                } else {
                                  toast.error("Failed to update status");
                                }
                              } catch (err) {
                                console.error(err);
                                toast.error("Error updating status");
                              }
                            }}
                            className={`px-2.5 py-1 text-xs font-semibold rounded-lg border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer ${
                              user.status === "Shortlisted"
                                ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50"
                                : user.status === "Under Review" || user.status === "Reviewing"
                                ? "bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400 border-amber-100 dark:border-amber-900/50"
                                : user.status === "Rejected"
                                ? "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border-rose-100 dark:border-rose-900/50"
                                : "bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-900/50"
                            }`}
                          >
                            <option value="Applied" className="bg-white dark:bg-gray-950 text-blue-600">Applied</option>
                            <option value="Under Review" className="bg-white dark:bg-gray-950 text-amber-650">Under Review</option>
                            <option value="Shortlisted" className="bg-white dark:bg-gray-950 text-emerald-600">Shortlisted</option>
                            <option value="Rejected" className="bg-white dark:bg-gray-950 text-rose-600">Rejected</option>
                          </select>
                        </TableCell>

                        {/* Resume Edit */}
                        <TableCell className="px-6 py-4 text-center">
                          <div className="inline-flex justify-center">
                            <button
                              onClick={() => setEditingCandidate(user)}
                              className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs"
                            >
                              View Resume
                            </button>
                          </div>
                        </TableCell>

                        {/* Actions */}
                        {role === "CLIENT" ? null : (
                          <TableCell className="px-6 py-4 text-center">
                            <button
                              onClick={() => handleDelete(user.id)}
                              className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 text-rose-600 dark:text-rose-400 transition-all duration-200"
                            >
                              Delete
                            </button>
                          </TableCell>
                        )}
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <td colSpan={role === "CLIENT" ? 8 : 9} className="py-12 text-center text-gray-400 dark:text-gray-500 text-sm">
                      No candidates found.
                    </td>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>
    </div>
  );
}
