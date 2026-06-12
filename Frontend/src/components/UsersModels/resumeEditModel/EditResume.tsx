"use client";
import React, { useState, useEffect, useRef } from "react";
import { Modal } from "../../ui/modal";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";

// @ts-ignore
import "quill/dist/quill.snow.css";

interface Candidate {
  id: number;
  firstName: string;
  lastName: string;
  resume: string;
  resumeText?: string;
  cleanedResume?: string;
}

interface EditResumeProps {
  candidate: Candidate;
  onSave?: (updatedCandidate: any) => void;
}

export default function EditResume({ candidate, onSave }: EditResumeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL;
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    let active = true;

    if (isOpen && editorRef.current && !quillRef.current) {
      const initQuill = async () => {
        const QuillModule = await import("quill");
        const Quill = QuillModule.default;

        if (!active) return;

        quillRef.current = new Quill(editorRef.current!, {
          theme: "snow",
          modules: {
            toolbar: [
              [{ header: [1, 2, 3, false] }],
              ["bold", "italic", "underline"],
              [{ list: "ordered" }, { list: "bullet" }],
              ["clean"],
            ],
          },
        });

        if (candidate.resumeText) {
          quillRef.current.setText(candidate.resumeText);
        }
      };

      initQuill();
    }

    return () => {
      active = false;
      quillRef.current = null;
    };
  }, [isOpen, candidate.resumeText]);

  const handleCopy = () => {
    if (quillRef.current) {
      const text = quillRef.current.getText();
      navigator.clipboard.writeText(text);
      toast.success("Resume text copied to clipboard!");
    } else {
      toast.error("No text available to copy.");
    }
  };

  const handleOpenPdf = () => {
    window.open(`${API_URL}/uploads/${candidate.resume}`, "_blank");
  };

  const handleExportWord = async () => {
    if (!quillRef.current) return;
    try {
      const { generateWord } = await import("quill-to-word");
      const delta = quillRef.current.getContents();
      const docxBlob = await generateWord(delta, { exportAs: "blob" });
      saveAs(docxBlob as Blob, `${candidate.firstName}_${candidate.lastName}_resume.docx`);
      toast.success("Word document exported successfully!");
    } catch (err) {
      console.error("Export Word failed:", err);
      toast.error("Failed to export Word document.");
    }
  };

  const handleExportPdf = async () => {
    if (!quillRef.current) return;
    try {
      const { pdfExporter } = await import("quill-to-pdf");
      const delta = quillRef.current.getContents();
      const pdfBlob = await pdfExporter.generatePdf(delta);
      saveAs(pdfBlob, `${candidate.firstName}_${candidate.lastName}_resume.pdf`);
      toast.success("PDF document exported successfully!");
    } catch (err) {
      console.error("Export PDF failed:", err);
      toast.error("Failed to export PDF document.");
    }
  };

  const handleSave = async () => {
    if (!quillRef.current) return;

    setIsSaving(true);
    const loadingToast = toast.loading("Saving and generating cleaned PDF...");

    try {
      // 1. Generate PDF blob from Quill delta
      const { pdfExporter } = await import("quill-to-pdf");
      const delta = quillRef.current.getContents();
      const pdfBlob = await pdfExporter.generatePdf(delta);

      // 2. Prepare FormData
      const formData = new FormData();
      const fileName = `${candidate.firstName}_${candidate.lastName}_cleaned.pdf`;
      formData.append("file", pdfBlob, fileName);
      
      const plainText = quillRef.current.getText();
      formData.append("resumeText", plainText);

      // 3. Send upload request to backend
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/candidates/${candidate.id}/upload-cleaned`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to upload cleaned resume file to backend.");
      }

      const updatedCandidate = await response.json();
      
      // Update local state with the plain text too
      onSave?.({ ...updatedCandidate, resumeText: plainText });

      toast.success("Cleaned resume saved and uploaded successfully!", { id: loadingToast });
      setIsOpen(false);
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save and upload cleaned resume.", { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs"
      >
        View Resume
      </button>

      <Modal isOpen={isOpen} onClose={() => !isSaving && setIsOpen(false)} className="max-w-[1300px] w-[92vw] m-4">
        <div className="flex flex-col gap-5 p-6 md:p-8 bg-white dark:bg-gray-900 rounded-3xl">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 dark:border-gray-850 pb-4">
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                Resume Rich Editor
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Edit and format resume for {candidate.firstName} {candidate.lastName}
              </p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mr-8">
              <button
                onClick={handleCopy}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                Copy Text
              </button>

              <button
                onClick={handleOpenPdf}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                Open Original
              </button>

              <button
                onClick={handleExportWord}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                Export Word
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all flex items-center gap-1.5 disabled:opacity-50"
              >
                Export PDF
              </button>
            </div>
          </div>

          <div className="flex-grow rounded-2xl overflow-hidden text-gray-100">
            <style>{`
              .ql-toolbar.ql-snow {
                background-color: #1f2937 !important;
                border-color: #374151 !important;
                border-top-left-radius: 16px;
                border-top-right-radius: 16px;
              }
              .ql-toolbar.ql-snow .ql-stroke {
                stroke: #e5e7eb !important;
              }
              .ql-toolbar.ql-snow .ql-fill {
                fill: #e5e7eb !important;
              }
              .ql-toolbar.ql-snow .ql-picker {
                color: #e5e7eb !important;
              }
              .ql-toolbar.ql-snow .ql-picker-options {
                background-color: #1f2937 !important;
                border-color: #374151 !important;
                color: #e5e7eb !important;
              }
              .ql-container.ql-snow {
                border-color: #374151 !important;
                border-bottom-left-radius: 16px;
                border-bottom-right-radius: 16px;
                background-color: #111827 !important;
              }
              .ql-editor {
                color: #f9fafb !important;
                font-size: 14px !important;
                line-height: 1.7 !important;
              }
              .ql-editor.ql-blank::before {
                color: #9ca3af !important;
              }
              .ql-editor::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              .ql-editor::-webkit-scrollbar-track {
                background: #111827 !important;
              }
              .ql-editor::-webkit-scrollbar-thumb {
                background: #374151 !important;
                border-radius: 9999px;
                border: 2px solid #111827;
              }
              .ql-editor::-webkit-scrollbar-thumb:hover {
                background: #4b5563 !important;
              }
            `}</style>
            <div ref={editorRef} style={{ height: "60vh" }} />
          </div>

          <div className="flex justify-end pt-2 gap-3 border-t border-gray-100 dark:border-gray-850">
            <button
              onClick={() => setIsOpen(false)}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 rounded-xl transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-5 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-750 text-white rounded-xl transition-all shadow-md shadow-blue-500/10 hover:shadow-lg disabled:opacity-50 flex items-center gap-2"
            >
              {isSaving && (
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              )}
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
