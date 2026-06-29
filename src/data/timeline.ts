// The milestone backbone, distilled from /pregnancy-guide.
// weekStart/weekEnd are GUIDANCE WINDOWS (gestational weeks), not hard dates.
// The app suggests the window; you pin the real date and it tracks yours.

export type Category = 'medical' | 'health' | 'admin' | 'prep' | 'partner'

export interface TimelineItem {
  id: string
  title: string
  category: Category
  weekStart: number
  weekEnd: number
  detail: string
  guide?: string // source file in /pregnancy-guide
  appointment?: boolean
}

export const CATEGORY_LABEL: Record<Category, string> = {
  medical: 'Medical',
  health: 'Parents’ health',
  admin: 'Insurance & admin',
  prep: 'Prep',
  partner: 'Together',
}

export const TIMELINE: TimelineItem[] = [
  // --- First trimester ---
  { id: 'question-list', title: 'Start a running question list for appointments', category: 'partner', weekStart: 8, weekEnd: 12, guide: '01', detail: 'Keep a shared note of questions as they come up so nothing is forgotten at the visit.' },
  { id: 'first-visit', title: 'First prenatal visit & dating ultrasound', category: 'medical', appointment: true, weekStart: 8, weekEnd: 10, guide: '01', detail: 'Dating scan, full bloodwork (blood type/Rh, CBC, infection + immunity screen), urine test, history, confirm prenatal vitamin. Your booked visit is July 13.' },
  { id: 'insurance-network', title: 'Confirm OB & hospital are in-network', category: 'admin', weekStart: 8, weekEnd: 13, guide: '09', detail: 'Also check the anesthesia group at that hospital — out-of-network anesthesia is a classic surprise bill.' },
  { id: 'insurance-coverage', title: 'Read your maternity coverage', category: 'admin', weekStart: 8, weekEnd: 14, guide: '09', detail: 'Deductible, out-of-pocket max, copays, and an estimate for both a vaginal birth and a C-section.' },
  { id: 'dad-tdap', title: 'Dad: Tdap booster (whooping cough)', category: 'health', weekStart: 8, weekEnd: 20, guide: '09', detail: 'Get one if it has been ~10 years. Whooping cough is dangerous to newborns; adults being current protects the baby until vaccines start at 2 months.' },
  { id: 'dad-vax', title: 'Dad: flu/COVID + confirm MMR & varicella immunity', category: 'health', weekStart: 8, weekEnd: 20, guide: '09', detail: 'If unsure whether you’re immune to measles/chickenpox, a doctor can check or re-vaccinate. Mom can’t get these live vaccines while pregnant.' },
  { id: 'mental-health', title: 'Line up mental-health support (both)', category: 'health', weekStart: 8, weekEnd: 30, guide: '09', detail: 'Know who you’d call and whether therapy is covered, before you need it. Postpartum depression affects dads too.' },
  { id: 'values-talk', title: 'Start the “how we’ll parent” conversations', category: 'partner', weekStart: 8, weekEnd: 20, guide: '09', detail: 'Feeding, sleep, visitors, names, traditions, division of labor. Decide together now rather than at 3 a.m. later.' },
  { id: 'carrier-screen', title: 'Carrier screening (optional)', category: 'medical', weekStart: 8, weekEnd: 12, guide: '01', detail: 'Blood test for inherited conditions. Can be done now or skipped — your call with the provider.' },
  { id: 'nipt', title: 'NIPT / cell-free DNA blood test', category: 'medical', weekStart: 10, weekEnd: 13, guide: '01', detail: 'Screens for chromosomal conditions and can reveal sex. Optional but common.' },
  { id: 'nt-scan', title: 'NT scan + first-trimester screening', category: 'medical', appointment: true, weekStart: 11, weekEnd: 13, guide: '01', detail: 'Ultrasound measuring nuchal translucency, combined with bloodwork.' },
  { id: 'announce', title: 'Decide announcement timing', category: 'partner', weekStart: 11, weekEnd: 14, guide: '01', detail: 'Many wait until ~12–13 weeks. Her timeline — don’t leak it.' },

  // --- Second trimester ---
  { id: 'visit-16', title: 'Prenatal visit (~every 4 weeks)', category: 'medical', appointment: true, weekStart: 16, weekEnd: 16, guide: '02', detail: 'Weight, blood pressure, fundal height, fetal heart rate, urine.' },
  { id: 'daycare', title: 'Tour & waitlist daycares', category: 'admin', weekStart: 16, weekEnd: 28, guide: '02', detail: 'NYC waitlists run long — get on lists early even though it feels too soon.' },
  { id: 'quad', title: 'Quad screen (if NIPT wasn’t done)', category: 'medical', weekStart: 15, weekEnd: 20, guide: '02', detail: 'Blood test alternative to NIPT for screening.' },
  { id: 'leave-policies', title: 'Read all parental-leave policies', category: 'admin', weekStart: 14, weekEnd: 22, guide: '09', detail: 'FMLA (job protection) + NY short-term disability (mom’s recovery) + NY Paid Family Leave (both parents) + your employer’s policy. They stack — get it in writing.' },
  { id: 'will-guardian', title: 'Make a will & name a guardian', category: 'admin', weekStart: 14, weekEnd: 26, guide: '09', detail: 'The most-skipped, most-important item: who raises your child if something happens to both of you.' },
  { id: 'life-insurance', title: 'Life insurance for both parents', category: 'admin', weekStart: 14, weekEnd: 26, guide: '09', detail: 'Cover both the earner and the at-home parent. Update beneficiaries while you’re at it.' },
  { id: 'registry', title: 'Start the registry; research car seat/stroller/crib', category: 'prep', weekStart: 18, weekEnd: 26, guide: '02', detail: 'Safety-research the big items; register gear for recall notices.' },
  { id: 'anatomy', title: 'Anatomy scan (level 2 ultrasound)', category: 'medical', appointment: true, weekStart: 18, weekEnd: 22, guide: '02', detail: 'The big one: detailed organ check, placenta position, sex usually confirmable. Bring your question list.' },
  { id: 'pediatrician', title: 'Choose a pediatrician', category: 'admin', weekStart: 20, weekEnd: 32, guide: '02', detail: 'The hospital needs the name at discharge. Tour and shortlist now.' },
  { id: 'childbirth-class', title: 'Book a childbirth class', category: 'prep', weekStart: 20, weekEnd: 30, guide: '02', detail: 'Aim for late second / early third trimester.' },
  { id: 'dental', title: 'Both: dental checkup & cleaning', category: 'health', weekStart: 10, weekEnd: 24, guide: '09', detail: 'Safe and recommended in pregnancy; gum health affects outcomes. Easy to skip, worth doing.' },
  { id: 'mom-flu-covid', title: 'Mom: flu & COVID vaccines', category: 'medical', weekStart: 12, weekEnd: 36, guide: '02', detail: 'Recommended any trimester.' },
  { id: 'visit-24', title: 'Prenatal visit', category: 'medical', appointment: true, weekStart: 24, weekEnd: 24, guide: '02', detail: 'Routine check.' },
  { id: 'glucose', title: 'Glucose challenge (gestational diabetes screen)', category: 'medical', weekStart: 24, weekEnd: 28, guide: '02', detail: 'Drink the sugary solution, blood draw after. A positive leads to a follow-up test.' },

  // --- Third trimester ---
  { id: 'visit-28', title: 'Prenatal visit — cadence increases to every 2 weeks', category: 'medical', appointment: true, weekStart: 28, weekEnd: 28, guide: '03', detail: 'Visits get more frequent from here.' },
  { id: 'tdap', title: 'Tdap vaccine (mom)', category: 'medical', weekStart: 27, weekEnd: 36, guide: '03', detail: 'Given every pregnancy; earlier in the window maximizes antibody transfer to baby.' },
  { id: 'rsv', title: 'RSV vaccine (seasonal) — discuss', category: 'medical', weekStart: 32, weekEnd: 36, guide: '03', detail: 'Seasonal (Sept–Jan). Alternative: baby gets the RSV antibody after birth. Most babies don’t need both — discuss with provider.' },
  { id: 'nursery', title: 'Set up nursery, wash baby clothes, freezer meals', category: 'prep', weekStart: 30, weekEnd: 37, guide: '03', detail: 'Nesting season. Stock the freezer now — future you will be grateful.' },
  { id: 'birth-plan', title: 'Draft & review birth plan with provider', category: 'prep', weekStart: 30, weekEnd: 36, guide: '03', detail: 'Preferences for labor, pain relief, and the unexpected. Bring printed copies to the hospital.' },
  { id: 'breast-pump', title: 'Order free breast pump through insurance', category: 'admin', weekStart: 28, weekEnd: 34, guide: '09', detail: 'Most US plans cover one at no cost — check the process and timing.' },
  { id: 'file-leave', title: 'File leave dates with HR', category: 'admin', weekStart: 28, weekEnd: 34, guide: '09', detail: 'Lock in both parents’ leave on a calendar; coordinate the handoff.' },
  { id: 'pre-register', title: 'Pre-register at the hospital', category: 'prep', weekStart: 32, weekEnd: 36, guide: '03', detail: 'Saves paperwork during labor.' },
  { id: 'hospital-route', title: 'Map hospital route, parking, after-hours entrance', category: 'prep', weekStart: 34, weekEnd: 38, guide: '03', detail: 'Plus a backup route and a rideshare plan. Dad owns this.' },
  { id: 'hospital-bag', title: 'Pack the hospital go-bag', category: 'prep', weekStart: 35, weekEnd: 36, guide: '04', detail: 'Two bags (labor + after). Don’t overpack; the hospital provides a lot. See the go-bag list.' },
  { id: 'car-seat', title: 'Install car seat & get it inspected', category: 'prep', weekStart: 35, weekEnd: 38, guide: '03', detail: 'Many hospitals/fire stations inspect for free. Required for discharge.' },
  { id: 'gbs', title: 'Group B strep swab', category: 'medical', weekStart: 36, weekEnd: 37, guide: '03', detail: 'Determines whether antibiotics are needed during labor.' },
  { id: 'position', title: 'Position check (breech?)', category: 'medical', weekStart: 36, weekEnd: 36, guide: '03', detail: 'Breech triggers a C-section or version (ECV) discussion.' },
  { id: 'visit-weekly', title: 'Weekly prenatal visits begin', category: 'medical', appointment: true, weekStart: 36, weekEnd: 36, guide: '03', detail: 'Every week now until birth.' },
  { id: 'kick-counts', title: 'Daily kick counts (if instructed)', category: 'medical', weekStart: 28, weekEnd: 40, guide: '03', detail: 'Track movement; report any decrease to your provider right away.' },

  // --- Around birth ---
  { id: 'add-baby-insurance', title: 'Add baby to insurance (HARD ~30-day deadline)', category: 'admin', weekStart: 40, weekEnd: 42, guide: '09', detail: 'Birth is a qualifying life event — you typically have only ~30 days (some plans 60). Set a reminder for the week after the due date.' },
]

export function itemById(id: string): TimelineItem | undefined {
  return TIMELINE.find((t) => t.id === id)
}
