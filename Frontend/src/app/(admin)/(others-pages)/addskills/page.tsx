'use client'
import { Trash, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { useRouter } from 'next/navigation';


const AddSkills = () => {
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const [isLoading, setIsLoading] = useState(true);
  const [skill, setSkill] = useState('');
  const [skills, setSkills] = useState<{ id: string; name: string }[]>([]);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const role = localStorage.getItem("role");
    if (role !== "ADMIN" && role !== "HR") {
      router.replace("/dashboard");
    } else {
      setAuthorized(true);
    }
  }, [router]);

  useEffect(() => {
    const fetchSkills = async () => {
      setIsLoading(true);
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchSkills();
  }, []);


  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {

    setSkill(e.target.value)

  }
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!skill.trim()) {
      toast.error("Please enter skill first");
      return;
    }

    if (skills.some((s) => s.name.toLowerCase() === skill.trim().toLowerCase())) {
      toast.error("This skill already exists!");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const response = await fetch(`${API_URL}/skills/create`, {
        method: "POST",
        headers: {
          'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ name: skill.trim() }),
      });
      if (!response.ok) throw new Error("Something went wrong!");
      const skillsData = await response.json();

      setSkills(prev => [...prev, skillsData]);
      setSkill('');
      toast.success("Skill added successfully!");

    } catch (error) {
      console.error("Error creating skill:", error);
      toast.error("Failed to add skill.");
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

  if (!authorized) return null;

  return (
    <div className="w-full min-h-[80vh] flex items-center justify-center bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      <div className="w-full max-w-2xl mx-4 sm:mx-0 min-h-[50vh] bg-white dark:bg-gray-900 shadow-xl rounded-2xl p-5 sm:p-8 border border-gray-200 dark:border-gray-800 overflow-hidden">
        <h2 className="text-2xl font-semibold text-gray-800 dark:text-white mb-6 text-center">
          Add Skills
        </h2>

        <form onSubmit={handleSubmit} className="flex gap-3">
          <input
            name='skill'
            value={skill}
            onChange={handleChange}
            type="text"
            placeholder="Enter a skill..."
            className="flex-1 min-w-0 px-4 py-2 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />

          <button
            type='submit'
            className="px-4 sm:px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md flex-shrink-0 cursor-pointer">
            Add
          </button>
        </form>

        {/* Skill list preview area */}
        <div className="mt-8 border-t border-gray-200 dark:border-gray-800 pt-6 custom-scrollbar max-h-[55vh] overflow-y-auto px-2 pb-3 space-y-2" data-lenis-prevent>
          {skills.length === 0 ? (
            <p className="text-center text-sm text-gray-400 py-6">No skills added yet.</p>
          ) : (
            <ul className="space-y-2">
              {skills.map((s, index) => (
                <li key={s.id || index} className="flex border border-gray-200/60 dark:border-gray-800/80 py-3 px-4 rounded-xl justify-between items-center bg-gray-50/60 dark:bg-gray-800/40 hover:bg-white dark:hover:bg-gray-800/80 transition-all shadow-2xs">
                  <span className="text-gray-800 dark:text-gray-200 font-medium text-sm sm:text-base">{s.name}</span>
                  <div className="relative group">
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(s.id)}
                      className="p-2 rounded-xl border border-gray-200 dark:border-gray-700 text-rose-600 dark:text-rose-400 bg-rose-50/50 hover:bg-rose-100/70 dark:bg-rose-950/30 dark:hover:bg-rose-950/60 transition-all cursor-pointer"
                    >
                      <Trash className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 rounded-lg bg-rose-600 text-white text-[10px] font-semibold whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 translate-y-1 group-hover:translate-y-0 transition-all duration-150 z-50 shadow-md">
                      Delete Skill
                      <div className="absolute top-full left-1/2 -translate-x-1/2 border-[4px] border-transparent border-t-rose-600" />
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
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

export default AddSkills