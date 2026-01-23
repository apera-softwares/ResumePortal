import { useModal } from "../../../hooks/useModal";
import { Modal } from "../../ui/modal";
import Button from "../../ui/button/Button";
import Input from "../../form/input/InputField";
import Label from "../../form/Label";



export default function ResumeModel(){


 const { isOpen, openModal, closeModal } = useModal();
      const handleSave = () => {
    // Handle save logic here
    console.log("Saving changes...");
    closeModal();
  };

    return(
       <>
           <button
            onClick={openModal}
            className="flex w-full items-center justify-center gap-2  rounded-full border border-gray-300 bg-white px-4 py-3 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200 lg:inline-flex lg:w-auto"
          >
            <img src="/images/resume/resume.png" className="h-6" alt="" />
             Upload Resume
          </button>
  <Modal isOpen={isOpen} onClose={closeModal} className="max-w-[700px] m-4 ">
        <div className="no-scrollbar  relative w-full max-w-[700px]   overflow-y-auto rounded-3xl bg-white p-4 dark:bg-gray-900 lg:p-11">
          <div className="px-2 pr-14">
            <h4 className="mb-2 text-2xl font-semibold text-gray-800 dark:text-white/90">
              Upload Your Resume
            </h4>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400 lg:mb-7">
            Help us get to know you better  by sharing your resume.
            </p>
          </div>
          <form className="flex flex-col">
            <div className="custom-scrollbar h-[200px] overflow-y-auto px-2 pb-3">
            
              <div className="mt-7">
                <h5 className="mb-5 text-lg font-medium text-gray-800 dark:text-white/90 lg:mb-6">
                   Resume
                </h5>

                <div className="grid grid-cols-1 gap-x-6 gap-y-5 lg:grid-cols-2">
                  <div className="col-span-2  lg:col-span-1">
                    <Label> Choose images to upload (PNG, JPG)</Label>
                    <Input type="file" name="Resume_upload" accept=".jpg, .jpeg, .png" />
                  </div>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3  px-2 mt-6 lg:justify-end">
              <Button size="sm" variant="outline" onClick={closeModal}>
                Close
              </Button>
              <Button size="sm" onClick={handleSave}>
               Upload
              </Button>
            </div>
          </form>
        </div>
          </Modal>

       
       </>
    )
}

