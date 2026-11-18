# Where Does Your Tax Dollar Go?

A static, responsive Cloudflare Pages starter website with a live $1 federal-spending calculator.

## Important data interpretation

The calculator uses the USAspending.gov Spending Explorer API (`POST https://api.usaspending.gov/api/v2/spending/`) with `type: "budget_function"` and fiscal-year/quarter filters. It applies each returned budget function's share of the returned total to the amount entered by the visitor.

This is an illustration of reported federal spending obligations by budget function. It is **not** a literal allocation of an individual's tax payment. Federal spending is funded by multiple receipts and borrowing. The website intentionally says this in the interface and methodology.

The app tries the current fiscal year and then the prior fiscal year, starting with Q4 and falling back to earlier quarters if data is not yet available. USAspending's API documentation notes that data for a latest complete quarter may not be available until 45 days after quarter close.

## Files

- `index.html` — homepage and calculator
- `styles.css` — responsive white-and-blue design
- `app.js` — fetches official data and calculates the proportional breakdown
- `about.html`, `privacy.html` — basic informational pages
- `_headers` — basic security headers for Cloudflare Pages
- `robots.txt`, `sitemap.xml` — starter crawler files

## Deploy to Cloudflare Pages

1. Create a new GitHub repository, for example `where-does-your-tax-dollar-go`.
2. Upload all files in this folder to the repository root.
3. In Cloudflare, open **Workers & Pages → Create → Pages → Connect to Git**.
4. Select the repository.
5. For a plain static site, use:
   - Framework preset: **None**
   - Build command: leave blank
   - Build output directory: `/` (or `.` if the dashboard requires a relative path)
6. Deploy. Cloudflare will provide a `*.pages.dev` URL.
7. Replace `YOUR-PROJECT.pages.dev` in `index.html`, `robots.txt`, and `sitemap.xml` with the actual Pages hostname, then commit the change.

Cloudflare Pages supports static HTML sites. The site has no build step and no paid service dependency.

## Test locally

Open `index.html` in a browser. The API call requires an internet connection. If the browser blocks local-file requests, deploy the site or serve the folder through a local static server.

## Before monetizing

- Test the API response and calculations on desktop and mobile.
- Add a clear contact/about page and update privacy terms before adding analytics, ads, newsletter signup, or payments.
- Do not use a $1 “tax allocation” claim in advertising. Describe it as an illustrative spending-share calculator.
- A paid report must add original analysis or convenience; the underlying public data itself is freely available.
- Check payment provider eligibility and tax obligations for an India-based operator before accepting payments from U.S. customers.
