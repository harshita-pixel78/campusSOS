# CampusSOS

## Smart Campus Problem Reporting & Resolution System

CampusSOS is a student-focused web application prototype for reporting, prioritizing, routing, tracking, and closing campus problems through one workflow.

### Hackathon
- Event: Hack Devengers 2.0
- Format: Online open-innovation hackathon
- Prototype type: Front-end MVP

## Core workflow

1. Student describes a problem and location.
2. Smart Triage suggests category, priority, department, and reason.
3. The student receives a unique Complaint ID.
4. The complaint can be tracked through a status timeline.
5. Admin can search, filter, assign, update status, and add resolution notes.
6. A student can confirm resolution or reopen a complaint if it was not actually fixed.

## Smart Triage categories

- Safety → Critical → Campus Safety
- Safety & Security → High → Campus Security
- Maintenance → Medium → Maintenance
- IT → Medium → IT Support
- Food → Medium → Mess / Food Services
- Cleanliness → Medium → Housekeeping
- Hostel → Medium → Hostel Administration
- General → Low → Campus Administration

The triage engine is a transparent keyword-based prototype, not a production AI model. Its output should be treated as a recommendation for demonstration purposes.

## Features

### Student side
- Minimal report form
- Optional name
- Problem description with character counter
- Quick location buttons
- Live Smart Triage preview
- Unique Complaint ID
- Complaint tracking
- Resolution feedback and reopening

### Admin side
- Complaint statistics
- High-priority alert
- Search and filters
- Priority sorting
- Department workload
- Complaint age
- Status updates
- Assignment
- Resolution notes
- Demo data

## Technology

- HTML5
- CSS3
- Vanilla JavaScript
- Browser localStorage
- GitHub Pages

No backend or external API is required for the MVP.

## Data model

Each complaint stores:

`id`, `studentName`, `description`, `location`, `category`, `priority`, `department`, `triageReason`, `emergency`, `status`, `assignedTo`, `resolutionNote`, `studentFeedback`, `createdAt`, `updatedAt`, `resolvedAt`, `reopenedAt`.

## Important prototype limitation

Data is stored in the browser's localStorage. That means a complaint is not shared between different devices or browsers. A production CampusSOS system should use authenticated student/admin accounts, a shared database, server-side authorization, notifications, audit logs, and appropriate privacy/security controls.

## Demo flow

For a hackathon demonstration:

1. Open Home.
2. Report a normal maintenance issue.
3. Show the live Smart Triage result.
4. Submit and copy the Complaint ID.
5. Open Track and show the timeline.
6. Open Admin and add Demo Data.
7. Show the Critical complaint, department workload, assignment, status update, and resolution note.
8. Return to Track and demonstrate resolution feedback/reopening.

## Project structure

```text
CampusSOS/
├── index.html
├── report.html
├── track.html
├── admin.html
├── style.css
├── script.js
└── README.md
```
