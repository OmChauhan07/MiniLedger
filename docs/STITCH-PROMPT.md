# Stitch Prompt — MiniLedger with Lent and Borrowed Loans

Design a polished Android mobile app called **MiniLedger** for tracking money a user has lent to friends and money the user has borrowed from other people. Use the supplied screenshots in `docs/design/references/` as the visual style reference: cool off-white background, white rounded cards, deep navy typography and primary actions, pale blue-gray borders, subtle shadows, amber pending, red overdue, green repaid.

Create:
1. Phone Login (+91) and Continue.
2. OTP Verification with masked number, six-digit numeric input, resend cooldown, and errors.
3. Dashboard with separate Lent Outstanding, Borrowed Outstanding, Overdue Receivable, and Overdue Payable summaries. Clearly label all metrics.
4. Add Loan with a prominent segmented selector: “I've Lent” / “I've Borrowed”, then person/lender name, INR amount, due date, and optional note only if supported.
5. Loan Details with a direction badge and direction-aware wording: Lent = “They owe you”; Borrowed = “You owe them”. Show supported dates/details and a confirmation before settling.
6. All Loans with search if supported, filters for All/Lent/Borrowed/Pending/Overdue/Repaid, counts, and direction-aware cards.
7. Account/Settings with profile, clearly labelled lent/borrowed stats, functional preferences only, app version, and sign out.

Overlays: Add Loan, Mark as Repaid/Paid confirmation, Loan Saved success, Due Date Picker, optional Receipt Attachment only if implemented, and Logout Confirmation.

Include loading, empty, validation, network error, invalid/expired OTP, pending, overdue, repaid, and no-filter-results states. Use text/icons as well as colors. Design for React Native + Expo on Android: safe areas, keyboard-aware forms, accessible touch targets, reusable components, realistic mobile layouts.

Scope: each loan belongs to the signed-in user and its type is relative to that user; the other person need not have an account. This is a tracking ledger only, not payment execution. Do not add bank integration, subscriptions, social features, or charts. Do not imply reminders, biometrics, receipts, or CSV export work unless implemented. Use fictional sample data only for mockups; production uses backend API data. Prioritize Dashboard, Add Loan, All Loans, and Loan Details.
