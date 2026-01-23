"use client"
import React, { useEffect, useState } from 'react'

const page = () => {

  const [role, setRole] = useState(" ")

useEffect(()=>{
const localStorageRole = localStorage.getItem("role")
setRole(localStorageRole || "")
},[])


  return (
    <div className='w-full h-full relative mt-1px '>
          <div className='w-full  h-full flex items-center justify-center opacity-10'>
           <img src="/images/brand/brand-logo-png.png" alt="" className=' mt-32' />
         </div>
         <div className=' w-full absolute top-[15%] left-1/2 -translate-x-1/2 -translate-y-1/2'>
           <h1 className='lg:text-4xl text-center font-black text-black  uppercase '> Welcome to Dashboard  <span className=' text-blue-600 underline '>{role}</span> </h1>
         </div>
      </div>
  )
}

export default page