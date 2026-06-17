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

function parsePlainTextToHtml(text: string): string {
  if (!text) return "";
  
  const lines = text.split(/\r?\n/);
  let html = "";
  let listType: "bullet" | "ordered" | null = null;
  
  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (listType === "bullet") {
        html += "</ul>";
        listType = null;
      } else if (listType === "ordered") {
        html += "</ol>";
        listType = null;
      }
      html += "<p><br></p>";
      continue;
    }
    
    // Check for footer / page numbers like "-- 1 of 1 --" or "Page 1" to remove them or treat as paragraph
    const isFooter = /^--\s*\d+\s*of\s*\d+\s*--$/i.test(trimmed) || /^page\s*\d+/i.test(trimmed);
    if (isFooter) {
      continue;
    }
    
    const bulletMatch = trimmed.match(/^[•\*\-\u2022]\s*(.*)/);
    const numberMatch = trimmed.match(/^(\d+)[\.\)]\s*(.*)/);
    
    if (bulletMatch) {
      if (listType === "ordered") {
        html += "</ol>";
        listType = null;
      }
      if (!listType) {
        html += "<ul>";
        listType = "bullet";
      }
      html += `<li>${bulletMatch[1]}</li>`;
    } else if (numberMatch) {
      if (listType === "bullet") {
        html += "</ul>";
        listType = null;
      }
      if (!listType) {
        html += "<ol>";
        listType = "ordered";
      }
      html += `<li>${numberMatch[2]}</li>`;
    } else {
      if (listType === "bullet") {
        html += "</ul>";
        listType = null;
      } else if (listType === "ordered") {
        html += "</ol>";
        listType = null;
      }
      
      // Check for headers (e.g. short lines like "Career Summary", "Education")
      const isHeader = trimmed.length < 50 && 
        /^(Career Summary|Adult Care Experience|Childcare Experience|Employment History|Education|Skills|Summary|Experience|Projects|Languages|Certifications|Professional Experience|Work Experience|Summary of Qualifications)$/i.test(trimmed);
        
      if (isHeader) {
        html += `<h3>${trimmed}</h3>`;
      } else {
        html += `<p>${trimmed}</p>`;
      }
    }
  }
  
  if (listType === "bullet") {
    html += "</ul>";
  } else if (listType === "ordered") {
    html += "</ol>";
  }
  
  return html;
}

function cleanPdftohtmlForEditor(htmlStr: string): string {
  if (!htmlStr) return "";

  // Check if it has absolute positioning; if not, return as is
  if (!htmlStr.includes("position:absolute")) {
    return htmlStr;
  }

  // 1. Parse all <style> classes to know which ones are bold/italic or headings
  const styleMap: Record<string, { bold: boolean; fontSize: number }> = {};
  const styleRegex = /\.([\w-]+)\{([^}]+)\}/g;
  let styleMatch;
  while ((styleMatch = styleRegex.exec(htmlStr)) !== null) {
    const className = styleMatch[1];
    const styleContent = styleMatch[2];
    styleMap[className] = {
      bold: styleContent.includes("bold") || styleContent.includes("Montserrat-SemiBold") || styleContent.includes("Lora-Bold"),
      fontSize: parseInt((styleContent.match(/font-size:(\d+)px/) || [])[1] || "14", 10),
    };
  }

  // 2. Parse all <p> tags
  const pRegex = /<p\s+style="([^"]*)"\s+class="([^"]*)"[^>]*>([\s\S]*?)<\/p>/gi;
  const paragraphs: Array<{
    top: number;
    left: number;
    text: string;
    fontSize: number;
    isBold: boolean;
    className: string;
  }> = [];
  let pMatch;

  while ((pMatch = pRegex.exec(htmlStr)) !== null) {
    const styleAttr = pMatch[1];
    const className = pMatch[2];
    const rawContent = pMatch[3];

    // Extract top and left coordinates
    const top = parseInt((styleAttr.match(/top:(\d+)px/) || [])[1] || "0", 10);
    const left = parseInt((styleAttr.match(/left:(\d+)px/) || [])[1] || "0", 10);

    // Clean text content (remove tags, replace non-breaking spaces)
    const cleanText = rawContent
      .replace(/<br\s*\/?>/gi, "__BR__")
      .replace(/<[^>]*>/g, "") // strip nested tags like <b>
      .replace(/__BR__/g, "<br/>")
      .replace(/&#160;/g, " ")
      .replace(/&nbsp;/g, " ")
      .trim();

    if (!cleanText) continue;

    const classInfo = styleMap[className] || { fontSize: 14, bold: false };
    const isBold = classInfo.bold || rawContent.includes("<b>") || rawContent.includes("<strong>");

    paragraphs.push({
      top,
      left,
      text: cleanText,
      fontSize: classInfo.fontSize,
      isBold,
      className,
    });
  }

  if (paragraphs.length === 0) {
    return htmlStr;
  }

  // 3. Detect column layout
  const leftGroup = paragraphs.filter(p => p.left < 300);
  const rightGroup = paragraphs.filter(p => p.left >= 300);
  const hasColumns = leftGroup.length > 5 && rightGroup.length > 5;

  // 4. Sort and group paragraphs
  const finalBlocks: string[] = [];

  const processColumn = (items: typeof paragraphs) => {
    // Sort items by top coordinate, then by left coordinate
    items.sort((a, b) => {
      if (Math.abs(a.top - b.top) < 8) {
        return a.left - b.left;
      }
      return a.top - b.top;
    });

    // Merge paragraphs that are on the same line (top diff < 8px)
    const lines: Array<typeof paragraphs> = [];
    let currentLine: typeof paragraphs = [];

    for (const p of items) {
      if (currentLine.length === 0) {
        currentLine.push(p);
      } else {
        const lastP = currentLine[currentLine.length - 1];
        if (Math.abs(p.top - lastP.top) < 8) {
          currentLine.push(p);
        } else {
          lines.push(currentLine);
          currentLine = [p];
        }
      }
    }
    if (currentLine.length > 0) {
      lines.push(currentLine);
    }

    // Convert lines into HTML blocks
    return lines.map(line => {
      const mergedText = line.map(p => p.text).join(" ");
      const maxFontSize = Math.max(...line.map(p => p.fontSize));
      const isHeader = maxFontSize > 18 || line.some(p => p.isBold && p.text.toUpperCase() === p.text && p.text.length < 50);
      const isBullet = line.some(p => p.text.startsWith("•") || p.text.startsWith("-") || p.text.startsWith("▪"));

      const cleanTextStr = mergedText.replace(/^[•\-\▪]\s*/, "").trim();

      if (isHeader) {
        return `<h3><strong>${cleanTextStr}</strong></h3>`;
      } else if (isBullet) {
        return `<ul><li>${cleanTextStr}</li></ul>`;
      } else {
        return `<p>${cleanTextStr}</p>`;
      }
    });
  };

  if (hasColumns) {
    finalBlocks.push("<h2><strong>CONTACT & PROFILE</strong></h2>");
    finalBlocks.push(...processColumn(leftGroup));
    finalBlocks.push("<hr/>");
    finalBlocks.push("<h2><strong>EXPERIENCE & HISTORY</strong></h2>");
    finalBlocks.push(...processColumn(rightGroup));
  } else {
    finalBlocks.push(...processColumn(paragraphs));
  }

  // Clean consecutive <ul> tags
  let resultHtml = finalBlocks.join("\n");
  resultHtml = resultHtml.replace(/<\/ul>\n<ul>/g, "\n");

  return resultHtml;
}

export default function EditResume({ candidate, onSave }: EditResumeProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const API_URL = process.env.NEXT_PUBLIC_API_URL || (typeof window !== "undefined" ? `http://${window.location.hostname}:3001` : "http://localhost:3001");
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
          const text = candidate.resumeText;
          const isHtml = /<[^>]+>/i.test(text);
          if (isHtml) {
            const cleanHtml = cleanPdftohtmlForEditor(text);
            quillRef.current.clipboard.dangerouslyPasteHTML(cleanHtml);
          } else {
            const formattedHtml = parsePlainTextToHtml(text);
            quillRef.current.clipboard.dangerouslyPasteHTML(formattedHtml);
          }
        } else {
          // Fetch resumeText from backend if not already provided
          try {
            const token = localStorage.getItem("token");
            const response = await fetch(`${API_URL}/candidates/${candidate.id}`, {
              headers: { Authorization: `Bearer ${token}` },
            });
            if (response.ok) {
              const data = await response.json();
              if (data.resumeText) {
                const cleanHtml = cleanPdftohtmlForEditor(data.resumeText);
                quillRef.current.clipboard.dangerouslyPasteHTML(cleanHtml);
              }
            }
          } catch (err) {
            console.error("Failed to fetch resume HTML", err);
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
      
      const htmlText = quillRef.current.root.innerHTML;
      formData.append("resumeText", htmlText);

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
      
      // Update local state with the HTML too
      onSave?.({ ...updatedCandidate, resumeText: htmlText });

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
                background-color: #f3f4f6 !important; /* light gray desk surface */
                overflow-y: auto !important;
                height: 60vh !important;
              }
              .ql-editor {
                background-color: #ffffff !important; /* white paper page */
                color: #1f2937 !important; /* dark gray text */
                font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif !important;
                font-size: 15px !important;
                line-height: 1.6 !important;
                width: 100% !important;
                max-width: 800px !important;
                min-height: 297mm !important; /* A4 aspect ratio height scale */
                padding: 50px 60px !important;
                margin: 30px auto !important;
                box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1) !important;
                border: 1px solid #e5e7eb !important;
                border-radius: 4px;
                overflow-y: visible !important;
              }
              .ql-editor h1, .ql-editor h2, .ql-editor h3 {
                font-weight: 700 !important;
                color: #111827 !important;
                margin-top: 1.25em !important;
                margin-bottom: 0.5em !important;
                line-height: 1.25 !important;
              }
              .ql-editor h1 { font-size: 22px !important; border-bottom: 1px solid #e5e7eb; padding-bottom: 6px; }
              .ql-editor h2 { font-size: 18px !important; }
              .ql-editor h3 { font-size: 16px !important; }
              .ql-editor p {
                margin-bottom: 1em !important;
                color: #374151 !important;
              }
              .ql-editor ul, .ql-editor ol {
                padding-left: 20px !important;
                margin-bottom: 1em !important;
              }
              .ql-editor li {
                margin-bottom: 0.25em !important;
                color: #374151 !important;
              }
              .ql-editor.ql-blank::before {
                color: #9ca3af !important;
                left: 60px !important;
                top: 50px !important;
              }
              .ql-container::-webkit-scrollbar {
                width: 8px;
                height: 8px;
              }
              .ql-container::-webkit-scrollbar-track {
                background: #f3f4f6 !important;
              }
              .ql-container::-webkit-scrollbar-thumb {
                background: #cbd5e1 !important;
                border-radius: 9999px;
                border: 2px solid #f3f4f6;
              }
              .ql-container::-webkit-scrollbar-thumb:hover {
                background: #94a3b8 !important;
              }
            `}</style>
            <div ref={editorRef} />
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
