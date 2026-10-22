# MiniLedger Design Brief — Stitch to React Native

Purpose: This document guides UI generation in Stitch and the migration of the chosen design into the real Expo React Native app. Stitch output is a visual reference, not the app implementation.

## Product design goal
Create a clear, trustworthy personal lending ledger for one user. Prioritize glanceable totals, readable loan status and fast entry creation. Avoid visual clutter and unnecessary animation.

## Target
- Mobile-first Android screen.
- React Native + Expo + TypeScript implementation.
- Design for common phone widths, safe areas, touch-friendly controls and readable text.
- INR currency display.
- Calm neutral background, dark readable text, one restrained primary accent, red/orange overdue status, muted green repaid status.
- Ensure status is not communicated by color alone; include text/icon labels.

## Screens to design
1. **Phone login**: brand name, short explanation, phone input, country code support appropriate to initial India-focused demo, continue button, validation and loading state.
2. **OTP verification**: six-digit OTP input, masked phone number, verify button, resend cooldown/status, clear invalid/expired state. Do not display OTP on screen.
3. **Dashboard**: title, summary cards for Total lent, Repaid, Outstanding and Overdue; “Add loan” primary action; list of recent loans; empty state.
4. **Loan list/card**: friend name, amount, due date, status label, overdue emphasis, mark-repaid action for unpaid entries.
5. **Add loan**: friend name, amount in INR, due-date picker, validation text, save/cancel actions.
6. **Error/loading states**: offline API, loading list, empty list, invalid input, failed save, successful repayment confirmation.

## Layout guidance
- Keep summary hierarchy clear: Outstanding and Overdue should be easy to identify.
- Use consistent spacing and typography scales.
- Use cards sparingly; do not put every field in a separate card.
- Buttons and inputs should be comfortable to tap.
- Avoid charts unless they clearly add value; the assignment only requires summary totals.
- Provide scroll behavior for small screens and keyboard-aware forms.
- Ensure text contrast and accessible labels.

## Stitch workflow
1. Paste the prompt below into Stitch and generate the screens.
2. Review the screens against `SPEC.md`; reject concepts that add out-of-scope features.
3. Export or capture the selected design reference and keep it in project assets only if licensing/usage permits.
4. Translate the design into reusable React Native components; do not copy web-only HTML/CSS into React Native.
5. Build real input, navigation, loading and error states; do not leave static mock data in the final flow.
6. Verify on a physical Android phone or emulator and adjust spacing for real device dimensions.

## Reusable Stitch prompt
Design a polished, minimal Android mobile app named MiniLedger for tracking money lent to friends. Create connected screens for phone-number login with mock OTP verification, a dashboard with Total Lent, Total Repaid, Outstanding and Overdue summary cards, a list of loans with overdue entries clearly highlighted, and an add-loan form with friend name, INR amount and due date. Use a calm neutral palette, one restrained primary accent, accessible contrast, readable typography, clear status labels and touch-friendly controls. Include loading, empty, validation and error states. Keep the scope strictly to the assignment: no bank integration, payments, charts, social feed or subscription UI. Use realistic but fictional demo data. This is a mobile app design for React Native, not a web dashboard.

## Design-to-code checklist
- [ ] Selected screens match `SPEC.md`.
- [ ] Components are feasible in React Native.
- [ ] Navigation and form states are specified.
- [ ] Overdue and repaid states are distinct without relying on color alone.
- [ ] Design is responsive on Android.
- [ ] No hardcoded demo data remains in production data flow.
- [ ] Visual test completed on device.
