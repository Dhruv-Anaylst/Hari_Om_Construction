# Hari Om Construction

Public website and office workspace for Hari Om Construction.

## Public website

- index.html: home and company overview
- about.html: company, principles and working approach
- services.html: pipeline, CGD, manpower, O&M and project coordination capabilities
- projects.html: supported project scopes and delivery flow
- quality.html: quality, safety and environmental approach
- gallery.html: licensed representative pipeline photos; replace with approved Hari Om project photos for a verified project portfolio
- careers.html: career interest form
- contact.html: office details and WhatsApp enquiry form

The Hari Om website uses its own copy and visual styling. Project records, client names, numerical claims and credentials are not published unless verified by the company. The gallery uses three Pexels photos under the Pexels License, with photographer links shown on the page: Sergei Starostin (two photos) and Asep Fajar Sasmita (one photo).

## Office workspace

office/ is the separate office workspace intended for tools.hariomconstruction.in. The existing office.hariomconstruction.in hostname is reserved for the Nextcloud tunnel.

The portal includes a project register, estimate builder with GST totals and print-to-PDF, site diary, attendance, expense register, material stock and movement tracking, GST/concrete/excavation/rebar calculators, CSV exports, and JSON backup. PDF Studio can merge PDFs, rotate pages, extract page ranges, and add a text stamp in the browser. The Official Portals directory links to government services and Microsoft 365. PDF files are processed on the device; workspace records are saved in browser local storage. Data is separate on each device; there is no shared database, sign-in, or server backup yet.

## Cloudflare Pages

The public site and the separate `hari-om-office-tools` Pages project are connected to the `Hari_Om_Construction` GitHub repository and deploy from `main`. The office project uses `office` as its root directory and serves at `tools.hariomconstruction.in`. The existing `office.hariomconstruction.in` hostname remains reserved for the Nextcloud tunnel.

Open index.html and office/index.html directly for a local preview. No package installation or build command is required.

