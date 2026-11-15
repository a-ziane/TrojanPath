# Verification record

Verified November 14, 2026 (America/Los_Angeles).

- Frontend TypeScript check and production build: pass.
- Vitest: 10 tests pass across planning, PostgreSQL/RLS, and provider behavior.
- Deno checks for both Edge Functions: pass.
- Hosted schema and resource seed: applied to the user-specified TrojanPath project.
- Hosted `generate-plan` and `upload-file`: active; both authenticate bearer tokens in their handlers.
- Supabase security advisors after migration: no findings.
- Hosted disposable-account test: password sign-in, private profile/plan persistence, saved-plan reuse, validated upload, signed download, anonymous-access rejection, XP deduplication, duplicate-check-in prevention, and reduced subsequent plan all pass. During that run, AI credentials were not installed in the hosted environment and both plans were honestly labeled fallback.
- Disposable QA account, sessions, and associated app records: removed, verified zero remaining. Test attachment removed through Storage API.
- Actual Gemini key: validated without exposing it. A real structured plan from Gemini 3.5 Flash-Lite passed schema/resource/workload validation (3 quests, 240 minutes). Legacy 2.5 Flash-Lite returned unavailable; 3.1 exceeded the planning timeout for this request. No personal student data was sent; only the supplied Zahi sample profile.
- Browser demo: onboard Zahi; complete a quest (+50 XP); attach completed project (+100 XP); verify Level 2 and avatar movement; submit building/limited-time feedback; verify 120-minute next plan; refresh and confirm plans, project, XP, and streak persist.
- Browser supporting pages: profile, progress, opportunity-match explanations, official USC resources.
- Mobile: compact navigation and no horizontal overflow at 390px; resource navigation verified.
- Repository base path: production app loads directly at `/TrojanPath/#/plan` with repository-prefixed assets.
- Frontend secret scan: no Gemini key shipped. Root and backend local secret files are Git-ignored.

Hosted AI follow-up: after the key was saved in Supabase Secrets, authenticated generation returned `source: gemini` and persisted a real plan and its tasks. The verification used synthetic data, then revoked the session and removed the disposable account and records.

Remaining external steps: Configure Auth Site URL/redirect URLs and email delivery for the intended hosted origin. Push source and enable GitHub Pages with the two public repository variables to deploy the frontend. Opportunity examples remain samples, résumé parsing is manual, and rewards remain illustrative.

## Teammate frontend update

- Integrated frontend source: `ncojoc@6b7ea848f274ad0f5da32f9da7a6b587d736e703`.
- Production build and TypeScript: pass; all 10 existing tests pass.
- Isolated browser demo: onboard profile, complete three quests, verify 100 XP / Level 2, and confirm the mountain’s current milestone advances to “Build something real.”
- Submit a check-in: streak becomes 1, next week is saved, and completed suggestions are excluded from the new plan.
- Backend contracts and secrets are unchanged; live Gemini and private upload verification above remain applicable. This update’s browser mutation tests used isolated local demo data, not a live student account.

## Focused UI, game graphics, and guided onboarding

- Production build / TypeScript: pass. Vitest: 15 tests pass, including Active filtering, completion toggling without repeated XP, recap snapshots, skill-context persistence, and provider question validation.
- Deno checks: `generate-plan` and `skill-context` pass. Hosted `skill-context` is active and rejects anonymous requests with 401. A direct synthetic Figma request to real Gemini returned a valid contextual question. The signed-in frontend-to-function skill-question path was not exercised in this update; request/validation behavior is covered by tests and the existing authenticated helper.
- Isolated demo browser: verified compact roadmap completion, undo completion, Active/Completed counts, automatic completed-task check-in selection, history with recap/reflections, and document editing with save/reload persistence.
- Guided onboarding browser: verified one question at a time, Back preserving a changed name, individual skill follow-ups, project title/link/description, résumé file attachment, editable 2.5-hour availability, successful saved pathway, and a plan within the selected budget. All browser test mutations used disposable local demo data.
- Responsive dashboard: 390px viewport has no horizontal overflow. Original vector mascot and map graphics replace the initials avatar; motion respects reduced-motion preferences.
- New profile and check-in fields remain inside existing owner-protected JSON data; no table grants, RLS policies, or database schema changed.

## Screenshot-inspired UI and career ladder

- Main navigation now uses Weekly Plan and Path, with icons, a player card, and mobile bottom navigation. The path graphic is a physical career ladder with floors and rungs; the guide loads directly on its earned milestone and moves vertically along the ladder. Outdoor scenery and the sky path are removed.
- Completion ring, level bars, persistent crossed-out completed tasks, a reduced-motion-aware XP celebration, ranking podium, workload cards, and eight derived badges are implemented. Opportunity samples stay explicitly labeled.
- Production build / TypeScript and all 17 tests pass. Achievement tests verify recorded awards and that duplicate check-in weeks cannot inflate a streak.
- Browser verification: three completed demo tasks show 100 XP and Level 2; First Step is earned. The final preview at 150 XP renders the guide at the second floor (118px from the base), with no horizontal overflow in the observed 721px viewport. Prior saved demo progress and check-in status remain intact.
- No backend, database, credentials, or API model changes in this update.

## Profile reference, HackSC demo task, and horse logo

- Profile now follows the supplied banner / Interests / Skills / Goal / project-card layout, with live XP level and existing edit, résumé, attachment, project-link, and LinkedIn-draft actions retained.
- The supplied photographed horse icon was cleaned into `public/trojanpath-logo.png` and installed in the app wordmark, sign-in screen, favicon, and Apple touch icon. Asset paths respect the Vite base path.
- Demo plans include an optional 60-minute “Attend HackSC hackathon” participation block linking to the official HackSC site. Saved demos upgrade only an untouched, unawarded suggestion of at least 60 minutes. Completed/reflected work is protected, total planned time never increases, and live fallback plans are unchanged.
- Browser: profile banner and three info cards render as requested; existing project card/actions remain. Reloaded demo shows HackSC in its saved weekly plan with 40 XP and the original 120-minute plan budget intact.
- Production build / TypeScript and all 19 tests pass. Deno checks for the planning function pass with the new shared demo helper.
