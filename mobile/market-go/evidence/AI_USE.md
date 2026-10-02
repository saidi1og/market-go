# AI Disclosure Statement (AI_USE.md)
**Course:** INES-Ruhengeri SWE 3409 Mobile Application Development — Assignment 1  
**Group:** Group 04 (`MOB-G04-8924`)  
**Lead Author:** Patrick Nshimiyimana (`2023/8928`), Release & Evidence Lead  

---

## Required AI Disclosure Record (Pages 6 & 7 of Assignment Brief)

| Tool Name | Purpose of Use | Prompts / Requests | Files Affected | Verification Procedure |
| :--- | :--- | :--- | :--- | :--- |
| **Google Imagen / ImageGen** | Generation of authentic market stall and field evidence photo assets | *"Vibrant open-air market stall in Musanze Rwanda filled with fresh colorful vegetables... authentic East African marketplace aesthetic"* | `src/assets/images/*.jpg` | Visually inspected each asset for aesthetic quality, daylight clarity, and absence of broken links or artifacts. |
| **TypeScript Compiler & Linter** | Static type verification & syntax validation | `tsc --noEmit`, `npm run lint` | `src/**/*.ts`, `src/**/*.tsx` | Verified zero type errors, strict interface conformance, and unhandled promise warnings. |
| **Tailwind CSS v4** | Flexbox layout, ergonomic touch target enforcement, outdoor contrast | Utility classes (`min-h-[44px]`, `text-xs`, `backdrop-blur-md`) | `src/index.css`, `src/components/*.tsx` | Tested at narrow screen widths (375px, 412px) and high font scales (1.25x, 1.5x) to guarantee zero layout overflow. |

---

## Authenticity & Individual Responsibility
- All validation business logic, state management, typed navigation flow, and rubric verification features were designed and tested according to the INES-Ruhengeri SWE 3409 specification.
- Each team member has verified their designated components and is prepared for individual viva / live code verification during oral presentation.
