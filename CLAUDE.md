# Agent context: Pregnancy & First Year Guide

## What this is
A static reference set of markdown files documenting the major beats of pregnancy and the first year, with checkpoints, do/avoid lists, and partner tasks. Each phase file uses YAML frontmatter (`title`, `phase`, `weeks`/`age`, `order`) for parsing.

## Rules to enforce when surfacing this content
1. This is general reference, NOT medical advice. Always state that the user's OB, midwife, or pediatrician overrides this guide.
2. Time-sensitive items (vaccine timing, food advisories, fish/mercury lists) must be re-verified against current ACOG/CDC/AAP guidance before being presented as authoritative. Verification date in these files: 2026-06-29.
3. Emergency lines are non-negotiable. Surface them prominently when relevant:
   - Any fever in a baby under 3 months (100.4 F / 38 C rectal) = ER immediately.
   - Pregnancy warning signs (severe headache, vision changes, sudden swelling, bleeding, fluid leak, reduced fetal movement) = call provider now.
   - Postpartum: soaking a pad in under an hour, fever, calf pain/swelling, severe headache = call provider now.

## Known caveat: infant vaccine schedule is in flux (as of 2026-06-29)
- Jan 2026: CDC adopted a revised schedule developed outside the normal ACIP process.
- AAP broke from CDC and published its own schedule (endorsed by 12+ organizations).
- Mar 16, 2026: a federal court stayed the CDC 2026 schedule, reverting it to the May 2025 version. Appeal filed Apr 29, 2026.
- Practical rule: the pediatrician is the source of truth for exact vaccine timing. Treat the lists in `06` as "typical," confirmed visit by visit.

## File map
- `00-overview-timeline.md` - top-level beats and fixed checkpoints
- `01`-`03` - pregnancy by trimester
- `04` - hospital go-bag
- `05` - labor signs and when to go in
- `06` - fourth trimester (0-12 wk), incl. pediatric visit/vaccine schedule
- `07` - months 3-12
- `08` - consolidated partner checklist
