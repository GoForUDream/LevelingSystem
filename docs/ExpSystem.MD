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

## Importance Factor → EXP Reward

```
IMPORTANCE ENUM:
────────────────

TRIVIAL      →   5 EXP     (Quick tasks, small wins)
LOW          →  15 EXP     (Simple daily tasks)
MEDIUM       →  30 EXP     (Standard tasks)
HIGH         →  50 EXP     (Important tasks)
CRITICAL     →  100 EXP    (Major milestones, life-changing tasks)


Example tasks:
──────────────
TRIVIAL:   Drink water, make bed, reply to a message
LOW:       Read 10 pages, 15-min exercise, organize desk
MEDIUM:    Complete work assignment, study 1 hour, gym session
HIGH:      Finish project, job interview prep, important meeting
CRITICAL:  Submit thesis, launch product, major presentation
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
• 10 TRIVIAL (50) + 10 LOW (150) + 10 MEDIUM (300) = 500 EXP
• Need about 3x this → Very active user

Option 2: Balanced approach
• 3 TRIVIAL (15) + 5 LOW (75) + 5 MEDIUM (150) + 3 HIGH (150) = 390 EXP
• About 4x this needed

Option 3: Focus on important tasks
• 2 TRIVIAL (10) + 3 LOW (45) + 4 MEDIUM (120) + 2 HIGH (100) + 1 CRITICAL (100) = 375 EXP
• About 4x this needed


Reality check:
──────────────
Level 100 in 5 years requires VERY consistent, dedicated use.
Most users will reach Level 50-70 in 5 years (still great!).
Level 100 is for the most committed users (top 1%).

This is intentional - makes Level 100 prestigious!
```

---

## Adjusted EXP Values (More Achievable)

```
If you want Level 100 more achievable with moderate daily use:

IMPORTANCE ENUM (Adjusted):
───────────────────────────

TRIVIAL      →   10 EXP
LOW          →   25 EXP
MEDIUM       →   50 EXP
HIGH         →   100 EXP
CRITICAL     →   200 EXP


Daily realistic scenario:
─────────────────────────
Morning routine:
• Wake up on time (LOW): 25 EXP
• Exercise 30 min (MEDIUM): 50 EXP
• Healthy breakfast (TRIVIAL): 10 EXP

Work/Study:
• Complete main task (HIGH): 100 EXP
• 2 smaller tasks (MEDIUM): 100 EXP
• Respond to emails (LOW): 25 EXP

Evening:
• Read 30 min (MEDIUM): 50 EXP
• Plan tomorrow (LOW): 25 EXP
• Sleep on time (TRIVIAL): 10 EXP

Daily Total: ~395 EXP

This person reaches:
• Level 10 in ~10 days
• Level 25 in ~3 months
• Level 50 in ~2 years
• Level 100 in ~5+ years (with consistency bonuses later)
```

---

## Recommended Final Values

```
IMPORTANCE → EXP:
─────────────────

TRIVIAL      →   10 EXP     (2-5 min tasks)
LOW          →   25 EXP     (5-15 min tasks)
MEDIUM       →   50 EXP     (15-60 min tasks)
HIGH         →   100 EXP    (1-3 hour tasks)
CRITICAL     →   200 EXP    (Major achievements)


LEVEL THRESHOLDS:
─────────────────

Level 1:         0 EXP      (Starting point)
Level 5:       720 EXP      (~1 week)
Level 10:    3,560 EXP      (~1 month)
Level 20:   20,000 EXP      (~3-4 months)
Level 30:   62,000 EXP      (~8-10 months)
Level 40:  145,000 EXP      (~1.5 years)
Level 50:  295,000 EXP      (~2 years)
Level 60:  530,000 EXP      (~3 years)
Level 70:  880,000 EXP      (~3.5 years)
Level 80: 1,360,000 EXP     (~4 years)
Level 90: 2,010,000 EXP     (~4.5 years)
Level 100: 2,870,000 EXP    (~5 years)
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

## Quick Reference

```
USER STORY EXAMPLES:
────────────────────

Casual user (200 EXP/day):
• Level 10 in 20 days
• Level 25 in 6 months
• Level 50 in 4 years
• Probably won't reach 100

Regular user (400 EXP/day):
• Level 10 in 10 days
• Level 25 in 3 months
• Level 50 in 2 years
• Level 100 in 5+ years (possible!)

Power user (800 EXP/day):
• Level 10 in 5 days
• Level 25 in 6 weeks
• Level 50 in 1 year
• Level 100 in 3-4 years (with bonuses)


This feels fair because:
────────────────────────
• Quick early wins (Level 1-10 in first month)
• Steady middle progress (Level 10-50 over 1-2 years)
• Prestigious high levels (Level 50+ takes dedication)
• Level 100 is a true 5-year achievement
```

---

## Summary

```
IMPORTANCE ENUM:
• TRIVIAL:   10 EXP
• LOW:       25 EXP
• MEDIUM:    50 EXP
• HIGH:      100 EXP
• CRITICAL:  200 EXP

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
importance Enum Yes MEDIUM
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
