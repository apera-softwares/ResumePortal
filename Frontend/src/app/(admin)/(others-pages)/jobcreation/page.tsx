"use client"

import Joblisting from '@/components/joblisting/Joblisting';
import { Modal } from '@/components/ui/modal';
import { useModal } from '@/hooks/useModal';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { useTheme } from '@/context/ThemeContext';
import { useRouter } from 'next/navigation';


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

export default function JobsCreation() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [editJobId, setEditJobId] = useState<string | null>(null);
  const [userCompany, setUserCompany] = useState<string>("");
  const [userRole, setUserRole] = useState<string>("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    client: "",
    skills: [] as string[],
    salary: 0,
    internalSalary: 0,
    location: "",
    type: "",
  });

  useEffect(() => {
    const role = localStorage.getItem("role");
    setUserRole(role || "");
    if (role !== "ADMIN" && role !== "HR" && role !== "CLIENT") {
      router.replace("/dashboard");
    } else {
      setAuthorized(true);
    }

    if (typeof window !== "undefined") {
      const userStr = localStorage.getItem("user");
      if (userStr) {
        try {
          const userObj = JSON.parse(userStr);
          setUserCompany(userObj.companyName || "");
          if (role === "CLIENT") {
            setFormData(prev => ({ ...prev, client: userObj.companyName || "" }));
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [router]);

  const selectStyles = {
    control: (base: any) => ({
      ...base,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#d1d5db',
      color: isDark ? '#ffffff' : '#111827',
      borderRadius: '0.5rem',
      padding: '0.125rem',
    }),
    menu: (base: any) => ({
      ...base,
      backgroundColor: isDark ? '#1f2937' : '#ffffff',
      borderColor: isDark ? '#374151' : '#d1d5db',
    }),
    option: (base: any, { isFocused, isSelected }: any) => ({
      ...base,
      backgroundColor: isSelected
        ? '#2563eb'
        : isFocused
          ? (isDark ? '#374151' : '#f3f4f6')
          : 'transparent',
      color: isSelected ? '#ffffff' : (isDark ? '#e5e7eb' : '#111827'),
      cursor: 'pointer',
    }),
    multiValue: (base: any) => ({
      ...base,
      backgroundColor: isDark ? '#374151' : '#e5e7eb',
    }),
    multiValueLabel: (base: any) => ({
      ...base,
      color: isDark ? '#ffffff' : '#111827',
    }),
    multiValueRemove: (base: any) => ({
      ...base,
      color: isDark ? '#9ca3af' : '#4b5563',
      ':hover': {
        backgroundColor: isDark ? '#4b5563' : '#d1d5db',
        color: isDark ? '#ffffff' : '#111827',
      },
    }),
    singleValue: (base: any) => ({
      ...base,
      color: isDark ? '#ffffff' : '#111827',
    }),
    input: (base: any) => ({
      ...base,
      color: isDark ? '#ffffff' : '#111827',
    }),
  };

  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const { isOpen, openModal, closeModal } = useModal();
  const [jData, setJData] = useState<Job[]>([]);
  const [selectedOption, setSelectedOption] = useState(null);

  const handleChnage = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target as HTMLInputElement;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "salary" || name === "internalSalary" ? Number(value) : value,
    }));
  }

  const handleSkillsChange = (selected: any) => {
    const values = selected ? selected.map((opt: any) => opt.value) : [];
    setFormData((prev) => ({ ...prev, skills: values }));
  };

  const handleCreateOpen = () => {
    setEditJobId(null);
    setFormData({
      title: "",
      description: "",
      client: userRole === "CLIENT" ? userCompany : "",
      skills: [],
      salary: 0,
      internalSalary: 0,
      location: "",
      type: "",
    });
    openModal();
  };

  const handleEditOpen = (job: Job) => {
    setEditJobId(job.id);
    setFormData({
      title: job.title,
      description: job.description,
      client: job.client || job.company || "",
      skills: job.skills || [],
      salary: job.salary,
      internalSalary: job.internalSalary || 0,
      location: job.location,
      type: job.type,
    });
    openModal();
  };

  const handlSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!formData.skills || formData.skills.length === 0) {
      toast.error("Please select at least one skill.");
      return;
    }
    if (!formData.location) {
      toast.error("Please select a location.");
      return;
    }
    const token = localStorage.getItem("token");

    try {
      const url = editJobId ? `${API_URL}/jobs/${editJobId}` : `${API_URL}/jobs/create`;
      const method = editJobId ? "PATCH" : "POST";
      const response = await fetch(url, {
        method: method,
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          Array.isArray(errorData.message)
            ? errorData.message.join(", ")
            : errorData.message || `Failed to ${editJobId ? "update" : "create"} job`
        );
      }

      const CreateJobData = await response.json();
      // Refresh the list to trigger correct pagination calculation
      setRefreshTrigger((prev) => prev + 1);
      toast.success(`Job ${editJobId ? "updated" : "created"} successfully!`);

      // Reset form
      setFormData({
        title: "",
        description: "",
        client: userRole === "CLIENT" ? userCompany : "",
        skills: [],
        salary: 0,
        internalSalary: 0,
        location: "",
        type: "",
      });
      setEditJobId(null);
      setSelectedOption(null);

      closeModal();
    } catch (error: any) {
      console.error(`Error saving Job:`, error);
      toast.error(error.message || `Error saving Job`);
    }
  };

  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const ITEMS_PER_PAGE = 8;

  const [skills, setSkills] = useState([])
  const [locations, setLocations] = useState<{ value: string; label: string }[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [jobTypes, setJobTypes] = useState<string[]>([]);

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await fetch(`${API_URL}/jobs/clients`, {
          method: "GET",
          headers: {
            'Authorization': `Bearer ${token || ""}`,
            'Content-Type': 'application/json'
          }
        });
        if (res.ok) {
          const result = await res.json();
          const clientList = result.data || [];
          setClients(clientList.map((c: any) => c.name));
        }
      } catch (error) {
        console.error("Error fetching clients:", error);
      }
    };
    fetchClients();
  }, [API_URL]);

  useEffect(() => {
    const fetchJobTypes = async () => {
      try {
        const res = await fetch(`${API_URL}/jobs/types`);
        if (res.ok) {
          const result = await res.json();
          const types = result.data || [];
          if (types.length > 0) {
            setJobTypes(types);
          }
        }
      } catch (error) {
        console.error("Error fetching job types:", error);
      }
    };
    fetchJobTypes();
  }, [API_URL]);

  useEffect(() => {
    const fetchLocations = async () => {
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
          setLocations([
            { value: "Remote", label: "Remote" },
            ...mapped
          ]);
        }
      } catch (error) {
        console.error("Error fetching locations:", error);
      }
    };
    fetchLocations();
  }, [API_URL]);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await fetch(`${API_URL}/skills`, {
          method: "GET",
          headers: { "Content-Type": "application/json" }
        });
        if (!res.ok) throw new Error("somethig went wrong");
        const Data = await res.json();
        setSkills(Data);
      } catch (error) {
        console.error("error while getting skills")
      }
    }
    fetchSkills()
  }, [])

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const queryParams = new URLSearchParams();
        queryParams.append("page", String(currentPage));
        queryParams.append("limit", String(ITEMS_PER_PAGE));
        if (searchTerm) {
          queryParams.append("search", searchTerm);
        }

        const localRole = localStorage.getItem("role");
        const localUserId = localStorage.getItem("userId");
        if (localRole) {
          queryParams.append("role", localRole);
        }
        if (localUserId) {
          queryParams.append("userId", localUserId);
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
  }, [API_URL, currentPage, searchTerm, refreshTrigger]);

  if (!authorized) return null;

  return (
    <>
      <div className="relative">
        <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">
          <div className="relative w-full flex max-w-[700px] rounded-3xl bg-white dark:bg-gray-900 p-4 lg:p-11">
            <div className="max-w-2xl w-full mx-auto bg-white dark:bg-gray-950 h-[75vh] overflow-y-scroll custom-scrollbar shadow-md rounded-2xl p-6 mt-8 border border-gray-100 dark:border-gray-800/80">
              <h2 className="text-2xl font-semibold mb-6 text-gray-900 dark:text-white">{editJobId ? "Edit Job Listing" : "Add Job Listing"}</h2>
              <form onSubmit={handlSubmit} className="space-y-5">
                {/* Title */}
                <div>
                  <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">
                    Job Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChnage}
                    placeholder="Enter job title"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  />
                </div>

                {/* Description */}
                <div>
                  <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">
                    Description <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChnage}
                    placeholder="Enter job description"
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 focus:ring-2 focus:ring-blue-400 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    rows={4}
                    required
                  ></textarea>
                </div>

                {/* Client */}
                {userRole !== "CLIENT" ? (
                  <div>
                    <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Client</label>
                    <CreatableSelect
                      name="client"
                      value={formData.client ? { value: formData.client, label: formData.client } : null}
                      onChange={(selected: any) => setFormData(prev => ({ ...prev, client: selected ? selected.value : "" }))}
                      options={clients.map((client) => ({ value: client, label: client }))}
                      styles={selectStyles}
                      placeholder="Select or Type Client"
                      isClearable
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Client</label>
                    <input
                      type="text"
                      value={formData.client || userCompany}
                      disabled
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                    />
                  </div>
                )}

                {/* Skills */}
                <div>
                  <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Skills</label>
                  <Select
                    name="skills"
                    value={skills.map((skill: any) => ({
                      value: skill.name,
                      label: skill.name,
                    })).filter((opt: any) => formData.skills.includes(opt.value))}
                    onChange={handleSkillsChange}
                    options={skills.map((skill: any) => ({
                      value: skill.name,
                      label: skill.name,
                    }))}
                    isMulti
                    styles={selectStyles}
                    placeholder="Select Skills..."
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">
                      Salary <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      name="salary"
                      value={formData.salary || ""}
                      onChange={handleChnage}
                      placeholder="e.g. 80000"
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Internal Salary</label>
                    <input
                      type="number"
                      name="internalSalary"
                      value={formData.internalSalary || ""}
                      onChange={handleChnage}
                      placeholder="e.g. 100000"
                      className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                {/* Location */}
                <div>
                  <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Location</label>
                  <CreatableSelect
                    name="location"
                    value={formData.location ? {
                      value: formData.location,
                      label: formData.location === "REMOTE" || formData.location.toUpperCase() === "REMOTE"
                        ? "Remote"
                        : formData.location
                          .toLowerCase()
                          .split(" ")
                          .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1))
                          .join(" ")
                    } : null}
                    onChange={(selected: any) => setFormData(prev => ({ ...prev, location: selected ? selected.value : "" }))}
                    options={locations}
                    styles={selectStyles}
                    placeholder="Select or Type Location"
                    isClearable
                  />
                </div>

                {/* Job Type */}
                <div>
                  <label className="block mb-1 text-gray-700 dark:text-gray-300 font-medium">Job Type</label>
                  <select
                    name="type"
                    value={formData.type}
                    onChange={handleChnage}
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    required
                  >
                    <option value="" className="text-gray-500">Select Job Type</option>
                    {jobTypes.map((type) => (
                      <option key={type} value={type}>
                        {type.replace("_", " ").toLowerCase().split(" ").map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  className="w-full bg-blue-600 text-white rounded-lg py-2 font-semibold hover:bg-blue-700 transition-all"
                >
                  {editJobId ? "Save Changes" : "Create Job"}
                </button>
              </form>
            </div>
          </div>
        </Modal>
      </div>

      <Joblisting
        jData={jData}
        onCreateJob={handleCreateOpen}
        onEditJob={handleEditOpen}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        totalCount={totalCount}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        itemsPerPage={ITEMS_PER_PAGE}
        onRefresh={() => setRefreshTrigger((prev) => prev + 1)}
        role={typeof window !== "undefined" ? localStorage.getItem("role") || undefined : undefined}
      />
    </>
  )
}
