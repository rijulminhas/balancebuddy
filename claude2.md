You are working on the BalanceBuddy application. Implement a secure payment confirmation workflow for the Settlement Module.

## Current Problem

Currently, when User A records a payment for a settlement, the settlement is automatically marked as completed. This is incorrect because User B may not have actually received the payment yet.

## New Settlement Flow

Replace the current flow:

Pending → Settled

with:

Pending → Awaiting Confirmation → Settled

## Required Implementation

### 1. New Settlement Status

Add a new status:

* Pending
* Awaiting Confirmation
* Settled

### 2. Record Payment Flow

When User A (debtor/payer) submits the "Record Payment" form:

* Do NOT mark the settlement as Settled.
* Change the settlement status to "Awaiting Confirmation".
* Store:

  * payment amount
  * payment method (Cash, UPI, Bank Transfer, Other)
  * notes (optional)
  * transaction reference (optional)
  * submittedAt timestamp
  * submittedBy user id

### 3. Push Notification

After User A submits a payment record:

Send a PWA Push Notification to User B (creditor/payee).

Notification Example:

Title:
Payment Confirmation Required

Message:
{User A Name} has recorded a payment of ₹{amount} for settlement "{expense name}". Please confirm whether you have received the payment.

Clicking the notification should open the relevant settlement details page.

### 4. Dashboard Alert UI

User B must immediately see a highlighted alert card on the Dashboard.

Conditions:

* Only visible to the payment receiver (User B).
* Show all settlements awaiting confirmation.

Card Example:

Payment Confirmation Required

{User A Name} claims to have paid ₹500 for Dinner Expense.

[Confirm Payment]
[Reject Payment]

Use a visually highlighted design so it is noticeable.

### 5. Settlement Screen UI

In the Settlement Module, add a dedicated section:

Awaiting Your Confirmation

Display all payment requests waiting for confirmation.

For each item show:

* Expense Name
* Amount
* Payer Name
* Payment Method
* Transaction Reference
* Notes
* Submitted Date

Actions:

[Confirm Payment]
[Reject Payment]

### 6. Confirm Payment Action

When User B clicks Confirm Payment:

* Change settlement status from Awaiting Confirmation to Settled.
* Mark settlement as completed.
* Update settlement balances.
* Create activity history entry.
* Notify User A.

Notification Example:

Title:
Payment Confirmed

Message:
{User B Name} has confirmed receipt of your payment of ₹{amount}.

### 7. Reject Payment Action

When User B clicks Reject Payment:

* Change settlement status back to Pending.
* Preserve rejection history.
* Store:

  * rejectedBy
  * rejectedAt
  * rejectionReason (optional)

Notify User A.

Notification Example:

Title:
Payment Rejected

Message:
Your payment request for ₹{amount} was rejected. Please review and resubmit if necessary.

### 8. Settlement History

Add settlement activity tracking:

Payment Recorded
Payment Confirmed
Payment Rejected

Include:

* user name
* action
* timestamp

### 9. Access Control

Only the payment receiver (User B) can:

* Confirm payment
* Reject payment

User A must never be able to approve their own payment.

Verify authorization on both frontend and backend.

### 10. Dashboard Counters

Add a count of pending confirmations:

Example:

Awaiting Confirmation (3)

Show on:

* Dashboard
* Settlement Module navigation/tab

### 11. Reminder Notifications

If a payment remains in Awaiting Confirmation status:

* Send a reminder notification after 24 hours.
* Continue showing the dashboard alert until action is taken.

### 12. Database & API Updates

Update all:

* database schema
* types
* validation schemas
* API routes
* server actions
* frontend components
* notifications
* activity logs

Ensure existing settlements continue working without data loss.

### 13. Code Quality Requirements

* Follow existing project architecture and coding patterns.
* Maintain TypeScript type safety.
* Handle loading states.
* Handle error states.
* Prevent duplicate confirmations.
* Prevent duplicate payment submissions.
* Prevent race conditions.
* Ensure optimistic UI updates are safe.
* Ensure all settlement calculations remain accurate.

Before coding, analyze the existing Settlement Module and integrate the feature cleanly without breaking any current functionality.
