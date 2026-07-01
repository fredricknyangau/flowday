# Flowday — Screen Wireframes

**Version:** 1.0  
**Author:** Fredrick Nyangau  
**Date:** July 2026  
**Status:** Draft  

---

## Notes

- All wireframes are mobile-first (375px base width)
- The same layout scales to laptop via a two-column split
- Protected blocks are always rendered in green
- Urgency colours: green (6+ hrs) / orange (under 6 hrs) / red (under 2 hrs or overdue)
- Bottom navigation is fixed and present on all screens

---

## Screen 1 — Today View

> Answers one question: what do I work on right now?

```
┌─────────────────────────────────┐
│  Flowday            Tue 1 Jul   │  ← top bar, date always visible
├─────────────────────────────────┤
│  Good morning ☀️                │
│  You have 4 assignments today   │  ← summary line, updates live
├─────────────────────────────────┤
│                                 │
│  TODAY'S ASSIGNMENTS            │  ← section label
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🔴  Lorah — Essay           │ │  ← RED: under 2 hrs
│ │     Nursing 4400            │ │
│ │     1200 words · 4 hrs est  │ │
│ │     Due 11:59 PM · 1hr 32m  │ │  ← live countdown
│ │     [ In Progress        ▾] │ │  ← status dropdown
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🟠  Adriele — Discussion    │ │  ← ORANGE: under 6 hrs
│ │     HIS 410                 │ │
│ │     400 words · 1.5 hrs est │ │
│ │     Due 11:59 PM · 4hr 10m  │ │
│ │     [ Not Started        ▾] │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🟢  Harnala — Module        │ │  ← GREEN: 6+ hrs remaining
│ │     Module 5                │ │
│ │     800 words · 2.5 hrs est │ │
│ │     Due 11:59 PM · 8hr 45m  │ │
│ │     [ Not Started        ▾] │ │
│ └─────────────────────────────┘ │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 🟢  Shefin — Assignment     │ │
│ │     NUR 437                 │ │
│ │     1000 words · 3.5 hrs est│ │
│ │     Due 11:59 PM · 10hr 20m │ │
│ │     [ Not Started        ▾] │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│  TODAY'S SCHEDULE               │  ← section label
│                                 │
│ ┌─────────────────────────────┐ │
│ │ 09:30  READING BLOCK     🟢 │ │  ← green = protected
│ │ 10:30  LEARNING — coding 🟢 │ │
│ │ 11:00  Chores + Breakfast   │ │
│ │ 11:30  Work session 1       │ │  ← active block highlighted
│ │ 13:30  Short break          │ │
│ │ 13:45  Work session 2       │ │
│ │ 17:00  EVENING NAP       🟢 │ │
│ │ 19:00  Work session 3       │ │
│ │ 22:00  Overnight session    │ │
│ │ 03:00  Sleep             🟢 │ │
│ └─────────────────────────────┘ │
│                                 │
├─────────────────────────────────┤
│  [TODAY]  [+ ADD]  [WEEK]       │  ← fixed bottom nav
└─────────────────────────────────┘
```

**Behaviour notes:**

- Assignment cards are sorted by deadline ascending — most urgent at top
- Status dropdown updates the card colour immediately on change
- When status changes to Submitted the card moves to the bottom
  and is greyed out
- The schedule panel scrolls independently from the assignment list
- The current active schedule block is highlighted in blue
- Tapping a card expands it to show full notes
- Protected schedule blocks show a lock icon and cannot be tapped away

---

## Screen 2 — Add Assignment

> Triggered by tapping the [+ ADD] button in the bottom nav

```
┌─────────────────────────────────┐
│  ←  New Assignment              │  ← back arrow returns to Today
├─────────────────────────────────┤
│                                 │
│  CLIENT                         │
│ ┌─────────────────────────────┐ │
│ │  Select client           ▾  │ │  ← dropdown from clients table
│ └─────────────────────────────┘ │
│                                 │
│  ASSIGNMENT TYPE                │
│ ┌─────────────────────────────┐ │
│ │  Select type             ▾  │ │  ← controlled list from schema
│ └─────────────────────────────┘ │
│                                 │
│  COURSE / SUBJECT               │
│ ┌─────────────────────────────┐ │
│ │  e.g. NUR 437               │ │  ← free text
│ └─────────────────────────────┘ │
│                                 │
│  WORD COUNT                     │
│ ┌─────────────────────────────┐ │
│ │  e.g. 1200                  │ │  ← numeric input
│ └─────────────────────────────┘ │
│                                 │
│  DEADLINE                       │
│ ┌──────────────┐ ┌────────────┐ │
│ │  01/07/2026  │ │  11:59 PM  │ │  ← date + time side by side
│ └──────────────┘ └────────────┘ │
│                                 │
│  PAYMENT (KES) — optional       │
│ ┌─────────────────────────────┐ │
│ │  e.g. 500                   │ │
│ └─────────────────────────────┘ │
│                                 │
│  NOTES — optional               │
│ ┌─────────────────────────────┐ │
│ │                             │ │
│ │                             │ │  ← multiline text area
│ └─────────────────────────────┘ │
│                                 │
│  ┌───────────────────────────┐  │
│  │  ESTIMATED TIME: 4.0 hrs  │  │  ← auto-calculated from word count
│  └───────────────────────────┘  │  ← updates live as user types
│                                 │
│  ┌───────────────────────────┐  │
│  │      SAVE ASSIGNMENT      │  │  ← primary CTA
│  └───────────────────────────┘  │
│                                 │
│  ┌───────────────────────────┐  │
│  │          CANCEL           │  │  ← secondary, returns to Today
│  └───────────────────────────┘  │
│                                 │
├─────────────────────────────────┤
│  [TODAY]  [+ ADD]  [WEEK]       │
└─────────────────────────────────┘
```

**Behaviour notes:**

- Client dropdown is populated from the clients table
- Estimated hours updates live as the user types the word count
  using CEILING(word_count / 300, 0.5)
- Deadline date defaults to today, time defaults to 11:59 PM
- All required fields show a red border and inline error if empty on save
- On successful save the user is returned to the Today view
  and the new assignment appears immediately in the correct urgency position
- The form does not clear between saves within the same session
  so that adding multiple assignments back-to-back is fast

---

## Screen 3 — Weekly View

> Answers one question: which days this week are overloaded?

```
┌─────────────────────────────────┐
│  Flowday            Week View   │
├─────────────────────────────────┤
│                                 │
│  Week of 30 Jun — 6 Jul 2026   │
│                                 │
│ ┌─────┬──────────────────────┐  │
│ │ MON │ ░░░░░░░░░░░░░░░░░░░  │  │  ← past day, greyed
│ │ 30  │  2 assignments  ✓   │  │
│ ├─────┼──────────────────────┤  │
│ │ TUE │ ████████████████████ │  │  ← today, highlighted
│ │  1  │  4 assignments  ⚠️   │  │  ← orange: approaching overload
│ ├─────┼──────────────────────┤  │
│ │ WED │ ██████████████       │  │
│ │  2  │  3 assignments  ✓   │  │
│ ├─────┼──────────────────────┤  │
│ │ THU │ ████████████████████ │  │  ← red: overloaded (5 assignments)
│ │  3  │  5 assignments  🔴   │  │
│ ├─────┼──────────────────────┤  │
│ │ FRI │ ████                 │  │
│ │  4  │  1 assignment   ✓   │  │
│ ├─────┼──────────────────────┤  │
│ │ SAT │                      │  │
│ │  5  │  No assignments      │  │
│ ├─────┼──────────────────────┤  │
│ │ SUN │                      │  │
│ │  6  │  No assignments      │  │
│ └─────┴──────────────────────┘  │
│                                 │
├─────────────────────────────────┤
│  WEEKLY SUMMARY                 │
│                                 │
│  Total assignments    15        │
│  Submitted             2        │
│  Still pending        11        │
│  Overdue               2        │
│  Total est. hours     38.5      │
│  Earnings this week  KES 3,200  │
│                                 │
├─────────────────────────────────┤
│  [TODAY]  [+ ADD]  [WEEK]       │
└─────────────────────────────────┘
```

**Behaviour notes:**

- Past days are greyed out but still tappable to see what was due
- Today's row is always highlighted with a blue left border
- Tapping any day row expands it to show the assignment list for that day
- Overload threshold: more than 3 assignments OR more than 9 estimated hours
  - Green check: within threshold
  - Orange warning: 3 assignments or 7 to 9 hours
  - Red alert: more than 3 assignments or more than 9 hours
- The bar inside each row is a visual fill proportional to load
- Weekly summary pulls live from the assignments table
- Earnings only counts assignments with status Submitted

---

## Laptop Layout (two-column split)

On screens wider than 768px the layout switches to side by side.

```
┌──────────────────────┬──────────────────────┐
│                      │                      │
│  TODAY'S             │  TODAY'S             │
│  ASSIGNMENTS         │  SCHEDULE            │
│                      │                      │
│  [card]              │  09:30 READING  🟢   │
│  [card]              │  10:30 LEARNING 🟢   │
│  [card]              │  11:30 Work 1        │
│  [card]              │  13:45 Work 2        │
│                      │  17:00 NAP      🟢   │
│                      │  22:00 Overnight     │
│                      │  03:00 Sleep    🟢   │
│                      │                      │
├──────────────────────┴──────────────────────┤
│  [TODAY]          [+ ADD]          [WEEK]   │
└─────────────────────────────────────────────┘
```

---

## Component Inventory

These are the reusable components that will be built in the frontend.

| Component | Used On | Notes |
|-----------|---------|-------|
| AssignmentCard | Today | Urgency colour, countdown, status dropdown |
| CountdownTimer | AssignmentCard | Live updating, colour coded |
| StatusDropdown | AssignmentCard | Updates DB on change |
| SchedulePanel | Today | Scrollable, highlights active block |
| ScheduleBlock | SchedulePanel | Green + lock icon if protected |
| AddAssignmentForm | Add screen | All fields, live hour estimate |
| EstimatedHoursBadge | AddAssignmentForm | Live calc from word count |
| WeekRow | Weekly | Expandable, load bar, overload flag |
| WeeklySummary | Weekly | Aggregate stats |
| BottomNav | All screens | Fixed, three tabs |
| TopBar | All screens | Title + current date |

---

*Wireframes version 1.0 — updates committed with message: docs: update wireframes vX.X*
