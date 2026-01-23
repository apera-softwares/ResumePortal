'use client'
import PublicJoblisting from "@/components/joblisting/PublicJoblisting";
import ResumeUploadForm from "@/components/ResumeUploadForm/ResumeUploadForm";
import { Modal } from "@/components/ui/modal";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useModal } from "@/hooks/useModal";

export default function GuestPage() {
  const { isOpen, openModal, closeModal } = useModal();

  const routes = useRouter()

  const [choosefile, setchoosefile] = useState<File | null>(null);

  const handleonChnage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    setchoosefile(file);

  }
  const handleUpload = () => {
    if (choosefile) {
      alert('Resume uploaded succesfully !')
    } else {
      alert('Plz choose the file first !')
    }
  }
  const handleLogin = () => {
    routes.push('/login');
  }

  return (
    <div className="min-h-screen w-full flex flex-col relative  ">
      <div className="flex justify-between items-center p-2 sm:p-6 lg:px-10 ">
        <div className="h-[11vh]  ">
          <img src="/images/brand/brand-logo-png.png" alt="brandLogo" className=" h-[100%]" />
        </div>
        {/* <div className="searchbar h-[8vh] w-[34%] px-6 border  flex items-center justify-between rounded-4xl">
                      <input type="text" name="search" placeholder="search by job title" className="w-[80%]  py-2" />

                      <button className="w-[20%] border py-2 rounded-4xl text-sm  bg-blue-600   hover:bg-blue-700 text-white font-regular "  > Search</button>
            </div> */}
        <div className="flex gap-5">
          <button onClick={openModal} className="px-4 lg:text-sm sm:text-xs  lg:px-6 py-2 h-[6vh] sm:py-3 hover:scale-98 rounded-xl bg-gray-600  text-white font-semibold">
            Upload Resume
          </button>
          <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4">




            <ResumeUploadForm closeModal={closeModal} />


          </Modal>
          <button onClick={handleLogin} className="px-4 lg:text-sm sm:text-xs lg:px-8 py-2 h-[6vh] sm:py-3 hover:scale-98  rounded-xl bg-blue-600 text-white font-semibold">
            LogIn
          </button>
        </div>
      </div>

      <PublicJoblisting />

      {/* Card Container */}
    </div>
  );
}
