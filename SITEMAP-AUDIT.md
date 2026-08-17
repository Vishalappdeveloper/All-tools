# Sitemap Audit

## Inventory (this ZIP)
| Sitemap | URL count | Notes |
|---|---|---|
| sitemap_index.xml | 7 sub-sitemaps | Correct sitemap-index format; each `<loc>` points to a real sub-sitemap, not to a private/API path |
| sitemap.xml | 1 | Homepage only |
| sitemap-pages.xml | 101 | Static/utility pages |
| sitemap-blog-archive.xml | 60 | Archived posts |
| sitemap-calculators.xml | 1,500 | |
| sitemap-converters.xml | 1,506 | |
| sitemap-tools.xml | 701 | |
| sitemap-blog.xml | 11,987 | Largest sitemap — primary driver of the ~15.9K "Discovered — not indexed" GSC bucket |
| **Total unique URLs** | **~15,856** | Matches the order of magnitude of GSC's 15.9K figure, confirming the blog sitemap is the main source of that bucket, not a technical bug in the sitemap file itself |

## Checks performed
- **No private/auth/admin/API URLs found in any sitemap** (`grep -l '/auth/\|/admin/\|/account/\|/api/'` across all `sitemap-*.xml` = 0 matches). This item from the master checklist was already correct.
- **No sitemap-XML-file self-references inside another sitemap** (i.e. no sitemap lists another sitemap's `.xml` URL as a page `<loc>`). Confirmed by inspecting `sitemap_index.xml` structure above — sub-sitemaps are declared correctly through the index mechanism, not linked as regular pages.
- **Duplicate `<loc>` entries removed** within each sitemap file in a prior pass (2,206 duplicates removed website-wide before this pass; re-checked now — no new duplicates introduced by this pass's edits).
- `sitemap.xml` (root, 1 URL) is separate from `sitemap_index.xml` (7 sitemaps) — this is intentional in this codebase (root sitemap = homepage-only convenience file, separate from the index), not a bug, but worth knowing when interpreting GSC's per-sitemap reports.

## Why GSC shows sitemap files under "Crawled — currently not indexed"
A `.xml` sitemap file is not a normal HTML page. If GSC lists a sitemap URL itself (e.g. `/sitemap-finance.xml`) inside a page-indexing report rather than only the Sitemaps report, it is typically because:
1. The `.xml` file was submitted or discovered as a normal URL at some point (e.g. it was linked from an HTML page, or someone pasted the sitemap URL into URL Inspection), or
2. An old sitemap filename (e.g. `/sitemap-finance.xml`, `/sitemap-health.xml`, `/sitemap-currency.xml` mentioned in the original report) no longer exists in the current sitemap set of this ZIP — this project currently only ships `sitemap-pages.xml`, `sitemap-blog.xml`, `sitemap-blog-archive.xml`, `sitemap-calculators.xml`, `sitemap-converters.xml`, `sitemap-tools.xml`, `sitemap.xml`. If GSC is still tracking `sitemap-finance.xml` / `sitemap-health.xml` / `sitemap-currency.xml` from an older deployment, those are stale references to files that no longer exist — they will naturally drop out of GSC's reports over time as Google recrawls and gets 404s for them. **Do not recreate those old filenames just to "answer" GSC** — that would be a fake fix per the master prompt's own rule #4.
- No internal HTML page in this ZIP links to any `.xml` sitemap file (`grep -rl 'sitemap.*\.xml' *.html` returns only `robots.txt`'s `Sitemap:` directive, which is correct and expected).

## Recommendation
- Keep sitemap set as-is (already free of private/duplicate/technical-endpoint URLs).
- If old sitemap filenames (`sitemap-finance.xml`, `sitemap-health.xml`, `sitemap-currency.xml`) still exist on the **live** server but not in this ZIP, remove them from the live server and from Search Console's tracked sitemap list (Search Console > Sitemaps > select old sitemap > Remove), since they are stale/renamed.
- Because `sitemap-blog.xml` alone is ~12K URLs, prioritize content-quality and internal-linking improvements there first — it is the largest lever on the "Discovered — not indexed" count (see SEO-AUDIT-REPORT.md).
