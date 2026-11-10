# src/legal

Legal documents as Markdown, bundled as strings by `src/legal.ts` (`@merqo/ui/legal`).

- `terms.md`, `privacy.md`, `pilot-agreement.md`, `end-customer-notice.md`: the documents.
- `schedules/`: one schedule per kit.
- `version.ts`, `version-manifest.json`: the document versions users accept.
- `CHANGELOG.md`: what changed in each version.
- `*.content.test.ts`: guards on required wording.

Rule: a content change bumps the matching date in `version.ts` and the manifest and adds a line to this folder's CHANGELOG, and rolls out to merqo and every kit the same day. Owner approval first.
