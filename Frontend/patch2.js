const fs = require('fs');
const path = './src/components/UsersModels/resumeEditModel/CanvasResumeEditor.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldCSS = `.ProseMirror {
              outline: none !important;
              min-height: 900px;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11pt;
              line-height: 1.35;
            }`;

const newCSS = `.ProseMirror {
              outline: none !important;
              min-height: 900px;
              font-family: Arial, Helvetica, sans-serif;
              font-size: 11pt;
              line-height: 1.5 !important;
              overflow-wrap: break-word !important;
              word-wrap: break-word !important;
              word-break: break-word !important;
              white-space: pre-wrap !important;
            }
            .ProseMirror * {
              overflow-wrap: break-word !important;
              word-wrap: break-word !important;
              word-break: break-word !important;
            }
            .ProseMirror span, .ProseMirror p {
              white-space: pre-wrap !important;
              max-width: 100% !important;
              display: inline-block;
            }`;

content = content.replace(oldCSS, newCSS);
fs.writeFileSync(path, content);
console.log("Patched css successfully");
