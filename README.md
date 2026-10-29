# Hari Om Construction

Public website and office workspace for Hari Om Construction.

## Pages

- index.html is the public website for hariomconstruction.in.
- office/ is the separate office workspace intended for tools.hariomconstruction.in. The existing office.hariomconstruction.in hostname is reserved for the Nextcloud tunnel.

## Office workspace

The portal includes a project register, estimate builder with GST totals and print-to-PDF, site diary, attendance, CSV exports, and JSON backup. It currently saves records in browser local storage. Data is separate on each device; there is no shared database, sign-in, or server backup yet.

## Cloudflare Pages

The public site and the separate `hari-om-office-tools` Pages project are connected to the `Hari_Om_Construction` GitHub repository and deploy from `main`. The office project uses `office` as its root directory and serves at `tools.hariomconstruction.in`. The existing `office.hariomconstruction.in` hostname remains reserved for the Nextcloud tunnel.

Open index.html and office/index.html directly for a local preview. No package installation or build command is required.
