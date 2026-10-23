# MiniLedger — Design Reference Map

The supplied screenshots are in `design/references/`. They show the original Lent flow and remain the primary style reference.

| File | Screen/state | What to reference |
|---|---|---|
| `design/references/account.png` | Account / Settings | Profile, grouped settings, session actions |
| `design/references/all-loans-pending.png` | All Loans — Pending | Search, status filters, outstanding summary, pending cards |
| `design/references/all-loans-overdue.png` | All Loans — Overdue | Red overdue state and overdue duration |
| `design/references/all-loans-repaid.png` | All Loans — Repaid | Green settled state and paid date |
| `design/references/all-loans-all.png` | All Loans — All | Mixed statuses and list hierarchy |
| `design/references/loan-details.png` | Loan Details | Details sheet, amount, due date, repayment action |
| `design/references/dashboard.png` | Dashboard | Summary cards, quick actions, recent loans |

## How to extend for Borrowed
Use the same cards, typography, spacing, and status colors. Add a clear direction badge or label to each loan:
- Lent: “They owe you” / “Receivable”.
- Borrowed: “You owe them” / “Payable”.

Do not rely on color alone to distinguish direction. Use text and/or a direction icon. Consider a segmented selector at the top of Add Loan (“I've Lent” / “I've Borrowed”) and filter chips on All Loans. Dashboard metrics must clearly separate lent and borrowed balances.

## Important caveats
Screenshots contain fictional names, phone numbers, amounts, dates, and counts. Do not hardcode them. Features visible in screenshots—reminders, device lock, receipts, CSV export, channel, purpose, reference IDs—must only be implemented if backed by the existing schema and API. Borrowed-loan screens are an extension of the reference style; they are not present as separate screenshots in the supplied set.
