# Design language, account header and role views

11 November 2026 · Design contract · App code is unchanged.

## One name per concept

| Concept | Display wording | Use |
| --- | --- | --- |
| Business controller | Owner | Signed-in role, approvals, settings and business reports |
| Selling role | Cashier / Cashiers | Signed-in role, access management and recorded sales attribution |
| App installation | Device / Devices | Pairing, access, backup, report coverage and device identity |
| Contact number | Mobile number | A customer's or cashier's contact number, not an installation |
| Goods held | Stock | Navigation, product quantities, receiving and availability |
| Physical goods count | Stock take | Entry, review, differences and saved stock adjustments |
| Drawer/shift | Till | Personal cash responsibility; shared hardware is still a Device |
| Physical cash count | Cash-up | Cash counted, variance, retained float and handover |

Do not rotate between Staff, Seller and User as role labels, or between Stock
and Inventory as destination labels. Ordinary prose can use lowercase owner
and cashier. Mobile/tablet describe screen sizes in design tools. Stable routes,
icons, filenames and data properties such as `worker`, `staff`, `phone1` and
`stock-count` are compatibility identifiers, not interface wording.

The project vocabulary lives in `handbook/product/04-glossary.md`. Current cdx
display strings and accessible labels adopt it. Legacy app implementation copy
is outside this design pass and must adopt the contract when implemented.

## Compact account header

The normal header contains the approved compact wordmark, shop name and signed-in
name with **Owner** or **Cashier**. The avatar opens that person's profile. Front
counter / Device 1 detail belongs there and in the relevant task context.
The four main destinations keep their positions across roles.

Healthy local saving does not require a persistent second status bar. Offline
status can show when relevant; saved/upload/payment/fiscal details remain in
their own views. Owner and cashier views never imply that local totals are a
complete shop report.

Practice mode is chosen once and can be represented by a small corner marker.
The standalone HTML account appearance uses a small **Preview** marker because
all data is fictional and no real account is connected. The preview's appearance
control is not a live/practice database switch and never mixes real shop data.
External service outcomes continue to say Example where appropriate.

## Role matrix

| Task | Owner | Cashier |
| --- | --- | --- |
| Sell and take payment | Yes | Yes, with active access |
| View stock | Yes | Yes |
| Receive/edit stock or perform stock take | Yes | Ask owner |
| Own till, cash-up and lock | Yes | Own signed-in till only |
| Business sales, profit, product and cashier reports | Yes | Hidden and guarded |
| Cashier permissions, devices and shop settings | Yes | Own access/status only |
| Money out / returns | Review and approve | Owner approval required |
| Product-line discount | Apply with a reason | Request owner approval |
| Pairing, restore and fiscal-day recovery | Owner views | Own permitted status only |

An owner-only destination is hidden from the cashier. Direct entry shows Owner
access and a return to selling; it does not expose business figures or clear
the basket. Tablet space changes layout, not permissions. Cashier attribution
comes from the recorded person; a shared device is not a substitute for a name.

## Design decisions in this pass

- Cashier is the single current selling-role label; no Manager role is introduced.
- Device covers mobile and tablet installations. Mobile number remains a separate
  contact concept.
- All manual discounts requested by a cashier require owner approval in this
  design. No arbitrary percentage limit is presented as a production policy.
- One manual discount per product line; no stacking or free-item workflow in this
  pass. Original price, discount and amount paid must remain distinguishable.
- Charts use labelled recorded figures and accessible tables. Missing data or
  missing buying costs remain unknown, not zero or invented profit.

See `-cdx-discounts.md` and `-cdx-owner-report-details.md` for the detailed
workflows, examples and limitations. Those documents describe design, not a
shipped Flutter feature or live integration.
