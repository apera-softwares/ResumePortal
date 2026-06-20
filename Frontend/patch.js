const fs = require('fs');
const path = './src/utils/pdfToHtmlConverter.ts';
let content = fs.readFileSync(path, 'utf8');

// The DOMParser is browser-only. In Next.js, this runs on the server sometimes.
// We must add a fallback or check for window.DOMParser.

const domParserTarget = `  /* ── 2. Parse DOM ── */
  const domParser = new DOMParser();
  const doc = domParser.parseFromString(htmlStr, "text/html");`;

const domParserReplacement = `  /* ── 2. Parse DOM (Browser vs Server Safe) ── */
  let doc;
  if (typeof window !== "undefined" && window.DOMParser) {
    const domParser = new DOMParser();
    doc = domParser.parseFromString(htmlStr, "text/html");
  } else {
    // If running on the server, we just return the string since we can't parse it
    // Alternatively, rely on JSDOM if you have it installed, but NextJS doesn't by default.
    return htmlStr;
  }`;

content = content.replace(domParserTarget, domParserReplacement);

// We also need to fix the backslash escaping that happened in the previous node patch
content = content.replace(/\\\`<img src="\\\${cleanSrc}/g, '\`<img src="\${cleanSrc}');
content = content.replace(/\\\`<img src="\\\${src}/g, '\`<img src="\${src}');

// Just a more generic cleanup of backslash issues
content = content.replace(/\\\`/g, '\`');

fs.writeFileSync(path, content);
console.log("Patched successfully");
