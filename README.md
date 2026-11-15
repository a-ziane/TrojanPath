# TrojanPath

**Turn your goals into your game plan.** A React + TypeScript career planning app for USC undergraduate, master’s, and PhD students. Independent student project; not official USC SSO or a university partnership.

## Run it

Requires Node 24+.

```sh
npm ci
cp .env.example .env.local
npm run dev
```

Open the URL printed by Vite. The explicit **Try demo** entry works with no external credentials. Demo state, including small attachments, stays in `localStorage` under `trojanpath:demo:v1`. Real accounts use Supabase exclusively and never import demo data. `Reset demo` removes only browser demo data. Use synthetic information in the demo, especially on shared devices.

The supplied project URL and publishable key are configured in the ignored `.env.local` for this checkout. For a new deployment set:

```dotenv
VITE_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=YOUR_PUBLISHABLE_KEY
VITE_BASE_PATH=/
```

Vite exposes only the public Supabase URL and publishable key. Never put a Gemini key or Supabase service key in a `VITE_` variable. `@supabase/ssr` is installed as requested but is not needed by this static Vite application. Browser sessions refresh through `supabase-js`; Next.js middleware would require a server and is not used.

## Features

- Email/password accounts with Supabase. Sign-up accurately reports when email confirmation is required.
- Editable profile, degree level, interests, self-reported skills, availability, experience, timezone, avatar, and leaderboard preferences.
- Structured weekly plans, accept/start/complete/skip/replace actions, evidence/reflection notes, saved history, and an adaptable check-in form.
- Distinct deterministic pathways for technology/data, healthcare, research/PhD, creative work, and career exploration. AI plans use the same validated structure and budget limits.
- Completed projects, optional private attachments, idempotent XP events, vertical avatar ladder, weekly local-time streaks, opt-in real leaderboard, and explicitly fictional demo rankings.
- Editable résumé draft, browser print/PDF styling, printable profile summary, and manually reviewed/copied LinkedIn project drafts.
- Official USC resource links. Opportunity examples are visibly samples, including in live mode; no live internship feed is implied.

## Supabase setup

The schema is in `supabase/migrations/`; official resource and sample-opportunity seed data is in `supabase/seed.sql`. Apply migrations in filename order, then the seed. This checkout targets the user-supplied TrojanPath project `iqvsqomldbqrzpekmujp`; never apply it to an unrelated project.

The pinned CLI is installed locally. CLI v3 defaults to local targets. Inspect `npx supabase migration up --help` and the relevant command’s help before targeting a hosted database. Alternatively, run each migration and then `seed.sql` in your project’s SQL editor. Do not rerun the initial migration against an already initialized database.

Tables: `profiles`, `projects`, `experiences`, `pathways`, `weekly_plans`, `tasks`, `check_ins`, `xp_events`, `resources`, `opportunities`. Flexible profile/experience data is JSON; a profile’s editable experience narrative is its confirmed source for planning and career materials. The `experiences` table is available for future structured records. Plans and tasks are written atomically through `save_plan` and preserved under a unique `(user_id, week)` constraint.

All exposed tables have RLS. Private records use the authenticated user’s ID, and task-to-plan ownership is enforced by a composite foreign key. XP is server-derived by narrow internal triggers and protected against direct client insertion; repeat requests and edits deduplicate on `(user_id, event_key)`. Authenticated clients cannot edit task effort/XP. Internal elevated functions check the authenticated identity and use an empty search path. Public wrappers run as invoker. The only cross-account output is an intentional, opt-in leaderboard returning display names and current-month points.

The private `student-files` bucket permits PDF, PNG, JPG, or text files up to 2 MB. The upload function authenticates the caller, bounds the request body, checks MIME and file signatures, sets a random owner-prefixed path, and uploads with server credentials. Browser downloads require an owner RLS policy and a 60-second signed URL. HTML/SVG uploads are rejected. No malware scanning is implemented; do not treat uploaded files as trusted executable content.

In **Authentication → URL Configuration**, add your actual local and hosted origins as allowed redirect URLs and set the hosted Site URL. Choose email confirmation settings and configure SMTP/delivery as needed. With confirmation enabled, students must confirm by email before their first sign-in. No USC SSO is implied.

## Gemini: live AI, low cost

Create a key in [Google AI Studio](https://aistudio.google.com/api-keys) and add it only in [Supabase Edge Function Secrets](https://supabase.com/dashboard/project/iqvsqomldbqrzpekmujp/functions/secrets):

- `GEMINI_API_KEY` — required for actual AI generation.
- `GEMINI_MODEL` — optional; defaults to `gemini-3.5-flash-lite`.
- `ALLOWED_ORIGINS` — comma-separated frontend origins, e.g. `http://127.0.0.1:5173,http://127.0.0.1:4173,https://a-ziane.github.io`.

Flash-Lite supports a free tier subject to Google’s account, region, and rate limits. The verified standard paid rates on November 14, 2026 are $0.30 / million input tokens and $2.50 / million output tokens. For illustration, a request using 3,000 input and 1,500 output tokens costs about $0.00465 on those rates. Actual token usage varies. The older 2.5 Flash-Lite is cheaper on paid rates but Google limits it to existing users; this app therefore defaults to the current new-project option. You may explicitly choose another compatible Gemini model through the server secret. See [Google pricing](https://aistudio.google.com/docs/pricing#gemini-3.5-flash-lite) and [legacy model availability](https://aistudio.google.com/docs/models/gemini-2.5-flash-lite).

Free-tier requests may be used to improve Google products under Google’s terms; paid-tier requests have different data-use terms. The app sends only a limited planning profile and short activity summaries, without email, uploaded documents, or résumé files. Students should understand this before using real personal information. University ChatGPT access does not supply Gemini or other API credits.

Cost controls: one persisted plan per user/week, no generation on page views or refresh, 10 planning/upload requests per user/hour in Postgres, a 20-second provider timeout, limited history/project summaries, and bounded model output. No web grounding/tool charges. A provider failure uses a plainly labeled deterministic fallback; no AI success is fabricated.

Deploy `generate-plan` and `upload-file` from `supabase/functions/`. The shared code in repository-root `shared/` must be included when bundling; preserve the source directory structure. Both functions use the pinned imports in `supabase/functions/deno.json`. The project’s Supabase URL, anon key, and service-role key are runtime-provided server variables. The service role is used only for validated uploads.

`verify_jwt = false` in function configuration is intentional for compatibility with current publishable keys and asymmetric JWTs. **Each endpoint independently verifies the bearer token through `auth.getUser()` before any data access or action.** It is not an unauthenticated API. Browser queries and the planning function run as the student under RLS.

Prompts and the provider interface live in `supabase/functions/_shared/provider.ts`; schemas in `shared/domain.ts`; budget, resource, and repeat validation plus deterministic planning in `shared/planner.ts`. AI may select only supplied resource IDs and cannot supply arbitrary URLs. Uploaded content is never interpreted as instructions or sent for automatic résumé parsing.

## Verification

```sh
npm run typecheck
npm test
npm run build
npx deno check --config supabase/functions/deno.json supabase/functions/generate-plan/index.ts supabase/functions/upload-file/index.ts
```

Vitest covers the main completion → project → XP → check-in → reduced-plan sequence, discipline differences, limited-time plans, timezone boundaries, duplicate check-ins, provider failures, structured outputs, and data minimization. A real PostgreSQL engine (PGlite) executes the migration with mocked Supabase auth/storage infrastructure to exercise RLS, ownership reassignment rejection, direct-XP-write rejection, idempotent awards, atomic plan saves, current-week check-ins, and persistent rate limiting. This verifies SQL behavior locally; it does not substitute for a hosted Auth/Storage integration test.

Browser verification checks onboarding, completing a quest, attaching a project, avatar/XP advancement, feedback-driven reduction from 210 to 120 minutes, refresh persistence, and page navigation. A 390px viewport check verifies compact navigation and no horizontal overflow. Production build and GitHub Pages base-path checks should be repeated after deployment configuration changes.

## Vercel

The frontend is ready to import into Vercel. `vercel.json` selects **Vite**, installs with **npm ci**, builds with **npm run build**, and publishes **dist**. Its build command explicitly sets `VITE_BASE_PATH=/` so a GitHub Pages base-path setting cannot break Vercel assets. Node **24.x** is pinned in `package.json`. Hash routes such as `/#/plan` work without a catch-all rewrite.

1. In Vercel, choose **Add New → Project** and import `a-ziane/TrojanPath`. Use repository root `./`, Vite, and production branch `main`. The checked-in configuration supplies the build/output settings.
2. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from your Supabase project to the **Production** environment. This project’s public URL is `https://iqvsqomldbqrzpekmujp.supabase.co`; the publishable key is available in Supabase’s API settings. Do not upload `.env.local`. For Preview, prefer a separate Supabase project and its corresponding public values; the same live project will share accounts and data across deployments if you deliberately use it for both.
3. Deploy. After Vercel assigns the real URL, add that exact origin (without a trailing slash or route) to the existing comma-separated `ALLOWED_ORIGINS` secret in Supabase Edge Function Secrets. Preserve origins you still use. For example, add `https://YOUR_ACTUAL_PROJECT.vercel.app`; replace that placeholder with the deployment’s actual domain. Do not allow every `*.vercel.app` domain. Explicitly add any preview origin you intend to test.
4. In Supabase **Authentication → URL Configuration**, set the **Site URL** to the production URL and add its root URL to **Redirect URLs**. Add explicit preview/local URLs only where needed. This lets email confirmation return to the app.
5. Test a real account: sign in, save a profile, generate a plan labeled **Gemini**, upload a project, and refresh. If plans or uploads fail only on the Vercel URL, check the origin allowlist first. Updating a Vercel build-time variable requires a new deployment.

Gemini and Supabase service credentials stay in **Supabase**, not Vercel. The hosted Edge Functions are already deployed separately; Vercel hosts the static frontend. `.vercelignore` excludes local environment files and backend files from CLI deployment uploads, and `.vercel/` is Git-ignored. A frontend deployment does not run database migrations or redeploy Edge Functions.

For a local equivalent of the Vercel build, run `VITE_BASE_PATH=/ npm run build`. The app still has an explicitly separate demo entry point if you want to inspect the interface without an account.

## GitHub Pages

`.github/workflows/pages.yml` builds, tests, and deploys `dist/` on pushes to `main` or manual dispatch. In GitHub, set **Settings → Pages → Source: GitHub Actions** and define repository variables `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`. Only these public values enter the build; Gemini remains in Supabase.

The workflow sets `VITE_BASE_PATH=/TrojanPath/`; navigation uses `HashRouter`, so a direct route looks like `https://a-ziane.github.io/TrojanPath/#/plan`. Static hosting needs no rewrite server. For another repository name, update the workflow’s base path. For a user/root domain site use `/`. Run `VITE_BASE_PATH=/TrojanPath/ npm run build` locally to inspect repository-relative assets.

Deployment is not automatic merely from creating local files; the implementation must be committed/pushed and Pages enabled. The live backend is independently hosted in Supabase.

## Three-minute walkthrough

1. **0:00–0:30** Open the app → Try demo. Keep Zahi’s Economics and Data Science profile, Python/Statistics skills, machine-learning interest, and four hours/week. Save to generate his path.
2. **0:30–1:00** Review a quest’s fit and completion criteria. Complete the first model-building quest. Observe +50 XP, then refresh to confirm persistence.
3. **1:00–1:40** Profile → Add project. Enter a confirmed description, date, and skills; attach a small PNG/PDF/text file and mark completed. Save. Progress shows 150 XP, Level 2, and the avatar at the next rung. Edit the same project: XP stays 150.
4. **1:40–2:20** Weekly Plan → Weekly check-in. Say “I enjoyed building” and choose “Too busy — I had limited time.” Save. The following week has at most 120 minutes, building first, a change explanation, and access to the previous week. Repeat the same check-in: the streak stays one week.
5. **2:20–3:00** View Profile → Career materials; edit and print/save a draft. Draft a LinkedIn post without publishing. Browse sample Opportunities and verified USC Resources. Exit demo to create/sign into a real account.

## Deliberate limitations

No social network, automated LinkedIn publishing, funded prizes, official USC SSO, verified live opportunity feed, or automatic résumé parsing. Files have validation and private access, but no malware scanning. Demo attachments are browser-local and limited by browser quota. Resource destinations were verified, but their program availability is not guaranteed. A failed AI request preserves existing plans. Editing a check-in does not regenerate an already saved next-week plan; it updates feedback for the next generation. Already-awarded XP is not awarded again or retroactively revoked when an item’s status changes.

### Local key file

A local Gemini key belongs in `supabase/functions/.env` (copy the adjacent `.env.example`). This file is ignored by Git. It is not deployed by a frontend build; copy the secret into Supabase’s Edge Function Secrets for hosted generation. `node scripts/check-gemini.mjs` validates the local key without printing it; `node scripts/test-gemini.mjs` exercises a real structured plan with synthetic data only. Local backend execution additionally requires the Supabase local stack and its runtime environment, or deploying the functions to your project.

## Teammate frontend integration

The main interface adapts [zahitisani3-rgb/ncojoc](https://github.com/zahitisani3-rgb/ncojoc) at commit `6b7ea848f274ad0f5da32f9da7a6b587d736e703`: the TP identity, cardinal/gold palette, DM Sans / Space Grotesk typography, sidebar, mountain trail, shared UI components, and quest card layout. Ported components live in `src/teammate/`.

The original Next.js/Zustand demo was adapted to the existing Vite app, keeping the live Supabase/Gemini integration and saved records. Pathway progression comes from earned XP; quests retain accept, replace, skip, completion, resources, and reflection. Check-ins and résumé editing open from the sidebar. Profile/project uploads and USC resources remain available. The leaderboard uses the existing opt-in database function in live mode; demo rankings remain explicitly fictional. No new API keys or database migrations are needed for this interface update. Existing Vercel settings remain valid.

## Focused dashboard and onboarding update

- Onboarding now advances one question at a time, with Back/Continue, optional steps, dynamic skill follow-ups, current projects with links, a private résumé upload, and editable weekly hours. Editing an existing profile remains a single form.
- New skills in live mode request a short contextual Gemini question through the authenticated `skill-context` Edge Function. Demo mode uses a clearly local prompt. Saved answers are profile data and limited excerpts inform later AI planning. If AI is unavailable or rate-limited, the question remains answerable without AI.
- The Pathway combines the mountain roadmap and compact task tracker. Active includes both older `suggested` and `in progress` records. Complete toggles completion; reopening does not revoke XP, and re-completing never awards duplicate XP. Details, reasons, evidence, replace, and skip live behind expandable controls.
- `/checkins` contains saved weekly reflections and factual, automatically assembled recaps. New check-ins snapshot confirmed task completions so later task edits do not rewrite the recap.
- `/resume` is a paper-style document editor with explicit Save, unsaved-change status, and PDF export through the browser’s print dialog.
- The original vector Trojan guide, mountain scenery, milestone stars/flags, and compact XP meter provide the game styling without external graphics dependencies.
- Deploy `skill-context` alongside `generate-plan` and `upload-file`; all keep the Gemini secret on the server. Skill questions share the existing per-user AI request limit. No database migration or additional API key is required.

The latest screenshot-inspired design uses **Weekly Plan** and **Path**, a physical career ladder, earned badges, completion rings, ranking podiums, and mobile bottom navigation. Milestone floors reflect participation XP; they are not employment titles or promised promotions. The guide stays on the ladder instead of following an outdoor trail into the sky.

## Portfolio

`/portfolio` replaces the résumé page (`/resume` redirects). Completed tasks, events, and completed projects create editable, factual résumé suggestions from their saved titles, reflections, descriptions, and skills. Planned instructions are never presented as accomplishments. Accept or Save & accept updates and saves the current résumé; Dismiss does not add anything. Reviewed decisions persist, and dismissed items can be restored. The document remains directly editable, with a 4,000-character limit and direct PDF download through a lazily loaded jsPDF module.

The side panel drafts editable LinkedIn posts for completed activities. Edited drafts can be saved and copied; nothing is published automatically. Suggestions and posts are assembled from confirmed saved activity details, with no additional API calls or new credentials. Portfolio decisions and post drafts live in the existing owner-protected profile JSON.

The supplied horse logo is the shared header/sign-in/favicon mark. Asset URLs include a cache version so the older TP mark is replaced on refresh.

### Live AI connection

Production `https://trojanpath.vercel.app` is explicitly allowed by the Edge Functions' CORS policy, alongside the local development and GitHub Pages origins. Additional origins can be added through `ALLOWED_ORIGINS`. Live generation uses Gemini; errors remain retryable and no longer silently become starter plans. Weekly Plan offers **Generate with Gemini** for untouched starter plans; plans with progress or reflection are preserved. New visitors start in light mode; the theme toggle remembers a student's explicit light/dark choice.

### Recording the two demo journeys

Choose **Try demo → Start Zahi’s journey → Fill with Zahi’s example**, then walk through the editable questions and select **Build my path**. The first example plan has economics-data exploration, introductory ML, and the existing USC Career Center resource, totaling 150 minutes within four hours.

Choose **Try demo → See Zahi after 4 weeks** to open Profile with the adaptation card. Use **View supporting check-ins**, **Weekly Plan → Week** to compare the oldest and current plans, then **Profile → Projects** and **Portfolio** for the completed sample project and its pending résumé suggestion. The demo-only **New student / After 4 weeks / Reset this demo** controls switch isolated browser saves. Reset clears only the selected journey. Dates are seeded relative to the current week; existing saves retain their recorded dates until reset. No sign-in or Gemini request is made by either journey. New-student drafts preserve answers on refresh and return to question one.

### Happening Now

Adapted from teammate branch [`engage-events`, commit `2422d97`](https://github.com/zahitisani3-rgb/ncojoc/tree/engage-events). The existing Vite MVP keeps its authentication, Resources page, and XP rules. `shared/campus-events.ts` adapts the teammate's calendar normalization and matching; `Happening Now` adds event discovery, search, saved Going intentions, and self-reported attendance reflections that appear in Portfolio. Event completion is disabled until after the official end time; Going does not register the student or award XP. Event completion now uses the MVP’s normal task XP rules; Going itself earns no XP.

The public, read-only Supabase `campus-events` function fetches the official USC calendar, caches each runtime's feed for an hour, and serves a labeled saved snapshot if the calendar is unavailable. Profiles are matched locally; profile text is not sent to the calendar. Demo mode always uses the deterministic labeled snapshot without fetching the service. The snapshot is dated November 15, 2026; official event pages remain authoritative for schedules and registration. Publish the Edge Function with its shared dependencies when deploying a fresh backend; it is already deployed to the configured TrojanPath project.

Going now creates a real event task in the normal Weekly Plan task list, including an XP value. There is no separate event section. The completion checkbox is locked until the official event end time; events without a known end time remain locked. Live accounts enforce this against a server-verified calendar catalog, not a browser-provided timestamp. Toggle Going off before completion to remove the task. Completion XP follows the current task/project checkmark: unchecking removes its reward and rechecking restores a single reward. Live accounts enforce this atomically in the database; demo accounts use the same rule locally. Light mode is the default for visitors without a saved theme choice; the toggle remains available.

The authenticated `plan-campus-event` Edge Function verifies the chosen event against the USC feed or trusted snapshot, stores its schedule in the server-only calendar catalog, and atomically creates/removes the owner’s task and Going record. Apply the `planned_event_tasks` migration and deploy this function with its shared dependencies for a fresh backend. Both are already installed on the configured project. Completion updates event reflection evidence for Portfolio; removing completion reverses the normal task XP.
