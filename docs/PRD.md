# Flowday — Product Requirements Document

**Version:** 1.0  
**Author:** Fredrick Nyangau  
**Date:** July 2026  
**Status:** Draft  

---

## 1. Overview

### 1.1 Product Summary

Flowday is a calm day planning system built for academic freelancers who
manage multiple clients, same-day deadlines, and overnight work sessions.
It removes the cognitive load of deciding what to work on next so the user
can focus entirely on the work itself.

### 1.2 The Problem

Academic freelancers managing 5 or more clients on WhatsApp have no
structured system for tracking assignments. Deadlines arrive informally,
priorities shift constantly, and critical personal time (sleep, meals,
personal learning) gets sacrificed without warning. The result is a stress
level of 8 out of 10, near-missed deadlines, and less than 4 hours of
sleep per night.

### 1.3 The Solution

A Progressive Web App that:
- Gives the user one clear answer to "what do I work on right now"
- Tracks every assignment from intake to submission
- Protects non-negotiable personal blocks (reading, learning, nap, sleep)
- Warns the user before a day becomes overloaded — not after

### 1.4 Target User

**Primary user:** A solo academic freelancer with the following profile:
- 5 to 6 active clients sending work via WhatsApp
- Mostly same-day deadlines
- Works overnight, sleeps less than 4 hours
- Uses phone and laptop interchangeably
- Stress level 8 out of 10 on a typical day
- Wants to learn coding but has no protected time for it yet

---

## 2. Goals and Non-Goals

### 2.1 Goals

- Reduce time spent deciding what to work on next to zero
- Surface overdue and near-due assignments before they become emergencies
- Protect the reading block, learning block, nap, and sleep every day
- Be usable on both Android phone and laptop from the same URL
- Load fast and work offline (PWA)

### 2.2 Non-Goals (MVP)

- Client communication or WhatsApp integration
- AI-generated task suggestions
- Team or multi-user support
- Payment processing
- Mobile app store distribution
- Calendar sync (Google Calendar, Outlook)

---

## 3. User Stories

### MVP

| ID | As a user I want to... | So that... |
|----|------------------------|------------|
| US-01 | Log a new assignment with client, type, deadline, and word count | I never lose track of what came in |
| US-02 | See all assignments due today sorted by urgency | I always know what to work on first |
| US-03 | See a live countdown per assignment | I know exactly how much time I have left |
| US-04 | Mark an assignment as In Progress, Submitted, or Overdue | My list stays accurate as I work |
| US-05 | See my daily schedule with protected blocks clearly marked | I know when to work and when to stop |
| US-06 | Be warned when a deadline is under 2 hours away | I never get caught off guard |

### Phase 2

| ID | As a user I want to... | So that... |
|----|------------------------|------------|
| US-07 | See a weekly view of assignments grouped by day | I know which days are overloaded before they arrive |
| US-08 | See per-client assignment counts and earnings | I understand my workload distribution |
| US-09 | Receive a browser push notification before a deadline | I am reminded even when the app is not open |
| US-10 | See estimated hours per assignment based on word count | I can plan my sessions realistically |

### Phase 3

| ID | As a user I want to... | So that... |
|----|------------------------|------------|
| US-11 | Have a protected 30-minute daily learning block | I make consistent progress toward coding skills |
| US-12 | Track income per assignment and per week | I have a clear picture of my earnings |
| US-13 | See a burnout warning when sleep or stress patterns are critical | I can act before I break down |

---

## 4. Features

### 4.1 MVP Features

#### Assignment Intake
- Fields: client name, assignment type, course or subject,
  word count, deadline date, deadline time, notes
- Estimated hours auto-calculated from word count at 300 words per hour
- Status options: Not started, In progress, Submitted, Overdue

#### Today View
- Lists all assignments due within the current work day
- Work day defined as 08:00 to 08:00 the following day
  (overnight sessions stay attached to the correct day)
- Sorted by deadline proximity — most urgent at the top
- Live countdown per assignment
  - Green: more than 6 hours remaining
  - Orange: under 6 hours remaining
  - Red: under 2 hours remaining or overdue

#### Daily Schedule Panel
- Displays the user's fixed daily routine alongside the task list
- Protected blocks rendered in green and clearly labelled
- Blocks: wake up, baby drop-off, reading, learning, chores,
  work sessions, nap, overnight session, sleep

#### Deadline Alert
- Visual indicator on the Today view when any assignment hits the 2-hour mark
- Phase 2 will upgrade this to a browser push notification

### 4.2 Phase 2 Features

- Weekly view with per-day assignment counts and overload flag
- Client tracker with active, submitted, and overdue counts
- Browser push notifications via Web Push API
- Estimated hours engine visible on the Today view

### 4.3 Phase 3 Features

- Daily learning block tracker with streak counter
- Income tracker per assignment and weekly total
- Burnout indicator based on overdue count and workload density

---

## 5. Technical Architecture

### 5.1 Stack

| Layer | Technology | Reason |
|-------|-----------|--------|
| Frontend | React 19 + TypeScript | Known stack from ZealSync |
| Styling | Tailwind CSS + shadcn/ui | Consistent with existing projects |
| State | TanStack Query | Server state management |
| PWA | Vite PWA plugin | Offline support and home screen install |
| Backend | FastAPI + Python | Primary learning track |
| Database | PostgreSQL | Raw SQL via asyncpg |
| Auth | JWT | Simple token-based auth for single user |
| Hosting | Vercel (frontend) + Railway (backend) | Free tier, fast deploy |

### 5.2 Day Boundary

The system defines a work day as 08:00 to 07:59 the following day.
This keeps overnight assignments attached to the day they were started
rather than rolling over to a new day at midnight.

### 5.3 Estimated Hours Formula
estimated_hours = CEILING(word_count / 300, 0.5)
Minimum returned: 0.5 hours. This is a conservative academic writing pace
and will be adjustable per user in Phase 2.

---

## 6. Design Principles

1. **One answer per screen.** Every view must answer one question clearly.
   The Today view answers: what do I work on right now.

2. **Calm over density.** No dashboards packed with widgets. White space
   is a feature.

3. **Protected time is non-negotiable.** The reading block, learning block,
   nap, and sleep cannot be removed or overwritten by the system.

4. **Works on any device.** The same URL opens correctly on Android Chrome
   and a laptop browser without any adjustment from the user.

5. **Reduce decisions, do not create new ones.** Every screen should leave
   the user with less to think about than when they arrived.

---

## 7. MVP Scope Definition

### In scope for MVP
- Assignment intake form
- Today view with countdown and urgency colour coding
- Status update per assignment
- Daily schedule panel with protected blocks
- Single user, no authentication required for MVP

### Out of scope for MVP
- User accounts and login
- Push notifications
- Weekly view
- Client tracker
- Income tracking
- Learning block streak
- Offline sync

---

## 8. Milestones

| Milestone | Scope | Target |
|-----------|-------|--------|
| M0 | Project setup, PRD, schema, wireframes | Week 1 |
| M1 | Backend: assignment CRUD endpoints | Week 2 |
| M2 | Frontend: Today view + assignment intake | Week 3 |
| M3 | Frontend: Daily schedule panel | Week 3 |
| M4 | MVP live on Vercel + Railway | Week 4 |
| M5 | Phase 2: weekly view + client tracker | Week 6 |
| M6 | Phase 2: push notifications | Week 7 |
| M7 | Phase 3: learning block + income tracker | Week 10 |

---

## 9. Success Metrics

| Metric | Target |
|--------|--------|
| User opens the app daily | 7 days in a row within first 2 weeks |
| Zero missed deadlines | First 30 days after go-live |
| Reading block protected | At least 5 out of 7 days per week |
| Learning block completed | At least 4 out of 7 days per week |
| User-reported stress level | Down from 8 to 5 within 60 days |

---

## 10. Open Questions

- [ ] Should the MVP require login or be open (single user, no auth)?
- [ ] What is the exact word-per-hour pace for this user?
- [ ] Should client names be editable inside the app or fixed at setup?
- [ ] Does she want income tracking from day one or Phase 2?

---

*This document will be updated as decisions are made. All changes
committed to version control with a clear commit message.*
