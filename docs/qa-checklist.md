# QA Checklist

**Project:** Maiyaar (معیار)  
**Purpose:** Production readiness verification before release or significant merge  
**Aligns with:** [Maiyaar Project Constitution](../.cursor/rules/maiyaar-project-constitution.mdc)

Use this checklist for full regression QA. Mark each item **Pass**, **Fail**, or **N/A** and record tester, date, version, browser, and device in the sign-off section.

---

## Environment Setup

- [ ] Application served over HTTP/HTTPS (local static server or staging URL)
- [ ] Correct branch/tag deployed (record commit SHA or tag)
- [ ] Browser devtools console open during testing
- [ ] `localStorage` cleared before fresh-run tests (or separate test profile documented)

---

## UI — Welcome Screen

- [ ] Page loads without visible layout breakage
- [ ] RTL direction correct (`dir="rtl"`, right-aligned reading flow)
- [ ] Urdu typography renders correctly (Noto Naskh Arabic or fallback acceptable)
- [ ] Branding displays: معیار, محاسبۂ نفس, بر اساس معیارِ مطلوب
- [ ] Intro text readable and centered appropriately
- [ ] Info boxes show question count (50) and expected duration
- [ ] Response scale legend lists four options in correct order
- [ ] **شروع کریں** button visible, clickable, adequate touch target
- [ ] No horizontal scroll on welcome screen at test viewports

---

## Navigation — Global

- [ ] Welcome → questionnaire transition hides welcome and shows questionnaire shell
- [ ] Questionnaire → report transition on Finish works
- [ ] Report → restart returns to questionnaire with cleared state
- [ ] Only one primary screen visible at a time
- [ ] Browser back button behavior acceptable (note unexpected behavior in notes)
- [ ] No broken links or `#` toggles that fail to respond

---

## Questionnaire — Flow and Content

- [ ] First question renders after start
- [ ] Question ID displayed (e.g., Q001)
- [ ] Question text readable; Urdu/Arabic characters intact
- [ ] Four answer options render as radio choices
- [ ] Selecting an answer visually highlights the option
- [ ] **Next** advances to following question
- [ ] **Previous** returns to prior question with answer preserved
- [ ] **Previous** on question 1 does not error (stays or no-op gracefully)
- [ ] **Next** without required answer does not advance (validation)
- [ ] Last question shows **Finish** (or equivalent) on Next button
- [ ] All 50 questions reachable in sequence
- [ ] Explanation toggle expands/collapses ("یہ سوال کس چیز کا جائزہ لیتا ہے؟")
- [ ] Explanation panel content readable when expanded

---

## Progress

- [ ] Current question number updates correctly (1–50)
- [ ] Total questions displays 50
- [ ] Percentage label updates as user progresses
- [ ] `<progress>` bar value matches current position
- [ ] Progress accurate after Previous navigation
- [ ] Progress accurate after page refresh *(note current v1 behavior if resume not implemented)*

---

## Report — Dashboard

- [ ] Report renders after completing questionnaire
- [ ] Cover section: title, date, overall percentage, level
- [ ] Overall result card shows score and summary text
- [ ] Section breakdown lists expected canonical sections
- [ ] Section percentages and levels display (verify no erroneous 0% from name drift)
- [ ] Progress bars render for each section
- [ ] Strongest section card populated with plausible data
- [ ] Growth section card populated
- [ ] Weak-question lessons section: groups expand/collapse
- [ ] Question insight cards show question number, answer, explanation, improvement
- [ ] 30-day action plan lists items (up to 3)
- [ ] Reflection prompts and du'a section present
- [ ] Footer/version information present
- [ ] Urdu copy dignified and complete — no placeholder or English leakage in primary content

---

## Print

- [ ] **رپورٹ پرنٹ کریں** (or print button) triggers print dialog
- [ ] Print preview hides welcome and questionnaire screens
- [ ] Print preview hides navigation buttons
- [ ] Report cards visible and not clipped severely
- [ ] Page breaks reasonable (`break-inside: avoid` respected where possible)
- [ ] Background colors/borders acceptable in print (or gracefully simplified)
- [ ] Text readable in black-and-white print

---

## Mobile Responsiveness

Test at minimum: **375px**, **768px**, and **1024px** widths.

- [ ] Welcome card fits viewport without horizontal scroll
- [ ] Questionnaire shell usable on mobile height
- [ ] Question text wraps correctly (`overflow-wrap`)
- [ ] Answer options stack and remain tappable
- [ ] Navigation buttons full-width or stacked on small screens
- [ ] Progress header readable on narrow screens
- [ ] Report section rows reflow (single column on mobile)
- [ ] Growth group toggles usable on touch devices
- [ ] No content hidden behind fixed/sticky elements

---

## Browser Compatibility

Test on latest stable versions where possible.

| Browser | Version | Pass | Notes |
|---------|---------|------|-------|
| Chrome | | [ ] | |
| Firefox | | [ ] | |
| Edge | | [ ] | |
| Safari (if available) | | [ ] | |
| Mobile Chrome | | [ ] | |
| Mobile Safari | | [ ] | |

- [ ] `fetch('questionnaire.json')` succeeds (not blocked by `file://` in production hosting)
- [ ] CSS `:has()` selector supported or graceful fallback verified
- [ ] `localStorage` read/write works

---

## Accessibility

- [ ] Keyboard navigation reaches buttons and radio options
- [ ] Focus visible on interactive elements
- [ ] `aria-live="polite"` regions present on progress and question container
- [ ] Sufficient color contrast for body text and buttons (visual check)
- [ ] Radio inputs associated with labels (clickable label area)
- [ ] No information conveyed by color alone for critical states

---

## Performance

- [ ] Initial load acceptable on mid-tier mobile (subjective: no prolonged blank screen)
- [ ] Question transitions feel immediate (no multi-second delay)
- [ ] Report generation completes without noticeable freeze
- [ ] No memory leak symptoms during full 50-question run (devtools heap stable enough for manual check)
- [ ] `questionnaire.json` loads once; no repeated fetch loops in network tab

---

## Console and Errors

- [ ] No JavaScript errors during welcome → questionnaire → report → restart flow
- [ ] No failed network requests for required assets (`questionnaire.json`, fonts, CSS, JS)
- [ ] Warnings reviewed; none indicate broken assessment integrity

---

## Assessment Integrity

- [ ] Question count remains 50
- [ ] Response scale unchanged (4 = best, 1 = worst) unless release notes say otherwise
- [ ] Section scores aggregate sensibly when all answers set to same value (spot check)
- [ ] No unapproved changes to `questionnaire.json` in this release
- [ ] Constitution compliance confirmed for release scope

---

## Sign-Off

| Field | Value |
|-------|-------|
| **Version / tag** | |
| **Commit SHA** | |
| **Tester** | |
| **Date** | |
| **Environment** | Local / Staging / Production |
| **Overall result** | Pass / Fail |
| **Blocking issues** | |

---

## Related Documents

- [Testing Strategy](./testing-strategy.md)
- [Release Checklist](./release-checklist.md)
- [Maiyaar Project Constitution](../.cursor/rules/maiyaar-project-constitution.mdc)
