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

### 1. Login (Phone + Password)
- Dedicated login screen with Brand and purpose statement.
- Mobile number field with +91 default country code.
- Password field with show/hide toggle.
- Primary "Login" button with validation and loading state.
- Secondary "Create Account" link directing to Signup flow.
- Clear error banner handling `INVALID_CREDENTIALS` and `PASSWORD_NOT_SET` (redirecting legacy accounts to OTP password setup).

### 2. Signup Flow
- Step A: Enter mobile number with +91 country code and press "Get Verification Code".
- Step B: Enter 6-digit OTP with expiry timer and resend action.
- Step C: Complete Profile screen (Full Name - required; Email - optional; Password & Confirm Password - required).
- Submit creates verified account and transitions directly to Dashboard.

### 3. Dashboard
Use the supplied Dashboard screenshot as the visual reference.
- Greeting displaying user's name (fallback to masked phone).
- Show distinct summary figures for **Lent Outstanding**, **Borrowed Outstanding**, **Net Position** (Receivable / Payable / Settled), **Overdue Receivable**, and **Overdue Payable**.
- Quick actions: Add Loan and All Loans.
- Recent Loans can contain both directions; each card displays clear direction badge, counterparty identity badge (Registered vs External), and correct wording.
- Include loading, empty, and API-error states.

### 4. Add Loan
Dedicated modal / bottom sheet.
- First choice: Direction selector (**I've Lent** vs **I've Borrowed**).
- Counterparty selection:
  - Search field to discover registered MiniLedger users by name or phone.
  - Interactive search result list showing Name and masked phone number (+91 98••• ••210) with a "Registered" badge.
  - Option to **Add someone outside MiniLedger** (prompts for external friend's name and optional phone).
  - Clear visual indicator of chosen counterparty with an option to change/remove selection.
- Amount in INR (required, positive number, decimal-safe).
- Due date (required, valid date with +7d, +14d, +30d quick chips).
- Inline validation, prevention of duplicate submissions, and Royal Obsidian design system styling.

### 5. Loan Details & Netting
Use the supplied Loan Details screenshot as the layout reference.
- Person name/initials, direction badge, amount, due date, and current status.
- Counterparty badge: "Registered User" or "External Contact".
- **Pairwise Net Balance Card** (when loan has a registered counterparty):
  - Shows total Lent to that user and total Borrowed from that user.
  - Displays computed net balance (e.g., "Priya owes you ₹3,000.00 net" or "You owe Priya ₹1,000.00 net" or "Settled / No net balance").
  - Explanatory note: "Original records remain unchanged for auditability."
- Direction-aware repayment action: "Mark as Repaid" (Lent) or "Mark as Paid" (Borrowed) with confirmation dialog.

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
- Profile card with phone verification badge and interactive **Edit Profile** action.
- Edit Profile modal with prefilled Name and Email, read-only phone number, input validation, and secure phone OTP verification before committing changes.
- Show active loans and lent/borrowed totals separately, or label any combined count/total explicitly.
- Currency preference INR/default.
- Screen Lock / Biometrics toggle has been deliberately removed (real security is enforced via phone OTP verification, password hashing, and JWT tokens).
- **Export Ledger as PDF**: Functional modal allowing users to configure direction, status, and date range filters, generating an authoritative PDF Personal Loan Ledger Statement downloadable and shareable via native device capabilities.
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
