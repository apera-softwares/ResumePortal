const fs = require('fs');
const path = './src/utils/pdfToHtmlConverter.ts';
let content = fs.readFileSync(path, 'utf8');

const target1 = `        return \\\`<td style="width:\${colW}%;text-align:\${align};vertical-align:top;border:none;padding:2px 4px;word-break:break-word;"><span class="\${el.className}" style="\${el.style}">\${el.html}</span></td>\\\`;`;
const replace1 = `        return \\\`<td style="width:\${colW}%;text-align:\${align};vertical-align:top;border:none;padding:2px 4px;word-break:break-word;white-space:normal;"><span class="\${el.className}" style="\${el.style};white-space:normal;display:inline;">\${el.html}</span></td>\\\`;`;

content = content.replace(target1, replace1);

const target2 = `      out.push(\\\`<p class="\${el.className}" style="\${el.style};\${alignStyle}margin-bottom:5px;">\${el.html}</p>\\\`);`;
const replace2 = `      out.push(\\\`<p class="\${el.className}" style="\${el.style};\${alignStyle}margin-bottom:5px;white-space:normal;">\${el.html}</p>\\\`);`;

content = content.replace(target2, replace2);

const target3 = `      const content = line.map(e => \\\`<span class="\${e.className}" style="\${e.style}">\${stripLeadingBullet(e.html)}</span>\\\`).join(" ");`;
const replace3 = `      const content = line.map(e => \\\`<span class="\${e.className}" style="\${e.style};white-space:normal;display:inline;">\${stripLeadingBullet(e.html)}</span>\\\`).join(" ");`;

content = content.replace(target3, replace3);

fs.writeFileSync(path, content);
console.log("Patched block building inline styles");
