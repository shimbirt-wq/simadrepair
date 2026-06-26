# SIMADRepair — IT Service Desk Platform
### Official Documentation for Faculty & Department Heads
**SIMAD University · IT Department · June 2026**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [The Problem We Solved](#2-the-problem-we-solved)
3. [Our Solution: SIMADRepair](#3-our-solution-simadrepair)
4. [How the Platform Works](#4-how-the-platform-works)
5. [What Your Students Experience](#5-what-your-students-experience)
6. [Staff & Technician Workflow](#6-staff--technician-workflow)
7. [Platform Features](#7-platform-features)
8. [Security & Privacy](#8-security--privacy)
9. [The Engineering Team](#9-the-engineering-team)
10. [How to Get Started](#10-how-to-get-started)
11. [Frequently Asked Questions](#11-frequently-asked-questions)
12. [Contact & Support](#12-contact--support)

---

## 1. Executive Summary

SIMADRepair is SIMAD University's official IT repair management platform, built entirely in-house by the university's own software engineering team. It replaces the previous informal, walk-in-only repair process with a transparent, trackable, and fully digital service desk.

Students and lecturers can now submit repair requests online, receive a unique tracking code, and monitor the status of their device at any time — without needing to visit the IT desk or call anyone.

The platform is **free for all SIMAD students and staff**, requires no account creation, and is accessible from any device with a browser.

---

## 2. The Problem We Solved

Before SIMADRepair, the IT repair process at SIMAD University had several significant pain points:

### 2.1 No Visibility After Drop-Off
Once a student handed over their device, they had no way to know what was happening to it. There was no status update, no estimated time, and no way to track progress without physically returning to the IT desk.

### 2.2 Manual, Paper-Based Intake
Repair requests were recorded manually on paper or in spreadsheets. This made it difficult to search records, assign technicians, or ensure nothing was lost or forgotten.

### 2.3 No Accountability or Audit Trail
There was no official record of who received a device, who worked on it, or when it changed hands. This created risk in the event of disputes or lost equipment.

### 2.4 Students Disrupting Technicians
Students frequently visited the IT desk in person just to ask "is my laptop ready?" — interrupting active repair work and reducing technician productivity.

### 2.5 No Formal Handoff Process
There was no structured process to confirm a device was received, repaired, and collected. Devices could sit uncollected for weeks with no follow-up system.

---

## 3. Our Solution: SIMADRepair

SIMADRepair is a web-based platform that digitalises and formalises the entire device repair lifecycle — from the moment a student submits a request to the moment they collect their repaired device.

### Core Principles

| Principle | How We Applied It |
|-----------|-------------------|
| **Transparency** | Every student can see exactly where their device is in the repair pipeline at any time |
| **Accountability** | Every action is logged with a timestamp — who did what and when |
| **Simplicity** | Students submit a request in under 2 minutes, no account required |
| **Efficiency** | Technicians have a clear, prioritised work queue with no paperwork |
| **Privacy** | Student contact details are only visible to authorised staff |

### Platform Overview

```
Public-facing (students & lecturers)
  ├── Submit a repair request  →  simadrepair.vercel.app/request-repair
  └── Track repair status      →  simadrepair.vercel.app/track

Staff-facing (authenticated)
  ├── Lead Technician dashboard  →  /lead
  └── Technician workspace       →  /technician/workspace
```

---

## 4. How the Platform Works

### The 5-Stage Repair Pipeline

Every repair goes through a clear, defined lifecycle:

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  1. SUBMITTED   │ →  │  2. RECEIVED    │ →  │  3. IN REPAIR   │
│                 │    │                 │    │                 │
│ Student fills   │    │ IT desk checks  │    │ Technician is   │
│ out the form.   │    │ in the device.  │    │ actively fixing │
│ Gets a tracking │    │ Custody logged. │    │ the device.     │
│ code instantly. │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                       │
                                                       ↓
                       ┌─────────────────┐    ┌─────────────────┐
                       │  5. COLLECTED   │ ←  │  4. READY FOR   │
                       │                 │    │     PICKUP      │
                       │ Device returned │    │                 │
                       │ to student.     │    │ Student is      │
                       │ Ticket closed.  │    │ notified to     │
                       │                 │    │ collect device. │
                       └─────────────────┘    └─────────────────┘
```

### Chain-of-Custody Tracking

In parallel with the repair status, the platform tracks physical device custody:

- **Not Received** → device not yet at the desk
- **Received** → device physically checked in
- **In Repair Room** → device moved to the workshop
- **Ready for Collection** → device back at the desk
- **Collected** → device returned to the student

This dual tracking ensures there is always a clear record of where a device is physically located.

---

## 5. What Your Students Experience

### Step 1 — Submit a Request (2 minutes)
The student visits `simadrepair.vercel.app/request-repair` and fills in a short form:
- Their name, student ID, faculty, and department
- Their phone number (for WhatsApp contact)
- The device type, brand, and model
- A description of the problem

No account, no login, no registration required.

### Step 2 — Receive a Tracking Code
Immediately after submission, the platform generates a unique tracking code in the format:

```
SIM-2026-1000042
```

The student is instructed to save or screenshot this code. It is their only reference for following up.

### Step 3 — Drop Off the Device
The student brings their device to the IT service desk. The lead technician checks it in against the tracking code, confirming physical receipt.

### Step 4 — Monitor Progress
At any time, the student visits `simadrepair.vercel.app/track`, enters their tracking code, and sees:
- Current repair status (which of the 5 stages)
- A plain-language message explaining what is happening
- Their assigned technician's name (once assigned)
- A direct WhatsApp link to message the technician (when applicable)

### Step 5 — Collect the Device
When the repair is complete, the status changes to **Ready for Pickup**. The student comes to the desk, the technician confirms collection, and the ticket is closed.

---

## 6. Staff & Technician Workflow

### Lead Technician (Command Centre)

The lead technician has access to `/lead`, a dashboard that shows:

- All active repair tickets with their current status
- A **next action** indicator for each ticket (what needs to happen now)
- Ability to receive devices, assign technicians, update status, and confirm pickup
- Full ticket details including student contact information and device notes

The lead can:
- Assign any ticket to a specific technician
- Move tickets through the pipeline with one click
- Add internal notes visible only to staff

### Technician (Workspace)

Each technician logs in to `/technician/workspace` and sees only their assigned tickets. Their view is focused:

- A personal queue of active repairs
- A clear "what to do now" guide for each ticket
- The device's storage location (where to find it physically)
- Ability to update repair status as they work

### Repair Status Roles

| Role | Permissions |
|------|-------------|
| **Admin** | Full access — all tickets, all users, system settings |
| **Lead Technician** | All tickets, can assign, receive devices, confirm pickup |
| **Technician** | Own assigned tickets only, can update repair status |
| **Public (Student)** | Can submit requests and track status by code only |

---

## 7. Platform Features

### For Students
- **One-page request form** — no account needed
- **Unique tracking code** — generated instantly on submission
- **Live status tracking** — 7 display states with plain-language messages
- **WhatsApp integration** — direct link to message assigned technician
- **No app required** — works on any phone browser

### For Staff
- **Role-based access** — each user sees only what they need
- **Full audit trail** — every status change is logged with timestamp and actor
- **Technician assignment** — lead assigns tickets to specific engineers
- **Chain-of-custody log** — device location tracked at every stage
- **Internal notes** — staff can add notes not visible to the student

### Technical Reliability
- Built on **Next.js 15** — production-grade web framework
- **PostgreSQL database** via Supabase — persistent, backed-up data
- **131 automated tests** — the platform is continuously verified
- **Vercel deployment** — globally distributed, zero-downtime deploys

---

## 8. Security & Privacy

### Student Data Protection
- Student contact details (phone, email) are **never shown to the public**
- The tracking page only shows: device type, repair status, technician name, and pickup location
- No student data is shared with third parties

### Access Control
- Staff access requires email and password authentication
- Sessions expire automatically
- Role permissions are enforced server-side — UI restrictions alone are not relied upon

### Data Handling
- All data is stored in a private Supabase database hosted in the EU
- No data is stored in the browser beyond the session token
- The session cookie is `HttpOnly` and `Secure` — not accessible by browser scripts

---

## 9. The Engineering Team

SIMADRepair was designed, built, and is maintained by SIMAD University's own IT engineering team. This is not a third-party product — it was purpose-built for our university's specific needs.

| Name | Role |
|------|------|
| **Eng. Muscab Abdirashid** | Team Lead Engineer |
| **Eng. Ishak Abdiaziz** | Full Stack Software Engineer |
| **Eng. Ruweydo Hassan** | Software Engineer |
| **Eng. Abdulsalam Hassan** | Software Engineer |

All four engineers are staff members of SIMAD University's IT department. Questions, feedback, and bug reports can be directed to the team via the contact details in Section 12.

---

## 10. How to Get Started

### For Faculty Heads — Communicating to Students

We recommend sharing the following with your students:

---

> **SIMADRepair is now live.**
>
> If your laptop, desktop, or other device needs repair, you no longer need to walk in and wait. Visit **simadrepair.vercel.app/request-repair**, fill out a short form, and bring your device to the IT desk. You will receive a tracking code to monitor your repair online at any time.
>
> This service is **free for all SIMAD students**.

---

### What Students Need to Know
1. The platform is accessible at `simadrepair.vercel.app`
2. No account or registration is required to submit a request
3. They must **save their tracking code** after submission — it is the only way to follow up
4. They bring their device to the **IT Service Desk** after submitting online
5. They can track their device status at any time using their tracking code

### What Faculty Should NOT Do
- Do not collect devices on behalf of students — students must come in person
- Do not share student tracking codes publicly — codes give access to repair status
- Do not promise repair timelines — the platform will communicate readiness

---

## 11. Frequently Asked Questions

**Q: Does a student need to create an account?**
No. Students submit requests and track their device without any login or registration.

**Q: What if a student loses their tracking code?**
They should contact the IT desk in person with their student ID. Staff can look up their ticket.

**Q: Can a student submit a request for someone else's device?**
The form asks for the requester's own details. Each request is tied to one student ID.

**Q: How does a student know when their device is ready?**
The status on the tracking page changes to "Ready for Pickup." If the technician has a phone number on file, there is also a WhatsApp link to contact them directly.

**Q: Is the platform available 24/7?**
Yes. The tracking and request form are available at all times. Staff processes requests during working hours.

**Q: What types of devices can be submitted?**
Laptops, desktops, tablets, and any other IT equipment. Phones are not currently in scope.

**Q: Who can see a student's personal information?**
Only authenticated staff (admins, lead technicians, technicians). The public tracking page shows only status and device info.

**Q: What happens if a repair cannot be fixed?**
The lead technician will contact the student directly via the phone number provided. The ticket will be closed with appropriate notes.

**Q: Is there a cost to students?**
The SIMADRepair service is completely free for all SIMAD University students and staff.

---

## 12. Contact & Support

For questions about the platform, technical issues, or to report a problem:

| Contact Type | Details |
|-------------|---------|
| **General enquiries** | support@simadrepair.edu.so |
| **Bug reports / technical issues** | Direct to the engineering team via IT department |
| **Student issues** | IT Service Desk, in person |
| **Platform URL** | simadrepair.vercel.app |

---

*This document was prepared by the SIMADRepair engineering team.*
*SIMAD University · IT Department · June 2026*
*Version 1.0 — For internal distribution to faculty and department heads*
