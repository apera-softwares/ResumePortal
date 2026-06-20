const fs = require('fs');
const path = './src/components/UsersModels/resumeEditModel/CanvasResumeEditor.tsx';
let content = fs.readFileSync(path, 'utf8');

const target = `            .ProseMirror span, .ProseMirror p {
              white-space: pre-wrap !important;
              max-width: 100% !important;
              display: inline-block;
            }`;

const replacement = `            .ProseMirror span, .ProseMirror p {
              white-space: normal !important;
              max-width: 100% !important;
              display: inline;
            }`;

content = content.replace(target, replacement);
fs.writeFileSync(path, content);
console.log("Patched css inline successfully");
