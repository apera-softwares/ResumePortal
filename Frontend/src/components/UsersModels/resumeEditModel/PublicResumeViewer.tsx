"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { saveAs } from "file-saver";

interface Candidate {
  id: string;
  firstName: string;
  lastName: string;
  resume?: string;
  resumeText?: string;
  editedHtml?: string;
  cleanedResume?: string;
  isPublic?: boolean;
}

interface PublicResumeViewerProps {
  candidate: Candidate;
  onClose: () => void;
}

type TabType = "original" | "edited";

// ─── Build an iframe-renderable HTML document from a raw HTML fragment ───────
function buildIframeDocument(html: string): string {
  const bodyHtml = html || "<div></div>";
  const hasDocumentShell = /<!doctype|<html[\s>]/i.test(bodyHtml);

  const chromeStyles = `
    <style>
      html, body {
        min-height: 100%;
        margin: 0;
        background: #e5e7eb;
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
        cursor: default;
        user-select: none;
        -webkit-user-select: none;
      }
      /* Page wrappers */
      div[id$="-div"], div[id^="page"], .a4-page,
      [style*="width:892px"], [style*="width: 892px"] {
        margin-left: auto !important;
        margin-right: auto !important;
        margin-top: 10px !important;
        margin-bottom: 25px !important;
        box-shadow: 0 10px 15px -3px rgba(0,0,0,0.3), 0 4px 6px -2px rgba(0,0,0,0.15) !important;
        position: relative !important;
        background: #ffffff;
      }
    </style>
  `;

  if (hasDocumentShell) {
    const withStyles = bodyHtml.replace(/<\/head>/i, `${chromeStyles}</head>`);
    // Make body non-editable
    return withStyles
      .replace(/contenteditable="true"/gi, 'contenteditable="false"')
      .replace(/designMode\s*=\s*["']on["']/gi, 'designMode="off"');
  }

  return `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
${chromeStyles}
</head>
<body>${bodyHtml}</body>
</html>`;
}

// ─── Spinner ──────────────────────────────────────────────────────────────────
function Spinner({ className = "h-7 w-7" }: { className?: string }) {
  return (
    <svg className={`animate-spin text-blue-500 ${className}`} fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  );
}

export default function PublicResumeViewer({ candidate, onClose }: PublicResumeViewerProps) {
  const API_URL =
    process.env.NEXT_PUBLIC_API_URL ||
    (typeof window !== "undefined" ? `http://${window.location.hostname}:3003` : "http://localhost:3003");

  const [activeTab, setActiveTab] = useState<TabType>("edited");
  const [editedHtml, setEditedHtml] = useState<string>("");
  const [originalHtml, setOriginalHtml] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [pdfZoom, setPdfZoom] = useState(100);
  const originalPdfUrl = candidate.resume
    ? `${API_URL}/uploads/${candidate.resume}`
    : null;
  const isPdf = candidate.resume?.toLowerCase().endsWith(".pdf");

  // ── Fetch resume data ───────────────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const res = await fetch(`${API_URL}/candidates/${candidate.id}`);
        if (res.ok) {
          const data = await res.json();
          setEditedHtml(data.editedHtml || data.resumeText || "");
          setOriginalHtml(data.resumeText || "");
        }
      } catch (err) {
        console.error("Failed to fetch resume data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [candidate.id, API_URL]);

  // ── Export PDF ──────────────────────────────────────────────────────────────
  const handleExportPdf = async () => {
    const htmlToExport = activeTab === "original" ? originalHtml : editedHtml;
    if (!htmlToExport && !(activeTab === "original" && isPdf && originalPdfUrl)) {
      toast.error("No content available to export.");
      return;
    }

    setIsExporting(true);
    const exportToast = toast.loading("Generating PDF...");

    try {
      // If viewing original PDF directly, just download it
      if (activeTab === "original" && isPdf && originalPdfUrl && !originalHtml) {
        const res = await fetch(originalPdfUrl);
        const blob = await res.blob();
        saveAs(blob, `${candidate.firstName}_${candidate.lastName}_original.pdf`);
        toast.dismiss(exportToast);
        toast.success("Original PDF downloaded!");
        setIsExporting(false);
        return;
      }

      const payload = activeTab === "original" ? originalHtml : editedHtml;
      const response = await fetch(`${API_URL}/candidates/export-pdf`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ html: payload }),
      });

      if (!response.ok) throw new Error("Server export failed");
      const blob = await response.blob();
      const fileName =
        activeTab === "original"
          ? `${candidate.firstName}_${candidate.lastName}_original.pdf`
          : `${candidate.firstName}_${candidate.lastName}_edited.pdf`;
      saveAs(blob, fileName);
      toast.dismiss(exportToast);
      toast.success("PDF exported successfully!");
    } catch (err) {
      console.error(err);
      toast.dismiss(exportToast);
      toast.error("Failed to export PDF. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // ── Render resume surface for "Edited Resume" tab ───────────────────────────
  const renderEditedResume = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-[#0b0a19]">
          <Spinner className="h-9 w-9" />
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Loading edited resume...
          </p>
        </div>
      );
    }

    if (!editedHtml) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-[#0b0a19] p-8">
          <div className="w-16 h-16 rounded-2xl bg-amber-50 dark:bg-amber-950/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">No edited resume available</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
            This candidate's resume has not been edited yet. Switch to the Original Resume tab.
          </p>
        </div>
      );
    }

    return (
      <iframe
        key={`edited-${candidate.id}`}
        title={`${candidate.firstName} ${candidate.lastName} — Edited Resume`}
        srcDoc={buildIframeDocument(editedHtml)}
        className="flex-1 w-full border-none bg-gray-200"
        sandbox="allow-same-origin"
      />
    );
  };

  // ── Render resume surface for "Original Resume" tab ─────────────────────────
  const renderOriginalResume = () => {
    if (isLoading) {
      return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-gray-50 dark:bg-[#0b0a19]">
          <Spinner className="h-9 w-9" />
          <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">
            Loading original resume...
          </p>
        </div>
      );
    }

    // If we have parsed HTML, show it in iframe (read-only)
    if (originalHtml) {
      return (
        <iframe
          key={`original-html-${candidate.id}`}
          title={`${candidate.firstName} ${candidate.lastName} — Original Resume`}
          srcDoc={buildIframeDocument(originalHtml)}
          className="flex-1 w-full border-none bg-gray-200"
          sandbox="allow-same-origin"
        />
      );
    }

    // Show native PDF viewer
    if (isPdf && originalPdfUrl) {
      return (
        <div className="flex-1 flex flex-col bg-gray-100 dark:bg-[#0b0a19] overflow-hidden">
          {/* PDF zoom control bar */}
          <div className="flex items-center justify-center gap-3 py-2 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 shadow-xs">
            <button
              onClick={() => setPdfZoom((z) => Math.max(50, z - 10))}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all"
              title="Zoom Out"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM13 10H7" />
              </svg>
            </button>
            <span className="text-xs font-bold text-gray-600 dark:text-gray-300 w-12 text-center">{pdfZoom}%</span>
            <button
              onClick={() => setPdfZoom((z) => Math.min(200, z + 10))}
              className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400 transition-all"
              title="Zoom In"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0zM10 7v3m0 0v3m0-3h3m-3 0H7" />
              </svg>
            </button>
            <button
              onClick={() => setPdfZoom(100)}
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline px-2"
            >
              Reset
            </button>
          </div>
          <div className="flex-1 overflow-auto flex justify-center">
            <iframe
              key={`original-pdf-${candidate.id}-${pdfZoom}`}
              src={`${originalPdfUrl}#toolbar=0&navpanes=0&zoom=${pdfZoom}`}
              title={`${candidate.firstName} ${candidate.lastName} — Original PDF`}
              className="border-none"
              style={{ width: `${pdfZoom}%`, minWidth: "600px", height: "100%" }}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 bg-gray-50 dark:bg-[#0b0a19] p-8">
        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
          <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <h3 className="text-sm font-bold text-gray-700 dark:text-gray-200">No original resume file</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center max-w-xs">
          No original document has been uploaded for this candidate.
        </p>
      </div>
    );
  };

  // ─── Full‑height layout ────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-0 bg-white dark:bg-gray-900 border border-gray-150/80 dark:border-gray-800/80 rounded-3xl h-[calc(100vh-170px)] min-h-[600px] w-full overflow-hidden box-border shadow-md">
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 px-5 pt-5 pb-4 border-b border-gray-150 dark:border-gray-800 bg-white dark:bg-gray-900 rounded-t-3xl flex-shrink-0">
        {/* Left: back + title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-700 dark:hover:text-gray-200 transition-all border border-gray-200 dark:border-gray-700 shadow-xs"
            title="Back to Candidates"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
          </button>
          <div>
            <h4 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
              {candidate.firstName} {candidate.lastName}
            </h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              Public Profile — View Only
            </p>
          </div>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
          {/* Read-only badge */}
          <span className="hidden md:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/40 text-xs font-bold">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
            Read Only
          </span>

          {/* ── Segmented toggle: Edited / Original ── */}
          <div className="inline-flex items-center rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-0.5 shadow-xs">
            {/* Edited Resume */}
            <button
              onClick={() => setActiveTab("edited")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "edited"
                  ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-700"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Edited Resume
              {activeTab === "edited" && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              )}
            </button>

            {/* divider */}
            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 mx-0.5" />

            {/* Original Resume */}
            <button
              onClick={() => setActiveTab("original")}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === "original"
                  ? "bg-white dark:bg-gray-900 text-blue-600 dark:text-blue-400 shadow-sm border border-gray-200 dark:border-gray-700"
                  : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
              }`}
            >
              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Original Resume
              {activeTab === "original" && (
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
              )}
            </button>
          </div>

          {/* Export PDF */}
          <button
            onClick={handleExportPdf}
            disabled={isExporting || isLoading}
            className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-rose-600 to-rose-500 hover:from-rose-700 hover:to-rose-600 text-white text-xs font-bold rounded-xl shadow-sm hover:shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          >
            {isExporting ? (
              <Spinner className="h-3.5 w-3.5 text-white" />
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {isExporting ? "Exporting..." : "Export PDF"}
          </button>

          {/* Close */}
          <button
            onClick={onClose}
            className="flex items-center gap-1.5 px-4 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold rounded-xl transition-all active:scale-95"
          >
            Close
          </button>
        </div>
      </div>

      {/* ── Content area ────────────────────────────────────────────────────── */}
      <div className="flex-1 min-h-0 flex flex-col overflow-hidden">
        {activeTab === "edited" ? renderEditedResume() : renderOriginalResume()}
      </div>
    </div>
  );
}
