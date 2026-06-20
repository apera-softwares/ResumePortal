const fs = require('fs');
const path = './src/utils/pdfToHtmlConverter.ts';
let content = fs.readFileSync(path, 'utf8');

const target1 = `        return \\\`<td style="width:\${colW}%;text-align:\${align};vertical-align:top;border:none;padding:2px 4px;word-break:break-word;white-space:normal;"><span class="\${el.className}" style="\${el.style};white-space:normal;display:inline;">\${el.html}</span></td>\\\`;`;
const replace1 = `        return \\\`<td style="width:\${colW}%;text-align:\${align};vertical-align:top;border:none;padding:2px 4px;word-break:break-word;white-space:normal;"><div class="\${el.className}" style="\${el.style};white-space:normal;display:block;">\${el.html}</div></td>\\\`;`;

content = content.replace(target1, replace1);

const target3 = `      const content = line.map(e => \\\`<span class="\${e.className}" style="\${e.style};white-space:normal;display:inline;">\${stripLeadingBullet(e.html)}</span>\\\`).join(" ");`;
const replace3 = `      const content = line.map(e => \\\`<span class="\${e.className}" style="\${e.style};white-space:normal;display:inline-block;">\${stripLeadingBullet(e.html)}</span>\\\`).join(" ");`;

content = content.replace(target3, replace3);

fs.writeFileSync(path, content);
console.log("Patched divs instead of spans");
