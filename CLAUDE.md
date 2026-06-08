@AGENTS.md


# CLAUDE.md

# RoomSync - Flatmate Operating System

## Project Overview

RoomSync is a modern Flatmate Operating System (FOS) designed for shared living environments including flats, PGs, hostels, co-living spaces, student accommodations, and travel groups.

The platform centralizes:

* Expense Management
* Rent Tracking
* Utility Bills
* Chore Management
* Inventory Management
* Asset Tracking
* Settlement Optimization
* Realtime Communication
* Push Notifications
* AI Insights

RoomSync is NOT an expense-splitting clone.

RoomSync should feel like a complete operating system for shared living.

---

# Tech Stack (MANDATORY)

Claude must NEVER introduce alternative technologies unless explicitly requested.

Frontend:

* Next.js 15+
* React 19+
* TypeScript
* App Router
* Tailwind CSS v4
* shadcn/ui (Radix)
* Lucide Icons

Backend:

* Next.js Route Handlers

Database:

* PostgreSQL

ORM:

* Drizzle ORM

Authentication:

* NextAuth

Validation:

* Zod

Forms:

* React Hook Form

State Management:

* Zustand

Realtime:

* Socket.io

Notifications:

* Web Push API
* PWA

Deployment:

* Vercel

Package Manager:

* npm

---

# Development Principles

Always follow:

1. TypeScript Strict Mode
2. Server Components by default
3. Client Components only when necessary
4. Mobile-first design
5. Reusable component architecture
6. Clean folder structure
7. SOLID principles
8. DRY principle
9. Accessibility best practices
10. Production-ready code

Never generate:

* JavaScript files
* Redux
* Context API for global state
* Prisma
* MongoDB
* Material UI
* Bootstrap
* Chakra UI

Unless explicitly requested.

---

# Project Structure

src/
│
├── app/
│ ├── (auth)/
│ ├── dashboard/
│ ├── flats/
│ ├── expenses/
│ ├── settlements/
│ ├── chores/
│ ├── inventory/
│ ├── assets/
│ ├── notifications/
│ ├── chat/
│ ├── settings/
│ └── api/
│
├── components/
│ ├── ui/
│ ├── layout/
│ ├── dashboard/
│ ├── expenses/
│ ├── chores/
│ ├── inventory/
│ ├── chat/
│ └── shared/
│
├── db/
│ ├── schema/
│ ├── migrations/
│ └── index.ts
│
├── hooks/
│
├── lib/
│
├── services/
│
├── store/
│
├── types/
│
├── constants/
│
└── utils/

---

# Core Modules

## Authentication

Features:

* Register
* Login
* Logout
* Forgot Password
* Email Verification
* Protected Routes
* Role Based Access

Roles:

* Owner
* Admin
* Member

---

## Flat Management

Features:

* Create Flat
* Join Flat
* Invite Members
* Remove Members
* Leave Flat
* Manage Permissions

---

## Expense Management

Features:

* Add Expense
* Edit Expense
* Delete Expense
* Expense Categories
* Receipt Upload
* Split Equally
* Split By Percentage
* Split By Amount
* Custom Participants

Categories:

* Groceries
* Rent
* Utilities
* Internet
* Repairs
* Maintenance
* Entertainment
* Miscellaneous

---

## Settlement System

Features:

* Debt Calculation
* Smart Settlement Optimization
* Settlement History
* Payment Records

Goal:

Minimize total transactions.

---

## Rent & Bills

Features:

* Rent Tracking
* Electricity Bills
* Water Bills
* Internet Bills
* Recurring Bills
* Due Date Reminders

---

## Chore Management

Features:

* Create Chore
* Assign Chore
* Recurring Chores
* Completion Tracking
* Notifications

Examples:

* Cleaning
* Garbage
* Laundry
* Grocery Shopping

---

## Inventory Management

Features:

* Grocery Tracking
* Household Items
* Quantity Tracking
* Low Stock Alerts

---

## Asset Management

Features:

* Shared Assets
* Ownership Tracking
* Purchase History

Examples:

* Refrigerator
* Washing Machine
* Microwave
* Furniture

---

## Chat Module

Realtime Features:

* Group Chat
* System Messages
* Expense Updates
* Chore Updates

Realtime powered by Pusher.

---

## Notification System

Types:

* In-App Notifications
* Push Notifications

Triggers:

* New Expense
* New Chore
* Due Bills
* Settlement Requests
* Flat Invitations

---

# Database Design Rules

Use Drizzle ORM.

Use:

* UUID primary keys
* createdAt
* updatedAt

for all tables.

Never use:

* integer auto increment IDs

unless absolutely necessary.

---

# Required Tables

users

flats

flat_members

expenses

expense_participants

settlements

payments

chores

inventory_items

assets

notifications

messages

push_subscriptions

audit_logs

---

# UI Guidelines

Design Inspiration:

* Linear
* Notion
* Splitwise
* Vercel

Requirements:

* Clean
* Modern
* Minimal
* Responsive
* Fast

Use:

* Cards
* Data Tables
* Dialogs
* Drawers
* Tabs
* Badges
* Skeleton Loaders

Avoid:

* Heavy animations
* Excessive gradients
* Visual clutter

---

# Performance Requirements

* Use Server Components where possible
* Implement Pagination
* Implement Lazy Loading
* Optimize Images
* Minimize Client Components
* Use Suspense
* Avoid unnecessary re-renders

Target:

* Lighthouse Score > 80

---

# Security Requirements

Must implement:

* Input Validation
* Rate Limiting
* CSRF Protection
* Secure Cookies
* Password Hashing
* SQL Injection Protection
* Authorization Checks

Never trust client-side permissions.

---

# Code Standards

Always:

* Use TypeScript types
* Create reusable components
* Use server actions where appropriate
* Use async/await
* Add loading states
* Add error handling
* Add empty states

Every feature must include:

* Loading State
* Error State
* Success State
* Empty State

---

# PWA Requirements

Must support:

* Installable App
* Offline Support
* Push Notifications
* App Manifest
* Service Worker

---

# Future AI Features

Architecture should support:

* OCR Receipt Scanning
* AI Expense Categorization
* Spending Insights
* Predictive Grocery Planning
* Voice Expense Entry
* Smart Recommendations

Build the system so future AI features can be added without major refactoring.

---

# Claude Instructions

Before generating code:

1. Check existing project structure.
2. Reuse existing components whenever possible.
3. Avoid duplicate logic.
4. Avoid duplicate API routes.
5. Follow existing naming conventions.
6. Keep code production-ready.
7. Do not create unnecessary files.
8. Do not change architecture without explanation.

When implementing a feature:

1. Explain the plan.
2. List affected files.
3. Generate code.
4. Explain database changes.
5. Mention any environment variables required.

Always act like a senior staff engineer working on a production SaaS application.
