# Liyun — ލިޔުން

A PDF toolbox that works in Dhivehi. Everything runs in the browser, and files are never uploaded.

- **Edit & fill PDF**: type Thaana (phonetic keyboard) or English anywhere on the page. Also: ✓/✗ marks, whiteout, a pen, images, and filling real form fields.
- **Sign PDF**: draw a signature or upload a photo of one (the white background is removed automatically).
- **My Files**: save PDFs (forms stay editable), create folders, rename, move, duplicate, search. Files are kept in this browser's storage on this device.
- **Merge, Split, Organize, Rotate, Page numbers (ސަފުހާ 1), Watermark, JPG → PDF, PDF → JPG**

## Sign-in & admin
The whole app needs a sign-in. Accounts are kept in `users.json` in this repo. Passwords are stored as PBKDF2-SHA256 hashes, never in plain text.
- **First visit:** with an empty `users.json`, the site asks you to create the first admin account.
- **Admin page:** go to the account menu and choose **Admin**. There you can add users, reset passwords, block or unblock accounts, make someone an admin, or delete accounts.
- **Publishing changes:** click **Publish to GitHub** to commit `users.json` using a fine-grained token (this repo only, *Contents: read & write*). The token is stored only in the admin's browser. Vercel redeploys automatically.
- **Limitation:** this is a client-side gate for a static site. It keeps casual visitors out, but it's not strong security.

## Deploy
It's a static site with no build step: `index.html` and the bundled libraries (pdf.js 3.11, pdf-lib 1.17, JSZip 3.10).
On Vercel, import the repo and choose the **Other** framework preset with no build command.

## Editing
The source is in `src/`. After a change, run `sh src/build.sh` to regenerate `index.html` (it embeds the Faruma font).
