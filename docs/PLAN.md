# Portfolio Website — Plan

## Context

You're a full stack dev (1y 9m, Kolkata). Production: Laravel, React + Redux, MySQL, Redis, REST APIs. Project-level: Node, Express, MongoDB. Learning: Java / Spring Boot. You've shipped client sites (car rental and others) and an SOP-generator SaaS. You want one site that gets you **freelance clients now** and **recruiter interest** for larger consulting/tech companies later.

What's already in the repo: the **Laravel 13 React starter kit**. Inertia v3, React 19 with React Compiler, Tailwind v4, Vite 8, Wayfinder, Pest, SQLite, and Fortify auth with passkeys. It already has an SSR build script (`build:ssr`), a light/dark hook (`resources/js/hooks/use-appearance.tsx`) and Radix UI parts (`resources/js/components/ui`). Nobody logs in on this site, so the auth scaffolding comes out.

Hard rules this plan follows:

- No login or admin of any kind.
- The site never claims more than your real background. AI output follows the same rule.
- AI never blocks a page render, and the site works fully when AI is down.
- Motion respects `prefers-reduced-motion`. Mobile Lighthouse target is 95 or higher.

You're learning React through your course, so I'll write the code normally and not teach inline. This file is the source of truth for the build.

---

## 1. Architecture decisions (and why)

| Decision        | Choice                                                                                                | Why                                                                                                                                                                                                                                                                                                                                          |
| --------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Laravel ↔ React | **Inertia v3** (already installed)                                                                    | You get one repo, one deploy and one router, with no REST layer to version or CORS to set up. A separate SPA plus API would be extra plumbing that buys you nothing on a portfolio.                                                                                                                                                          |
| SSR             | **On**, via `@inertiajs/vite`                                                                         | LinkedIn, WhatsApp and Slack link previews don't run JS, and recruiters share links. SSR also speeds up the first paint. If the SSR Node process dies, Inertia falls back to client rendering, so there's no outage. **Cost:** your host must run a Node process next to PHP. Laravel Cloud, Forge or a VPS can. Cheap shared hosting can't. |
| Content         | **Files in git** (PHP arrays + Markdown with YAML front matter)                                       | Editing content means editing a file, committing and deploying. No DB, no admin, and you get a history of every change.                                                                                                                                                                                                                      |
| Database        | SQLite (keep)                                                                                         | Used only for sessions, cache, rate limits, the AI usage ledger and contact messages. Never for content.                                                                                                                                                                                                                                     |
| AI provider     | Your own small `AiProvider` interface with one HTTP implementation, chosen by `AI_PROVIDER` in `.env` | It's about 100 lines, easy to fake in tests, and adds no new dependency. Default: **Claude Haiku 4.5**, which is cheap, fast and good at following grounding instructions.                                                                                                                                                                   |
| Animation       | **GSAP + `@gsap/react`** (new deps, needs your OK)                                                    | GSAP is now free, including ScrollTrigger, SplitText and Flip. `useGSAP` handles cleanup in React.                                                                                                                                                                                                                                           |

**Things I'm deliberately NOT adding (overbuilt for a portfolio):** a vector DB or RAG (all your content fits in about 6k tokens, so it goes straight into the prompt), Lenis/smooth-scroll hijacking (hurts accessibility and feels laggy on slow laptops), a WebGL/Three.js hero, a blog, a CMS, i18n and analytics dashboards.

---

## 2. One site, two audiences

Don't build two sites, and don't use AI for this. Use a **deterministic audience switch**:

- The hero has a segmented control: **"I'm hiring" / "I need something built"**. A neutral default shows both paths.
- The choice lives in a `?for=recruiter|client` query param plus a cookie, so the server renders the right variant under SSR with no flash of the wrong content. The URLs are shareable: put `yoursite.com/?for=client` in freelance proposals and `?for=recruiter` on your CV.
- Switching changes the headline and subcopy, the **order** of sections (GSAP Flip animates the reorder, which is the signature moment of the site), the primary CTA ("Download résumé" vs "Get a project plan") and which projects are featured.
- **Why not AI here:** you'd pay latency and cost for copy you should write yourself, and generated copy is exactly where overclaiming slips in.

---

## 3. Pages and content

| Route               | Audience   | Content                                                                                                                                   |
| ------------------- | ---------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `/`                 | both       | Hero + audience switch · Selected work (3) · **Skills by evidence tier** · Experience timeline · Currently learning · AI chat entry · CTA |
| `/work`             | both       | All projects, filterable by type (client site / SaaS / personal)                                                                          |
| `/work/{slug}`      | both       | Case study: problem → what I built → stack → my role → outcome → build timeline → links                                                   |
| `/hire`             | clients    | Services, process (4 steps), **Project Brief tool**, FAQ, contact form                                                                    |
| `/resume`           | recruiters | Printable one-pager (print CSS), PDF download, **Job-description matcher**                                                                |
| `/sitemap.xml`, 404 | —          | SEO + a friendly 404                                                                                                                      |

**Skills by evidence tier** is the honesty feature. It's built into the data model, and the UI and the AI both read from it:

- **Production**: PHP/Laravel, React + Redux, MySQL, Redis, REST APIs, with experience length calculated from Apr 2025.
- **Built projects with**: Node.js, Express, MongoDB, each linked to the project that proves it.
- **Currently learning**: Java, Spring Boot, with the course name and a simple progress note.

**Contact:** a form with a honeypot field and per-IP throttle. It saves to the DB and emails you. Nothing more.

---

## 4. AI features

Every feature has to pass two tests. **Memorable**: would a visitor remember it? **Useful**: does it save the visitor time or prove a skill? Here's my verdict on your four ideas:

| Your idea                              | Verdict                                                                                                                                                                                                   |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Streaming "ask about me" chat          | **Keep.** This is the core feature.                                                                                                                                                                       |
| AI-reshaped hero                       | **Replace** with the deterministic switch in §2 and put the AI budget into the JD matcher below.                                                                                                          |
| Project brief → sitemap + phases       | **Keep, with guardrails.** No prices, no day estimates, clearly labelled as a draft.                                                                                                                      |
| "How it was built" from commit history | **Change to offline.** Client repos are private and commit messages are noisy. Generate it locally with an artisan command, review it, and commit it as content. Zero runtime cost and no attack surface. |

### 4.1 Ask About Me (both audiences)

- **UX:** press ⌘K / Ctrl+K or tap a floating button to open a Radix Dialog. It shows 4 suggested questions as chips. The answer streams in with a soft per-word fade, not a fake typewriter. Each answer ends with **source chips** ("Car rental case study →") that link to real pages, so it proves the answer rather than just stating it.
- **Honesty:** the prompt includes the skill evidence tiers. The model is told to say "I haven't used X in production; I've built Y with it" or "that's not in my background". A Pest test covers this with a fake provider.
- **Tech:** a POST endpoint streams Server-Sent Events via `response()->eventStream()`. The client reads the stream with `fetch`. The chat bundle is lazy-loaded, so it costs 0 KB on first paint.

### 4.2 Project Brief Planner (clients, `/hire`)

- **UX:** the client describes their idea in up to 1,000 chars, with optional chips for type and budget band. The result renders as an **animated sitemap tree**: SVG connector lines draw in, then nodes pop in. Below it: a **phase timeline** (MVP → v1 → later), each phase sized S/M/L, a "Questions I'd ask you" list, and "Closest thing I've built: _Car rental site_". The CTA **"Send this brief to Dexter"** pre-fills the contact form with the brief.
- **Why it's useful:** the client gets a structured first scope in 20 seconds, and you get a qualified lead with a written brief.
- **Tech:** the provider returns JSON output, which Laravel validates against a schema before it goes to the client. If validation fails, the client sees a friendly fallback plus the plain contact form.

### 4.3 Job Description Matcher (recruiters, `/resume`)

- **UX:** the recruiter pastes a JD. Each requirement becomes a row that animates in with a badge: **Production** (green) / **Built projects** (blue) / **Learning** (amber) / **Gap** (grey), plus a one-line evidence link. A summary line at the top gives the honest fit. They can copy the result as a note.
- **Why:** it saves a recruiter's screening time, and showing a _Gap_ badge honestly builds more trust than claiming everything. You need to be comfortable with it saying "Gap".
- **Tech:** the same JSON-schema flow as 4.2. The requirement list comes from the model, but tiers are **mapped from your skills data in PHP where possible**, so the model can't promote a skill up a tier.

### 4.4 Build Story (offline, content only)

- `php artisan portfolio:build-story {slug} --repo=/path/to/repo` reads `git log` locally and asks the AI to cluster commits into 4–6 milestones. It writes them to the project's front matter **for you to edit** before committing.
- **UX on the case study:** a vertical timeline with a scroll-drawn line (ScrollTrigger scrub) and milestones that reveal as you scroll.

### 4.5 Guardrails (all live features share one `AiGateway`)

| Guard             | Implementation                                                                                                                                                                                                                                                                                                                                                              |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Rate limit per IP | Named `RateLimiter`s: chat 20/hour, brief 5/hour, JD 5/hour, plus a global per-IP daily cap                                                                                                                                                                                                                                                                                 |
| Input caps        | FormRequest `max:` (chat 500, brief 1000, JD 6000 chars); chat history trimmed to the last 6 turns                                                                                                                                                                                                                                                                          |
| Token caps        | `max_tokens` set per feature in `config/ai.php`                                                                                                                                                                                                                                                                                                                             |
| Response cache    | Key = hash(feature + normalised input + **content version**). Editing content busts the cache automatically. Chat caches only the first turn, which covers the suggested chips.                                                                                                                                                                                             |
| Spend limit       | An `ai_usage` table logs tokens and estimated cost per call. The gateway refuses once the daily/monthly budget in `.env` is hit and the UI shows the fallback. Also set a hard cap in the provider console, because belt and braces.                                                                                                                                        |
| Prompt injection  | Your content goes in the system prompt and visitor input is wrapped in delimiters. The model gets **no tools**, the prompt holds **no secrets**, and structured outputs are schema-validated. Off-topic → a short refusal. Honestly, injection can't be fully prevented. The design makes a successful one harmless: the worst case is odd text shown only to the attacker. |
| Failure           | Every AI widget has a static fallback (FAQ + contact / plain form / résumé link). No AI call happens during a page render.                                                                                                                                                                                                                                                  |

---

## 5. Visual & motion direction

- **Look:** editorial and calm. Dark-first with a light mode, using the existing `use-appearance` hook. Dark teal accent, Poppins throughout (headings and body) with JetBrains Mono for small labels, all self-hosted. Thin grid lines and a soft teal glow.
- **Signature moments** (each has a purpose):
    1. Hero headline reveals by line with SplitText + mask.
    2. The audience switch reorders sections with **Flip**.
    3. Project cards: image clip-path reveal on hover/focus.
    4. Case-study build timeline drawn on scroll.
    5. The brief planner's sitemap draws itself.
    6. Section reveals fire **once** on enter, with nothing looping forever.
- **Performance and a11y rules:** animate only `transform` and `opacity`. All GSAP runs inside `gsap.matchMedia()` with a `(prefers-reduced-motion: reduce)` branch that shows the final state instantly. GSAP plugins are registered once in `resources/js/lib/gsap.ts`. Streaming chat text goes to a live region only when complete, not per token. Focus stays visible and there's a skip link.

---

## 6. Data & folder structure

```
content/                                  # all editable content, in git
  profile.php        # name, role, bio variants per audience, links, availability
  skills.php         # [name, tier: production|projects|learning, evidence: [project slugs]]
  experience.php     # roles, dates, bullet points
  services.php, faq.php, learning.php
  projects/
    car-rental-<client>.md                # YAML front matter + markdown body
    sop-generator-saas.md

app/
  Content/ContentRepository.php           # loads + caches content, exposes version hash
  Content/Data/Project.php, Skill.php     # readonly DTOs
  Ai/Contracts/AiProvider.php             # complete(), stream(), completeJson()
  Ai/Providers/AnthropicProvider.php      # Http client; OpenAiProvider optional later
  Ai/AiGateway.php                        # budget, cache, caps, usage logging
  Ai/Features/AskAboutMe.php, BriefPlanner.php, JobMatcher.php
  Ai/KnowledgePack.php                    # content → compact grounding text
  Console/Commands/BuildStory.php
  Http/Controllers/{Home,Work,Hire,Resume,Contact,Sitemap}Controller.php
  Http/Controllers/Ai/{Chat,Brief,JobMatch}Controller.php
  Models/{AiUsage,ContactMessage}.php
config/ai.php
resources/prompts/*.md                    # system prompts, versioned in git
resources/js/
  pages/{home,hire,resume}.tsx, pages/work/{index,show}.tsx
  components/site/…  components/ai/…  components/motion/…
  lib/gsap.ts   hooks/use-audience.ts
tests/Feature/Ai/*, tests/Feature/Pages/*
```

**New dependencies needing approval:** `gsap`, `@gsap/react` (npm). Promote `symfony/yaml` (already installed transitively) to a direct composer dependency. Nothing else.

**Removed:** Fortify, passkeys, the auth/settings/dashboard pages and routes, and their tests.

---

## 7. Build phases (each ends with a summary + how to run/test)

0. **Cleanup and foundations.** Remove auth, add the site layout, fonts, design tokens, dark/light, and GSAP setup with reduced-motion handling.
1. **Content layer.** `content/` files, `ContentRepository`, DTOs, tests.
2. **Static pages.** Home (with audience switch + Flip), Work index/show, Hire, Resume (print CSS). Fully usable with zero AI.
3. **SEO and contact.** Meta/OG per page, `sitemap.xml`, robots, SSR verified. Contact form with honeypot, throttle and mail.
4. **AI core.** Provider interface, Anthropic provider, `AiGateway` guardrails, `ai_usage`, `config/ai.php`, Pest tests with a faked HTTP provider (budget, cache, rate limit, injection refusal, provider failure).
5. **Ask About Me** chat (streaming + sources).
6. **Project Brief Planner.**
7. **JD Matcher.**
8. **Build Story** command + case-study timeline.
9. **Polish.** Lighthouse/axe pass, mobile throttled testing, OG images, deploy.

Phases 2–3 give you a shippable site on their own. Ship it before starting AI work.

---

## 8. Risks & honest pushback

- **AI can overclaim anyway.** It's mitigated by evidence tiers mapped in PHP and by tests, but review real outputs before launch.
- **Content is the actual bottleneck.** Case studies need real problem/outcome text and screenshots, and client names need permission to show. Start writing now.
- **SSR hosting.** Decide the host before Phase 3. Laravel Cloud or a small VPS both work.
- **Four AI features is a lot.** If you want to cut, cut Build Story first, then the JD matcher. The chat alone is enough to impress.
- **Cost.** With Haiku, caps and caching, realistic traffic costs about a few dollars a month. The budget guard makes that a hard limit.

---

## 9. Verification (per phase and final)

- `php artisan test --compact` for the relevant files each phase, then the full suite. AI tests use `Http::fake()`, so there are no real calls.
- `vendor/bin/pint --dirty --format agent` after PHP changes, and `npm run types:check` after TS changes.
- `npm run build:ssr` + SSR server, then view source to confirm server-rendered HTML and OG tags.
- Manual: turn on OS reduced motion and confirm no animation. Set `AI_PROVIDER` to an invalid key and confirm every page still works with fallbacks. Hit rate limits with repeated requests.
- Lighthouse (mobile, throttled) ≥ 95 on Home, Work show, Hire.

## Open decisions (defaults assumed unless you say otherwise)

- Hosting target (default: Laravel Cloud, since it's SSR-capable).
- AI provider (default: Anthropic, Claude Haiku 4.5).
- Accent colour and fonts get decided in Phase 0 with a quick visual proposal.
