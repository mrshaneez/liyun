# Liyun — ލިޔުން

A PDF toolbox that works in Dhivehi. Everything runs in the browser, and files are never uploaded.

- **Edit & fill PDF**: type Thaana (phonetic keyboard) or English anywhere on the page. Also: ✓/✗ marks, whiteout, a pen, images, and filling real form fields.
- **Sign PDF**: draw a signature or upload a photo of one (the white background is removed automatically).
- **Merge, Split, Organize, Rotate, Page numbers (ސަފުހާ 1), Watermark, JPG → PDF, PDF → JPG**

## Deploy
It's a static site with no build step: `index.html` and the bundled libraries (pdf.js 3.11, pdf-lib 1.17, JSZip 3.10).
On Vercel, import the repo and choose the **Other** framework preset with no build command.

## Editing
The source is in `src/`. After a change, run `sh src/build.sh` to regenerate `index.html` (it embeds the Faruma font).
