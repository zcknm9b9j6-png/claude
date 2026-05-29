import type { BrandColor } from "../brand";

// The six recurring sections shared by the Term and Yearly trackers, plus the
// extra "IT & Systems" section that only the Yearly tracker uses.
export interface SectionDef {
  name: string;
  color: BrandColor;
}

export const TERM_SECTIONS: SectionDef[] = [
  { name: "Staffing & Compliance", color: "teal" },
  { name: "Enrolments & Marketing", color: "purple" },
  { name: "ISS & Funding", color: "orange" },
  { name: "Operations & Quality", color: "pink" },
  { name: "Training & Development", color: "lime" },
  { name: "Administration", color: "teal" },
];

export const YEARLY_SECTIONS: SectionDef[] = [
  ...TERM_SECTIONS,
  { name: "IT & Systems", color: "purple" },
];

// Default Term Tracker tasks, transcribed from the Excel workbook.
export const TERM_TASKS: Record<string, string[]> = {
  "Staffing & Compliance": [
    "Conduct full staffing audit for the term",
    "Review educator certificates / qualifications",
    "Submit Blue Card / WWCC renewal reminders",
    "Review ACECQA NQA ITS quality area items",
    "Review and update risk management documentation",
    "Staff performance / check-in conversations",
    "Update Master Staffing Audit Excel file",
  ],
  "Enrolments & Marketing": [
    "Review enrolment numbers across all 13 services",
    "Outreach to primary schools in each service area",
    "Distribute enrolment flyers / newsletter to schools",
    "Review and update website content / social media",
    "Run end-of-term enrolment promotions",
    "Analyse waitlist and capacity across services",
  ],
  "ISS & Funding": [
    "Review ISS case load across nine services",
    "Complete end-of-term ISS funding summary report",
    "Check new ISS referrals and support plans",
    "Confirm Inclusion Support Subsidy claims lodged",
  ],
  "Operations & Quality": [
    "Vacation care program planning complete",
    "VC program distributed to families",
    "All excursion risk assessments signed off",
    "Review Quality Improvement Plan (QIP) progress",
    "Service coordinator check-ins complete",
    "Policies reviewed and current",
  ],
  "Training & Development": [
    "Review GECCKO training audit completion",
    "Schedule mandatory training (first aid, CPR)",
    "Staff professional development planned",
    "New educator onboarding completed",
  ],
  Administration: [
    "Term report distributed to leadership",
    "SharePoint records up to date",
    "Family communication / newsletter sent",
    "Fee and billing review",
    "Archive previous term records",
  ],
};

// Default Yearly Tracker tasks — annual / once-a-year items.
export const YEARLY_TASKS: Record<string, string[]> = {
  "Staffing & Compliance": [
    "Annual staffing structure review",
    "Renew public liability & insurances",
    "Annual policy & procedure review",
    "Lodge annual ACECQA / regulatory returns",
  ],
  "Enrolments & Marketing": [
    "Set yearly enrolment targets",
    "Annual marketing plan",
    "Refresh brand & website",
  ],
  "ISS & Funding": [
    "Annual ISS funding acquittal",
    "Review inclusion strategy across services",
  ],
  "Operations & Quality": [
    "Annual QIP review & resubmission",
    "Whole-of-year vacation care calendar set",
    "Annual fee schedule review",
  ],
  "Training & Development": [
    "Plan annual training calendar",
    "Annual first aid / CPR renewals booked",
  ],
  Administration: [
    "Annual budget prepared",
    "End-of-financial-year reconciliation",
    "Annual records archive",
  ],
  "IT & Systems": [
    "Review childcare management software",
    "Annual cyber-security / data backup check",
    "Renew domains, email & subscriptions",
  ],
};
