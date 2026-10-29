# Hari Om Construction

Public website and office workspace for Hari Om Construction.

## Pages

- index.html is the public website for hariomconstruction.in.
- office/ is the separate office workspace intended for office.hariomconstruction.in.

## Office workspace

The portal includes a project register, estimate builder with GST totals and print-to-PDF, site diary, attendance, CSV exports, and JSON backup. It currently saves records in browser local storage. Data is separate on each device; there is no shared database, sign-in, or server backup yet.

## Cloudflare Pages

The public site is connected to the Hari_Om_Construction GitHub repository and deploys from main. The office app can use the same repository with office as its Cloudflare Pages root directory. Point office.hariomconstruction.in at that Pages project after it is created.

Open index.html and office/index.html directly for a local preview. No package installation or build command is required.

