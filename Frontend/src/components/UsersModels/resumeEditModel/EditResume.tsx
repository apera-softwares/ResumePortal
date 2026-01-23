export default function EditResume({ resume }: { resume: string }) {
 const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const handleView = () => {

    window.open(`${API_URL}/uploads/${resume}`, "_blank");
  };

  return (
    <button
      onClick={handleView}
      className="px-[1.2vw] py-[1vh] rounded-2xl text-xs border text-gray hover:bg-gray-200 hover:scale-110"
    >
      View Resume
    </button>
  );
}
