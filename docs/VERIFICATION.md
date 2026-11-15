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
