# Quiet receipt preview

12 November 2026 · Design only in cdx.

The previous receipt still repeated information outside the receipt itself.
This pass supersedes that presentation for both the immediate sale result and
receipts opened from Recent sales.

- No visible Sale saved / Sale receipt heading or separate role heading.
- No change card; received cash and change remain once in the receipt data.
- No Saved on device, upload, fiscal or practice-receipt status lines.
- No Return selected items or Return whole sale controls on the receipt.
- One small, muted green check beside the shop name indicates a completed sale.
- Share, Print and Next customer remain. The small app Preview/Practice corner
  marker remains; this HTML still contains fictional data.

An unsaved sale does not receive the green check. It shows one short failure
instruction and Retry saving this sale. Sharing/printing remain disabled until
the same sale is saved successfully. A retry does not create a second sale.
An accessible, visually hidden Receipt heading keeps the page understandable
without adding another visible title.

Returns have moved to Recent sales: choose Return beside the original eligible
receipt to enter the existing quantity-and-approval flow. Historical return data
remains readable where relevant; return actions do not clutter the receipt.
This preserves the prior return feature rather than deleting the business flow.

| Preview | Link |
| --- | --- |
| Phone: the same three-item USD 4.00 sale, USD 5.00 received, USD 1.00 change | [Phone](-cdx-receipt-clean-mobile.png) |
| Tablet: same receipt and restrained success check | [Tablet](-cdx-receipt-clean-tablet.png) |

The success marker uses receipt-specific semantic tokens. It does not change the
approved charcoal/chalk/sign-red branding. Old basket-added feedback is cleared
when opening a receipt, so it cannot linger over the result.

`-cdx-receipt-clean-check.cjs` covers 48 combinations of receipt/result, role,
320/390/768/1024 px and light/dark/large text. It checks absence of the removed
copy/actions, one check mark, once-only receipt values, direct sale-to-receipt,
sharing, the Recent sales return entry and honest failed-save retry. Actual phone
and tablet renders are inspected. Relevant workflow and catalog results are
recorded in [status.md](status.md).

No app/backend code, production data or permissions changed. Figma remains
deferred. Physical-device and screen-reader validation remain separate.
