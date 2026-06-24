'use client'
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'


const addskills = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [skill, setSkill] = useState('');
  const [skills, setSkills] = useState<{ id: number; name: string }[]>([]);
  const [filteredSkills, setFilteredSkills] = useState(skills);

  useEffect(() => {
    const fetchSkills = async () => {
      try {
        const res = await fetch(`${API_URL}/skills`, {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });
        if (!res.ok) throw new Error("Something went wrong!");

        const data = await res.json();
        console.log(data, "im response data");

        // since API returns an array of skill objects
        setSkills(data);
        setFilteredSkills(data);
      } catch (error) {
        console.error("Error fetching skills:", error);
      }
    };

    fetchSkills();
  }, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    setSkill(e.target.value)

  }
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    console.log(skill, "im skill")
    e.preventDefault();
    if (!skill.trim()) return
    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/skills/create`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: skill }),
      });
      console.log(JSON.stringify({ name: skill }),)
      if (!response.ok) throw new Error("something went Wrong !")
      const skillsData = await response.json();
      console.log(skillsData, "im the data");

      setSkills(prev => [...prev, skillsData])
      setFilteredSkills(prev => [...prev, skillsData])
      setSkill('')
      toast.success("Skill added successfully!");

    } catch (error) {
      console.error("Error creating Job:", error);
    }
  }

  const executeDelete = async (skillID: number) => {
    const token = localStorage.getItem("token");
    const url = `${API_URL}/skills/${skillID}`;
    try {
      const res = await fetch(url, {
        method: "DELETE",
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      });
      if (!res.ok) throw new Error("failed to Delete !");
      setSkills((prev) => prev.filter((item) => item.id !== skillID));
      setFilteredSkills((prev) => prev.filter((item) => item.id !== skillID));
      toast.success("Skill deleted successfully!");
    } catch (error) {
      console.error("Error deleting skill:", error);
      toast.error("Failed to delete skill.");
    }
  };

  const handleDelete = (skillID: number) => {
    toast((t) => (
      <div className="flex flex-col gap-3 p-1">
        <p className="text-sm font-medium text-gray-900">
          Are you sure you want to delete this skill?
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
              await executeDelete(skillID);
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

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="w-[80vw] max-w-2xl min-h-[50vh] bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-8 border border-gray-200 dark:border-gray-800 overflow-hidden">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
          Add Skills
        </h2>

        <form onSubmit={handleSubmit} className="flex gap-4">
          <input
            name='skill'
            value={skill}
            onChange={handleChange}
            type="text"
            placeholder="Enter a skill..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />

          <button
            type='submit'
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md">
            Add Skill
          </button>
        </form>

        {/* Optional: Skill list preview area */}
        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-4 max-h-64 text-gray-600 dark:text-gray-300 overflow-y-auto custom-scrollbar">

          <ul className="list-disc list-inside">
            {skills.map((s, index) => (
              <li key={index} className="flex border border-gray-100 dark:border-gray-800 py-2 pr-10 px-4 rounded-xl justify-between items-center mb-2 bg-gray-50/50 dark:bg-gray-900/50">
                <span className="text-gray-800 dark:text-gray-200 font-medium">{s.name}</span>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="text-red-500 hover:text-red-700 text-sm font-medium"
                >
                  Delete
                </button>
              </li>
            ))}
          </ul>

        </div>
      </div>

    </div>

  )
}

export default addskills