# Talk to your shop's data with AI

*For shop owners using Dura POS. Dura also puts a copy of this guide in your
`Dura POS` folder in Google Drive, called "About my Dura files (for AI)".*

Your sales, stock and money are in your own Google Drive, as ordinary Google
Sheets. You can open them yourself, or you can give them to an AI assistant
(Claude, ChatGPT, Gemini, NotebookLM, or another) and ask questions in plain
words: *"Which products made me the most money in October?"*

This guide explains:

- what each file is;
- which file to give the AI for which question;
- a ready-made message that explains your files to the AI, so its answers are
  right.

## Before you start: your data, your choice

- **The files hold your customers' names and phone numbers, your TIN, and
  your sales.** Only share them with an AI service you trust. Where the
  service lets you, turn off "use my data to train the model".
- **No passwords or keys are in any file.** PINs, payment keys and ZIMRA keys
  stay on your phones.
- **If you'd rather not share customer details,** download the file, delete
  the `Contacts` tab (and the Customer columns in Sales), and share that copy.
- **AI can make mistakes.** Check any important number against the file's own
  `Summary` tab, which works it out with formulas. For tax returns, ask your
  accountant.

## The files

Everything is in one folder in your Google Drive, `Dura POS`.

| File | Where | Made when | What's in it |
|---|---|---|---|
| **My Shop** | `Dura POS/My Shop` | When you set up Dura. Kept for good | Your products and prices, stock at each location, contacts (customers and suppliers), staff, settings, exchange rates, this year's stock and money movements, stock counts, supplier invoices, who owes what, and a summary |
| **Monthly sales** | `Dura POS/2026/2026-10 Sales` | One per month, made before the month starts | Every sale, invoice and return, the items, the payments (including change), each till's cash-up, ZIMRA fiscal days, quotes, and a summary of the month |
| **Activity** | `Dura POS/2026/Activity 2026` | One per year | Who did what, on which phone, and when: sign-ins, refunds, price changes, stock alerts, cash-ups |
| **Year archive** | `Dura POS/2025/Ledger 2025` | Made automatically after the year ends | Last year's stock and money movements, stock counts, supplier invoices, rates, and the closing stock |

**Every file opens on a `Read Me` tab** that explains the file. Give that tab
to the AI too.

## Which file for which question

| You want to know | Give the AI |
|---|---|
| Sales: by day, by till, by seller, by product, best sellers, busy days | That month's **Sales** file (several months for a comparison) |
| How each currency did; how customers paid (cash, EcoCash, card) | The month's **Sales** file (Sales and Payments tabs) |
| Whether a seller's cash was short, and when | The month's **Sales** file (Cash-ups tab), plus **Activity** for who was signed in |
| What's running out, what to reorder, slow movers | **My Shop** (Stock, Stock Ledger, Products), plus a recent **Sales** file for how fast things sell |
| What stock was lost (written off, counted short) | **My Shop** (Stock Ledger, Stock Counts) |
| Who owes the shop, and whom the shop owes | **My Shop** (Balances, Money Ledger, Contacts) |
| What was bought from suppliers, and the VAT on it | **My Shop** (Purchases) |
| Rough profit for a month | That month's **Sales** file, plus **My Shop** (Stock Ledger, for the cost of what was sold) |
| Whether receipts reached ZIMRA | The month's **Sales** file (Fiscal status, Fiscal Days) |
| Who changed a price, gave a refund, or approved a discount | **Activity** for the year |
| Last year | The year's **Ledger** archive and its monthly **Sales** files |

## How to give the files to an AI

The exact steps differ between services and change over time. These are the
usual ways:

- **Download and upload (works everywhere).**
  1. In Google Sheets, open the file and choose *File → Download →
     Microsoft Excel (.xlsx)*.
  2. Upload it to the AI chat. Most assistants that can analyse files accept
     `.xlsx`.
  3. If one doesn't, download single tabs as *Comma-separated values (.csv)*
     instead. Each download is the tab you're looking at.
- **From Google Drive directly.** Some assistants can connect to Google Drive
  and open the file there. Gemini inside Google Drive and Sheets can read the
  file you have open, on Google accounts where it's available.
- **NotebookLM, or a project with several files.** Add the files you need as
  sources, plus this guide. Then you can ask questions across months.

**Then paste the message below as your first message,** so the AI knows how
Dura's files work.

## The message to paste first

> I'm sharing files from my shop's point-of-sale app, Dura POS. Please read
> them using these rules.
>
> **The files.** "My Shop" is the main file: products, stock, contacts,
> staff, settings, exchange rates, this year's Stock Ledger and Money Ledger,
> stock counts, purchases from suppliers, balances, and a summary. Each
> "yyyy-mm Sales" file is one month: Sales, Items Sold, Payments, Cash-ups,
> Fiscal Days, Quotes and a Summary. "Activity yyyy" is the audit trail.
> "Ledger yyyy" is a closed year. Every file has a Read Me tab: read it first.
>
> **Currencies.** The shop trades in USD, ZWG and ZAR. Never add amounts in
> different currencies together. Report each currency separately, unless I
> ask you to convert; if I do, use the rate in the "Rate used" column of each
> payment, or the Exchange Rates tab for that date, and say which you used.
> Prices are set in USD, and ZWG or ZAR prices come from that day's rate.
> Costs and stock values are in USD.
>
> **Sales.** Each row in Sales is one sale (Type "Sale"), invoice on account
> ("Invoice") or return ("Return", with negative amounts and pointing to the
> original sale). Totals already include VAT; the VAT column is the VAT
> inside. Count sales as rows where Type is not "Return". "Net sales" means
> sales plus returns.
>
> **Payments.** One row per thing handed over, in the currency it was handed
> over in. Kind "Payment" is money in. "Change" is change given (negative).
> "Change kept" is change the shop kept for the customer, to use later.
> "Refund" is money back. "Account payment" is a later payment of an invoice.
> Ignore rows with Status "Failed" or "Cancelled". For each sale, "Amount in
> sale currency" of its Paid, Given, Kept, Refunded and On account rows adds
> up to the sale total.
>
> **Cash-ups.** One row per till per day (or per shift). "Expected" is what
> should be in the drawer and "Counted" is what was there; a negative
> difference means the till was short.
>
> **Stock Ledger.** One row per stock movement. Qty is positive for stock in
> (Opening, Stock in, Moved in, Returned) and negative for stock out (Sold,
> Moved out, Written off). "Counted" is the correction from a stock count.
> Stock on hand = the sum of Qty per product and location. Stock value =
> Qty × Unit cost, in USD.
>
> **Money Ledger.** Money movements that aren't sales: expenses, supplier
> invoices and payments, takings handed to the owner, banking, kept change,
> and invoices on account. A negative "Cash amount" is money out. "Balance
> change" is what the shop owes a contact: positive means the shop owes them
> more, negative means they owe the shop more. Adding up Balance change per
> contact and currency gives the Balances tab.
>
> **IDs.** IDs start with the phone that made them: "P4-S261013-0014" is sale
> 14 on phone P4 on 13 Oct 2026. Contacts are like "P1-C0008". Use the IDs to
> join tabs (for example, Sales "Sale ID" to Items Sold and Payments).
>
> **Colours and dots** in the sheets are only for reading: 🟢 good, 🟡 needs
> a look, 🟠 someone owes the shop, 🔵 the shop owes someone, 🔴 act now,
> ⚪ settled. Red numbers are negative.
>
> **How to answer.**
> - Say which file and tab you used.
> - Show the numbers per currency.
> - Tell me if something looks wrong in the data: a total that doesn't add
>   up, a missing day, a till that's often short.
> - Keep answers short and plain, as for a busy shop owner.
> - If a question needs a file I haven't given you, tell me which one.

## Questions to try

**Every day or week**

- "How much did we sell yesterday, per currency and per till?"
- "Which day this month was busiest, and what time of day do most sales
  happen?"
- "Was any till short at cash-up this month? Which seller, and how much?"

**Stock**

- "What's running low at each location, and how many days until it runs out,
  at this month's selling speed?"
- "Make me an order list for Harare Cash & Carry for next Monday, for two
  weeks of stock."
- "Which products hardly sold in the last 60 days?"
- "How much stock did we write off or lose in stock counts this year, and on
  which products?"

**Money**

- "Who owes us money, and since when? Is anyone over their limit?"
- "How much kept change do we owe customers, and which balances are older
  than 60 days?"
- "How much did we pay suppliers this month, and how much VAT was on their
  invoices?"
- "Roughly what profit did we make in September: sales minus the cost of
  what we sold?"

**Customers and staff**

- "Who are our top 10 customers this year, and what do they buy?"
- "Compare the sellers: sales, refunds and cash-up differences."
- "List every refund last month, who gave it, and who approved it."

**Fiscalisation**

- "Did every receipt reach ZIMRA? List any that are queued or were flagged."
- "Show each fiscal day closed this month, per till, with its totals."

## When the AI and the Summary disagree

The `Summary` tabs are worked out by the sheet's own formulas, so trust them
first. Usually a disagreement means one of these:

- the AI added two currencies together;
- it counted failed payments;
- it missed returns;
- it was given only part of the month.

Point it back to the rules above and ask it to check again.
