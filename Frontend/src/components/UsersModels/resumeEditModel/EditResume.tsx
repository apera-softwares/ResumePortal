"use client";

import React, { useState, useEffect, useRef } from "react";
import { Modal } from "../../ui/modal";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";
import dynamic from "next/dynamic";
import { jsPDF } from "jspdf";
import { useRouter, usePathname } from "next/navigation";
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Underline as UnderlineIcon,
  Undo2,
} from "lucide-react";

function jsonToHtml(jsonStr: string): string {
  try {
    const data = JSON.parse(jsonStr);
    if (typeof data === "string") return data;
    return jsonStr;
  } catch {
    return jsonStr;
  }
}

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

interface ExactHtmlResumeEditorProps {
  html: string;
  title: string;
  onChange: (html: string) => void;
}

const exactEditorFonts = [
  { label: "Default", value: "" },
  { label: "Arial", value: "Arial, Helvetica, sans-serif" },
  { label: "Georgia", value: "Georgia, serif" },
  { label: "Times", value: "'Times New Roman', Times, serif" },
  { label: "Verdana", value: "Verdana, Geneva, sans-serif" },
  { label: "Inter", value: "Inter, sans-serif" },
];

const exactEditorFontSizes = ["9px", "10px", "11px", "12px", "13px", "14px", "16px", "18px", "20px", "24px"];

function buildIframeDocument(html: string, editable = false): string {
  const bodyHtml = html || "<div></div>";
  const hasDocumentShell = /<!doctype|<html[\s>]/i.test(bodyHtml);
  const chromeStyles = `
    <style>
      html, body {
        min-height: 100%;
        margin: 0;
        background: #9ca3af;
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      body {
        overflow-y: auto;
        overflow-x: hidden;
        width: 100%;
        padding: 20px 0;
        box-sizing: border-box;
      }
      /* Centering page wrappers of pdftohtml output */
      div[id$="-div"], div[id^="page"], .a4-page, [style*="width:892px"], [style*="width: 892px"] {
        margin-left: auto !important;
        margin-right: auto !important;
        margin-top: 10px !important;
        margin-bottom: 25px !important;
        box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.15) !important;
        position: relative !important;
        background: #ffffff;
      }
      ${editable ? `
      [contenteditable="true"] {
        outline: 2px solid transparent;
        cursor: text;
      }
      [contenteditable="true"]:focus {
        outline: 2px solid rgba(37, 99, 235, 0.35);
        outline-offset: 2px;
      }
      ` : ""}
    </style>
  `;

  if (hasDocumentShell) {
    const withStyles = bodyHtml.replace(/<\/head>/i, `${chromeStyles}</head>`);
    if (!editable) return withStyles;
    return withStyles.replace(/<body([^>]*)>/i, `<body$1 contenteditable="true" spellcheck="false">`);
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
${chromeStyles}
</head>
<body${editable ? ' contenteditable="true" spellcheck="false"' : ""}>${bodyHtml}</body>
</html>`;
}

function ExactHtmlResumeEditor({ html, title, onChange }: ExactHtmlResumeEditorProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const savedRangeRef = useRef<Range | null>(null);
  const initialDocumentRef = useRef(buildIframeDocument(html, true));

  const getDoc = () => iframeRef.current?.contentDocument || null;

  const syncHtml = (doc: Document) => {
    onChange(`<!DOCTYPE html>\n${doc.documentElement.outerHTML}`);
  };

  const saveSelection = (doc = getDoc()) => {
    const selection = doc?.getSelection();
    if (selection && selection.rangeCount > 0) {
      savedRangeRef.current = selection.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = (doc: Document) => {
    if (!savedRangeRef.current) return;
    const selection = doc.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(savedRangeRef.current);
  };

  const runCommand = (command: string, value?: string) => {
    const doc = getDoc();
    if (!doc?.body) return;

    doc.body.focus();
    restoreSelection(doc);
    doc.execCommand("styleWithCSS", false, "true");
    doc.execCommand(command, false, value);
    saveSelection(doc);
    syncHtml(doc);
  };

  const applyInlineStyle = (styles: Partial<CSSStyleDeclaration>) => {
    const doc = getDoc();
    if (!doc?.body) return;

    doc.body.focus();
    restoreSelection(doc);
    const selection = doc.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (range.collapsed) return;

    const span = doc.createElement("span");
    Object.assign(span.style, styles);

    try {
      range.surroundContents(span);
    } catch {
      const contents = range.extractContents();
      span.appendChild(contents);
      range.insertNode(span);
    }

    selection.removeAllRanges();
    const nextRange = doc.createRange();
    nextRange.selectNodeContents(span);
    selection.addRange(nextRange);
    saveSelection(doc);
    syncHtml(doc);
  };

  const handleLoad = () => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument;
    if (!doc?.body) return;

    doc.designMode = "on";
    doc.body.setAttribute("contenteditable", "true");
    doc.body.setAttribute("spellcheck", "false");

    const handleInput = () => syncHtml(doc);
    const handleSelection = () => saveSelection(doc);

    doc.addEventListener("input", handleInput);
    doc.addEventListener("blur", handleInput, true);
    doc.addEventListener("selectionchange", handleSelection);
    doc.addEventListener("keyup", handleSelection);
    doc.addEventListener("mouseup", handleSelection);
  };

  const toolbarButtonClass =
    "p-2 text-gray-650 hover:bg-gray-100 dark:text-gray-350 dark:hover:bg-gray-800 rounded-lg transition-all";

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-inner dark:border-gray-800 dark:bg-gray-950">
      <div className="flex flex-wrap items-center gap-1.5 border-b border-gray-200 bg-white p-2.5 dark:border-gray-800 dark:bg-gray-900">
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("undo")} className={toolbarButtonClass} title="Undo">
          <Undo2 className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("redo")} className={toolbarButtonClass} title="Redo">
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-800" />

        <select
          onMouseDown={() => saveSelection()}
          onChange={(e) => e.target.value && applyInlineStyle({ fontFamily: e.target.value })}
          className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          defaultValue=""
        >
          {exactEditorFonts.map((font) => (
            <option key={font.label} value={font.value}>{font.label}</option>
          ))}
        </select>

        <select
          onMouseDown={() => saveSelection()}
          onChange={(e) => applyInlineStyle({ fontSize: e.target.value })}
          className="rounded-lg border border-gray-200 bg-gray-50 px-2.5 py-1.5 text-xs font-semibold text-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-200"
          defaultValue="12px"
        >
          {exactEditorFontSizes.map((size) => (
            <option key={size} value={size}>{size.replace("px", "")}</option>
          ))}
        </select>

        <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-800" />

        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("bold")} className={toolbarButtonClass} title="Bold">
          <Bold className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("italic")} className={toolbarButtonClass} title="Italic">
          <Italic className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("underline")} className={toolbarButtonClass} title="Underline">
          <UnderlineIcon className="h-4 w-4" />
        </button>

        <label className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" title="Text Color">
          <span>A</span>
          <input
            type="color"
            className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
            onMouseDown={() => saveSelection()}
            onChange={(e) => runCommand("foreColor", e.target.value)}
          />
        </label>
        <label className="flex h-8 items-center gap-1 rounded-lg px-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" title="Highlight">
          <span>HL</span>
          <input
            type="color"
            className="h-5 w-6 cursor-pointer border-0 bg-transparent p-0"
            onMouseDown={() => saveSelection()}
            onChange={(e) => runCommand("hiliteColor", e.target.value)}
          />
        </label>

        <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-800" />

        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("justifyLeft")} className={toolbarButtonClass} title="Align Left">
          <AlignLeft className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("justifyCenter")} className={toolbarButtonClass} title="Align Center">
          <AlignCenter className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("justifyRight")} className={toolbarButtonClass} title="Align Right">
          <AlignRight className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("justifyFull")} className={toolbarButtonClass} title="Justify">
          <AlignJustify className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-gray-200 dark:bg-gray-800" />

        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("insertUnorderedList")} className={toolbarButtonClass} title="Bullet List">
          <List className="h-4 w-4" />
        </button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => runCommand("insertOrderedList")} className={toolbarButtonClass} title="Numbered List">
          <ListOrdered className="h-4 w-4" />
        </button>
      </div>

      <iframe
        ref={iframeRef}
        onLoad={handleLoad}
        title={title}
        srcDoc={initialDocumentRef.current}
        className="min-h-0 flex-1 bg-gray-400"
        sandbox="allow-same-origin"
      />
    </div>
  );
}

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  resume: string;
  resumeText?: string;
  cleanedResume?: string;
  editedHtml?: string;
  isPublic?: boolean;
}

interface EditResumeProps {
  candidate: Candidate;
  onSave?: (updatedCandidate: Candidate & Record<string, unknown>) => void;
  isInline?: boolean;
  onClose?: () => void;
  initialMode?: "preview" | "edit" | "review" | "original";
  isPublicPage?: boolean;
}

export default function EditResume({ candidate, onSave, isInline = false, onClose, initialMode, isPublicPage = false }: EditResumeProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(isInline);
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingFile, setIsUploadingFile] = useState(false);
  const [rawHtml, setRawHtml] = useState<string>("");
  const [previewHtml, setPreviewHtml] = useState<string>("");
  const [originalParsedHtml, setOriginalParsedHtml] = useState<string>("");
  const [isEditMode, setIsEditMode] = useState<boolean>(initialMode === "edit");
  const [viewMode, setViewMode] = useState<"preview" | "edit" | "review">(
    initialMode === "edit" ? "edit" : (initialMode === "original" || initialMode === "review" ? "review" : "preview")
  );
  const [styleHeader, setStyleHeader] = useState<string>("");
  const [zoom, setZoom] = useState<number>(1.0);
  const [editorKey, setEditorKey] = useState<number>(0);

  const [isPublic, setIsPublic] = useState<boolean>(candidate.isPublic || false);
  const [isTogglingPublic, setIsTogglingPublic] = useState(false);
  const [role, setRole] = useState<string | null>(null);

  const isLoadedRef = useRef(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");

  // Get user role from local storage
  useEffect(() => {
    if (typeof window !== "undefined") {
      setRole(localStorage.getItem("role"));
    }
  }, []);

  // Sync viewMode and isEditMode with initialMode when routing parameters change
  useEffect(() => {
    if (initialMode) {
      const edit = initialMode === "edit";
      setIsEditMode(edit);
      setViewMode(
        edit ? "edit" : (initialMode === "original" || initialMode === "review" ? "review" : "preview")
      );
    }
  }, [initialMode]);

  const handleEditResumeClick = () => {
    setIsEditMode(true);
    setViewMode("edit");
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      params.set("mode", "edit");
      router.replace(`${pathname}?${params.toString()}`);
    }
  };

  const handleCancel = () => {
    if (initialMode === "edit") {
      if (isInline) onClose?.();
      else setIsOpen(false);
    } else {
      setIsEditMode(false);
      setViewMode("review");
      if (typeof window !== "undefined") {
        const params = new URLSearchParams(window.location.search);
        params.set("mode", "view");
        router.replace(`${pathname}?${params.toString()}`);
      }
    }
  };

  // Fetch initial content from backend on open (Load ONCE only)
  useEffect(() => {
    if (!isOpen) {
      isLoadedRef.current = false;
      return;
    }

    const loadContent = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${API_URL}/candidates/${candidate.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (response.ok) {
          const data = await response.json();
          const sourceHtml = data.editedHtml || data.resumeText || "";

          setStyleHeader("");
          setPreviewHtml(sourceHtml);
          setRawHtml(sourceHtml);
          setOriginalParsedHtml(data.resumeText || "");
          setIsPublic(data.isPublic || false);
          if (!initialMode) {
            setViewMode(isPublicPage ? "preview" : "edit");
          }

          // Mark as loaded so subsequent state updates do not overwrite TipTap editor
          isLoadedRef.current = true;
        }
      } catch (err) {
        console.error("Failed to fetch resume HTML", err);
      }
    };

    loadContent();
  }, [isOpen, candidate.id, API_URL, initialMode]);

  const togglePublicStatus = async () => {
    setIsTogglingPublic(true);
    try {
      const token = localStorage.getItem("token");
      const nextPublicVal = !isPublic;
      const response = await fetch(`${API_URL}/candidates/${candidate.id}/public`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ isPublic: nextPublicVal }),
      });
      if (response.ok) {
        setIsPublic(nextPublicVal);
        toast.success(nextPublicVal ? "Candidate is now public!" : "Candidate is now private.");
        if (onSave) {
          onSave({ ...candidate, isPublic: nextPublicVal });
        }
      } else {
        toast.error("Failed to update public status.");
      }
    } catch (err) {
      console.error(err);
      toast.error("An error occurred updating public status.");
    } finally {
      setIsTogglingPublic(false);
    }
  };


  const handleEditorChange = (html: string) => {
    setRawHtml(html);
  };

  const renderResumeSurface = () => {
    if (viewMode === "review") {
      return (
        <div className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-inner dark:border-gray-800 dark:bg-gray-950">
          {renderOriginalResumeContent()}
        </div>
      );
    }

    if (viewMode === "preview") {
      return (
        <div className="h-full overflow-hidden rounded-2xl border border-gray-200 bg-gray-100 shadow-inner dark:border-gray-800 dark:bg-gray-950">
          <iframe
            key={`${candidate.id}-${previewHtml.length}`}
            title={`${candidate.firstName} ${candidate.lastName} resume preview`}
            srcDoc={buildIframeDocument(previewHtml || rawHtml)}
            className="h-full w-full bg-gray-400"
            sandbox="allow-same-origin"
          />
        </div>
      );
    }

    if (rawHtml) {
      return (
        <ExactHtmlResumeEditor
          key={`${candidate.id}-${editorKey}`}
          html={rawHtml}
          title={`${candidate.firstName} ${candidate.lastName} resume editor`}
          onChange={handleEditorChange}
        />
      );
    }

    return (
      <CanvasResumeEditor
        key={`${candidate.id}-${editorKey}`}
        initialContent={rawHtml}
        styleHeader={styleHeader}
        onChange={handleEditorChange}
        zoom={zoom}
        onZoomChange={setZoom}
      />
    );
  };

  const renderOriginalResumeContent = () => {
    if (originalParsedHtml) {
      return (
        <iframe
          srcDoc={buildIframeDocument(originalParsedHtml)}
          className="w-full h-full border-none bg-gray-400"
          title="Original Resume HTML"
          sandbox="allow-same-origin"
        />
      );
    }

    const resumeUrl = candidate.resume ? `${API_URL}/uploads/${candidate.resume}` : null;
    const isPdf = candidate.resume?.toLowerCase().endsWith(".pdf");

    if (isPdf && resumeUrl) {
      return (
        <iframe
          src={`${resumeUrl}#toolbar=0&navpanes=0`}
          className="w-full h-full border-none bg-gray-400"
          title="Original Resume PDF"
        />
      );
    }

    if (!isPdf && !originalParsedHtml) {
      return (
        <div className="w-full h-full flex items-center justify-center p-8 bg-gray-50 dark:bg-gray-900">
          <div className="flex flex-col items-center gap-3">
            <svg className="animate-spin h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <span className="text-sm font-semibold text-gray-500">Loading original resume...</span>
          </div>
        </div>
      );
    }

    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-3 p-8 bg-gray-50 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
        <svg className="w-12 h-12 text-gray-300 dark:text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <span className="text-sm font-semibold">No original resume file or text available.</span>
      </div>
    );
  };

  // Extract cleanest HTML representation from rawHtml payload
  const getCleanHtml = (raw: string): string => {
    if (!raw) return "";
    const jsonMatch = raw.match(/<!--JSON_DATA:([\s\S]*?)-->/);
    if (jsonMatch && jsonMatch[1]) {
      return jsonToHtml(jsonMatch[1]);
    }
    if (raw.trim().startsWith("[")) {
      return jsonToHtml(raw);
    }
    return raw;
  };

  const handleCopy = () => {
    if (rawHtml) {
      const htmlContent = getCleanHtml(rawHtml);
      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = htmlContent;
      const text = tempDiv.textContent || tempDiv.innerText || "";
      navigator.clipboard.writeText(text);
      toast.success("Resume text copied to clipboard!");
    }
  };

  const handleOpenPdf = () => {
    if (candidate.resume) {
      window.open(`${API_URL}/uploads/${candidate.resume}`, "_blank");
    } else {
      toast.error("No resume file available.");
    }
  };

  // Helper to generate a simple PDF blob for server persistence
  const generateSimplePdfBlob = (htmlContent: string, title: string): Blob => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4"
    });

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    const plainText = tempDiv.textContent || tempDiv.innerText || "";

    doc.setFont("Helvetica");
    doc.setFontSize(14);
    doc.text(title, 40, 40);

    doc.setFontSize(10);
    const splitText = doc.splitTextToSize(plainText, 515);
    let y = 70;

    splitText.forEach((line: string) => {
      if (y > 780) {
        doc.addPage();
        y = 40;
      }
      doc.text(line, 40, y);
      y += 15;
    });

    return doc.output("blob");
  };

  const handleExportPdf = async () => {
    const htmlToExport = viewMode === "review" ? (originalParsedHtml || rawHtml) : (previewHtml || rawHtml);
    if (!htmlToExport) return;
    const exportToast = toast.loading("Exporting premium PDF...");
    try {
      const response = await fetch(`${API_URL}/candidates/export-pdf`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: htmlToExport }),
      });

      if (!response.ok) {
        throw new Error("Failed to export PDF from server.");
      }

      const blob = await response.blob();
      saveAs(blob, `${candidate.firstName}_${candidate.lastName}_resume.pdf`);
      toast.dismiss(exportToast);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.dismiss(exportToast);
      toast.error("Failed to export PDF.");
    }
  };

  const handleExportWord = async () => {
    if (!rawHtml) return;
    const exportToast = toast.loading("Exporting premium Word document...");
    try {
      const response = await fetch(`${API_URL}/candidates/export-docx`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ html: rawHtml }),
      });

      if (!response.ok) {
        throw new Error("Failed to export Word document from server.");
      }

      const blob = await response.blob();
      saveAs(blob, `${candidate.firstName}_${candidate.lastName}_resume.docx`);
      toast.dismiss(exportToast);
      toast.success("Word document exported successfully!");
    } catch (err) {
      console.error(err);
      toast.dismiss(exportToast);
      toast.error("Failed to export Word document.");
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingFile(true);
    const uploadToast = toast.loading("Uploading and parsing new resume file...");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/candidates/${candidate.id}/update-resume`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      if (!response.ok) {
        throw new Error("Failed to update candidate resume file");
      }

      const updatedCandidate = await response.json();

      setIsPublic(updatedCandidate.isPublic || false);
      onSave?.(updatedCandidate);

      const parsedContent = updatedCandidate.resumeText || "";
      if (parsedContent) {
        // Clear styleHeader; our converter processes and inlines all styles
        setStyleHeader("");

        setPreviewHtml(parsedContent);
        setRawHtml(parsedContent);
        setOriginalParsedHtml(parsedContent);
        setViewMode("preview");
        setEditorKey(prev => prev + 1); // Reset CanvasResumeEditor state and force remount with new parsed HTML
        toast.success("Resume updated and parsed successfully!", { id: uploadToast });
      } else {
        toast.success("Resume updated! Text parsing is processing in background.", { id: uploadToast });
      }
    } catch (err) {
      console.error("File update failed:", err);
      toast.error("Failed to update resume file.", { id: uploadToast });
    } finally {
      setIsUploadingFile(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSave = async () => {
    if (!rawHtml) {
      toast.error("Editor content is empty!");
      return;
    }

    setIsSaving(true);
    const loadingToast = toast.loading("Saving changes to server...");

    try {
      const formData = new FormData();
      const fullHtml = /<!doctype|<html[\s>]/i.test(rawHtml)
        ? rawHtml
        : `<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf-8">\n</head>\n<body bgcolor="#A0A0A0" vlink="blue" link="blue">\n${rawHtml}\n</body>\n</html>`;
      formData.append("resumeText", fullHtml);
      formData.append("editedHtml", fullHtml);

      const token = localStorage.getItem("token");
      const response = await fetch(`${API_URL}/candidates/${candidate.id}/update-resume`, {
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
      setPreviewHtml(fullHtml);
      setViewMode("preview");

      toast.success("Resume saved successfully!", { id: loadingToast });
      if (isInline) onClose?.();
      else setIsOpen(false);
    } catch (err) {
      console.error("Save failed:", err);
      toast.error("Failed to save resume changes.", { id: loadingToast });
    } finally {
      setIsSaving(false);
    }
  };

  if (isInline) {
    return (
      <div className="flex flex-col gap-4 p-5 md:p-6 bg-white dark:bg-gray-900 border border-gray-150/80 dark:border-gray-800/80 rounded-3xl h-[calc(100vh-170px)] min-h-[600px] w-full overflow-hidden box-border shadow-md">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-150 dark:border-gray-800 pb-4">
          <div className="flex items-center gap-3">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-all border border-gray-200 dark:border-gray-750 shadow-xs"
              title="Back to Candidates"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? "Resume Visual Editor" : "View Resume"}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {isEditMode 
                  ? `Edit and format resume layout for ${candidate.firstName} ${candidate.lastName}` 
                  : `View resume layout for ${candidate.firstName} ${candidate.lastName}`}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {!isEditMode && role !== "CLIENT" && !isPublicPage && (
              <button
                onClick={handleEditResumeClick}
                className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span>Edit Resume</span>
              </button>
            )}

            {!isPublicPage && isEditMode && (
              <button
                onClick={togglePublicStatus}
                disabled={isTogglingPublic || isSaving || isUploadingFile}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all border ${isPublic
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30"
                  : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800"
                  } disabled:opacity-50`}
              >
                {isPublic ? (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2m-4-3h1.5a2.5 2.5 0 012.5 2.5V14a2 2 0 002 2h1.5m-6-3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Public</span>
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                    <span>Mark as Public</span>
                  </>
                )}
              </button>
            )}

            {isEditMode && (
              <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800">
                <button
                  onClick={() => setViewMode("review")}
                  disabled={isSaving || isUploadingFile}
                  className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 ${viewMode === "review"
                    ? "bg-white text-blue-600 shadow-xs dark:bg-gray-900 dark:text-blue-400"
                    : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                    }`}
                >
                  Preview
                </button>
                {isPublicPage && (
                  <button
                    onClick={() => setViewMode("preview")}
                    disabled={isSaving || isUploadingFile}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 ${viewMode === "preview"
                      ? "bg-white text-blue-600 shadow-xs dark:bg-gray-900 dark:text-blue-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                  >
                    View
                  </button>
                )}
                {!isPublicPage && (
                  <button
                    onClick={() => setViewMode("edit")}
                    disabled={isSaving || isUploadingFile}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 ${viewMode === "edit"
                      ? "bg-white text-blue-600 shadow-xs dark:bg-gray-900 dark:text-blue-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                  >
                    Edit
                  </button>
                )}
              </div>
            )}

            {!isPublicPage && isEditMode && (
              <>
                {/* Premium Update File Button */}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isSaving || isUploadingFile}
                  className="px-3 py-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-955/40 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                >
                  {isUploadingFile ? (
                    <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  ) : (
                    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                    </svg>
                  )}
                  {isUploadingFile ? "Uploading..." : "Update File"}
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept=".pdf,.docx,.doc"
                  className="hidden"
                />

                <button
                  onClick={handleExportWord}
                  disabled={isSaving || isUploadingFile}
                  className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 rounded-lg transition-all disabled:opacity-50"
                >
                  Export Word
                </button>
              </>
            )}

            {isEditMode && (
              <button
                onClick={handleExportPdf}
                disabled={isSaving || isUploadingFile}
                className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/40 rounded-lg transition-all disabled:opacity-50"
              >
                Export PDF
              </button>
            )}
          </div>
        </div>

        {/* Canvas Rich Editor */}
        <div className="flex-1 min-h-0">
          {renderResumeSurface()}
        </div>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2">
          </div>

          <div className="flex justify-end gap-3">
            {isPublicPage || !isEditMode ? (
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 rounded-xl transition-all shadow-sm active:scale-95"
              >
                Close
              </button>
            ) : (
              <>
                <button
                  onClick={handleCancel}
                  disabled={isSaving || isUploadingFile}
                  className="px-5 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>

                <button
                  onClick={handleSave}
                  disabled={isSaving || isUploadingFile}
                  className="px-6 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
                >
                  {isSaving && (
                    <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                  )}
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 rounded-xl text-xs font-semibold border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xs"
      >
        View Resume
      </button>

      <Modal
        isOpen={isOpen}
        onClose={() => !isSaving && !isUploadingFile && setIsOpen(false)}
        isFullscreen={true}
        className="bg-white dark:bg-gray-900"
      >
        <div className="flex flex-col gap-4 p-5 md:p-6 bg-white dark:bg-gray-900 h-screen w-screen overflow-hidden box-border">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-gray-150 dark:border-gray-800 pb-4">
            <div>
              <h4 className="text-xl font-bold text-gray-900 dark:text-white">
                {isEditMode ? "Resume Visual Editor" : "View Resume"}
              </h4>
              <p className="text-xs text-gray-500 mt-1">
                {isEditMode 
                  ? `Edit and format resume layout for ${candidate.firstName} ${candidate.lastName}` 
                  : `View resume layout for ${candidate.firstName} ${candidate.lastName}`}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2 pr-12 sm:pr-16">
              {!isEditMode && role !== "CLIENT" && !isPublicPage && (
                <button
                  onClick={handleEditResumeClick}
                  className="px-3 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-all shadow-md flex items-center gap-1.5 cursor-pointer"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  <span>Edit Resume</span>
                </button>
              )}

              {!isPublicPage && isEditMode && (
                <button
                  onClick={togglePublicStatus}
                  disabled={isTogglingPublic || isSaving || isUploadingFile}
                  className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all border ${isPublic
                    ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/30"
                    : "bg-white text-gray-700 border-gray-200 hover:bg-gray-50 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700 dark:hover:bg-gray-800"
                    } disabled:opacity-50`}
                >
                  {isPublic ? (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 002 2h2m-4-3h1.5a2.5 2.5 0 012.5 2.5V14a2 2 0 002 2h1.5m-6-3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Public</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                      <span>Mark as Public</span>
                    </>
                  )}
                </button>
              )}

              {isEditMode && (
                <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 dark:border-gray-700 dark:bg-gray-800">
                  <button
                    onClick={() => setViewMode("review")}
                    disabled={isSaving || isUploadingFile}
                    className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 ${viewMode === "review"
                      ? "bg-white text-blue-600 shadow-xs dark:bg-gray-900 dark:text-blue-400"
                      : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                      }`}
                  >
                    Preview
                  </button>
                  {isPublicPage && (
                    <button
                      onClick={() => setViewMode("preview")}
                      disabled={isSaving || isUploadingFile}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 ${viewMode === "preview"
                        ? "bg-white text-blue-600 shadow-xs dark:bg-gray-900 dark:text-blue-400"
                        : "text-gray-500 hover:text-gray-705 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                    >
                      View
                    </button>
                  )}
                  {!isPublicPage && (
                    <button
                      onClick={() => setViewMode("edit")}
                      disabled={isSaving || isUploadingFile}
                      className={`px-3 py-1.5 text-xs font-bold rounded-md transition-all disabled:opacity-50 ${viewMode === "edit"
                        ? "bg-white text-blue-600 shadow-xs dark:bg-gray-900 dark:text-blue-400"
                        : "text-gray-500 hover:text-gray-705 dark:text-gray-400 dark:hover:text-gray-200"
                        }`}
                    >
                      Edit
                    </button>
                  )}
                </div>
              )}

              {!isPublicPage && isEditMode && (
                <>
                  {/* Premium Update File Button */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isSaving || isUploadingFile}
                    className="px-3 py-1.5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-955/40 rounded-lg transition-all disabled:opacity-50 flex items-center gap-1.5"
                  >
                    {isUploadingFile ? (
                      <svg className="animate-spin h-3.5 w-3.5" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    ) : (
                      <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.2">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                      </svg>
                    )}
                    {isUploadingFile ? "Uploading..." : "Update File"}
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".pdf,.docx,.doc"
                    className="hidden"
                  />

                  <button
                    onClick={handleExportWord}
                    disabled={isSaving || isUploadingFile}
                    className="px-3 py-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-955/40 rounded-lg transition-all disabled:opacity-50"
                  >
                    Export Word
                  </button>
                </>
              )}

              {isEditMode && (
                <button
                  onClick={handleExportPdf}
                  disabled={isSaving || isUploadingFile}
                  className="px-3 py-1.5 text-xs font-bold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-955/40 rounded-lg transition-all disabled:opacity-50"
                >
                  Export PDF
                </button>
              )}
            </div>
          </div>

          {/* Canvas Rich Editor */}
          <div className="flex-1 min-h-0">
            {renderResumeSurface()}
          </div>

          {/* Footer Actions */}
          <div className="flex justify-between items-center pt-4 border-t border-gray-100 dark:border-gray-800">
            {/* Auto-Save Indicator Status */}
            <div className="flex items-center gap-2">
            </div>

            <div className="flex justify-end gap-3">
              {isPublicPage || !isEditMode ? (
                <button
                  onClick={() => setIsOpen(false)}
                  className="px-6 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 rounded-xl transition-all shadow-sm active:scale-95"
                >
                  Close
                </button>
              ) : (
                <>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving || isUploadingFile}
                    className="px-5 py-2.5 text-sm font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 dark:bg-gray-800 dark:hover:bg-gray-700 dark:text-gray-200 rounded-xl transition-all disabled:opacity-50"
                  >
                    Cancel
                  </button>

                  <button
                    onClick={handleSave}
                    disabled={isSaving || isUploadingFile}
                    className="px-6 py-2.5 text-sm font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all shadow-md active:scale-95 flex items-center gap-2"
                  >
                    {isSaving && (
                      <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                    )}
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
