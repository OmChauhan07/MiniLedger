# MiniLedger — Mobile UI Design Specification

## Product goal
MiniLedger is an Android-first personal ledger for tracking money lent to other people and money borrowed from other people. A user records their own loans and repayment obligations. This is not a payment processor, bank integration, or shared multi-user loan contract.

## Visual direction
- Clean, trustworthy personal-finance utility.
- Very light cool-gray/off-white canvas; white rounded cards.
- Deep navy/near-black text and primary actions.
- Thin pale blue-gray borders, subtle shadows, rounded cards.
- Pending = amber; overdue = red; repaid/paid = green.
- Status always includes text and/or an icon, not color alone.
- Currency is INR, with Indian digit grouping (e.g. ₹42,200).
- React Native + Expo + TypeScript, optimized for Android.
- Avoid unnecessary animations, charts, payments, bank integrations, subscriptions, and social features.

## App shell
- Header with MiniLedger brand and current page title.
- Bottom navigation: Dashboard, All Loans, central Add Loan action, Account.
- Respect safe areas and Android system bars.
- Keep bottom padding so navigation does not cover the last card.
- Reuse spacing, typography, card radius, icons, and touch targets.

## Loan direction terminology
- **Lent**: the current user gave money to the named person; the named person owes the current user.
- **Borrowed**: the current user received money from the named person; the current user owes that person.
- Use direction-specific labels consistently: “They owe you” for Lent and “You owe them” for Borrowed.
- Use a direction selector in Add Loan. Do not infer direction from names or amounts.

## Screens

### 1. Login
- Brand and concise purpose statement.
- Phone field with +91 default country code.
- Continue button, validation/loading state, brief privacy note.
- No password field for phone + OTP authentication.

### 2. OTP Verification
- Masked phone number, six-digit numeric OTP, Verify button, resend cooldown.
- Handle invalid/expired OTP, rate limits, and network errors.
- Mock OTP is logged by the backend only; never show it in the app or API response.

### 3. Dashboard
Use the supplied Dashboard screenshot as the visual reference.
- Greeting without unnecessarily exposing the full phone number.
- Show distinct summary figures for **Lent Outstanding**, **Borrowed Outstanding**, **Overdue Receivable**, and **Overdue Payable**.
- Also show Total Lent and Total Repaid as clearly labelled metrics if space allows; do not combine lent and borrowed amounts into one unlabeled “capital” total.
- Quick actions: Add Loan and All Loans.
- Recent Loans can contain both directions; each card must have a clear Lent/Borrowed indicator and correct “They owe you” / “You owe them” wording.
- Include loading, empty, and API-error states.

### 4. Add Loan
Can be a dedicated screen or modal/bottom sheet.
- First field/choice: direction selector with **I've Lent** and **I've Borrowed**.
- Person name (required).
- Amount in INR (required, positive number).
- Due date (required, valid date).
- Optional note only if supported by the existing backend schema/API.
- Optional receipt only if file upload is implemented end-to-end.
- Form labels adapt to direction where useful: e.g. “Friend's name” or “Lender's name”.
- Validate fields inline, prevent duplicate submissions, and show success only after API success.
- Return to the relevant screen and refresh summaries.

### 5. Loan Details
Use the supplied Loan Details screenshot as the layout reference.
- Person name/initials, direction badge, amount, due date, and current status.
- Lent: label amount “Lent Amount” and state “They owe you”.
- Borrowed: label amount “Borrowed Amount” and state “You owe them”.
- Show creation date, repayment/paid date, note, or reference ID only when actual data exists.
- Unpaid Lent action: “Mark as Repaid” or “Mark as Received”.
- Unpaid Borrowed action: “Mark as Paid” or “Mark as Repaid”.
- Confirm the action and use direction-specific copy.

### 6. All Loans
Use the supplied All Loans screenshots for the shared visual style.
- Search by person name and note only if notes are supported.
- Filter chips: **All, Lent, Borrowed, Pending, Overdue, Repaid/Paid**. If the screen is too crowded, make chips horizontally scrollable or use a filter sheet.
- Counts must match the displayed filter rules.
- Summary panel should be context-aware: show Lent Outstanding and Borrowed Outstanding separately or adapt to the selected direction.
- Loan cards show initials, person name, direction, amount, due/paid date, status, and an action where appropriate.
- Overdue cards use red treatment, pending amber, settled green.
- Empty state should explain the selected filter has no records.

### 7. Account / Settings
Use the supplied Account screenshot.
- Profile card and phone verification state.
- Show active loans and lent/borrowed totals separately, or label any combined count/total explicitly.
- Currency preference INR/default.
- Friendly Reminders, Screen Lock, receipt upload, and CSV export only if actually implemented.
- App name/version and Sign Out with confirmation.

## Popups and modals
1. Add Loan form with the direction selector.
2. Mark as Repaid/Paid confirmation that names the person, amount, and direction.
3. Loan Saved success toast/banner after API success; include direction in message.
4. Due Date Picker.
5. Receipt Attachment only if upload is implemented.
6. Logout Confirmation.

## Reusable components
Consider `AppHeader`, `BottomTabBar`, `SummaryCard`, `LoanCard`, `LoanTypeSelector`, `StatusBadge`, `FilterChip`, `PrimaryButton`, `FormField`, `EmptyState`, `LoadingState`, `ErrorState`, and `ConfirmDialog`. Reuse current project components and dependencies.

## Accessibility and data integrity
- Accessible labels for icon-only actions, readable contrast, comfortable touch targets.
- Support keyboard avoidance and scrolling.
- Avoid horizontal overflow.
- Screenshot values are illustrative only; production views must use API responses.
- A loan is overdue only when unpaid and due date is before the current date.
- Never show a “paid on” date unless stored by the backend.
- The current user's loan direction is per record; don't model this as a shared account between two app users.
