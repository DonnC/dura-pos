# Shops, stores and branches; phones and staff; reporting

28 October 2026. Read with `03`, `04` and `08`.

## Shops, stores and branches are one thing in Dura: a location

"Shop", "store", "branch", "outlet" and "stall" are different names for the
same thing: **a place where stock is kept and, usually, sold.** In Dura it's a
**location**, a row in `My Shop` → `Locations`.

- **Your own word.** The owner picks what the app calls it, in Settings. A
  chain says "branch", a vendor says "stall", and the screens use that word.
- **The one real difference:** whether the location sells. Some businesses
  say "store" for a storeroom or warehouse that only holds stock.

| Location type | Sells? | Has phones that sell? | Example |
|---|---|---|---|
| **Selling** (the default) | Yes | Yes | The main shop; the Mbare stall; the Bulawayo branch |
| **Storage only** | No | Only to receive and move stock | A back storeroom; a small warehouse that feeds the branches |

**Several businesses are not several locations.** Two companies with different
TINs are two Dura shops: two `Dura POS` folders, each with its own `My Shop`.
- They can live in the same Google account.
- The owner switches between them in the app.
- Nothing is shared between them: not stock, sales or ZIMRA devices.

## How a location works

**Stock**

- Stock is held **per location**. Every Ledger row names its location, and
  the `Stock` tab shows each product at each location.
- **Moving stock** is a `Moved out` row at one location and a `Moved in` row
  at the other, with one reference. A storeroom feeds the shops this way.
- **Receiving stock:** a supplier delivers to a location, and the purchase is
  recorded there.
- **Stock takes** are per location.
- **Low-stock alerts** are per location. "Out at Mbare, plenty at Main"
  suggests a move instead of a purchase.

**Prices** are one price list for the whole business. A per-location price can
be added if a business asks; it isn't in the design yet.

**Sales**

- Each sale is tagged with its **location, phone and seller**.
- All locations go into the same month's Sales file. The Summary splits them
  by location, phone and seller.
- At up to about 10 phones, one file per month is enough (`04`, "How big can
  the files get?").

**ZIMRA.** Each selling phone is a fiscal device, registered under a
**branch** (ZIMRA's word), with the branch's name and address on every
receipt.
- So each selling location is one ZIMRA branch, and its phones are that
  branch's devices.
- A phone that moves to another location needs its device's branch details
  updated with ZIMRA, which is one of the open questions to ask them.

## Phones and staff are separate things

**A phone is a till; a person is a seller.** They are linked only by who is
signed in.

| | What it is | Belongs to | Kept in |
|---|---|---|---|
| **Location** | A place with stock | The business | `Locations` |
| **Phone (device)** | A till: its own drawer, cash-up, ZIMRA device and receipt numbers | **One location** at a time | `Phones` |
| **Person (staff)** | Someone who sells or manages, with a PIN | The business; allowed on chosen phones or locations | `Staff` |

**Many phones don't mean many staff, and many staff don't mean many phones.**

| Shop | Phones | People |
|---|---|---|
| A vendor selling alone | 1 | 1 (the owner) |
| The sample's main shop | 2 (the owner's phone and the till) | 2 (the owner and one seller) |
| A tuck shop with shifts | 1 till | 3 sellers, one after another |
| A busy shop at month end | 3 tills | 3 sellers, plus the owner moving between them |

**What follows from that:**

- **Sales record both** the phone and the seller. "Which till" and "which
  person" are separate questions, with separate answers.
- **Cash-ups belong to the drawer, so to the phone.** When sellers change
  shift on one till, each hand-over is a cash-up: one row per phone per shift,
  so a shortage is pinned to the person who had the drawer. One seller all
  day is one cash-up a day, as in the sample.
- **Fiscal numbering belongs to the phone**, never to the person.
- **Who may do what belongs to the person:**
  - **Owner:** everything, everywhere.
  - **Manager** (optional, per location): approves refunds and discounts,
    receives stock, does stock takes and sees reports for *their* locations.
    Useful once there are branches the owner isn't at.
  - **Seller:** sells and cashes up on the phones they're allowed on.

## Reporting

**In the app.** Each person sees what their role allows, as answers rather than
tables:

| Role | Sees |
|---|---|
| Seller | Their own sales today, their drawer, what's low at their location |
| Manager | Their locations: today and this week, cash-up differences by seller, stock low or out, purchases |
| Owner | Every location combined, with a tap to split by location, phone or seller |

The owner's home cards:

- sales today and this week, per currency;
- cash-up differences;
- what's running out, and where;
- who owes the shop, and whom the shop owes;
- how much kept change it holds.

**A day-end message.** At the last cash-up, the owner's phone can send the
owner a short WhatsApp-style summary, for example:

> Today: Main USD 412 / ZWG 3,150, Mbare USD 238 / ZAR 640. Short: Mbare USD 1.
> Out of stock: sugar at Mbare.

It's built on the phone from synced data, with no server.

**In the sheets** (`04`):

- **Each month's Summary:**
  - by day, with charts;
  - by location, by phone and by seller;
  - by payment method and by product;
  - cash-up differences.
- **`My Shop` → Summary:** stock and stock value per location, money owed,
  and the year month by month, with charts.
- **`Balances`:** who owes what.
- **`Activity`:** who did what, and where.

**Currencies are never added together** in any report: USD, ZWG and ZAR are
always side by side.
