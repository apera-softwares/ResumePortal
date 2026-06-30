'use client'
import { Trash, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'


const addskills = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [skill, setSkill] = useState('');
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

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
      setSkill('')
      toast.success("Skill added successfully!");

    } catch (error) {
      console.error("Error creating Job:", error);
    }
  }

  const executeDelete = async (skillID: string) => {
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
      toast.success("Skill deleted successfully!");
    } catch (error) {
      console.error("Error deleting skill:", error);
      toast.error("Failed to delete skill.");
    }
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
            Add
          </button>
        </form>

        {/* Optional: Skill list preview area */}
        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-4 max-h-64 text-gray-600 dark:text-gray-300 overflow-y-auto custom-scrollbar">

          <ul className="list-disc list-inside">
            {skills.map((s, index) => (
              <li key={index} className="flex border border-gray-100 dark:border-gray-800/60 py-2 pr-4 pl-4 rounded-xl justify-between items-center mb-2 bg-gray-50/50 dark:bg-gray-900/50">
                <span className="text-gray-800 dark:text-gray-200 font-medium">{s.name}</span>
                <button
                  onClick={() => setDeleteConfirmId(s.id)}
                  className="p-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 dark:hover:bg-rose-950/50 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-100/50 dark:border-rose-900/40 transition-all cursor-pointer"
                  title="Delete Skill"
                >
                  <Trash className="h-3.5 w-3.5" />
                </button>
              </li>
            ))}
          </ul>

        </div>
      </div>

      {/* Center Delete Confirmation Modal */}
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
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 mb-4">
              <Trash2 className="h-6 w-6" />
            </div>

            {/* Title */}
            <h3 className="text-base font-semibold text-gray-900 dark:text-white leading-6 mb-2">
              Are you sure?
            </h3>

            {/* Message */}
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-6">
              Do you really want to delete this skill? This action is permanent and cannot be undone.
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
  )
}

export default addskills