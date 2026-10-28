# Questions to put to ZIMRA's FDMS team

27 October 2026. Phase 0 of `01-assessment.md`. The answers decide what Dura POS
can promise and how onboarding works. Get them in writing, by email, and file
the replies here.

## The ones that decide whether to build

1. **Approval of third-party software.** Can a taxpayer go live with any
   FDMS-compatible third-party app on their own? Or must the software's
   developer be registered or approved first, as an approved supplier or
   otherwise?
2. **Per business or per model.** Is the approval (the error-free test day and
   the sample Fiscal Tax Invoice and Credit/Debit Note) needed for **each
   taxpayer**? Or is the software model (`DeviceModelName` / `DeviceModelVersionNo`)
   approved once? How is a model registered, and does every new app version need
   to be registered or approved again?
3. **Sample documents.** In what form should they be submitted (printout, PDF,
   photo)? Where do they go, and how long does approval usually take?

## Receipts

4. Is a **58 mm** printed receipt, about 32 characters a line, acceptable? Or
   must it follow the 48-character Receipt48 layout (80 mm)?
5. Are **digital receipts** (PDF, WhatsApp, SMS link) acceptable instead of
   printed ones? The spec says to submit a receipt "when receipt is printed".

## Operation

6. **Offline mode.** When does ZIMRA assign `Offline` as a device's operating
   mode? Can a taxpayer ask for it, and can a device move between online and
   offline?
7. **Several tills.** Each phone is its own fiscal device. Does each additional
   device for the same taxpayer go through test and approval again?
8. **Lost or stolen device.** What is the official procedure, and is there a
   reporting deadline (an "8 hours" rule has been quoted)? Who closes the device's
   open fiscal day? How is its certificate revoked? What happens to receipts that
   were issued but never sent?
9. **Fiscal day length.** What value of `taxPayerDayMaxHrs` is normally
   configured, and can it differ between taxpayers?

## Scope

10. **Non-VAT taxpayers.** Are traders below the VAT threshold required to
    fiscalise under section 90 of the Income Tax Act? Can they register virtual
    devices?
11. **Mixed-currency tender.** A customer pays partly in USD and partly in ZiG.
    Is the right approach one receipt in a single currency, with the other
    currency's payment converted at the merchant's rate and stated in the
    receipt currency?
12. **Kept change.** A customer pays USD 1.00 cash for a USD 0.60 sale and
    leaves the USD 0.40 change with the shop, to use later. Is the receipt's
    payment USD 1.00 cash, or USD 0.60? When the customer later spends the
    kept 0.40, which money type should that payment use: `Coupon`, `Other`,
    or something else?
13. **Invoice on account.** A business customer is invoiced now and pays in
    30 days. Is the invoice fiscalised when issued, with money type `Credit`?
    Does anything go to ZIMRA when the payment arrives?
14. **Branches and devices.** Each selling location is a branch with its own
    devices. If a phone moves to another branch, or a new branch opens, is
    that a change to the device's branch details, or a new device? Can a
    taxpayer register devices for a new branch themselves?
15. **Anything else.** Apart from the test day and the sample documents, is
    there any other certification, security review or test the software must
    pass?

## Answers

_(file ZIMRA's replies here, with the date and the contact)_
