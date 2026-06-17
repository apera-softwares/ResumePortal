"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "../../ui/modal";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";
import dynamic from "next/dynamic";
import { jsPDF } from "jspdf";

// Import CanvasResumeEditor dynamically with SSR disabled to prevent hydration mismatch errors
const CanvasResumeEditor = dynamic(() => import("./CanvasResumeEditor"), {
  ssr: false,
  loading: () => (
    <div className="flex items-center justify-center p-12 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl min-h-[500px]">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
        </svg>
        <span className="text-sm font-semibold text-gray-500">Loading Canvas Document Editor...</span>
      </div>
    </div>
  ),
});

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
  const [rawHtml, setRawHtml] = useState<string>("");
  const [zoom, setZoom] = useState<number>(1.0);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? `http://${window.location.hostname}:3001` : "http://localhost:3001");

  // Fetch initial content from backend on open
  useEffect(() => {
    if (!isOpen) return;

    const loadContent = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/candidates/${candidate.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const contentSource = data.editedHtml || data.resumeText || "";
          setRawHtml(contentSource);
        }
      } catch (err) {
        console.error("Failed to fetch resume HTML", err);
      }
    };

    loadContent();
  }, [isOpen, candidate.id, API_URL]);

  const handleEditorChange = (html: string) => {
    setRawHtml(html);
  };

  const handleCopy = () => {
    if (rawHtml) {
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = rawHtml;
      const text = tempDiv.textContent || tempDiv.innerText || "";
      navigator.clipboard.writeText(text);
      toast.success("Resume text copied to clipboard!");
    } else {
      toast.error("No text available to copy.");
    }
  };

  const handleOpenPdf = () => {
    window.open(`${API_URL}/uploads/${candidate.resume}`, "_blank");
  };

  // Helper to generate a client-side PDF file to submit to backend
  const generateSimplePdfBlob = (htmlContent: string, candidateName: string): Blob => {
    const doc = new jsPDF();
    
    // Strip HTML tags to get plain text for the PDF fallback
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(`Resume: ${candidateName}`, 20, 20);
    doc.line(20, 24, 190, 24);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(plainText, 170);
    
    let y = 35;
    for (let i = 0; i < splitText.length; i++) {
      if (y > 280) {
        doc.addPage();
        y = 20;
      }
      doc.text(splitText[i], 20, y);
      y += 12;
    }
    
    return doc.output("blob");
  };

  const handleExportWord = () => {
    try {
      const header = "<html xmlns:o='urn:schemas-microsoft-com:office:office' " +
        "xmlns:w='urn:schemas-microsoft-com:office:word' " +
        "xmlns='http://www.w3.org/TR/REC-html40'>" +
        "<head><title>Resume</title><meta charset='utf-8'></head><body>";
      const footer = "</body></html>";
      const sourceHTML = header + rawHtml + footer;
      
      const blob = new Blob(['\ufeff' + sourceHTML], {
        type: 'application/msword'
      });
      saveAs(blob, `${candidate.firstName}_${candidate.lastName}_resume.doc`);
      toast.success("Word document exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export Word document.");
    }
  };

  const handleExportPdf = () => {
    try {
      const pdfBlob = generateSimplePdfBlob(rawHtml, `${candidate.firstName} ${candidate.lastName}`);
      saveAs(pdfBlob, `${candidate.firstName}_${candidate.lastName}_resume.pdf`);
      toast.success("PDF document exported successfully!");
    } catch (err) {
      console.error(err);
      toast.error("Failed to export PDF document.");
    }
  };

  const handleSave = async () => {
    if (!rawHtml) {
      toast.error("Editor content is empty!");
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading("Saving changes...");

    try {
      // 1. Generate client-side PDF file to satisfy backend multer requirements
      const pdfBlob = generateSimplePdfBlob(rawHtml, `${candidate.firstName} ${candidate.lastName}`);
      
      // 2. Prepare FormData
      const formData = new FormData();
      const fileName = `${candidate.firstName}_${candidate.lastName}_cleaned.pdf`;
      formData.append("file", pdfBlob, fileName);
      formData.append("resumeText", rawHtml);

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
        throw new Error("Failed to save resume changes to backend.");
      }

      const updatedCandidate = await response.json();
      
      onSave?.({ ...updatedCandidate, resumeText: rawHtml });

      toast.success("Resume saved successfully!", { id: loadingToast });
      setIsOpen(false);
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save resume changes.", { id: loadingToast });
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
        <div className="flex flex-col gap-5 p-6 md:p-8 bg-white dark:bg-gray-900 rounded-3xl h-[88vh]">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                Resume Visual Editor
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                Edit and format resume layout for {candidate.firstName} {candidate.lastName}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleCopy}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/40 rounded-lg transition-all disabled:opacity-50"
              >
                Copy Text
              </button>

              <button
                onClick={handleOpenPdf}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-all disabled:opacity-50"
              >
                Open Original
              </button>

              <button
                onClick={handleExportWord}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-all disabled:opacity-50"
              >
                Export Word
              </button>

              <button
                onClick={handleExportPdf}
                disabled={isSaving}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-lg transition-all disabled:opacity-50"
              >
                Export PDF
              </button>
            </div>
          </div>

          {/* Canvas Rich Editor */}
          <div className="flex-1 min-h-0">
            <CanvasResumeEditor
              initialContent={rawHtml}
              onChange={handleEditorChange}
              zoom={zoom}
              onZoomChange={setZoom}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end pt-4 gap-3 border-t border-gray-100 dark:border-gray-800">
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
