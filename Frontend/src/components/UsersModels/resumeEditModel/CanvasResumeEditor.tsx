"use client";

import React, { useState, useEffect, useRef } from "react";
import { 
  Bold as BoldIcon, 
  Italic as ItalicIcon, 
  Underline as UnderlineIcon, 
  Undo as UndoIcon, 
  Redo as RedoIcon, 
  ZoomIn, 
  ZoomOut,
  Palette
} from "lucide-react";

interface ParsedPage {
  id: string;
  width: string;
  height: string;
  innerHTML: string;
  style: string;
}

interface CanvasResumeEditorProps {
  initialContent: string;
  onChange: (html: string) => void;
  zoom: number;
  onZoomChange: (zoom: number) => void;
}

export default function CanvasResumeEditor({ 
  initialContent, 
  onChange, 
  zoom, 
  onZoomChange 
}: CanvasResumeEditorProps) {
  const [pages, setPages] = useState<ParsedPage[]>([]);
  const [styleSheets, setStyleSheets] = useState<string[]>([]);
  const [activeIframeIdx, setActiveIframeIdx] = useState<number | null>(null);
  
  const iframesRef = useRef<(HTMLIFrameElement | null)[]>([]);
  const isInitializedRef = useRef(false);

  // Parse HTML content into separate pages and styles
  useEffect(() => {
    if (!initialContent) return;

    // Reset initial state when candidate content changes
    isInitializedRef.current = false;
    iframesRef.current = [];

    const parser = new DOMParser();
    const doc = parser.parseFromString(initialContent, "text/html");

    // Extract stylesheets
    const styles: string[] = [];
    doc.querySelectorAll("style").forEach(style => {
      styles.push(style.innerHTML);
    });
    setStyleSheets(styles);

    // Find all page-like divs
    const body = doc.body;
    const childDivs = Array.from(body.children).filter(
      el => el.tagName === "DIV" && (el.id.includes("page") || el.getAttribute("style")?.includes("position"))
    );

    const parsedPages: ParsedPage[] = [];

    if (childDivs.length === 0) {
      // Fallback if no page wrappers
      parsedPages.push({
        id: "page-1",
        width: "892",
        height: "1262",
        innerHTML: body.innerHTML,
        style: "position:relative; width:892px; height:1262px; background:white; margin:0 auto;",
      });
    } else {
      childDivs.forEach((div, idx) => {
        const styleAttr = div.getAttribute("style") || "";
        const width = styleAttr.match(/width:\s*(\d+)px/)?.[1] || "892";
        const height = styleAttr.match(/height:\s*(\d+)px/)?.[1] || "1262";

        // Create editable markup for the iframe content
        const clone = div.cloneNode(true) as HTMLElement;
        const textElements = clone.querySelectorAll("p, span, h1, h2, h3, h4, h5, h6, li, td, div");
        
        textElements.forEach(el => {
          // Only make leaf-like text nodes editable to prevent nested cursor issues
          if (el.children.length === 0 || (el.tagName === "P" && Array.from(el.children).every(c => c.tagName === "SPAN" || c.tagName === "B" || c.tagName === "I"))) {
            el.setAttribute("contenteditable", "true");
            el.setAttribute("spellcheck", "false");
            el.classList.add("editable-text-block");
          }
        });

        parsedPages.push({
          id: div.id || `page-${idx + 1}`,
          width,
          height,
          innerHTML: clone.innerHTML,
          style: styleAttr,
        });
      });
    }

    setPages(parsedPages);
  }, [initialContent]);

  // Write content and load iframes exactly once per change
  useEffect(() => {
    if (pages.length === 0 || isInitializedRef.current) return;

    pages.forEach((page, idx) => {
      const iframe = iframesRef.current[idx];
      if (!iframe) return;

      const setupIframe = () => {
        const doc = iframe.contentDocument;
        if (!doc) return;

        // Construct standard style block including user fonts and pdf styles
        const pageStyles = styleSheets.map(s => `<style>${s}</style>`).join("\n");
        const iframeHtml = `
          <!DOCTYPE html>
          <html>
          <head>
            <meta charset="utf-8">
            ${pageStyles}
            <style>
              html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                overflow: hidden !important;
                background: transparent !important;
                -webkit-print-color-adjust: exact;
                font-smooth: antialiased;
                -webkit-font-smoothing: antialiased;
              }
              
              /* Editable Highlights */
              .editable-text-block {
                outline: none !important;
                cursor: text;
                transition: box-shadow 0.1s ease, background-color 0.1s ease;
              }
              .editable-text-block:hover {
                box-shadow: 0 0 0 1px rgba(59, 130, 246, 0.4) !important;
                background-color: rgba(59, 130, 246, 0.05) !important;
              }
              .editable-text-block:focus {
                box-shadow: 0 0 0 2px #3b82f6 !important;
                background-color: rgba(59, 130, 246, 0.08) !important;
              }
              table {
                border-collapse: collapse;
              }
            </style>
          </head>
          <body>
            <div id="${page.id}" style="${page.style}">
              ${page.innerHTML}
            </div>
          </body>
          </html>
        `;

        doc.open();
        doc.write(iframeHtml);
        doc.close();

        // Listen for user inputs
        doc.addEventListener("input", triggerChange);
        
        // Listen for active selection focus
        doc.addEventListener("focusin", () => {
          setActiveIframeIdx(idx);
        });
        doc.addEventListener("click", () => {
          setActiveIframeIdx(idx);
        });
      };

      if (iframe.contentDocument?.readyState === "complete") {
        setupIframe();
      } else {
        iframe.onload = setupIframe;
      }
    });

    isInitializedRef.current = true;
  }, [pages, styleSheets]);

  // Handle rich text formatting command
  const executeCommand = (command: string, value: string = "") => {
    if (activeIframeIdx !== null) {
      const iframe = iframesRef.current[activeIframeIdx];
      const iframeDoc = iframe?.contentDocument;
      if (iframeDoc) {
        iframeDoc.execCommand(command, false, value);
        triggerChange();
      }
    } else {
      document.execCommand(command, false, value);
    }
  };

  // Collect updated HTML and trigger parent onChange handler
  const triggerChange = () => {
    let bodyHtml = "";
    
    pages.forEach((page, idx) => {
      const iframe = iframesRef.current[idx];
      const iframeDoc = iframe?.contentDocument;
      const pageDiv = iframeDoc?.getElementById(page.id);

      if (pageDiv) {
        // Clone the page div to avoid mutating the live iframe DOM
        const clone = pageDiv.cloneNode(true) as HTMLElement;

        // Strip helper attributes and classes
        clone.querySelectorAll("[contenteditable]").forEach(el => {
          el.removeAttribute("contenteditable");
          el.removeAttribute("spellcheck");
          el.classList.remove("editable-text-block");
        });

        const id = clone.getAttribute("id") || "";
        const style = clone.getAttribute("style") || "";
        bodyHtml += `<div id="${id}" style="${style}">${clone.innerHTML}</div>\n`;
      } else {
        bodyHtml += `<div id="${page.id}" style="${page.style}">${page.innerHTML}</div>\n`;
      }
    });

    // Reconstruct stylesheets
    let styleHtml = "";
    styleSheets.forEach(sheet => {
      styleHtml += `<style>\n${sheet}\n</style>\n`;
    });

    const fullHtml = `<!DOCTYPE html>\n<html>\n<head>\n${styleHtml}</head>\n<body>\n${bodyHtml}</body>\n</html>`;
    onChange(fullHtml);
  };

  const colors = [
    "#000000", "#333333", "#666666", "#999999", 
    "#ef4444", "#f97316", "#f59e0b", "#10b981", 
    "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899"
  ];

  return (
    <div className="flex flex-col h-full bg-gray-150 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden shadow-xs">
      {/* Editor Canvas Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 select-none z-10">
        <div className="flex items-center gap-1.5">
          {/* History Controls */}
          <button
            onClick={() => executeCommand("undo")}
            title="Undo"
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <UndoIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand("redo")}
            title="Redo"
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <RedoIcon className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Format Controls */}
          <button
            onClick={() => executeCommand("bold")}
            title="Bold"
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors font-bold"
          >
            <BoldIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand("italic")}
            title="Italic"
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors italic"
          >
            <ItalicIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => executeCommand("underline")}
            title="Underline"
            className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors underline"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-6 bg-gray-200 dark:bg-gray-700 mx-1" />

          {/* Text Color Selector */}
          <div className="relative group flex items-center">
            <button
              title="Text Color"
              className="p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors flex items-center gap-1"
            >
              <Palette className="w-4 h-4" />
            </button>
            <div className="absolute top-full left-0 mt-1 hidden group-hover:flex flex-wrap gap-1 p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg w-40 z-20">
              {colors.map(color => (
                <button
                  key={color}
                  onClick={() => executeCommand("foreColor", color)}
                  className="w-6 h-6 rounded-full border border-gray-200/50 hover:scale-110 active:scale-95 transition-all shadow-xs"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Zoom controls */}
        <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-700 px-3 py-1.5 rounded-lg">
          <button
            onClick={() => onZoomChange(Math.max(0.5, zoom - 0.1))}
            className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded shadow-xs text-gray-600 dark:text-gray-200"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <span className="text-xs font-semibold w-12 text-center text-gray-700 dark:text-gray-300">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => onZoomChange(Math.min(1.5, zoom + 0.1))}
            className="p-1 hover:bg-white dark:hover:bg-gray-600 rounded shadow-xs text-gray-600 dark:text-gray-200"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Pages Container */}
      <div 
        className="flex-1 overflow-auto p-8 flex flex-col items-center gap-8 bg-gray-100 dark:bg-gray-900"
      >
        {pages.map((page, idx) => (
          <div
            key={page.id}
            style={{
              width: `${Number(page.width) * zoom}px`,
              height: `${Number(page.height) * zoom}px`,
            }}
            className="relative overflow-hidden shadow-2xl border border-gray-200/80 dark:border-gray-800 rounded-xs bg-white shrink-0 transition-all duration-200 ease-out"
          >
            <iframe
              ref={el => { iframesRef.current[idx] = el; }}
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
                width: `${page.width}px`,
                height: `${page.height}px`,
                border: "none",
                position: "absolute",
                top: 0,
                left: 0,
              }}
              title={`Page ${idx + 1}`}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
