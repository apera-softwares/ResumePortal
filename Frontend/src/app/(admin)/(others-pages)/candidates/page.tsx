"use client";

import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import EditResume from "@/components/UsersModels/resumeEditModel/EditResume";
import { SquarePen, Trash, SlidersHorizontal, X, ChevronDown } from "lucide-react";
import React, { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import toast from "react-hot-toast";
import Select, { components } from "react-select";

const getCustomSelectStyles = (isDark: boolean) => ({
  control: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: isDark ? '#1f2937' : '#ffffff',
    borderColor: state.isFocused
      ? '#3b82f6'
      : isDark
        ? '#374151'
        : '#e5e7eb',
    borderRadius: '1rem',
    padding: '2px 4px',
    fontSize: '0.875rem',
    fontWeight: '600',
    boxShadow: state.isFocused
      ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
      : 'none',
    '&:hover': {
      borderColor: isDark ? '#4b5563' : '#d1d5db',
    },
    transition: 'all 0.2s ease',
  }),
  menu: (provided: any) => ({
    ...provided,
    backgroundColor: isDark ? '#111827' : '#ffffff',
    borderRadius: '0.75rem',
    border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
    overflow: 'hidden',
    zIndex: 9999,
  }),
  singleValue: (provided: any) => ({
    ...provided,
    color: isDark ? '#f9fafb' : '#111827',
  }),
  placeholder: (provided: any) => ({
    ...provided,
    color: isDark ? '#9ca3af' : '#6b7280',
  }),
  multiValue: (provided: any) => ({
    ...provided,
    backgroundColor: isDark ? '#374151' : '#f3f4f6',
    borderRadius: '0.5rem',
    border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
    padding: '1px 4px',
  }),
  multiValueLabel: (provided: any) => ({
    ...provided,
    color: isDark ? '#f9fafb' : '#374151',
    fontWeight: '600',
    fontSize: '0.75rem',
  }),
  multiValueRemove: (provided: any) => ({
    ...provided,
    color: isDark ? '#9ca3af' : '#6b7280',
    borderRadius: '0.25rem',
    marginLeft: '2px',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
      color: isDark ? '#ef4444' : '#ef4444',
    },
  }),
  option: (provided: any, state: any) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? '#3b82f6'
      : state.isFocused
        ? isDark
          ? '#1f2937'
          : '#f3f4f6'
        : 'transparent',
    color: state.isSelected
      ? '#ffffff'
      : isDark
        ? '#f9fafb'
        : '#111827',
    padding: '8px 12px',
    borderRadius: '0.5rem',
    fontSize: '0.875rem',
    cursor: 'pointer',
    '&:active': {
      backgroundColor: '#3b82f6',
    },
  }),
});

const CustomOption = (props: any) => {
  return (
    <components.Option {...props}>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={props.isSelected}
          onChange={() => null}
          className="h-4 w-4 rounded border-gray-300 dark:border-gray-650 bg-white dark:bg-gray-800 text-blue-600 focus:ring-blue-500 dark:focus:ring-blue-600 cursor-pointer"
        />
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{props.label}</span>
      </div>
    </components.Option>
  );
};

const DEFAULT_CITY_OPTIONS = [
  { value: "Remote", label: "Remote" },
  { value: "Bangalore", label: "Bangalore" },
  { value: "Mumbai", label: "Mumbai" },
  { value: "Delhi NCR", label: "Delhi NCR" },
  { value: "Gurgaon", label: "Gurgaon" },
  { value: "Noida", label: "Noida" },
  { value: "Hyderabad", label: "Hyderabad" },
  { value: "Pune", label: "Pune" },
  { value: "Chennai", label: "Chennai" },
  { value: "Kolkata", label: "Kolkata" },
  { value: "Ahmedabad", label: "Ahmedabad" },
  { value: "Kochi", label: "Kochi" },
  { value: "Jaipur", label: "Jaipur" },
];

const EXPERIENCE_OPTIONS = [
  { value: "fresher", label: "Fresher (0 Years)" },
  { value: "0-1", label: "0–1 Yrs" },
  { value: "1-2", label: "1–2 Yrs" },
  { value: "2-3", label: "2–3 Yrs" },
  { value: "3-5", label: "3–5 Yrs" },
  { value: "5-7", label: "5–7 Yrs" },
  { value: "7-10", label: "7–10 Yrs" },
  { value: "10-12", label: "10–12 Yrs" },
  { value: "12-15", label: "12–15 Yrs" },
  { value: "15+", label: "15+ Yrs" },
];

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  mobile?: string;
  yearsOfExperience: number;
  education?: string;
  noticePeriod: number;
  budget?: string;
  resume: string;
  resumeText?: string;
  cleanedResume?: string;
  isPublic?: boolean;
  skills: { name: string }[];
  job?: {
    id: string;
    title: string;
    createdById: string;
    location?: string;
    salary?: number;
  };
  currentLocation?: string;
  preferredJobLocations?: string[];
  status?: string;
}

function CandidatesContent() {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const candidateIdParam = searchParams.get("candidateId");
  const modeParam = searchParams.get("mode");
  const jobIdParam = searchParams.get("jobId");
  const jobTitleParam = searchParams.get("jobTitle");

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
  const [expFilter, setExpFilter] = useState<{ value: string; label: string } | null>(null);
  const [skillFilter, setSkillFilter] = useState<{ value: string; label: string }[]>([]);
  const [availableSkills, setAvailableSkills] = useState<string[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [editingCandidate, setEditingCandidate] = useState<Candidate | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [jobs, setJobs] = useState<{ id: string; title: string }[]>([]);
  const [jobFilter, setJobFilter] = useState<{ value: string; label: string } | null>(null);
  const [locationFilter, setLocationFilter] = useState<{ value: string; label: string }[]>([]);
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>(DEFAULT_CITY_OPTIONS);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  const activeFiltersCount = [
    jobFilter ? 1 : 0,
    locationFilter.length > 0 ? 1 : 0,
    skillFilter.length > 0 ? 1 : 0,
    expFilter ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setIsDark(document.documentElement.classList.contains("dark"));

      const observer = new MutationObserver(() => {
        setIsDark(document.documentElement.classList.contains("dark"));
      });
      observer.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ["class"],
      });
      return () => observer.disconnect();
    }
  }, []);

  const fetchJobs = async () => {
    try {
      const res = await fetch(`${API_URL}/jobs`);
      if (res.ok) {
        const data = await res.json();
        const jobsList = data.data || [];
        setJobs(jobsList);
      }
    } catch (error) {
      console.error("Error fetching jobs list:", error);
    }
  };

  const fetchCities = async () => {
    try {
      const res = await fetch(`${API_URL}/locations`);
      if (res.ok) {
        const result = await res.json();
        const locationsList = result.data || [];
        const mapped = locationsList
          .filter((loc: any) => loc.name.toUpperCase() !== "REMOTE")
          .map((loc: any) => ({
            value: loc.name,
            label: loc.name
              .toLowerCase()
              .split(" ")
              .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(" "),
          }));
        setCityOptions([
          { value: "Remote", label: "Remote" },
          ...mapped
        ]);
      }
    } catch (error) {
      console.error("Error fetching cities list:", error);
    }
  };

  const clearJobFilterAndUrl = () => {
    setJobFilter(null);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.delete("jobId");
      params.delete("jobTitle");
      const newSearch = params.toString();
      router.replace(newSearch ? `${pathname}?${newSearch}` : pathname);
    }
  };

  const clearAllFiltersAndUrl = () => {
    setJobFilter(null);
    setLocationFilter([]);
    setSkillFilter([]);
    setExpFilter(null);
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.delete("jobId");
      params.delete("jobTitle");
      const newSearch = params.toString();
      router.replace(newSearch ? `${pathname}?${newSearch}` : pathname);
    }
  };

  useEffect(() => {
    fetchJobs();
    fetchCities();
  }, [API_URL]);

  useEffect(() => {
    if (jobIdParam) {
      setJobFilter({
        value: jobIdParam,
        label: jobTitleParam ? decodeURIComponent(jobTitleParam) : "Filtered Job",
      });
    } else {
      setJobFilter(null);
    }
  }, [jobIdParam, jobTitleParam]);

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
      const cached = candidatesData.find((c) => String(c.id) === String(candidateIdParam));
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
  }, [searchTerm, expFilter, skillFilter, jobFilter, locationFilter]);

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
        if (skillFilter && skillFilter.length > 0) queryParams.append("skill", skillFilter.map(s => s.value).join(","));
        if (expFilter?.value) queryParams.append("experience", expFilter.value);
        if (role) queryParams.append("role", role);
        if (userId) queryParams.append("userId", String(userId));
        if (jobFilter?.value) queryParams.append("jobId", jobFilter.value);
        if (locationFilter && locationFilter.length > 0) queryParams.append("location", locationFilter.map(l => l.value).join(","));

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
  }, [API_URL, currentPage, searchTerm, expFilter, skillFilter, role, userId, jobFilter, locationFilter]);

  const executeDelete = async (candidatesID: string) => {
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
                String(c.id) === String(editingCandidate.id) ? { ...c, ...updatedCandidate } : c
              )
            );
            setFiltercandidates((prev) =>
              prev.map((c) =>
                String(c.id) === String(editingCandidate.id) ? { ...c, ...updatedCandidate } : c
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
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto items-center">
          {/* Search Input */}
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              placeholder="Search candidates..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm text-gray-900 bg-gray-55 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white dark:focus:bg-gray-950 dark:text-white transition-all"
            />
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-405">
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

          {/* Unified Filter Popover */}
          <div className="relative w-full sm:w-auto">
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className="w-full sm:w-auto flex items-center justify-between sm:justify-start gap-2 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl hover:bg-gray-55 dark:hover:bg-gray-800 transition-all cursor-pointer shadow-xs"
            >
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span>Filters</span>
                {activeFiltersCount > 0 && (
                  <span className="flex items-center justify-center h-5 px-1.5 min-w-[20px] text-[10px] font-bold text-white bg-blue-600 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
              </div>
              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isFilterOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Popover Card */}
            {isFilterOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setIsFilterOpen(false)}
                />
                
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-3xl shadow-2xl p-5 z-50 flex flex-col gap-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-2">
                    <span className="text-sm font-bold text-gray-900 dark:text-white">Filters</span>
                    {activeFiltersCount > 0 && (
                      <button
                        onClick={clearAllFiltersAndUrl}
                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Job Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Job Profile</label>
                    <Select
                      name="jobFilter"
                      value={jobFilter}
                      onChange={(selected: any) => {
                        if (!selected) {
                          clearJobFilterAndUrl();
                        } else {
                          setJobFilter(selected);
                        }
                      }}
                      onFocus={fetchJobs}
                      options={jobs.map((j) => ({ value: j.id, label: j.title }))}
                      styles={getCustomSelectStyles(isDark)}
                      placeholder="Select Job..."
                      isClearable
                    />
                  </div>

                  {/* Location Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Location</label>
                    <Select
                      name="locationFilter"
                      value={locationFilter}
                      onChange={(selected: any) => setLocationFilter(selected || [])}
                      options={cityOptions}
                      styles={getCustomSelectStyles(isDark)}
                      placeholder="Select Location..."
                      isMulti
                      closeMenuOnSelect={false}
                      hideSelectedOptions={false}
                      components={{ Option: CustomOption }}
                    />
                  </div>

                  {/* Skill Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Skill</label>
                    <Select
                      name="skillFilter"
                      value={skillFilter}
                      onChange={(selected: any) => setSkillFilter(selected || [])}
                      onFocus={fetchAvailableSkills}
                      options={availableSkills.map((s) => ({ value: s, label: s }))}
                      styles={getCustomSelectStyles(isDark)}
                      placeholder="Select Skill..."
                      isMulti
                      closeMenuOnSelect={false}
                      hideSelectedOptions={false}
                      components={{ Option: CustomOption }}
                    />
                  </div>

                  {/* Experience Filter */}
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400">Experience</label>
                    <Select
                      name="expFilter"
                      value={expFilter}
                      onChange={(selected: any) => setExpFilter(selected)}
                      options={EXPERIENCE_OPTIONS}
                      styles={getCustomSelectStyles(isDark)}
                      placeholder="Select Experience..."
                      isClearable
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Active Filters Row */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-6 py-3.5 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800/80 rounded-3xl shadow-xs">
          <span className="text-xs font-semibold text-gray-400 dark:text-gray-505">Active Filters:</span>
          {jobFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50">
              Job: {jobFilter.label}
              <button onClick={clearJobFilterAndUrl} className="hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          {locationFilter.map((loc) => (
            <span key={loc.value} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50 animate-fade-in">
              Location: {loc.label}
              <button onClick={() => setLocationFilter(prev => prev.filter(item => item.value !== loc.value))} className="hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {skillFilter.map((skill) => (
            <span key={skill.value} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50 animate-fade-in">
              Skill: {skill.label}
              <button onClick={() => setSkillFilter(prev => prev.filter(item => item.value !== skill.value))} className="hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
          {expFilter && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-100/50 dark:border-blue-900/50">
              Experience: {expFilter.label}
              <button onClick={() => setExpFilter(null)} className="hover:text-blue-800 dark:hover:text-blue-300 cursor-pointer">
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          )}
          <button
            onClick={clearAllFiltersAndUrl}
            className="text-xs font-bold text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 ml-1 transition-colors cursor-pointer"
          >
            Clear All
          </button>
        </div>
      )}

      <div className="min-h-[70vh] flex flex-col justify-between overflow-hidden rounded-3xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-xs">
        <div className="max-w-full overflow-x-auto flex-1">
          <div className="min-w-[1102px]">
            <Table>
              {/* Header */}
              <TableHeader className="border-b border-gray-200/40 dark:border-gray-800/60 bg-gray-50/50 dark:bg-gray-900/50">
                <TableRow className="h-14">
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Candidate Name</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Location</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Notice Period</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Budget</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Yrs of Exp</TableCell>
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Skills</TableCell>
                  {/* <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-start">Status</TableCell> */}
                  <TableCell isHeader className="px-6 py-4 font-semibold text-gray-500 dark:text-gray-400 text-sm text-center">Visibility</TableCell>
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
                            </div>
                          </div>
                        </TableCell>

                        {/* Location */}
                        <TableCell className="px-6 py-4 text-start text-sm text-gray-750 dark:text-gray-300 font-medium capitalize">
                          {user.currentLocation || "Remote"}
                        </TableCell>

                        {/* Notice Period */}
                        <TableCell className="px-6 py-4 text-start text-sm text-gray-750 dark:text-gray-300 font-medium">
                          {user.noticePeriod !== undefined && user.noticePeriod !== null ? `${user.noticePeriod} Days` : "N/A"}
                        </TableCell>

                        {/* Budget */}
                        <TableCell className="px-6 py-4 text-start text-sm text-gray-750 dark:text-gray-300 font-semibold">
                          {user.budget || "N/A"}
                        </TableCell>

                        {/* Experience */}
                        <TableCell className="px-6 py-4 text-start text-sm text-gray-700 dark:text-gray-300">
                          <span className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900/50">
                            {(() => {
                              const exp = user.yearsOfExperience;
                              if (!exp || exp === 0) return "Fresher";
                              const formatted = parseFloat(Number(exp).toFixed(1));
                              return `${formatted} ${formatted === 1 ? "Yr" : "Yrs"}`;
                            })()}
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
                              <span className="text-gray-400 dark:text-gray-500 font-medium">NA</span>
                            )}
                          </div>
                        </TableCell>

                        {/* Visibility (Public vs Private) */}
                        <TableCell className="px-6 py-4 text-center">
                          {user.isPublic ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/50">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                              Public
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-500 dark:text-gray-400 border border-gray-100 dark:border-gray-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
                              Private
                            </span>
                          )}
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 mb-4">
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
