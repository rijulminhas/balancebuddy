# BalanceBuddy - Personal Finance Module Implementation

Add a new header navigation button named **"Personal Finance"** alongside the existing navigation items.

## Navigation Behavior

* Clicking **Personal Finance** should switch the user from the Group Expense Management section to a dedicated Personal Finance section.
* The Personal Finance module should be completely isolated from Group Expenses, Groups, Settlements, and Shopping Lists.
* Only the logged-in user can access and view their own Personal Finance data.
* Follow the existing BalanceBuddy UI design system, color palette, card styles, spacing, responsiveness, authentication flow, and project architecture.
* Use existing project patterns for database schema, API routes, server actions, validation, loading states, empty states, error handling, and permissions.

---

# Personal Finance Dashboard

Create a dashboard overview displaying:

* Total Income (Current Month)
* Total Expenses (Current Month)
* Total Investments (Current Month)
* Total Savings (Current Month)
* Total Loan/EMI Payments (Current Month)
* Net Cash Flow

Display all values in summary cards similar to existing BalanceBuddy analytics cards.

Add:

* Monthly financial overview chart
* Expense category breakdown
* Income vs Expense chart
* Recent transactions section

---

# Module 1: Income Management

Create an Income module where users can manage income sources.

Fields:

* Title
* Amount
* Income Type

  * Salary
  * Freelancing
  * Business
  * Rental Income
  * Bonus
  * Other
* Date
* Notes

Features:

* Create Income
* Edit Income
* Delete Income
* Monthly Income Summary
* Income History
* Income Filters

---

# Module 2: Personal Expense Management

Create a Personal Expenses module separate from Group Expenses.

Fields:

* Title
* Amount
* Category

  * Food
  * Travel
  * Fuel
  * Shopping
  * Entertainment
  * Bills
  * Healthcare
  * Education
  * Family
  * Other
* Date
* Notes

Features:

* Create Expense
* Edit Expense
* Delete Expense
* Category-wise Summary
* Monthly Expense Summary
* Expense Filters
* Search Expenses

---

# Module 3: Investment Tracker

Create an Investment Management module.

Fields:

* Investment Name
* Amount
* Investment Type

  * SIP
  * Mutual Fund
  * Stocks
  * PPF
  * FD
  * Crypto
  * Gold
  * Other
* Date
* Notes

Features:

* Add Investment
* Edit Investment
* Delete Investment
* Monthly Investment Summary
* Investment History
* Investment Filters

---

# Module 4: Savings Goals

Create a Savings Goal module.

Fields:

* Goal Name
* Target Amount
* Current Saved Amount
* Target Date
* Notes

Features:

* Create Goal
* Update Progress
* Delete Goal
* Progress Percentage
* Progress Bar Visualization
* Goal Completion Tracking

Examples:

* Emergency Fund
* New Bike
* New Car
* Vacation
* House Down Payment

---

# Module 5: Loans & EMI Tracker

Create a Loan Management module.

Fields:

* Loan Name
* Total Loan Amount
* Outstanding Amount
* EMI Amount
* Loan Type

  * Home Loan
  * Car Loan
  * Personal Loan
  * Education Loan
  * Credit Card EMI
  * Other
* Start Date
* End Date

Features:

* Add Loan
* Edit Loan
* Delete Loan
* Outstanding Balance Tracking
* Monthly EMI Summary
* Loan Overview Dashboard

---

# Module 6: Net Worth Dashboard

Create a dedicated Net Worth page.

Net Worth Formula:

Net Worth = Total Assets - Total Liabilities

Assets include:

* Savings
* Investments
* Bank Balance Entries
* Cash Entries

Liabilities include:

* Loans
* EMIs
* Outstanding Debt

Features:

* Current Net Worth
* Monthly Net Worth Trend
* Asset Breakdown
* Liability Breakdown
* Historical Net Worth Chart

---

# Analytics

Add analytics pages for:

* Income Trends
* Expense Trends
* Investment Trends
* Savings Growth
* Loan Overview
* Net Worth Growth

Use the same chart library and UI patterns already used in BalanceBuddy analytics.

---

# Database Requirements

Create separate database tables for:

* personal_incomes
* personal_expenses
* personal_investments
* savings_goals
* loans
* net_worth_snapshots (if required)

All records must be linked to:

* userId
* createdAt
* updatedAt

Use existing Drizzle ORM conventions and schema patterns.

---

# Technical Requirements

* Follow existing Next.js App Router architecture.
* Use existing authentication system.
* Use existing server actions/API patterns.
* Use existing validation approach (Zod if already used).
* Use existing reusable UI components.
* Mobile responsive design required.
* Dark mode compatibility required.
* Proper loading, empty, and error states required.
* Pagination where necessary.
* Search and filtering support where applicable.

---

# Important

Do not add AI Insights yet.

Focus on building a complete Personal Finance Management System that feels like a natural extension of BalanceBuddy and matches the quality, architecture, design patterns, and user experience of the existing application.

Make sure to not change anything in other done screens and done backend , only work for the given things accordingly .