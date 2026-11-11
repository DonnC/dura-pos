# Consistency, accessibility and interruptions

11 November 2026 · Design only, inside cdx.

This pass reviews the existing Shop Sign design rather than introducing another
feature. The cashier should be able to resume unfinished work, see keyboard
focus and reach every control without changing the familiar daily workflow.

## Findings and changes

| Priority | Finding | Design correction |
| --- | --- | --- |
| High | Cash received disappeared after a browser reload | Retain one unfinished cash entry for the same seller, currency, products, quantities and prices |
| High | Search and cash inputs suppressed their visible focus outline | Draw focus around the full field; give selects the same focus treatment |
| Medium | All chips in Stock and Fiscal queue measured about 46 px wide | Set shared chips to a minimum 48 px width |
| Medium | The cash input itself was about 41 px tall | Give the editable area a 48 px minimum height |
| Medium | Cash validation was visible but lacked an invalid-state attribute | Expose `aria-invalid` alongside the existing error description |
| Medium | Older interrupted reviews returned to entry without explaining the restart | Explain that the review is no longer open and ask the user to check saved records before re-entry |
| Low | Reduced-motion mode disabled animations but retained transitions | Suppress transitions too |
| Low | Programmatic page focus outlined the whole scrolling region | Keep page focus for navigation announcements; show rings on interactive controls |

Checkbox glyphs remain smaller than 48 px; their surrounding labels are the
larger clickable target. The audit measures that label, not just the glyph.
No screen hierarchy, approved logo, role permission or money calculation was
redesigned. The new focus outline uses the existing theme token.

## Interruption contract

Cash entry is an unfinished draft, never a payment or saved sale. Returning to
the payment screen after a reload restores its text and displays **Unfinished
cash entry restored. Check the amount before saving.** The cashier still checks
the customer and taps the existing save action. Nothing is charged or recorded
by restoring the draft.

Changing seller, pricing currency, product price or basket clears the draft.
Holding, clearing or completing the basket also clears it. Consent checkboxes
and approval PINs are not restored. Pending mobile payments retain their own
reference and remain unconfirmed after reload; they are not converted into cash.

The subsequent [older-review recovery pass](-cdx-review-drafts.md) now retains
delivery, stock-count, money-out and cash-up drafts across reload. Restored
reviews require a fresh check and approval where needed. Missing/completed
drafts still return safely to entry without replaying a save. See the newer
document for the current contract; this audit records the earlier finding.

The prototype keeps one `s.cashDraft` with a basket/context key and at most
16 characters of entry text. It uses the existing practice-browser storage,
without a schema, workbook, production-record or restore-format change. No
migration is needed: older practice sessions have no draft to restore. The
preview's existing reset clears it along with the rest of the practice session.
Browser persistence does not establish Android process-death or storage safety.

## Coverage and evidence

[-cdx-audit-inventory.json](-cdx-audit-inventory.json) records all **90 base
screen routes**, rendered headings, primary actions, labels and measured
control-size findings. It is generated from the running prototype's route map,
so it does not infer implemented screens from documents. It is not an inventory
of every dialog, alternate state, data value or production app screen.

[-cdx-audit-check.cjs](-cdx-audit-check.cjs) checks control labels and target
sizes on those base routes, then key journeys at phone, tablet, dark and 200%
text settings. Interaction checks cover cash-draft recovery, context changes,
unchanged money while drafting, no repeated sale on reload, pending identity,
dialog Escape/focus return, search focus and reduced-motion feedback.

Focused assertions first failed for missing visible cash-field focus and then
for lost cash-entry text after reload. The corrections followed those failures.
Existing workflow and layout regressions are recorded in [status.md](status.md).

Review the [phone payment](-cdx-phone-cash-recovery.png),
[tablet payment](-cdx-tablet-cash-recovery.png) and
[interrupted review](-cdx-phone-review-restart.png) captures. These are browser
viewport simulations. Screen-reader attributes and keyboard behaviour are
checks, not evidence of a complete accessibility conformance audit.

## Assumptions and remaining validation

- The single retained cash draft belongs to this practice phone and seller.
  It is not shared across phones and does not represent money already taken.
- The 90-route base inventory uses fictional populated fixtures; conditional
  recovery screens and dialogs also need separate fixtures in any full handoff.
- Existing live-region and dialog semantics remain in use. Physical Android
  keyboard/insets, TalkBack, switch access and vendor observation remain open.
- Native process recovery and production persistence are implementation work.
  This pass changes only the HTML design sandbox.

The Figma conversion scope is assessed separately in
[-cdx-figma-readiness.md](-cdx-figma-readiness.md).
