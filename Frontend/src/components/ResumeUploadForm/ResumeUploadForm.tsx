
import Input from "../form/input/InputField";
import Label from "../form/Label";
import Select from 'react-select';
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

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

const WORK_MODE_OPTIONS = [
  { value: "Remote", label: "Remote" },
  { value: "Hybrid", label: "Hybrid" },
  { value: "On-site", label: "On-site" },
];
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


export default function ResumeUploadForm({ closeModal, jobId, onApplySuccess }: { closeModal: () => void; jobId?: string | null; onApplySuccess?: (jobId: string) => void }) {
  const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");
  const [candidData, setcanditData] = useState<any[]>([]);
  const [selectedOption, setSelectedOption] = useState<any[]>([]);
  const [isDark, setIsDark] = useState(false);
  const [cityOptions, setCityOptions] = useState<{ value: string; label: string }[]>(DEFAULT_CITY_OPTIONS);
  const [isCandidate, setIsCandidate] = useState(false);


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

  useEffect(() => {
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
        console.error("Error fetching cities:", error);
      }
    };
    fetchCities();
  }, [API_URL]);

  const handleSkillsChange = (selected: any) => {
    const values = selected ? selected.map((opt: any) => opt.value) : [];
    setFormData((prev) => ({ ...prev, skills: values }));
  };
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    yearsOfExperience: "",
    education: "",
    noticePeriod: "",
    currentLocation: "",
    budget: "",
    preferredJobLocations: [] as string[],
    expectedCtc: "",
    currentCtc: "",
    resume: null as File | null,
    skills: "",
  });

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("role") || "";
      const storedEmail = localStorage.getItem("email") || "";
      const storedName = localStorage.getItem("name") || "";

      if (storedRole === "CANDIDATE" && storedEmail) {
        setIsCandidate(true);
        let first = "";
        let last = "";
        if (storedName) {
          const parts = storedName.trim().split(/\s+/);
          first = parts[0] || "";
          last = parts.slice(1).join(" ") || "";
        }
        setFormData((prev) => ({
          ...prev,
          email: prev.email || storedEmail,
          firstName: prev.firstName || first,
          lastName: prev.lastName || last,
        }));
      }
    }
  }, []);

  const [errors, setErrors] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    resume: "",
  });

  const [expYears, setExpYears] = useState("0");
  const [expMonths, setExpMonths] = useState("0");

  useEffect(() => {
    if (formData.yearsOfExperience !== undefined && formData.yearsOfExperience !== "") {
      const totalExp = Number(formData.yearsOfExperience);
      if (!isNaN(totalExp)) {
        const yrs = Math.floor(totalExp);
        const mos = Math.round((totalExp - yrs) * 12);
        const clampedYrs = Math.min(15, Math.max(0, yrs));
        const clampedMos = Math.min(11, Math.max(0, mos));
        setExpYears(String(clampedYrs));
        setExpMonths(String(clampedMos));
      }
    }
  }, [formData.yearsOfExperience]);

  const handleExpYearsChange = (selected: any) => {
    const yrs = selected ? selected.value : "0";
    setExpYears(yrs);
    const total = Number(yrs) + Number(expMonths) / 12;
    setFormData(prev => ({ ...prev, yearsOfExperience: String(total) }));
  };

  const handleExpMonthsChange = (selected: any) => {
    const mos = selected ? selected.value : "0";
    setExpMonths(mos);
    const total = Number(expYears) + Number(mos) / 12;
    setFormData(prev => ({ ...prev, yearsOfExperience: String(total) }));
  };

  const handleNoticePeriodChange = (selected: any) => {
    setFormData(prev => ({ ...prev, noticePeriod: selected ? selected.value : "" }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "mobile") {
      const numericValue = value.replace(/\D/g, "");
      if (numericValue.length > 10) return;
      setFormData((prev) => ({
        ...prev,
        [name]: numericValue,
      }));
      setErrors((prev) => ({ ...prev, mobile: "" }));
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    // Clear errors as user types
    setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        resume: file,
      }));
      setErrors((prev) => ({ ...prev, resume: "" }));
    }
  };

  const validate = () => {
    let isValid = true;
    const tempErrors = { firstName: "", lastName: "", email: "", mobile: "", resume: "" };

    if (!formData.firstName.trim()) {
      tempErrors.firstName = "First name is required";
      isValid = false;
    }

    if (!formData.lastName.trim()) {
      tempErrors.lastName = "Last name is required";
      isValid = false;
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!formData.email.trim()) {
      tempErrors.email = "Email is required";
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = "Please enter a valid email address";
      isValid = false;
    }

    const mobileRegex = /^\d{10}$/;
    if (!formData.mobile.trim()) {
      tempErrors.mobile = "Mobile number is required";
      isValid = false;
    } else if (!mobileRegex.test(formData.mobile)) {
      tempErrors.mobile = "Mobile number must be exactly 10 digits";
      isValid = false;
    }

    if (!formData.resume) {
      tempErrors.resume = "Please upload your resume";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handlSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!validate()) return;

    const token = localStorage.getItem("token");

    const bodyData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) {
        // If the field is "resume", backend expects it as "file"
        if (key === "resume") {
          bodyData.append("file", value as any);
        } else if (Array.isArray(value)) {
          bodyData.append(key, value.join(","));
        } else {
          bodyData.append(key, value as any);
        }
      }
    });

    if (jobId) {
      bodyData.append("jobId", String(jobId));
    }

    const userId = localStorage.getItem("userId");
    if (userId) {
      bodyData.append("userId", userId);
    }
    console.log("bodyData", bodyData)
    try {
      const response = await fetch(`${API_URL}/candidates/uploadMedia`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
        body: bodyData,
      });
      console.log(bodyData, "im bodydata ")
      if (!response.ok) throw new Error("Something went wrong");

      const createdCandidate = await response.json();
      setcanditData((prev) => [...(prev || []), createdCandidate]);


      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        yearsOfExperience: "",
        education: "",
        noticePeriod: "",
        currentLocation: "",
        budget: "",
        preferredJobLocations: [],
        expectedCtc: "",
        currentCtc: "",
        resume: null,
        skills: "",
      });

      toast.success("Resume uploaded successfully!");

      // Save email and applied job ID to localStorage to track status and persist applied state
      if (formData.email) {
        localStorage.setItem("candidateEmail", formData.email);
      }
      if (jobId) {
        const storedApplied = localStorage.getItem("appliedJobIds");
        const appliedList = storedApplied ? JSON.parse(storedApplied) : [];
        if (!appliedList.includes(jobId)) {
          localStorage.setItem("appliedJobIds", JSON.stringify([...appliedList, jobId]));
        }
      }

      if (jobId && onApplySuccess) {
        onApplySuccess(jobId);
      }
      closeModal()
    } catch (error) {
      console.error("Error uploading resume:", error);
      toast.error("Resume upload failed.");
    }
  };

  const [skills, setSkills] = useState([])
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

  const customSelectStyles = {
    control: (provided: any, state: any) => {
      return {
        ...provided,
        backgroundColor: isDark ? '#111827' : '#ffffff',
        borderColor: state.isFocused
          ? '#3b82f6'
          : isDark
            ? '#374151'
            : '#e5e7eb',
        borderRadius: '0.75rem',
        padding: '2px 4px',
        fontSize: '0.875rem',
        boxShadow: state.isFocused
          ? '0 0 0 2px rgba(59, 130, 246, 0.2)'
          : 'none',
        '&:hover': {
          borderColor: isDark ? '#4b5563' : '#d1d5db',
        },
        transition: 'all 0.2s ease',
      };
    },
    menu: (provided: any) => {
      return {
        ...provided,
        backgroundColor: isDark ? '#111827' : '#ffffff',
        borderRadius: '0.75rem',
        border: isDark ? '1px solid #374151' : '1px solid #e5e7eb',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        overflow: 'hidden',
        zIndex: 9999,
      };
    },
    menuList: (provided: any) => {
      return {
        ...provided,
        maxHeight: '180px',
        padding: '4px',
        scrollbarWidth: 'thin' as any,
        scrollbarColor: isDark ? '#4b5563 transparent' : '#cbd5e1 transparent',
        '&::-webkit-scrollbar': {
          width: '6px',
          height: '6px',
        },
        '&::-webkit-scrollbar-track': {
          background: 'transparent',
        },
        '&::-webkit-scrollbar-thumb': {
          background: isDark ? '#374151' : '#cbd5e1',
          borderRadius: '9999px',
          border: '1px solid transparent',
        },
        '&::-webkit-scrollbar-thumb:hover': {
          background: isDark ? '#4b5563' : '#94a3b8',
        },
      };
    },
    option: (provided: any, state: any) => {
      return {
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
          color: '#ffffff',
        },
        transition: 'all 0.15s ease',
      };
    },
    singleValue: (provided: any) => {
      return {
        ...provided,
        color: isDark ? '#f9fafb' : '#111827',
      };
    },
    placeholder: (provided: any) => {
      return {
        ...provided,
        color: isDark ? '#9ca3af' : '#6b7280',
        fontSize: '0.875rem',
      };
    },
    multiValue: (provided: any) => {
      return {
        ...provided,
        backgroundColor: isDark ? '#374151' : '#f3f4f6',
        borderRadius: '0.5rem',
        border: isDark ? '1px solid #4b5563' : '1px solid #e5e7eb',
        padding: '1px 4px',
      };
    },
    multiValueLabel: (provided: any) => {
      return {
        ...provided,
        color: isDark ? '#f9fafb' : '#374151',
        fontWeight: '600',
        fontSize: '0.75rem',
      };
    },
    multiValueRemove: (provided: any) => {
      return {
        ...provided,
        color: isDark ? '#9ca3af' : '#6b7280',
        borderRadius: '0.25rem',
        marginLeft: '2px',
        cursor: 'pointer',
        '&:hover': {
          backgroundColor: isDark ? '#4b5563' : '#e5e7eb',
          color: isDark ? '#ef4444' : '#ef4444',
        },
        transition: 'all 0.15s ease',
      };
    },
  };

  return (
    <div className="relative w-full p-2 sm:p-4">
      <div className="px-2 pr-14">
        <h4 className="mb-2 text-2xl font-bold text-gray-900 dark:text-white">
          Upload Resume
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          Fill in your details and upload your resume for review.
        </p>
      </div>

      <form className="flex flex-col justify-start" onSubmit={handlSubmit}>
        <div className="custom-scrollbar max-h-[60vh] md:max-h-[70vh] overflow-y-auto px-2 pb-3">
          <div className="mt-7">
            <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
              Candidate Information
            </h5>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div className="col-span-2 lg:col-span-1">
                <Label>First Name <span className="text-rose-500">*</span></Label>
                <Input
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && (
                  <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.firstName}</p>
                )}
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Last Name <span className="text-rose-500">*</span></Label>
                <Input
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && (
                  <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.lastName}</p>
                )}
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Email <span className="text-rose-500">*</span></Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                  disabled={isCandidate}
                />
                {errors.email && (
                  <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.email}</p>
                )}
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Mobile <span className="text-rose-500">*</span></Label>
                <Input
                  type="text"
                  name="mobile"
                  placeholder="Enter mobile number"
                  value={formData.mobile}
                  onChange={handleChange}
                />
                {errors.mobile && (
                  <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.mobile}</p>
                )}
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Years of Experience</Label>
                <div className="grid grid-cols-2 gap-2">
                  <Select
                     name="expYears"
                     value={EXP_YEARS_OPTIONS.find(opt => opt.value === expYears) || null}
                     onChange={handleExpYearsChange}
                     options={EXP_YEARS_OPTIONS}
                     styles={customSelectStyles}
                     placeholder="Yrs"
                  />
                  <Select
                     name="expMonths"
                     value={EXP_MONTHS_OPTIONS.find(opt => opt.value === expMonths) || null}
                     onChange={handleExpMonthsChange}
                     options={EXP_MONTHS_OPTIONS}
                     styles={customSelectStyles}
                     placeholder="Months"
                  />
                </div>
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Notice Period</Label>
                <Select
                  name="noticePeriod"
                  value={NOTICE_PERIOD_OPTIONS.find(opt => opt.value === String(formData.noticePeriod)) || null}
                  onChange={handleNoticePeriodChange}
                  options={NOTICE_PERIOD_OPTIONS}
                  styles={customSelectStyles}
                  placeholder="Select notice period..."
                />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Current Location</Label>
                <Select
                  name="currentLocation"
                  value={cityOptions.find(opt => opt.value.toLowerCase() === (formData.currentLocation || "").toLowerCase()) || null}
                  onChange={(selected: any) => {
                    setFormData((prev) => ({ ...prev, currentLocation: selected ? selected.value : "" }));
                  }}
                  options={cityOptions}
                  styles={customSelectStyles}
                  placeholder="Select city..."
                />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Budget (Optional)</Label>
                <Input
                  type="text"
                  name="budget"
                  placeholder="e.g. 5-7 LPA"
                  value={formData.budget}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Current CTC (LPA, Optional)</Label>
                <Input
                  type="number"
                  step={0.1}
                  name="currentCtc"
                  placeholder="e.g. 6.0"
                  value={formData.currentCtc}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Expected CTC (LPA, Optional)</Label>
                <Input
                  type="number"
                  step={0.1}
                  name="expectedCtc"
                  placeholder="e.g. 8.5"
                  value={formData.expectedCtc}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2">
                <Label>Education</Label>
                <Input
                  type="text"
                  name="education"
                  placeholder="e.g. B.Tech in Computer Science"
                  value={formData.education}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2">
                <Label>Skills</Label>
                <Select
                  name="skills"
                  defaultValue={selectedOption || undefined}
                  onChange={handleSkillsChange}
                  options={skills.map((skill: any) => ({
                    value: skill.name,
                    label: skill.name,
                  }))}
                  isMulti
                  styles={customSelectStyles}
                />
              </div>

              <div className="col-span-2">
                <Label>Upload Resume (PDF/DOC) <span className="text-rose-500">*</span></Label>
                <Input
                  type="file"
                  name="resume"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
                {errors.resume && (
                  <p className="text-xs text-rose-500 mt-1.5 font-medium">{errors.resume}</p>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          <button
            type="submit"
            className="px-6 py-2.5 text-sm font-semibold bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white rounded-xl shadow-md shadow-blue-500/10 hover:shadow-lg hover:shadow-blue-500/20 active:scale-[0.98] transition-all duration-200"
          >
            Save & Upload
          </button>
        </div>
      </form>
    </div>
  );
}
