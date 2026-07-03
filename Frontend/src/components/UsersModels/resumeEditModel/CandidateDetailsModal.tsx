"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../../ui/modal";
import toast from "react-hot-toast";
import Select from "react-select";
import {
  X,
  User,
  Mail,
  Phone,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  GraduationCap,
  Award,
  Lock
} from "lucide-react";

interface CandidateDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  candidate: any;
  onSave: (updatedCandidate: any) => void;
  role: string | null;
}

const NOTICE_PERIOD_OPTIONS = [
  { value: "0", label: "Immediate Join" },
  { value: "15", label: "0-15 days" },
  { value: "30", label: "1-month" },
  { value: "60", label: "2-month" },
  { value: "90", label: "3-month" },
  { value: "120", label: "more than 3" },
];

const EXP_YEARS_OPTIONS = [
  { value: "0", label: "Fresher" },
  { value: "1", label: "1 Yr" },
  { value: "2", label: "2 Yrs" },
  { value: "3", label: "3 Yrs" },
  { value: "4", label: "4 Yrs" },
  { value: "5", label: "5 Yrs" },
  { value: "6", label: "6 Yrs" },
  { value: "7", label: "7 Yrs" },
  { value: "8", label: "8 Yrs" },
  { value: "9", label: "9 Yrs" },
  { value: "10", label: "10 Yrs" },
  { value: "11", label: "11 Yrs" },
  { value: "12", label: "12 Yrs" },
  { value: "13", label: "13 Yrs" },
  { value: "14", label: "14 Yrs" },
  { value: "15", label: "15+ Yrs" },
];

const EXP_MONTHS_OPTIONS = [
  { value: "0", label: "0 Months" },
  { value: "1", label: "1 Month" },
  { value: "2", label: "2 Months" },
  { value: "3", label: "3 Months" },
  { value: "4", label: "4 Months" },
  { value: "5", label: "5 Months" },
  { value: "6", label: "6 Months" },
  { value: "7", label: "7 Months" },
  { value: "8", label: "8 Months" },
  { value: "9", label: "9 Months" },
  { value: "10", label: "10 Months" },
  { value: "11", label: "11 Months" },
];

export default function CandidateDetailsModal({
  isOpen,
  onClose,
  candidate,
  onSave,
  role,
}: CandidateDetailsModalProps) {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");

  const isEditable = role === "ADMIN" || role === "HR";

  const [isDark, setIsDark] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [availableSkills, setAvailableSkills] = useState<any[]>([]);
  const [availableLocations, setAvailableLocations] = useState<any[]>([]);

  // Form State
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    yearsOfExperience: 0,
    education: "",
    noticePeriod: 0,
    currentLocation: "",
    budget: "",
    currentCtc: "",
    expectedCtc: "",
    skills: [] as string[],
    preferredJobLocations: [] as string[],
  });

  const [expYears, setExpYears] = useState("0");
  const [expMonths, setExpMonths] = useState("0");

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

  // Fetch Skills and Locations
  useEffect(() => {
    const fetchDropdownData = async () => {
      try {
        const skillsRes = await fetch(`${API_URL}/skills`);
        if (skillsRes.ok) {
          const skillsData = await skillsRes.json();
          setAvailableSkills(skillsData || []);
        }

        const locRes = await fetch(`${API_URL}/locations`);
        if (locRes.ok) {
          const locData = await locRes.json();
          setAvailableLocations(locData.data || []);
        }
      } catch (err) {
        console.error("Error loading dropdown data:", err);
      }
    };
    fetchDropdownData();
  }, [API_URL]);

  // Load candidate into form state
  useEffect(() => {
    if (candidate) {
      const skillsFlat = (candidate.skills || []).map((s: any) => s.name || s);
      setFormData({
        firstName: candidate.firstName || "",
        lastName: candidate.lastName || "",
        email: candidate.email || "",
        mobile: candidate.mobile || "",
        yearsOfExperience: candidate.yearsOfExperience || 0,
        education: candidate.education || "",
        noticePeriod: candidate.noticePeriod || 0,
        currentLocation: candidate.currentLocation || "",
        budget: candidate.budget || "",
        currentCtc: candidate.currentCtc !== null && candidate.currentCtc !== undefined ? String(candidate.currentCtc) : "",
        expectedCtc: candidate.expectedCtc !== null && candidate.expectedCtc !== undefined ? String(candidate.expectedCtc) : "",
        skills: skillsFlat,
        preferredJobLocations: candidate.preferredJobLocations || [],
      });

      const totalExp = Number(candidate.yearsOfExperience || 0);
      const yrs = Math.floor(totalExp);
      const mos = Math.round((totalExp - yrs) * 12);
      setExpYears(String(Math.min(15, Math.max(0, yrs))));
      setExpMonths(String(Math.min(11, Math.max(0, mos))));
    }
  }, [candidate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === "mobile") {
      const numeric = value.replace(/\D/g, "");
      if (numeric.length > 10) return;
      setFormData((prev) => ({ ...prev, [name]: numeric }));
      return;
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSkillsChange = (selected: any) => {
    const values = selected ? selected.map((opt: any) => opt.value) : [];
    setFormData((prev) => ({ ...prev, skills: values }));
  };

  const handleExpYearsChange = (selected: any) => {
    const yrs = selected ? selected.value : "0";
    setExpYears(yrs);
    const total = Number(yrs) + Number(expMonths) / 12;
    setFormData(prev => ({ ...prev, yearsOfExperience: total }));
  };

  const handleExpMonthsChange = (selected: any) => {
    const mos = selected ? selected.value : "0";
    setExpMonths(mos);
    const total = Number(expYears) + Number(mos) / 12;
    setFormData(prev => ({ ...prev, yearsOfExperience: total }));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isEditable) return;

    if (!formData.firstName.trim()) {
      toast.error("First Name is required");
      return;
    }
    if (!formData.lastName.trim()) {
      toast.error("Last Name is required");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Email is required");
      return;
    }
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Invalid email address");
      return;
    }
    if (formData.mobile && formData.mobile.length !== 10) {
      toast.error("Mobile number must be exactly 10 digits");
      return;
    }

    setIsSaving(true);
    const saveToast = toast.loading("Saving candidate details...");

    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/candidates/${candidate.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to save changes");
      }

      const updated = await response.json();
      onSave(updated);
      toast.success("Candidate details updated successfully!", { id: saveToast });
      onClose();
    } catch (err) {
      console.error(err);
      toast.error("Failed to update candidate details.", { id: saveToast });
    } finally {
      setIsSaving(false);
    }
  };

  const customSelectStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: isDark ? "#1f2937" : "#ffffff",
      borderColor: state.isFocused ? "#3b82f6" : isDark ? "#374151" : "#e5e7eb",
      borderRadius: "0.75rem",
      padding: "2px 4px",
      fontSize: "0.875rem",
      boxShadow: state.isFocused ? "0 0 0 2px rgba(59, 130, 246, 0.2)" : "none",
      "&:hover": {
        borderColor: isDark ? "#4b5563" : "#d1d5db",
      },
      transition: "all 0.2s ease",
    }),
    menu: (provided: any) => ({
      ...provided,
      backgroundColor: isDark ? "#111827" : "#ffffff",
      borderRadius: "0.75rem",
      border: isDark ? "1px solid #374151" : "1px solid #e5e7eb",
      boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
      zIndex: 9999,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? "#3b82f6"
        : state.isFocused
          ? isDark
            ? "#1f2937"
            : "#f3f4f6"
          : "transparent",
      color: state.isSelected ? "#ffffff" : isDark ? "#f9fafb" : "#111827",
      cursor: "pointer",
    }),
    multiValue: (provided: any) => ({
      ...provided,
      backgroundColor: isDark ? "#374151" : "#f3f4f6",
      borderRadius: "0.5rem",
    }),
    multiValueLabel: (provided: any) => ({
      ...provided,
      color: isDark ? "#f9fafb" : "#374151",
    }),
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="max-w-[800px] m-4">
      <div className="w-full rounded-3xl bg-white dark:bg-gray-900 p-6 lg:p-10 border border-gray-100 dark:border-gray-800 shadow-xl max-h-[85vh] overflow-y-auto custom-scrollbar">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 rounded-2xl">
              <User className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                Candidate Profile Details
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {isEditable ? "Modify and update candidate database profile" : "View profile and database records (Read-Only)"}
              </p>
            </div>
          </div>
          {!isEditable && (
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 bg-amber-50 dark:bg-amber-950/20 dark:text-amber-400 px-3 py-1.5 rounded-xl border border-amber-200/40 dark:border-amber-900/30">
              <Lock className="w-3.5 h-3.5" />
              <span>Read-Only</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
            {/* First Name */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>First Name <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                disabled={!isEditable}
                placeholder="Enter first name"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>

            {/* Last Name */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <User className="w-3.5 h-3.5 text-gray-400" />
                <span>Last Name <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                disabled={!isEditable}
                placeholder="Enter last name"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Mail className="w-3.5 h-3.5 text-gray-400" />
                <span>Email Address <span className="text-rose-500">*</span></span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditable}
                placeholder="Enter email address"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>

            {/* Mobile */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Phone className="w-3.5 h-3.5 text-gray-400" />
                <span>Mobile Number</span>
              </label>
              <input
                type="text"
                name="mobile"
                value={formData.mobile}
                onChange={handleChange}
                disabled={!isEditable}
                placeholder="Enter 10-digit mobile number"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              />
              {isEditable && formData.mobile && formData.mobile.length !== 10 && (
                <p className="text-xs text-amber-500 font-semibold mt-1">Must be exactly 10 digits</p>
              )}
            </div>

            {/* Experience */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Briefcase className="w-3.5 h-3.5 text-gray-400" />
                <span>Years of Experience</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <Select
                  name="expYears"
                  value={EXP_YEARS_OPTIONS.find(opt => opt.value === expYears) || null}
                  onChange={handleExpYearsChange}
                  options={EXP_YEARS_OPTIONS}
                  isDisabled={!isEditable}
                  styles={customSelectStyles}
                  placeholder="Yrs"
                />
                <Select
                  name="expMonths"
                  value={EXP_MONTHS_OPTIONS.find(opt => opt.value === expMonths) || null}
                  onChange={handleExpMonthsChange}
                  options={EXP_MONTHS_OPTIONS}
                  isDisabled={!isEditable}
                  styles={customSelectStyles}
                  placeholder="Months"
                />
              </div>
            </div>

            {/* Notice Period */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-gray-400" />
                <span>Notice Period</span>
              </label>
              <Select
                name="noticePeriod"
                value={NOTICE_PERIOD_OPTIONS.find(opt => opt.value === String(formData.noticePeriod)) || null}
                onChange={(selected: any) => {
                  setFormData(prev => ({ ...prev, noticePeriod: selected ? parseInt(selected.value, 10) : 0 }));
                }}
                options={NOTICE_PERIOD_OPTIONS}
                isDisabled={!isEditable}
                styles={customSelectStyles}
                placeholder="Select notice period..."
              />
            </div>

            {/* Location */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>Location</span>
              </label>
              <Select
                name="currentLocation"
                value={
                  formData.currentLocation
                    ? { value: formData.currentLocation, label: formData.currentLocation }
                    : null
                }
                onChange={(selected: any) => {
                  setFormData(prev => ({ ...prev, currentLocation: selected ? selected.value : "" }));
                }}
                options={[
                  { value: "Remote", label: "Remote" },
                  ...availableLocations.map((l: any) => ({ value: l.name, label: l.name })),
                ]}
                isDisabled={!isEditable}
                styles={customSelectStyles}
                placeholder="Select location..."
              />
            </div>

            {/* Preferred Locations */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                <span>Preferred Locations</span>
              </label>
              <Select
                name="preferredJobLocations"
                value={(formData.preferredJobLocations || []).map((loc) => ({ value: loc, label: loc }))}
                onChange={(selected: any) => {
                  const values = selected ? selected.map((opt: any) => opt.value) : [];
                  setFormData((prev) => ({ ...prev, preferredJobLocations: values }));
                }}
                options={[
                  { value: "Remote", label: "Remote" },
                  ...availableLocations.map((l: any) => ({ value: l.name, label: l.name })),
                ]}
                isMulti
                isDisabled={!isEditable}
                styles={customSelectStyles}
                placeholder="Select preferred locations..."
              />
            </div>

            {/* Budget */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                <span>Budget / Package</span>
              </label>
              <input
                type="text"
                name="budget"
                value={formData.budget}
                onChange={handleChange}
                disabled={!isEditable}
                placeholder="e.g. 12-15 LPA"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>

            {/* Current CTC */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                <span>Current CTC (LPA)</span>
              </label>
              <input
                type="number"
                step="0.1"
                name="currentCtc"
                value={formData.currentCtc}
                onChange={handleChange}
                disabled={!isEditable}
                placeholder="e.g. 8.5"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>

            {/* Expected CTC */}
            <div>
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <DollarSign className="w-3.5 h-3.5 text-gray-400" />
                <span>Expected CTC (LPA)</span>
              </label>
              <input
                type="number"
                step="0.1"
                name="expectedCtc"
                value={formData.expectedCtc}
                onChange={handleChange}
                disabled={!isEditable}
                placeholder="e.g. 12.0"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>

            {/* Education */}
            <div className="md:col-span-2">
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <GraduationCap className="w-3.5 h-3.5 text-gray-400" />
                <span>Education Details</span>
              </label>
              <input
                type="text"
                name="education"
                value={formData.education}
                onChange={handleChange}
                disabled={!isEditable}
                placeholder="e.g. B.Tech in CSE / MCA"
                className="w-full border border-gray-200 dark:border-gray-700 rounded-xl p-3 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm transition-all disabled:opacity-75 disabled:cursor-not-allowed"
              />
            </div>

            {/* Skills */}
            <div className="md:col-span-2">
              <label className="block mb-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1">
                <Award className="w-3.5 h-3.5 text-gray-400" />
                <span>Tagged Skills</span>
              </label>
              <Select
                name="skills"
                value={formData.skills.map((s) => ({ value: s, label: s }))}
                onChange={handleSkillsChange}
                options={availableSkills.map((s) => ({ value: s.name, label: s.name }))}
                isMulti
                isDisabled={!isEditable}
                styles={customSelectStyles}
                placeholder="Select or enter skills..."
              />
            </div>
          </div>

          {/* Action Footer */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-100 dark:border-gray-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-55 dark:hover:bg-gray-800 text-sm font-semibold transition-all"
            >
              Cancel
            </button>
            {isEditable && (
              <button
                type="submit"
                disabled={isSaving}
                className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/10 hover:shadow-lg transition-all flex items-center gap-2"
              >
                {isSaving && (
                  <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                )}
                <span>Save Changes</span>
              </button>
            )}
          </div>
        </form>
      </div>
    </Modal>
  );
}
