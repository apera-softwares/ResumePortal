import Button from "../ui/button/Button";
import Input from "../form/input/InputField";
import Label from "../form/Label";
import { useState } from "react";

export default function ResumeUploadForm() {
  const [candidData, setcanditData] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    yearsOfExperience: "",
    education: "",
    noticePeriod: "",
    resume: null as File | null,
    skills: "", // will send as comma-separated string, backend can split
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({
        ...prev,
        resume: file,
      }));
    }
  };

  const handlSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const token = localStorage.getItem("token");

    const bodyData = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value !== null) bodyData.append(key, value as any);
    });

    try {
      const response = await fetch("http://192.168.1.48:3003/candidates/create", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token || ""}`,
        },
        body: bodyData,
      });

      if (!response.ok) throw new Error("Something went wrong");

      const createdCandidate = await response.json();
      setcanditData((prev) => [...(prev || []), createdCandidate]);
      console.log(candidData,"im candidi data")

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        mobile: "",
        yearsOfExperience: "",
        education: "",
        noticePeriod: "",
        resume: null,
        skills: "",
      });

      alert("Resume uploaded successfully");
    } catch (error) {
      console.error("Error uploading resume:", error);
      alert("Upload failed");
    
    }
  };

  return (
    <div className="no-scrollbar relative w-full max-w-[700px] overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900">
      <div className="px-2 pr-14">
        <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
          Upload Resume
        </h4>
        <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
          Fill in your details and upload your resume for review.
        </p>
      </div>

      <form className="flex flex-col justify-start" onSubmit={handlSubmit}>
        <div className="custom-scrollbar h-[450px] overflow-y-auto px-2 pb-3">
          <div className="mt-7">
            <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
              Candidate Information
            </h5>

            <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
              <div className="col-span-2 lg:col-span-1">
                <Label>First Name</Label>
                <Input
                  type="text"
                  name="firstName"
                  placeholder="Enter first name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Last Name</Label>
                <Input
                  type="text"
                  name="lastName"
                  placeholder="Enter last name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  name="email"
                  placeholder="Enter email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Mobile</Label>
                <Input
                  type="text"
                  name="mobile"
                  placeholder="Enter mobile number"
                  value={formData.mobile}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Years of Experience</Label>
                <Input
                  type="number"
                  name="yearsOfExperience"
                  placeholder="e.g. 5"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2 lg:col-span-1">
                <Label>Notice Period (in days)</Label>
                <Input
                  type="number"
                  name="noticePeriod"
                  placeholder="e.g. 30"
                  value={formData.noticePeriod}
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
                <Input
                  type="text"
                  name="skills"
                  placeholder="e.g. React, Node.js, SQL"
                  value={formData.skills}
                  onChange={handleChange}
                />
              </div>

              <div className="col-span-2">
                <Label>Upload Resume (PDF/DOC)</Label>
                <Input
                  type="file"
                  name="resume"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 px-2 mt-6 lg:justify-end">
          <Button size="sm">
            Save & Upload
          </Button>
        </div>
      </form>
    </div>
  );
}
