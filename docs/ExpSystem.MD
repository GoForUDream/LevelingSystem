## EXP & Level System Design

---

## Core Philosophy

```
Goal: Build confidence through consistency
─────────────────────────────────────────

• 5 years to reach Level 100 (achievable but requires dedication)
• Early levels = Easy (quick wins, build momentum)
• Mid levels = Steady progress (feel consistent growth)
• High levels = Prestigious (earned through long-term commitment)
• Never reset EXP (cumulative achievement)
```

---

## Rank Tiers → EXP Reward

```
RANK TIERS:
───────────

D-Rank       →  10 EXP     (Quick tasks, small wins)
C-Rank       →  25 EXP     (Simple daily tasks)
B-Rank       →  50 EXP     (Standard tasks)
A-Rank       → 100 EXP     (Important tasks)
S-Rank       → 200 EXP     (Major milestones, life-changing tasks)


Example tasks:
──────────────
D-Rank:    Drink water, make bed, reply to a message
C-Rank:    Read 10 pages, 15-min exercise, organize desk
B-Rank:    Complete work assignment, study 1 hour, gym session
A-Rank:    Finish project, job interview prep, important meeting
S-Rank:    Submit thesis, launch product, major presentation
```

---

## EXP to Level System

```
Design principles:
──────────────────
• Level 1-20:   Fast progression (keep users engaged)
• Level 21-50:  Moderate pace (steady growth)
• Level 51-80:  Slower (dedication required)
• Level 81-100: Prestigious (true commitment)


Target timeline (with consistent daily use):
────────────────────────────────────────────
Level 10:   ~1 month
Level 25:   ~3 months
Level 50:   ~1 year
Level 75:   ~2.5 years
Level 100:  ~5 years
```

---

## The Formula

```
EXP required for each level:
────────────────────────────

Formula: EXP_for_level = Base × (Level ^ Growth_Factor)

Where:
• Base = 100
• Growth_Factor = 1.8

This creates exponential growth that feels fair.
```

---

## Complete Level Table

```
LEVEL    TOTAL EXP NEEDED    EXP TO NEXT LEVEL    APPROX. TIME
─────    ────────────────    ─────────────────    ────────────

  1              0                  100            Day 1
  2            100                  150            ~2 days
  3            250                  200            ~3 days
  4            450                  270            ~4 days
  5            720                  350            ~5 days

  6          1,070                  440            ~1 week
  7          1,510                  550            ~1.5 weeks
  8          2,060                  680            ~2 weeks
  9          2,740                  820            ~2.5 weeks
 10          3,560                  980            ~1 month

 15          9,500                1,800            ~2 months
 20         20,000                2,900            ~3 months
 25         37,000                4,200            ~5 months
 30         62,000                5,800            ~7 months
 35         97,000                7,600            ~10 months
 40        145,000               10,000            ~1 year

 45        210,000               12,500            ~1.3 years
 50        295,000               15,500            ~1.6 years
 55        400,000               19,000            ~2 years
 60        530,000               23,000            ~2.4 years
 65        690,000               27,500            ~2.8 years
 70        880,000               32,500            ~3.3 years

 75      1,100,000               38,000            ~3.8 years
 80      1,360,000               44,000            ~4.2 years
 85      1,660,000               51,000            ~4.5 years
 90      2,010,000               58,000            ~4.7 years
 95      2,410,000               66,000            ~4.9 years
100      2,870,000                  —              ~5 years
```

---

## Daily EXP Target Analysis

```
To reach Level 100 in 5 years:
──────────────────────────────

Total EXP needed: ~2,870,000
Days in 5 years: 1,825 days
Average daily EXP: ~1,570 EXP/day


What does 1,570 EXP/day look like?
──────────────────────────────────

Option 1: Many small tasks
• 10 D-Rank (100) + 10 C-Rank (250) + 10 B-Rank (500) = 850 EXP
• Need about 2x this → Very active user

Option 2: Balanced approach
• 3 D-Rank (30) + 5 C-Rank (125) + 5 B-Rank (250) + 3 A-Rank (300) = 705 EXP
• About 2-3x this needed

Option 3: Focus on important tasks
• 2 D-Rank (20) + 3 C-Rank (75) + 4 B-Rank (200) + 2 A-Rank (200) + 1 S-Rank (200) = 695 EXP
• About 2-3x this needed


Reality check:
──────────────
Level 100 in 5 years requires VERY consistent, dedicated use.
Most users will reach Level 50-70 in 5 years (still great!).
Level 100 is for the most committed users (top 1%).

This is intentional - makes Level 100 prestigious!
```

---

## Level Calculation Formula

```
To calculate level from total EXP:

Method: Binary search or formula approximation

Simple formula:
───────────────
Level = floor( (Total_EXP / 100) ^ 0.55 ) + 1

Or use lookup table for exact values.


To calculate EXP needed for specific level:
───────────────────────────────────────────
EXP_needed = 100 × (Level ^ 1.8)
```

---

## Summary

```
RANK TIERS:
• D-Rank:    10 EXP
• C-Rank:    25 EXP
• B-Rank:    50 EXP
• A-Rank:   100 EXP
• S-Rank:   200 EXP

LEVEL FORMULA:
• Total EXP needed for level = 100 × (Level ^ 1.8)
• Cumulative, never resets

TIMELINE:
• Level 10:  ~1 month
• Level 50:  ~2 years
• Level 100: ~5 years

KEY INSIGHT:
• Early levels are fast → Keeps users motivated
• High levels take time → Makes achievement meaningful
• Consistency is rewarded → More tasks = more EXP = faster progress
```

Complete Table Structure

TASK
────────────────────────────────────────────────────────────────

FIELD TYPE REQUIRED DEFAULT
───── ──── ──────── ───────

id UUID/Integer Yes auto
user_id Integer (FK) Yes -

title String(255) Yes -
description Text No null

status Enum Yes TODO
importance Enum Yes MEDIUM (displayed as B-Rank)
exp_value Integer Yes (calculated)

due_date DateTime No null
original_due_date DateTime No null

reschedule_count Integer Yes 0
max_reschedules Integer Yes 2
last_rescheduled_at DateTime No null

exp_earned Integer No null
exp_penalty Integer No null
is_exp_processed Boolean Yes false

category_id Integer (FK) No null
project_id Integer (FK) No null

started_at DateTime No null
completed_at DateTime No null
failed_at DateTime No null

created_at DateTime Yes now()
updated_at DateTime Yes now()

Here's a description for each importance level:

---

## **D-Rank** — 10 EXP

**Quick wins, minimal effort**

Tasks that take less than 5 minutes and require almost no mental energy. These are small actions you can do on autopilot.

_Examples: Drink a glass of water, make your bed, reply to a simple message, take your vitamins, stretch for 2 minutes_

---

## **C-Rank** — 25 EXP

**Simple daily habits**

Routine tasks that are easy but still require some intention. They keep your day running smoothly without much challenge.

_Examples: Check emails, do a 10-minute walk, review your to-do list, prepare a simple meal, tidy your desk_

---

## **B-Rank** — 50 EXP

**Standard meaningful tasks**

Tasks that require focus, time, or effort. These are the core actions that move your goals forward and make up a productive day.

_Examples: Complete a work assignment, exercise for 30 minutes, study for an hour, attend a meeting, cook a proper meal_

---

## **A-Rank** — 100 EXP

**Important and challenging**

Tasks that demand significant effort, skill, or courage. These often involve deadlines, responsibility, or stepping outside your comfort zone.

_Examples: Finish a major project, have a difficult conversation, complete a job application, present to a group, learn a complex skill_

---

## **S-Rank** — 200 EXP

**Life-changing milestones**

Major achievements that have lasting impact on your life. These are the boss fights — tasks you've been building toward or avoiding.

_Examples: Pass an important exam, launch your project, complete a certification, finish a marathon, make a major life decision_

---
