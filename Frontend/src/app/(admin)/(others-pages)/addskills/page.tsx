
'use client'
import React, { useEffect, useState } from 'react'


const addskills = () => {
  const [skill , setSkill] =useState('');
const [skills, setSkills] = useState<{ id: number; name: string }[]>([]);
  const [filteredSkills ,setFilteredSkills]=useState(skills);
          
     useEffect(() => {
  const fetchSkills = async () => {
    try {
      const res = await fetch("http://192.168.1.48:3003/skills", {
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


  const handleChange =(e:React.ChangeEvent<HTMLInputElement>)=>{

    setSkill(e.target.value)

  }
  const handleSubmit =async(e: React.FormEvent<HTMLFormElement>)=>{
     console.log(skill,"im skill")
    e.preventDefault();
     if(!skill.trim())return
    const token = localStorage.getItem("token");
        try {
          const response =await fetch("http://192.168.1.48:3003/skills/create",{
           method:"POST",
           headers:{ 
              'Authorization': `Bearer ${token}`,
          "Content-Type": "application/json"
           },
          body: JSON.stringify({ name: skill }),
          });
           console.log(JSON.stringify({ name: skill }),)
          if(!response.ok)throw new Error("something went Wrong !")
            const skillsData = await response.json();
           console.log(skillsData,"im the data"); 
       
      setSkills(prev => [...prev, skillsData])
      setFilteredSkills(prev => [...prev, skillsData])
      setSkill('')

        }catch(error){
        console.error("Error creating Job:", error);
    }
        }

        const handleDelete =async(skillID:number)=>{
          if(!confirm("Ar you sure you want to Delete this Skill ?")) return
          const token=localStorage.getItem("token")
          const url =`http://192.168.1.48:3003/skills/${skillID}`
          try{
            const res =await fetch(url,{
              method:"DELETE",
              headers:{
                  'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            });
            if(!res.ok)throw new Error("failed to Delelte !")
            setSkills((prev) => prev.filter((item) => item.id !== skillID));
    setFilteredSkills((prev) => prev.filter((item) => item.id !== skillID));
          }catch(error){
            console.log(error)
          }
        }
        
  return (
  <div className="w-full h-[80vh] flex items-center justify-center bg-gray-50">
  <div className="w-[80vw] max-w-2xl h-[60vh] bg-white shadow-xl rounded-2xl p-8 border border-gray-200 overflow-hidden">
    <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
      Add Your Skills
    </h2>

    <form  onSubmit={handleSubmit} className="flex gap-4">
      <input
      name='skill'
       value={skill}
       onChange={handleChange}
        type="text"
        placeholder="Enter a skill..."
        className="flex-1 px-4 py-2 border border-gray-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
      />

      <button
      type='submit'
      className="px-6 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition-all shadow-md">
        Add Skill
      </button>
    </form>

    {/* Optional: Skill list preview area */}
      <div className="mt-8 border-t pt-4 max-h-64  text-gray-600 overflow-y-auto">
      
            <ul className="list-disc list-inside ">
              {skills.map((s, index) => (
                <li key={index} className="flex border py-2 pr-10 px-2  rounded- justify-between items-center mb-2">
                  <span>{s.name}</span>
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