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

function convertPlainTextToHtml(text: string): string {
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  let html = "";
  let inList = false;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += "<p><br></p>";
      continue;
    }

    const isBullet = /^[•\-\*\▪]\s*/.test(line) || /^\d+\.\s+/.test(line);
    const isHeader =
      line.length < 50 &&
      /^[A-Z\d\s\-\,\&\/\(\)]+$/.test(line) &&
      !line.endsWith(".") &&
      !line.includes("@") &&
      !line.includes(":") &&
      !/^[•\-\*\▪]/.test(line);

    if (isHeader) {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      html += `<h2><strong>${line}</strong></h2>`;
    } else if (isBullet) {
      if (!inList) {
        html += "<ul>";
        inList = true;
      }
      const cleanLine = line.replace(/^[•\-\*\▪\d+\.]\s*/, "");
      html += `<li>${cleanLine}</li>`;
    } else {
      if (inList) {
        html += "</ul>";
        inList = false;
      }
      if (html === "" && line.length < 30) {
        html += `<h1><strong>${line}</strong></h1>`;
      } else {
        html += `<p>${line}</p>`;
      }
    }
  }

  if (inList) {
    html += "</ul>";
  }

  return html;
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
          const text = candidate.resumeText.trim();
          if (text.startsWith("<") && (text.includes("</p>") || text.includes("</div>") || text.includes("</h2>") || text.includes("</ul>"))) {
            quillRef.current.clipboard.dangerouslyPasteHTML(text);
          } else {
            const formatted = convertPlainTextToHtml(text);
            quillRef.current.clipboard.dangerouslyPasteHTML(formatted);
          }
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

      const plainText = quillRef.current.root.innerHTML;
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
              /* Default/Light Mode styles for Quill Editor */
              .ql-toolbar.ql-snow {
                background-color: #f8fafc !important;
                border-color: #e2e8f0 !important;
                border-top-left-radius: 16px;
                border-top-right-radius: 16px;
                padding: 12px !important;
              }
              .ql-container.ql-snow {
                background-color: #ffffff !important;
                border-color: #e2e8f0 !important;
                border-bottom-left-radius: 16px;
                border-bottom-right-radius: 16px;
                font-family: inherit !important;
              }
              .ql-editor {
                color: #0f172a !important;
                font-size: 15px !important;
                line-height: 1.75 !important;
                padding: 20px 24px !important;
              }
              .ql-editor.ql-blank::before {
                color: #94a3b8 !important;
                left: 24px !important;
              }
              
              /* Toolbar Button & Picker Styles - Light Mode */
              .ql-snow.ql-toolbar button,
              .ql-snow .ql-toolbar button {
                border-radius: 6px;
                transition: all 0.15s ease;
                margin-right: 4px;
              }
              .ql-snow.ql-toolbar button:hover,
              .ql-snow .ql-toolbar button:hover {
                background-color: #f1f5f9 !important;
              }
              .ql-snow.ql-toolbar button.ql-active,
              .ql-snow .ql-toolbar button.ql-active {
                background-color: #eff6ff !important;
              }
              .ql-snow.ql-toolbar button.ql-active .ql-stroke,
              .ql-snow .ql-toolbar button.ql-active .ql-stroke {
                stroke: #2563eb !important;
              }
              .ql-snow.ql-toolbar button.ql-active .ql-fill,
              .ql-snow .ql-toolbar button.ql-active .ql-fill {
                fill: #2563eb !important;
              }
              .ql-snow.ql-toolbar button:hover .ql-stroke,
              .ql-snow .ql-toolbar button:hover .ql-stroke {
                stroke: #1e40af !important;
              }
              .ql-snow.ql-toolbar button:hover .ql-fill,
              .ql-snow .ql-toolbar button:hover .ql-fill {
                fill: #1e40af !important;
              }
              .ql-snow.ql-toolbar .ql-stroke {
                stroke: #475569 !important;
                stroke-width: 2px;
              }
              .ql-snow.ql-toolbar .ql-fill {
                fill: #475569 !important;
              }
              .ql-snow.ql-toolbar .ql-picker {
                color: #475569 !important;
                font-weight: 500;
              }
              .ql-snow.ql-toolbar .ql-picker-label {
                border-radius: 6px;
                padding-left: 8px !important;
                padding-right: 8px !important;
                transition: all 0.15s ease;
              }
              .ql-snow.ql-toolbar .ql-picker-label:hover {
                background-color: #f1f5f9 !important;
                color: #0f172a !important;
              }
              .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke {
                stroke: #0f172a !important;
              }
              .ql-snow.ql-toolbar .ql-picker-options {
                background-color: #ffffff !important;
                border-color: #e2e8f0 !important;
                border-radius: 12px;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1);
                padding: 6px !important;
              }
              .ql-snow.ql-toolbar .ql-picker-item {
                border-radius: 6px;
                padding: 4px 8px !important;
                transition: all 0.15s ease;
              }
              .ql-snow.ql-toolbar .ql-picker-item:hover {
                background-color: #f1f5f9 !important;
                color: #2563eb !important;
              }
              .ql-snow.ql-toolbar .ql-picker-item.ql-selected {
                color: #2563eb !important;
                background-color: #eff6ff !important;
              }

              /* Scrollbar Styling - Light Mode */
              .ql-editor::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              .ql-editor::-webkit-scrollbar-track {
                background: #ffffff !important;
              }
              .ql-editor::-webkit-scrollbar-thumb {
                background: #cbd5e1 !important;
                border-radius: 9999px;
                border: 2px solid #ffffff;
              }
              .ql-editor::-webkit-scrollbar-thumb:hover {
                background: #94a3b8 !important;
              }

              /* Dark Mode overrides */
              .dark .ql-toolbar.ql-snow {
                background-color: #1e293b !important;
                border-color: #334155 !important;
              }
              .dark .ql-container.ql-snow {
                background-color: #0f172a !important;
                border-color: #334155 !important;
              }
              .dark .ql-editor {
                color: #f8fafc !important;
              }
              .dark .ql-editor.ql-blank::before {
                color: #64748b !important;
              }
              
              /* Toolbar Buttons & Pickers - Dark Mode */
              .dark .ql-snow.ql-toolbar button:hover,
              .dark .ql-snow .ql-toolbar button:hover {
                background-color: #334155 !important;
              }
              .dark .ql-snow.ql-toolbar button.ql-active,
              .dark .ql-snow .ql-toolbar button.ql-active {
                background-color: #1e3a8a !important;
              }
              .dark .ql-snow.ql-toolbar button.ql-active .ql-stroke,
              .dark .ql-snow .ql-toolbar button.ql-active .ql-stroke {
                stroke: #60a5fa !important;
              }
              .dark .ql-snow.ql-toolbar button.ql-active .ql-fill,
              .dark .ql-snow .ql-toolbar button.ql-active .ql-fill {
                fill: #60a5fa !important;
              }
              .dark .ql-snow.ql-toolbar button:hover .ql-stroke,
              .dark .ql-snow .ql-toolbar button:hover .ql-stroke {
                stroke: #60a5fa !important;
              }
              .dark .ql-snow.ql-toolbar button:hover .ql-fill,
              .dark .ql-snow .ql-toolbar button:hover .ql-fill {
                fill: #60a5fa !important;
              }
              .dark .ql-snow.ql-toolbar .ql-stroke {
                stroke: #cbd5e1 !important;
              }
              .dark .ql-snow.ql-toolbar .ql-fill {
                fill: #cbd5e1 !important;
              }
              .dark .ql-snow.ql-toolbar .ql-picker {
                color: #cbd5e1 !important;
              }
              .dark .ql-snow.ql-toolbar .ql-picker-label:hover {
                background-color: #334155 !important;
                color: #ffffff !important;
              }
              .dark .ql-snow.ql-toolbar .ql-picker-label:hover .ql-stroke {
                stroke: #ffffff !important;
              }
              .dark .ql-snow.ql-toolbar .ql-picker-options {
                background-color: #1e293b !important;
                border-color: #334155 !important;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -4px rgba(0, 0, 0, 0.3);
              }
              .dark .ql-snow.ql-toolbar .ql-picker-item:hover {
                background-color: #334155 !important;
                color: #60a5fa !important;
              }
              .dark .ql-snow.ql-toolbar .ql-picker-item.ql-selected {
                color: #60a5fa !important;
                background-color: #1e3a8a !important;
              }

              /* Scrollbar Styling - Dark Mode */
              .dark .ql-editor::-webkit-scrollbar-track {
                background: #0f172a !important;
              }
              .dark .ql-editor::-webkit-scrollbar-thumb {
                background: #475569 !important;
                border: 2px solid #0f172a;
              }
              .dark .ql-editor::-webkit-scrollbar-thumb:hover {
                background: #64748b !important;
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
