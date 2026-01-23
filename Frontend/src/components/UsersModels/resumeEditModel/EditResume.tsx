export default function EditResume({ resume }: { resume: string }) {

  const handleView = () => {

    window.open(`http://192.168.1.48:3003/uploads/${resume}`, "_blank");
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
