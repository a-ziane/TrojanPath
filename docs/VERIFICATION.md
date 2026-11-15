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

## Portfolio suggestions, résumé download, and LinkedIn drafts

- `/portfolio` replaces résumé navigation; `/resume` remains a redirect. Shared horse logo verified loaded in the top-corner header.
- Build / TypeScript and 23 tests pass. Tests cover completed-only sources, evidence rather than instructions, edited additions, duplicate prevention, size limits, saved review states/posts, and factual event/project drafts.
- Isolated browser demo: complete model/Python/HackSC tasks; accept model suggestion; edit and accept Python suggestion; dismiss HackSC without adding it; verify saved document and decisions survive reload; restore dismissed suggestion.
- LinkedIn: choose HackSC event, edit draft, save, reload, select same activity, and verify the edited text persists.
- Direct PDF: Download résumé produced `Zahi-resume.pdf`, recognized as a valid one-page PDF 1.3 file. Current document text is exported locally without sending it to an API.
- Responsive: 1280px and 390px document widths match scroll widths (no horizontal overflow).
- Live persistence uses the existing profile JSON/RLS path. This update’s browser mutations were isolated demo data; a new hosted-account session was not created.

Integration follow-up: rebased Portfolio onto the contributor’s light/dark-mode update (`320f820`), preserving the theme toggle and theme initialization. Portfolio panels, controls, text, borders, and the sticky logo header now use the shared theme tokens; the résumé paper remains white for PDF preview. Combined production build and all 25 tests pass.

## Production AI connection and dark mode — November 15, 2026

- Reproduced production CORS failure: `https://trojanpath.vercel.app` received `Access-Control-Allow-Origin: null`. Deployed corrected headers to generate-plan v7, skill-context v2, and upload-file v3; all three production preflights now return the exact allowed origin.
- An authorized temporary authenticated test account saved a starter plan, called the hosted generation endpoint, received HTTP 200/source `gemini`, and read back one Gemini plan with three generated tasks. Signed out globally after verification. Removed the temporary account after approval and verified zero remaining test accounts, plans, tasks, or sessions.
- Atomic starter upgrade is owner-scoped and refuses plans with changed task status/reflections; database regression checks cover rollback on invalid plans and preservation of completed work. Existing Gemini plans remain idempotent.
- Default theme is dark; saved light choices remain supported by the existing toggle. Build, Edge Function type checks, and all 31 tests pass.

## Production alias and Safari verification

The user's Safari tab was on `https://trojanpath-a-zianes-projects.vercel.app`, which was absent from the exact origin allowlist. Added that production alias and redeployed generate-plan v8, skill-context v3, and upload-file v4. Verified generation directly through the Vercel UI with a temporary account, then successfully upgraded the user's untouched starter plan in their Safari tab. The page displays three personalized tasks and “Generated with Gemini.” Error reporting now preserves server messages and distinguishes authentication failures from browser connection failures.

## Recording journeys and teammate campus-events page

- Reused existing onboarding, profile, task tracker, check-in history, Portfolio, and XP calculations. Each demo now has its own versioned localStorage key; selection and draft answers persist. Live auth storage, the live repository methods, and the legacy demo key are untouched. Switching/resetting never calls live mutation methods.
- Browser-verified: Try demo offers both choices; new student opens question one, example filling leaves answers editable, all 16 questions reach the first deterministic plan, a task completion persists, and switching to the four-week journey does not mix histories. Resetting new student leaves the four-week save intact. Four-week Profile loads its adaptation card immediately; supporting history contains three previous-week check-ins; Week selector exposes all four plans; Portfolio puts the completed sample project's résumé suggestion first. Seeded XP is 330 with a three-week streak; the current 120-minute plan has no completed tasks. Celebration overlays are disabled only in demo mode.
- Imported the campus-event feed/matching approach from `zahitisani3-rgb/ncojoc` branch `engage-events`, commit `2422d97`, adapting its Next.js UI to this Vite app and existing Supabase backend. Kept Resources, live authentication/planning, and current XP accounting. Added optional profile-owned event notes; no database migration or new dependency.
- Deployed public read-only `campus-events` v1. Hosted endpoint returned HTTP 200, production CORS origin, source `live`, and 138 normalized upcoming USC listings. Profile matching runs locally. Demo event cards use the labeled November 15 snapshot and no API call. Going survived browser refresh; future I went buttons were disabled. Mobile viewport 390px had document width 390px with scrollable seven-item navigation.
- Tests cover independent storage/reset, incomplete onboarding drafts, chronological plans/check-ins/XP, budgets, verified resource IDs, adaptation evidence, matching, calendar normalization, and attendance-only Portfolio inclusion. Production build and 43 tests pass. Existing provider and database access-control tests remain green; no real accounts or saved plans were modified for this task.
- Production browser verification confirmed the automatic Vercel deployment exposes both journey choices and the imported Happening Now page. It also caught a first-entry wildcard redirect racing the four-week destination; the fallback route now respects the selected journey. Replayed welcome → Try demo → See Zahi after 4 weeks in the isolated production build and verified it opens `/profile` with the adaptation card, without an XP animation.

## Planned events, reversible XP, and light default

- Browser verified Going → Weekly Plan displays the chosen event and scheduled date, survives refresh, and Remove clears it without altering task history. Uses existing profile-owned event saves for both live and demo modes.
- Browser verified completing a 50-XP task changed the demo from 330 to 380 XP, unchecking returned it to 330, and refresh preserved the result. Unit tests cover repeated unchecks/rechecks and project reversals. Database tests cover atomic deduction/restoration and unchanged direct-XP-write restrictions.
- Installed the owner-scoped reversible completion reward trigger in the hosted database and confirmed its definition. No direct client XP writes or manual changes to real students' task statuses were used.
- Fresh isolated browser opened in light mode. Saved dark/light choices and the toggle still work. Production build and all 46 tests pass.

## Real event tasks and end-time enforcement

- Replaced the separate weekly-plan event section with actual task records. Going creates one event task with the normal duration-based XP, contributes to task counts, and survives refresh; repeated Going requests do not duplicate it. Cancelling Going removes an unfinished event task.
- Task UI disables completion until the official end time, refreshes its clock automatically, and leaves unknown-end events locked. Removed the independent I went action to avoid a second completion path.
- Live tasks are created through an authenticated Edge Function and owner-scoped atomic RPC. Schedule metadata comes from the USC feed/trusted snapshot using server credentials. Clients cannot update the calendar catalog; the database completion trigger checks that catalog rather than editable task timestamps. Existing starter-plan regeneration cannot delete selected event tasks.
- Installed the migration and deployed plan-campus-event v2. Anonymous POST returns HTTP 401 with the correct production CORS header. No real student account or plan was modified during verification. Database integration tests verify deduplication, rejection before/without an end time, XP after an eligible past event, XP reversal, and denied client schedule writes. Demo tests verify one Portfolio entry per completed event.
- Browser verified the chosen event appears in the main task list as Event · 60 min · +40 XP, checkbox disabled until November 24 at 1 PM Pacific, with no separate section. Refresh retains the task and lock. Production build, Edge Function type check, and all 50 tests pass.
