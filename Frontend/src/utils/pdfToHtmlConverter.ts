/*
 * pdfToHtmlConverter.ts
 * -------------------------------------------------
 * 1. `parsePlainTextToHtml` – plain-text → minimal HTML
 * 2. `cleanPdftohtmlForEditor` – pdftohtml raw HTML → clean flow HTML
 *
 * Key design goals for cleanPdftohtmlForEditor:
 *   ✅ Preserve background images (dark sidebars, decorative graphics)
 *   ✅ Preserve content images (profile photos, icons)
 *   ✅ Preserve original CSS colors, font sizes, background-colors
 *   ✅ Preserve horizontal divider lines (HR elements)
 *   ✅ Remove only absolute positioning – keep everything else
 *   ✅ Group elements into headings / paragraphs / tables / lists
 *   ✅ Wrap each PDF page in a .resume-page div
 */

/* ─── plain-text converter (unchanged) ─────────────────────────────────── */

export function parsePlainTextToHtml(text: string): string {
  if (!text) return "";
  const lines = text.split(/\r?\n/);
  let html = "";
  let listType: "bullet" | "ordered" | null = null;

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      if (listType === "bullet") { html += "</ul>"; listType = null; }
      else if (listType === "ordered") { html += "</ol>"; listType = null; }
      html += "<p><br></p>";
      continue;
    }
    const isFooter = /^--\s*\d+\s*of\s*\d+\s*--$/i.test(trimmed) || /^page\s*\d+/i.test(trimmed);
    if (isFooter) continue;

    const bulletMatch = trimmed.match(/^[•*\-\u2022]\s*(.*)/);
    const numberMatch = trimmed.match(/^(\d+)[.)]\s*(.*)/);

    if (bulletMatch) {
      if (listType === "ordered") { html += "</ol>"; listType = null; }
      if (!listType) { html += "<ul>"; listType = "bullet"; }
      html += `<li>${bulletMatch[1]}</li>`;
    } else if (numberMatch) {
      if (listType === "bullet") { html += "</ul>"; listType = null; }
      if (!listType) { html += "<ol>"; listType = "ordered"; }
      html += `<li>${numberMatch[2]}</li>`;
    } else {
      if (listType === "bullet") { html += "</ul>"; listType = null; }
      else if (listType === "ordered") { html += "</ol>"; listType = null; }
      const isHeader = trimmed.length < 50 &&
        /^(Career Summary|Education|Skills|Experience|Projects|Certifications|Professional Experience|Work Experience|Summary of Qualifications)$/i.test(trimmed);
      html += isHeader ? `<h3>${trimmed}</h3>` : `<p>${trimmed}</p>`;
    }
  }
  if (listType === "bullet") html += "</ul>";
  else if (listType === "ordered") html += "</ol>";
  return html;
}

/* ─── CSS layout props to strip from text elements (keep visual props) ─── */
// NOTE: width/height intentionally NOT stripped so image/div dimensions survive.
const LAYOUT_KEYS = new Set([
  "position", "top", "left", "right", "bottom", "z-index",
  "white-space", "overflow",
  "margin", "margin-top", "margin-bottom", "margin-left", "margin-right"
]);

// For text elements only: also strip width/height (they were absolute-px coords)
const LAYOUT_KEYS_TEXT = new Set([
  "position", "top", "left", "right", "bottom", "z-index",
  "white-space", "overflow",
  "margin", "margin-top", "margin-bottom", "margin-left", "margin-right"
]);

/** Strip only layout/positioning props from an inline style string. */
function cleanInlineStyle(styleAttr: string, keepDimensions = false): string {
  const keys = keepDimensions ? LAYOUT_KEYS : LAYOUT_KEYS_TEXT;
  return styleAttr
    .split(";")
    .map(s => s.trim())
    .filter(s => {
      const k = s.split(":")[0].trim().toLowerCase();
      return s && !keys.has(k);
    })
    .join("; ");
}

/** Strip a leading bullet character even when wrapped inside HTML tags. */
function stripLeadingBullet(html: string): string {
  return html.replace(
    /^((?:<[^>]+>\s*)*)[•\-\▪\■\●\○\♦\·\*\u2022\u00b7\u25aa\u25a0\u25cf\u25cb\u25c6]\s*/,
    "$1"
  );
}

function startsWithBullet(plain: string): boolean {
  return /^[•\-\▪\■\●\○\♦\·\*\u2022\u00b7\u25aa\u25a0\u25cf\u25cb\u25c6]/.test(plain.trim());
}

function repairNestedTables(doc: Document) {
  // Find all tables that are nested inside another table
  const tables = Array.from(doc.querySelectorAll("table table"));
  for (const table of tables) {
    const rows = Array.from(table.querySelectorAll("tr"));
    if (rows.length === 0) continue;
    
    const replacements: HTMLElement[] = [];
    for (const row of rows) {
      const tds = Array.from(row.querySelectorAll("td"));
      if (tds.length === 0) continue;
      
      const cellContents = tds.map((td, i) => {
        const html = td.innerHTML.trim();
        const style = td.getAttribute("style") || "";
        const isDate = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current|\d{4})/i.test(html);
        const align = style.includes("text-align: right") || (isDate && i === tds.length - 1) ? "right" : "left";
        const alignStyle = align === "right" ? "margin-left: auto;" : "";
        return { html, alignStyle };
      });
      
      const flexDiv = doc.createElement("div");
      flexDiv.setAttribute("style", "display: flex; flex-direction: row; justify-content: space-between; align-items: baseline; width: 100%; margin: 2px 0;");
      
      for (const cell of cellContents) {
        if (!cell.html) continue;
        const p = doc.createElement("p");
        p.setAttribute("style", `${cell.alignStyle} margin: 0 !important; display: inline-block;`);
        p.innerHTML = cell.html;
        flexDiv.appendChild(p);
      }
      replacements.push(flexDiv);
    }
    
    if (table.parentNode) {
      const parent = table.parentNode;
      for (const replacement of replacements) {
        parent.insertBefore(replacement, table);
      }
      parent.removeChild(table);
    }
  }
}

/* ─── main export ────────────────────────────────────────────────────────── */

export function cleanPdftohtmlForEditor(htmlStr: string): string {
  if (!htmlStr) return "";

  // Replace white-space:nowrap globally so text can wrap in the editor.
  htmlStr = htmlStr.replace(/white-space:\s*nowrap/gi, "white-space: normal");

  let doc: Document;
  if (typeof window !== "undefined" && window.DOMParser) {
    const domParser = new DOMParser();
    doc = domParser.parseFromString(htmlStr, "text/html");
  } else {
    return htmlStr;
  }

  // If there is no absolute positioning, the HTML is already in flow layout.
  // Run repair to fix any previously saved broken nested tables.
  if (!/position\s*:\s*absolute/i.test(htmlStr)) {
    repairNestedTables(doc);
    return doc.body.innerHTML;
  }

  /* ── 1. Extract CSS class → visual style map ── */
  const styleMap: Record<string, {
    bold: boolean;
    fontSize: number;
    color: string;
    background: string;
    rawStyles: string;  // all non-layout properties
  }> = {};

  const styleBlockRegex = /<style[^>]*>([\s\S]*?)<\/style>/gi;
  let styleBlock: RegExpExecArray | null;
  while ((styleBlock = styleBlockRegex.exec(htmlStr)) !== null) {
    const cssText = styleBlock[1];
    const ruleRegex = /\.([\w-]+)\s*\{([^}]+)\}/g;
    let rule: RegExpExecArray | null;
    while ((rule = ruleRegex.exec(cssText)) !== null) {
      const cls = rule[1];
      const body = rule[2];

      const rawStyles = body
        .split(";")
        .map(s => s.trim())
        .filter(s => {
          const k = s.split(":")[0].trim().toLowerCase();
          return s && !LAYOUT_KEYS_TEXT.has(k);
        })
        .join("; ");

      styleMap[cls] = {
        bold: /bold|700|800|900|SemiBold|ExtraBold/i.test(body),
        fontSize: parseInt(body.match(/font-size:\s*(\d+)px/)?.[1] ?? "14", 10),
        color: body.match(/(?:^|;)\s*color:\s*([^;]+)/)?.[1]?.trim() ?? "",
        background: body.match(/background(?:-color)?:\s*([^;]+)/)?.[1]?.trim() ?? "",
        rawStyles,
      };
    }
  }

  /* ── 2. Parse DOM (Browser vs Server Safe) ── */
  // 'doc' was already parsed at the top of cleanPdftohtmlForEditor.

  /* ── 3. Find page containers ── */
  let pageEls = Array.from(doc.querySelectorAll('div[id$="-div"], .pf, .resume-page'));
  if (pageEls.length === 0) {
    const mock = doc.createElement("div");
    mock.className = "resume-page";
    mock.innerHTML = doc.body.innerHTML;
    pageEls = [mock];
  }

  return pageEls
    .map((pageEl, idx) => processPage(pageEl as HTMLElement, idx, styleMap))
    .filter(Boolean)
    .join("\n");
}

/* ─── per-page processing ────────────────────────────────────────────────── */

function processPage(
  pageEl: HTMLElement,
  pageIdx: number,
  styleMap: Record<string, { bold: boolean; fontSize: number; color: string; background: string; rawStyles: string }>
): string {
  const pageStyleAttr = pageEl.getAttribute("style") ?? "";
  const pageWidth = parseInt(pageStyleAttr.match(/width:\s*(\d+)px/i)?.[1] ?? "900", 10);

  /* ── Separate background images from content images ──
   * A "background" image covers most of the page (width > 60% of page width)
   * and is positioned at the very top-left (top ≤ 5, left ≤ 5).
   * Everything else is a content image (profile photo, icon, etc.)
   */
  const allImgs = Array.from(pageEl.querySelectorAll("img"));
  let bgImgHtml = "";
  const contentImages: Array<{ top: number; left: number; html: string }> = [];

  allImgs.forEach(img => {
    const s = img.getAttribute("style") ?? "";
    const altAttr = (img.getAttribute("alt") ?? "").toLowerCase();

    const imgTop = parseInt(s.match(/top:\s*(\d+)px/)?.[1] ?? img.getAttribute("y") ?? "999", 10);
    const imgLeft = parseInt(s.match(/left:\s*(\d+)px/)?.[1] ?? img.getAttribute("x") ?? "999", 10);
    
    const imgWStyle = parseInt(s.match(/width:\s*(\d+)px/)?.[1] ?? "0", 10);
    const imgHStyle = parseInt(s.match(/height:\s*(\d+)px/)?.[1] ?? "0", 10);
    const imgWAttr = parseInt(img.getAttribute("width") ?? "0", 10);
    const imgHAttr = parseInt(img.getAttribute("height") ?? "0", 10);
    
    const imgW = imgWStyle || imgWAttr;
    const imgH = imgHStyle || imgHAttr;

    // If image covers most of the page width and starts at the top-left → backdrop
    // Or if pdftohtml explicitly marks it with alt="background"
    const isBackdrop = altAttr.includes("background") || (imgTop <= 10 && imgLeft <= 10 && imgW >= pageWidth * 0.55);
    
    if (isBackdrop) {
      const cleanSrc = img.getAttribute("src") ?? "";
      const cleanAlt = img.getAttribute("alt") ?? "";
      bgImgHtml = `<img class="page-background-img" src="${cleanSrc}" alt="${cleanAlt}" width="${imgW || ""}" height="${imgH || ""}" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:fill;z-index:0;pointer-events:none;" />`;
    } else {
      // Content image: preserve original dimensions & src — these are profile photos, icons, etc.
      const src = img.getAttribute("src") ?? "";
      const alt = img.getAttribute("alt") ?? "";
      const className = img.className || "";
      const originalStyle = cleanInlineStyle(s, true); // keepDimensions=true
      const w = imgW || 80;
      const h = imgH || 80;

      // If image is roughly square (aspect ratio 0.7–1.3), treat as a profile/avatar photo
      const isSquare = w > 0 && h > 0 && Math.abs(w / h - 1) < 0.35;
      const avatarStyle = isSquare
        ? `border-radius:50%;object-fit:cover;width:${w}px;height:${h}px;display:inline-block;vertical-align:middle;margin:4px 8px 4px 0;`
        : `display:inline-block;max-width:100%;object-fit:contain;vertical-align:middle;margin:4px 0;width:${w}px;height:${h}px;`;

      contentImages.push({
        top: imgTop,
        left: imgLeft,
        html: `<img class="${className}" src="${src}" alt="${alt}" width="${w}" height="${h}" style="${avatarStyle}${originalStyle}" />`,
      });
    }
  });

  /* ── Preserve page-level background color / gradient / dimensions ──
   * pdftohtml sometimes puts the dark sidebar as a background-color/image
   * on the page div itself. We capture it and apply to our wrapper.
   */
  const pageBgStyle = pageStyleAttr
    .split(";")
    .map(s => s.trim())
    .filter(s => {
      const k = s.split(":")[0].trim().toLowerCase();
      return s && (k === "background" || k === "background-color" || k === "background-image" || k === "width" || k === "height");
    })
    .map(s => {
      const parts = s.split(":");
      const k = parts[0].trim().toLowerCase();
      if (k === "height") {
        return `min-height: ${parts[1].trim()}`;
      }
      return s;
    })
    .join("; ");

  /* ── Extract all <p> and <hr> elements ── */
  type El = {
    top: number; left: number; html: string; plainText: string;
    fontSize: number; isBold: boolean; className: string; style: string;
    isHr: boolean;
  };
  const elements: El[] = [];

  pageEl.querySelectorAll("p, hr").forEach(el => {
    const s = el.getAttribute("style") ?? "";
    const cls = el.className ?? "";
    const isHr = el.tagName.toLowerCase() === "hr";
    const top = parseInt(s.match(/top:\s*(\d+)px/)?.[1] ?? "0", 10);
    const left = parseInt(s.match(/left:\s*(\d+)px/)?.[1] ?? "0", 10);

    if (isHr) {
      const hrColor = s.match(/(?:color|border-color):\s*([^;]+)/)?.[1]?.trim() ?? "";
      const hrStyle = hrColor ? `border-color:${hrColor};` : "";
      elements.push({ top, left, html: "<hr />", plainText: "", fontSize: 0, isBold: false, className: "", style: hrStyle, isHr: true });
      return;
    }

    const rawHtml = (el as HTMLElement).innerHTML.trim();
    if (!rawHtml) return;
    const plain = rawHtml.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]*>/g, "").trim();
    const normalised = plain.replace(/&(nbsp|#160|ensp|emsp|thinsp);/gi, "").replace(/\s+/g, "").trim();
    if (!normalised) return;

    const decodedPlain = plain.replace(/&(nbsp|#160|ensp|emsp|thinsp);/gi, " ").replace(/[^\S\r\n]+/g, " ").trim();

    const clsInfo = styleMap[cls] ?? { bold: false, fontSize: 14, color: "", background: "", rawStyles: "" };
    const isBold = clsInfo.bold || rawHtml.includes("<b>") || rawHtml.includes("<strong>") ||
                   /font-weight:\s*(bold|700|800|900)/i.test(s);

    // Combine inline style + class rawStyles, strip layout props
    const baseStyle = cleanInlineStyle(s, false);
    let combined = [baseStyle, clsInfo.rawStyles].filter(Boolean).join("; ");

    // Auto-detect white text with no background and style as a premium badge
    const hasWhiteColor = /(?:^|;)\s*color:\s*(?:#ffffff|#fff|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/i.test(combined);
    const hasBgColor = /(?:^|;)\s*background(?:-color)?:\s*/i.test(combined);
    
    let htmlContent = rawHtml;
    if (hasWhiteColor && !hasBgColor && !startsWithBullet(decodedPlain)) {
      // Render as a styled skill chip/badge that closely matches the template's appearance
      const badgeStyle = [
        "display:inline-block",
        "background-color:#334155",
        "color:#f8fafc",
        "padding:3px 10px",
        "border-radius:20px",
        "font-size:12px",
        "font-weight:600",
        "letter-spacing:0.02em",
        "margin:3px 4px 3px 0",
        "line-height:1.6",
        "vertical-align:middle",
        "text-shadow:none",
        "border:1px solid #475569"
      ].join(";");
      htmlContent = `<span style="${badgeStyle}">${rawHtml}</span>`;
      // Strip the original white color from the parent container style
      combined = combined.replace(/(?:^|;)\s*color:\s*(?:#ffffff|#fff|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))/gi, "");
    }

    elements.push({ top, left, html: htmlContent, plainText: decodedPlain, fontSize: clsInfo.fontSize, isBold, className: cls, style: combined, isHr: false });
  });

  // Also insert content images as pseudo-elements so they appear in reading order
  contentImages.forEach(img => {
    elements.push({
      top: img.top, left: img.left,
      html: img.html, plainText: "[image]",
      fontSize: 0, isBold: false, className: "", style: "",
      isHr: false,
    });
  });

  if (elements.length === 0) return "";

  /* ── Sort by top, then left ── */
  elements.sort((a, b) => a.top !== b.top ? a.top - b.top : a.left - b.left);

  /* ── Group into horizontal lines (±8 px vertical tolerance) ── */
  const rawLines: El[][] = [];
  let cur: El[] = [];
  for (const el of elements) {
    if (!cur.length || Math.abs(el.top - cur[0].top) <= 8) {
      cur.push(el);
    } else {
      rawLines.push(cur);
      cur = [el];
    }
  }
  if (cur.length) rawLines.push(cur);

  /* ── Merge horizontally close elements in each line ── */
  const lines: El[][] = rawLines.map(line => {
    line.sort((a, b) => a.left - b.left);
    const merged: El[] = [];
    for (const el of line) {
      if (!merged.length) { merged.push({ ...el }); continue; }
      const prev = merged[merged.length - 1];
      if (prev.isHr || el.isHr || el.plainText === "[image]" || prev.plainText === "[image]") {
        merged.push({ ...el });
        continue;
      }
      const avgCharW = Math.max(5, prev.fontSize * 0.5);
      const prevRight = prev.left + prev.plainText.length * avgCharW;
      const gap = el.left - prevRight;
      const crossesSplit = prev.left < pageWidth * 0.35 && el.left > pageWidth * 0.45;

      if (gap <= 150 && !crossesSplit) {
        prev.html += " " + el.html;
        prev.plainText += " " + el.plainText;
        prev.fontSize = Math.max(prev.fontSize, el.fontSize);
        prev.isBold = prev.isBold || el.isBold;
      } else {
        merged.push({ ...el });
      }
    }
    return merged;
  });

  /* ── Merge isolated bullet lines into the next line's first element ── */
  const finalLines: El[][] = [];
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    // If the line consists of exactly one element that is a bullet character
    if (line.length === 1 && startsWithBullet(line[0].plainText)) {
      const bulletEl = line[0];
      // Check if there is a next line to merge into
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1];
        // Ensure the next line is close vertically (e.g. within 38px)
        const verticalGap = nextLine[0].top - bulletEl.top;
        if (verticalGap > 0 && verticalGap <= 38) {
          // Merge bullet into the first element of the next line
          const targetEl = nextLine[0];
          targetEl.plainText = bulletEl.plainText + " " + targetEl.plainText;
          targetEl.html = bulletEl.html + " " + targetEl.html;
          // Set the coordinates to the bullet's start
          targetEl.top = bulletEl.top;
          targetEl.left = bulletEl.left;
          continue; // Skip pushing this bullet line; it's now merged!
        }
      }
    }
    finalLines.push(line);
  }
  const processedLines = finalLines;

  /* ── Score-based 2-column detection ── */
  let firstDualTop = -1;

  for (const line of processedLines) {
    if (line.length > 1) {
      const isRightColumn = line.some(e => !e.isHr && e.left >= pageWidth * 0.45);
      if (isRightColumn) {
        const candidateTop = line[0].top;
        const bodyLines = processedLines.filter(l => l[0].top >= candidateTop - 8);
        
        let tempDualColRows = 0;
        for (const bl of bodyLines) {
          const hasLeft = bl.some(e => !e.isHr && e.left < pageWidth * 0.35);
          const hasRight = bl.some(e => !e.isHr && e.left > pageWidth * 0.45);
          if (hasLeft && hasRight) {
            tempDualColRows++;
          }
        }
        
        const tempHasCrossing = bodyLines.some(bl => {
          return bl.some(e => {
            if (e.isHr || e.plainText === "[image]") return false;
            const avgCharW = Math.max(5, e.fontSize * 0.5);
            const subLines = e.plainText.split('\n');
            const maxLineLen = Math.max(...subLines.map(l => l.trim().length));
            const estW = maxLineLen * avgCharW;
            return e.left < pageWidth * 0.35 && e.left + estW > pageWidth * 0.55;
          });
        });
        
        const leftTops = bodyLines
          .filter(bl => bl.some(e => !e.isHr && e.left < pageWidth * 0.45))
          .map(bl => bl[0].top);
        const rightTops = bodyLines
          .filter(bl => bl.some(e => !e.isHr && e.left >= pageWidth * 0.45))
          .map(bl => bl[0].top);
          
        const tempLeftSpan = leftTops.length > 0 ? Math.max(...leftTops) - Math.min(...leftTops) : 0;
        const tempRightSpan = rightTops.length > 0 ? Math.max(...rightTops) - Math.min(...rightTops) : 0;
        
        if (tempDualColRows >= 4 && !tempHasCrossing && tempLeftSpan >= 300 && tempRightSpan >= 300) {
          firstDualTop = candidateTop;
          break;
        }
      }
    }
  }

  const isTwoCol = firstDualTop !== -1;

  /* ── Build output blocks ── */
  let blocks: string[];
  if (isTwoCol) {
    // 1. Separate header lines from body lines
    const headerLines = processedLines.filter(l => l[0].top < firstDualTop - 8);
    const bodyLines = processedLines.filter(l => l[0].top >= firstDualTop - 8);
    
    // 2. Gather body elements from original elements list and partition by horizontal coordinate
    const bodyElements = elements.filter(e => e.top >= firstDualTop - 8);
    const leftThreshold = pageWidth * 0.45;
    
    const leftElements = bodyElements.filter(e => e.isHr || e.left < leftThreshold);
    const rightElements = bodyElements.filter(e => !e.isHr && e.left >= leftThreshold);
    
    // Helper to group elements into lines, merge horizontally, and merge bullet items
    const reconstructLines = (els: typeof elements) => {
      if (els.length === 0) return [];
      const sortedEls = [...els].sort((a, b) => a.top !== b.top ? a.top - b.top : a.left - b.left);
      
      const raw: typeof els[] = [];
      let currentLine: typeof els = [];
      for (const el of sortedEls) {
        if (!currentLine.length || Math.abs(el.top - currentLine[0].top) <= 8) {
          currentLine.push(el);
        } else {
          raw.push(currentLine);
          currentLine = [el];
        }
      }
      if (currentLine.length) raw.push(currentLine);
      
      const mergedLines = raw.map(line => {
        line.sort((a, b) => a.left - b.left);
        const merged: typeof els = [];
        for (const el of line) {
          if (!merged.length) { merged.push({ ...el }); continue; }
          const prev = merged[merged.length - 1];
          if (prev.isHr || el.isHr || el.plainText === "[image]" || prev.plainText === "[image]") {
            merged.push({ ...el });
            continue;
          }
          const avgCharW = Math.max(5, prev.fontSize * 0.5);
          const prevRight = prev.left + prev.plainText.length * avgCharW;
          const gap = el.left - prevRight;
          
          if (gap <= 150) {
            prev.html += " " + el.html;
            prev.plainText += " " + el.plainText;
            prev.fontSize = Math.max(prev.fontSize, el.fontSize);
            prev.isBold = prev.isBold || el.isBold;
          } else {
            merged.push({ ...el });
          }
        }
        return merged;
      });

      const finalColLines: typeof els[] = [];
      for (let i = 0; i < mergedLines.length; i++) {
        const line = mergedLines[i];
        if (line.length === 1 && startsWithBullet(line[0].plainText)) {
          const bulletEl = line[0];
          if (i + 1 < mergedLines.length) {
            const nextLine = mergedLines[i + 1];
            const verticalGap = nextLine[0].top - bulletEl.top;
            if (verticalGap > 0 && verticalGap <= 38) {
              const targetEl = nextLine[0];
              targetEl.plainText = bulletEl.plainText + " " + targetEl.plainText;
              targetEl.html = bulletEl.html + " " + targetEl.html;
              targetEl.top = bulletEl.top;
              targetEl.left = bulletEl.left;
              continue;
            }
          }
        }
        finalColLines.push(line);
      }
      return finalColLines;
    };

    const leftLines = reconstructLines(leftElements);
    const rightLines = reconstructLines(rightElements);

    // 3. Determine actual split point width based on right-side items
    const rightMinLeft = rightElements.length > 0 
      ? Math.min(...rightElements.map(e => e.left).filter(e => e !== undefined), pageWidth * 0.5)
      : pageWidth * 0.5;
    const leftColW = rightMinLeft - 10;
    const leftPct = Math.round((leftColW / pageWidth) * 100);

    const headerBlocks = buildBlocks(headerLines, pageWidth);
    const lastHeaderLine = headerLines[headerLines.length - 1];
    const initialTop = lastHeaderLine ? lastHeaderLine[0].top : 0;
    const initialFs = lastHeaderLine ? Math.max(...lastHeaderLine.map(e => e.fontSize)) : 14;

    blocks = [
      ...headerBlocks,
      `<table style="width:100%;border-collapse:collapse;border:none;table-layout:fixed;" border="0"><tbody><tr>` +
        `<td style="width:${leftPct}%;vertical-align:top;border:none;padding:0 18px 0 0;">` +
        buildBlocks(leftLines, leftColW, initialTop, initialFs).join("") +
        `</td><td style="width:${100 - leftPct}%;vertical-align:top;border:none;padding:0 0 0 18px;">` +
        buildBlocks(rightLines, pageWidth - leftColW, initialTop, initialFs).join("") +
        `</td></tr></tbody></table>`,
    ];
  } else {
    blocks = buildBlocks(processedLines, pageWidth);
  }

  // Page wrapper: carry page background-color if present
  const wrapperStyle = pageBgStyle ? `style="${pageBgStyle}"` : "";
  return (
    `<div class="resume-page ${bgImgHtml ? 'has-bg-img' : ''}" id="page${pageIdx + 1}-div" ${wrapperStyle}>\n` +
    bgImgHtml + "\n" +
    blocks.join("\n") +
    "\n</div>"
  );
}

/* ─── semantic block builder ─────────────────────────────────────────────── */

function buildBlocks(
  lines: Array<Array<{
    top: number; left: number; html: string; plainText: string;
    fontSize: number; isBold: boolean; className: string; style: string; isHr: boolean;
  }>>,
  colWidth: number,
  initialPrevTop?: number,
  initialPrevFontSize?: number
): string[] {
  const out: string[] = [];
  let listOpen = false;
  let pendingRows: typeof lines[0][] = [];

  let prevTop = initialPrevTop;
  let prevFontSize = initialPrevFontSize;

  const getMarginStyle = (currentTop: number, currentFontSize: number): string => {
    if (prevTop === undefined) {
      // First element — do NOT use its absolute PDF top as margin.
      // That would push everything ~150px down. Just record and return nothing.
      prevTop = currentTop;
      prevFontSize = currentFontSize;
      return "";
    }
    // Gap between bottom of previous line and top of current line.
    const prevHeight = (prevFontSize || 14) * 1.4; // approximate line height
    const gap = currentTop - prevTop - prevHeight;
    prevTop = currentTop;
    prevFontSize = currentFontSize;
    // Only emit margin when there is a genuine visual gap (>4px) between sections.
    // Cap at 36px so a single large gap doesn't balloon the layout.
    if (gap > 4) return `margin-top:${Math.min(Math.round(gap), 36)}px;`;
    return "";
  };

  const flushTable = () => {
    if (!pendingRows.length) return;
    const rows = pendingRows.map(row => {
      if (row.length === 1) {
        const el = row[0];
        return `<p class="${el.className}" style="${el.style}; margin-bottom: 2px; position:relative; z-index:1;">${el.html}</p>`;
      }
      const cells = row.map((el, i) => {
        const isDate = /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec|Present|Current|\d{4})/i.test(el.html);
        const align = i === row.length - 1 && isDate ? "right" : "left";
        const alignStyle = align === "right" ? "margin-left: auto;" : "";
        return `<p class="${el.className}" style="${el.style}; ${alignStyle} margin: 0 !important; display: inline-block;">${el.html}</p>`;
      });
      return `<div style="display: flex; flex-direction: row; justify-content: space-between; align-items: baseline; width: 100%; margin: 2px 0; position:relative; z-index:1;">${cells.join("")}</div>`;
    });
    out.push(...rows);
    pendingRows = [];
  };

  const closeList = () => { if (listOpen) { out.push("</ul>"); listOpen = false; } };

  for (const line of lines) {
    const plain = line.map(e => e.plainText).join(" ").trim();
    const maxFs = Math.max(...line.map(e => e.fontSize));
    const hasHr = line.some(e => e.isHr);
    const isImage = line.length === 1 && line[0].plainText === "[image]";
    const isBulletLine = !isImage && line.some(e => startsWithBullet(e.plainText));

    const currentTop = line[0].top;
    const marginStyle = getMarginStyle(currentTop, maxFs);

    /* HR */
    if (hasHr) {
      flushTable(); closeList();
      const hrStyle = [line[0].style, marginStyle, "position:relative; z-index:1;"].filter(Boolean).join("; ");
      out.push(`<hr style="${hrStyle}" />`);
      continue;
    }

    /* Inline image (profile photo, icon) */
    if (isImage) {
      flushTable(); closeList();
      out.push(`<div style="margin:6px 0;position:relative;z-index:1;${marginStyle}">${line[0].html}</div>`);
      continue;
    }

    /* Bullet list item */
    if (isBulletLine) {
      flushTable();
      if (!listOpen) { 
        out.push(`<ul style="margin:4px 0;padding-left:22px;position:relative;z-index:1;${marginStyle}">`); 
        listOpen = true; 
      }
      const content = line.map(e => `<span class="${e.className}" style="${e.style}">${stripLeadingBullet(e.html)}</span>`).join(" ");
      out.push(`  <li style="margin-bottom:2px;">${content}</li>`);
      continue;
    }

    /* Heading */
    const isHeading = maxFs > 18 ||
      (line.length === 1 && line[0].isBold && plain === plain.toUpperCase() && plain.length < 60 && plain.length > 1);

    closeList();

    if (isHeading) {
      flushTable();
      const el = line[0];
      const level = maxFs > 24 ? 2 : 3;
      const align = detectAlign(el, colWidth);
      const alignStyle = align !== "left" ? `text-align:${align};` : "";
      const combinedStyle = [el.style, alignStyle, marginStyle, "margin-bottom:5px;position:relative;z-index:1;"].filter(Boolean).join("; ");
      out.push(`<h${level} class="${el.className}" style="${combinedStyle}">${el.html}</h${level}>`);
      continue;
    }

    /* Single paragraph */
    if (line.length === 1) {
      const el = line[0];
      // Table continuation: short, left-aligned, while a table is building
      if (pendingRows.length > 0 && el.plainText.length <= 70 && el.left < colWidth * 0.25 && !isHeading) {
        pendingRows.push(line);
        continue;
      }
      flushTable();
      const align = detectAlign(el, colWidth);
      const alignStyle = align !== "left" ? `text-align:${align};` : "";
      const combinedStyle = [el.style, alignStyle, marginStyle, "margin-bottom:5px;position:relative;z-index:1;"].filter(Boolean).join("; ");
      out.push(`<p class="${el.className}" style="${combinedStyle}">${el.html}</p>`);
      continue;
    }

    /* Multi-column row → layout table */
    if (pendingRows.length === 0) {
      line[0].style = [line[0].style, marginStyle].filter(Boolean).join("; ");
    }
    pendingRows.push(line);
  }

  flushTable();
  closeList();
  return out;
}

function detectAlign(
  el: { left: number; plainText: string; fontSize: number },
  colWidth: number
): "left" | "center" | "right" {
  const charW = Math.max(5, el.fontSize * 0.5);
  const textW = el.plainText.length * charW;
  const center = el.left + textW / 2;
  if (Math.abs(center - colWidth / 2) < 60) return "center";
  if (el.left > colWidth * 0.6) return "right";
  return "left";
}
