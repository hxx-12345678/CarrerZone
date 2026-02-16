# Comprehensive Feature Analysis & Testing Guide
## Job Portal Application (Gulf & Normal Portals)

This document provides detailed analysis, testing steps, and feature breakdown for the Job Portal application. It covers both the **Normal (Standard)** and **Gulf (Region-Specific)** portals across all user roles: **Candidates**, **Employers**, and **Admins**.

---

## 1. System Overview & Architecture

The application is a dual-portal system serving two distinct markets:
1.  **Normal Portal:** Standard global/India-focused job market.
2.  **Gulf Portal:** Specialized market for Gulf region opportunities.

**User Roles:**
*   **Candidate (Job Seeker):** Access to job search, profile management, and region-specific dashboards.
*   **Employer:** Post jobs, manage candidates, and track hiring pipelines.
*   **Super Admin:** Platform oversight, user management, and verifications.

---

## 2. Authentication & Onboarding (All Users)

### A. AI Registration Chatbot
*   **Description:** An interactive chatbot that guides users through registration, determining region eligibility.
*   **Location:** `client/components/registration-chatbot.tsx`
*   **Features:**
    *   Email/Phone validation.
    *   Region selection (India, Gulf, or Both).
    *   Auto-login upon success.
*   **Testing Steps:**
    1.  Open the chatbot on the landing page.
    2.  Complete registration for a new user.
    3.  **Scenario A (India):** Verify redirection to Normal Dashboard.
    4.  **Scenario B (Gulf):** Verify redirection to Gulf Dashboard.
    5.  **Scenario C (Both):** Verify access to switch between dashboards.

### B. Standard Login & Auth Guards
*   **Testing Steps:**
    1.  Login as Candidate -> Verify access to `/dashboard`, block access to `/employer-dashboard`.
    2.  Login as Employer -> Verify access to `/employer-dashboard`, block access to `/super-admin`.
    3.  Login as Admin -> Verify access to `/super-admin` only.

---

## 3. Candidate (Job Seeker) - Normal Portal

**Base Path:** `/dashboard`

### A. Dashboard Overview
*   **Features:** Application stats, Profile Completion meter, Recent Notifications.
*   **Testing:** Apply for a job, verify stats increment. Added skills update profile meter.

### B. Job Search (`/jobs`)
*   **Features:** Search/Filter jobs, "Apply" button, "Featured Companies".
*   **Testing:** Search "React", filter by "Remote", Apply -> Success Toast.

### C. Applications (`/applications`)
*   **Features:** Track status (Applied, Shortlisted), Withdraw Application.
*   **Testing:** Verify applied jobs appear. Test "Undo Application" removal.

### D. Documents (`/dashboard/resumes`)
*   **Features:** Upload/Manage multiple resumes (PDF/DOCX).
*   **Testing:** Upload new resume, set as Default, Delete old version.

### E. Communication (`/messages`)
*   **Features:** Direct messaging with recruiters/employers.
*   **Testing:** Send a test message to an employer. Verify receipt in Employer inbox.

### F. Job At Pace (Premium) (`/job-at-pace`)
*   **Features:** Fast-tracked applications, Premium Alerts (`/job-at-pace/alerts`).
*   **Testing:**
    1.  Navigate to `/job-at-pace`.
    2.  Select a plan -> Click Subscribe (`/job-at-pace/subscribe`).
    3.  Complete dummy payment -> Verify redirection to `/success`.

---

## 4. Candidate (Job Seeker) - Gulf Portal

**Base Path:** `/jobseeker-gulf-dashboard`

### A. Gulf Dashboard
*   **Features:** Region-Specific Stats, **Gulf Jobs Feed** (filtered database), Profile Snooze (Privacy).
*   **Testing:**
    1.  Login as Gulf User.
    2.  Verify only Gulf-region jobs appear.
    3.  Test "Snooze Profile" for 24hrs -> functionality check.

### B. Gulf Applications (`/gulf-applications`)
*   **Features:** Separate tracking for Gulf job applications.
*   **Testing:** Apply to a Gulf job -> Verify extensive application data fields are captured.

---

## 5. Employer - Normal Portal

**Base Path:** `/employer-dashboard`

### A. Dashboard & Analytics
*   **Features:** Hiring Funnel stats, Active Jobs count, Recent Applicants list.
*   **Testing:** Post a job -> "Active Jobs" count +1.

### B. Post a Job (`/employer-dashboard/post-job`)
*   **Features:** Multi-step form, AI Description Generator, Salary range, Skill tagging.
*   **Testing:** Complete full job posting flow. Verify job appears in "Manage Jobs".

### C. Candidate Management (`/employer-dashboard/applications`)
*   **Features:** Kanban/List view of applicants. Actions: Shortlist, Reject, Message.
*   **Testing:**
    1.  Select a job.
    2.  Move candidate to "Shortlisted".
    3.  Verify candidate sees status update on their end.

### D. Managed Requirements (`/employer-dashboard/requirements`)
*   **Features:** Detailed hiring specs, auto-matching suggestions.
*   **Testing:** Create a Requirement -> Check for auto-suggested candidates.

---

## 6. Employer - Gulf Portal

**Base Path:** `/gulf-dashboard`

### A. Gulf Employer Dashboard
*   **Features:** Gulf-specific metrics, Access to Gulf candidate pool.
*   **Testing:** Compare "Recent Applicants" list with Normal dashboard (should be distinct sets).

### B. Manage Requirements (Gulf)
*   **Features:** Compliance fields (Visa status, Nationality preferences).
*   **Testing:** Create Gulf Requirement -> Verify specific dropdowns (e.g., GCC Nationalities).

---

## 7. Admin & Super Admin Portal

**Base Path:** `/super-admin`

### A. Global Overview (`/super-admin/dashboard`)
*   **Features:** Platform Health (Users, Revenue, Active Jobs).
*   **Testing:** verify data consistency with DB.

### B. User Management (`/super-admin/users`)
*   **Features:** Ban/Delete users, Edit Roles.
*   **Testing:** Ban a user -> Verify they cannot login.

### C. Company Verification (`/super-admin/companies`)
*   **Features:** Approve/Reject Company Registrations.
*   **Testing:** Register new company -> Admin approves -> Company goes Live.

### D. Agency Vertification (`/super-admin/agency-verifications`)
*   **Features:** Review uploaded business documents for agencies.
*   **Testing:**
    1.  Employer requests "Agency" status + uploads docs.
    2.  Admin reviews docs in modal -> Approves logic.

### E. Job Moderation (`/super-admin/jobs`)
*   **Features:** Flag/Remove inappropriate listings.
*   **Testing:** Admin closes a job -> Verify it disappears from public search.

---

## 8. Premium & Pricing Features

### A. Pricing Plans (`/pricing`)
*   **Features:** Subscription tiers for Employers (Free, Pro, Enterprise).
*   **Testing:**
    1.  Employer selects "Pro" plan.
    2.  Redirect to Payment Gateway (Mock).
    3.  Verify account features unlock (e.g., unlimited job posts).

### B. Job At Pace (Candidate Premium)
*   **Features:** High-priority application status.
*   **Testing:** Subscribe as Candidate -> Apply to job -> Verify application is flagged as "Premium/Urgent" to Employer.

---

## 9. Technical Testing Checklist

1.  **Routes:** Verify all page loads return 200 OK.
2.  **API:** Test endpoints in `server/routes` (Auth, Jobs, Users) using Postman.
3.  **Components:** Unit test key components:
    *   `registration-chatbot.tsx` (Logic flow)
    *   `profile-completion-dialog.tsx` (Conditionals)
    *   `job-application-dialog.tsx` (Form submission)
4.  **Database:** Verify schema integrity (Users linked to Roles, Applications linked to Jobs).

## 10. Conclusion

This guide covers the end-to-end functionality for all user types. Testing should strictly interpret the separation between "Normal" and "Gulf" data streams to ensure no cross-contamination of regional data, while verifying the unified authentication system works seamlessly.
