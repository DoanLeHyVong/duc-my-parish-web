# Branding and Vietnamese content recovery

The Web uses `ParishProfile.faviconUrl` and `updatedAt` to set the browser icon and Apple touch icon. Saving Website Settings invalidates the profile query; the icon URL includes a deterministic revision. The initial HTML uses the parish cross at `/favicon.svg?v=parish-1`. No rebuild is required for subsequent branding changes. Refresh an already-open tab after installing a new Web release.

## Confirmed public Production data findings (2026-11-15)

Read from UTF-8 JSON at `/api/v1/public/home`, independently of React/CSS:

| Entity | ID | Field | Confirmed replacement | Preserve |
| --- | --- | --- | --- | --- |
| Banner | 1 | primaryText | Xem giờ lễ | image, title, destination, order, visibility |
| Banner | 3 | primaryText | Xem giờ lễ | image, title, destination, order, visibility |
| Category | 8 | name | Phụng vụ | slug `pha-ng-va`, ID, post relations |

Banner 2 already has the correct CTA. Category 8 is referenced by Post 8. The malformed values are already present in API JSON, whereas current `prisma/seed.ts` contains the correct Vietnamese strings. UTF-8 and NFC alone do not detect every form of mojibake. The historical writer/import path that corrupted these rows has not been established; do not attribute this to the current font or assume a global database charset defect. Current schema migration SQL uses utf8mb4, but Production column/session charset has not been inspected directly.

## Operator procedure — separate approval required

No data repair is part of this Web deployment.

1. Obtain approval for exactly the three field replacements above. Check whether an editor has changed the values since this report; stop if the current row differs from the reviewed snapshot.
2. Use the existing API backup procedure to create a consistent SQL backup, calculate SHA-256, download and verify it outside the VPS, and complete isolated restore verification. Preserve that backup and its evidence. Never reuse a consumed release proof.
3. Privately export each row's current ID, target text field, slug/URL, updatedAt and relations. Include raw UTF-8/hex values when diagnosing the corruption. Keep exports outside repositories. Confirm the category's existing inbound links and post associations.
4. Use a separately reviewed maintenance transaction: lock these exact rows, require exact field/updatedAt preimage matches, update only the three approved columns, and require one affected row per update. Preserve `pha-ng-va`. Record the maintenance audit in the same transaction. Stop on any concurrent change. Admin forms currently submit multiple fields without an optimistic revision guard; do not use them for this repair unless concurrent editing is excluded by an enforced maintenance window. Do not use blanket character-conversion UPDATEs.
5. Inside the transaction, read back rows and relations on the same connection. Commit only if those checks pass; otherwise roll back. After commit, read public API JSON and verify the two button texts, category name, unchanged URLs/IDs/relations and audit entries. Check desktop/mobile Hero, category list, article preview and category page. Separate API connections cannot verify uncommitted changes.
6. If a committed change must be undone, restore only these three field preimages through an audited operation after verifying no intervening edits. Do not restore the whole database over newer business data. Retain the full backup for disaster recovery.

An Admin edit is immediately committed by its API transaction. Its rollback is a new audited edit using the captured preimage; it is not equivalent to an open SQL transaction rollback.

## Release verification

- Keep the existing Web CI and Production Deployment checksum, atomic switch and smoke gates.
- Compare the served index/asset names with the new build and check the effective DOM has one `rel=icon`, points to configured branding, and loads an image successfully.
- Confirm `/favicon.svg?v=parish-1` contains the parish cross rather than Vite's purple lightning.
- Inspect public and Admin pages in desktop/mobile viewports. Correct source rendering does not prove that all private CMS records are free of stored corruption.
- Fixing the Web cannot repair the three Production values above. Leave them explicitly outstanding until the separately approved data recovery is verified.
