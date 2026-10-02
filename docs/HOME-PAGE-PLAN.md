# Home Page — Plan

## Context

The overall site plan lives in `docs/PLAN.md`. The foundation is done: the Poppins + dark-teal theme, GSAP setup, and the content layer in `content/*.php` read by `app/Content/ContentRepository.php`. The home page is still a placeholder with hardcoded skills.

This plan covers the real home page:

- A hero ("banner") section, including whether a photo is needed.
- A polished header, plus a mobile sidebar with Font Awesome hamburger and close icons.
- A correct heading hierarchy (h1 → h2 → h3) for SEO.
- GSAP animation that is purposeful, not scattered.
- Full responsiveness from 360px phones to wide desktops.

We'll build it in small steps and review each one.

---

## 1. Do you need a photo? Yes, one.

A face builds trust with freelance clients, and it helps recruiters recognise you after a call. One portrait is enough. Everything else on the page is typographic, which keeps it fast.

**What to send**

|            |                                                                                                                                                                                            |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framing    | Head and shoulders to mid-chest. Face the camera or turn slightly (a 3/4 angle), with a relaxed, confident expression.                                                                     |
| Clothes    | A plain solid colour, like a dark or white shirt or t-shirt. No logos or busy patterns.                                                                                                    |
| Background | **Removed (transparent PNG).** It will sit on the dark-teal backdrop, and I'll add a soft teal rim light in CSS.                                                                           |
| Size       | Portrait ratio **4:5**, at least **1200 × 1500 px**.                                                                                                                                       |
| Lighting   | Even and soft on the face, with no harsh shadows.                                                                                                                                          |
| AI editing | Fine for background removal, lighting, colour and skin clean-up. **Don't change your face, age or build.** Recruiters and clients will meet you on video, so the photo must look like you. |
| File       | Save it as `public/images/profile/portrait.png`. I'll convert it to WebP/AVIF at 3 sizes, around 60–120 KB each.                                                                           |

**Until you send it:** the hero shows a teal "LA" monogram tile of the same size, so the layout never breaks. Later (Phase 3) I'll generate a 1200×630 social-share image from this portrait. No other photos are needed on the home page.

---

## 2. Design direction

**The one memorable thing: the "−40%" API trace.** Your strongest proven result is cutting API response time by 40% through query optimisation, indexing and Redis caching. That's specific to you, and it shows your full stack at once.

- The hero portrait has a small **request-trace card** overlapping its lower edge. It looks like a browser devtools timing row.
- It shows **`GET /api/bookings`**, a "before" bar at 100% and an "after" bar at 60%, labelled "40% faster · indexing + Redis caching".
- On page load the "after" bar shrinks from 100% to 60% while the label counts down to −40%.
- It's the page's single orchestrated motion moment. It uses only relative numbers, because the bio has no absolute timings, so it claims nothing extra.

**Palette** (existing tokens, named):

- Deep sea `#0b1719`: background.
- Tide `#13222a`: raised surfaces.
- Teal `#0f6b66`: buttons and fills.
- Seafoam `#5ec4b6`: teal text and lines on dark.
- Mist `#e6f0ef`: text.
- Amber `#e0a84a`: the "learning" tier only.

**Type:**

- Poppins does all the work. Headlines are semibold (600) with tight tracking, body text is 400, and the type scale is roughly 14 / 16 / 18 / 24 / 36 / 60.
- JetBrains Mono is used **only inside the trace card**, where code-style text is genuinely what's being shown. I'll remove the mono uppercase labels used elsewhere on the placeholder page.

**Things I'm deliberately avoiding** (they make a page look templated):

- Uppercase letter-spaced eyebrow labels.
- "A · B · C" dotted meta strings.
- Colouring one word of the headline, which the placeholder does now and will lose.
- Fade-up on every section.
- Identical cards everywhere.
- Arrow-suffixed buttons.

**Motion rules:**

1. One page-load sequence in the hero.
2. A scroll-drawn experience timeline, because it's a real sequence of events.
3. Motion that responds to actions: the drawer, the hamburger↔close icon, button presses and the header hiding on scroll-down.

Everything else stays still. All GSAP runs inside `gsap.matchMedia()` with a reduced-motion branch that shows the final state instantly.

---

## 3. Page structure and heading hierarchy

There is exactly **one h1**. Every section starts with an h2, and items inside a section are h3. The header, drawer and footer contain no headings.

```
<header>  logo · nav · theme toggle · "Let's talk" button · hamburger (<lg)
<main>
  h1  Labib Alam, full stack developer
      (the visible big line is the audience headline, inside the same h1)
  ├─ h2  Selected work              (only rendered once a featured project exists)
  │    └─ h3  project title …
  ├─ h2  What I work with           (skills by tier)
  │    ├─ h3  In production
  │    ├─ h3  Built projects with
  │    └─ h3  Currently learning
  ├─ h2  Experience
  │    └─ h3  Associate Software Developer (company + dates as text)  …
  ├─ h2  Currently learning         (the AccioJob course)
  └─ h2  Let's work together        (two paths: hiring / building)
<footer>  links, © line (no headings)
```

The h1 markup is `<h1><span class="name line">Labib Alam, full stack developer in Kolkata</span><span class="headline">I build web apps that are fast, reliable and easy to hand over.</span></h1>`. Search engines get your name and role, and visitors see the big headline.

---

## 4. Layout wireframes

**Desktop (≥1024px)**

```
┌──────────────────────────────────────────────────────────────┐
│ LA Labib Alam      Work  Skills  Experience  Contact   ◐  [Let's talk] │
├──────────────────────────────────────────────────────────────┤
│ Labib Alam, full stack developer in Kolkata      ┌──────────┐ │
│                                                  │          │ │
│ I build web apps that are                        │ portrait │ │
│ fast, reliable and easy                          │  (4:5)   │ │
│ to hand over.                                    │          │ │
│                                               ┌──┴──────────┴┐│
│ Laravel, React and MySQL in production for    │GET /api/book…││
│ rental and e-commerce platforms. 1 yr 5 mo.   │before ██████ ││
│                                               │after  ███▌ −40%│
│ [See my experience]  [Email me]               └──────────────┘│
├──────────────────────────────────────────────────────────────┤
│ What I work with                                              │
│ ┃ In production        ┃ Built projects with ┃ Currently learning │
│ ┃ Laravel  React …     ┃ Node.js  Express …  ┃ Java  Spring Boot │
├──────────────────────────────────────────────────────────────┤
│ Experience        │● Associate Software Developer   Feb 2026–now│
│ (sticky label)    ││  Digital Advengers FZCO · highlights · tools│
│                   │● Junior Software Engineer  Sep–Dec 2025     │
│                   │● Web Development Intern   Apr–Sep 2025      │
├──────────────────────────────────────────────────────────────┤
│ Let's work together                                           │
│ Hiring? → résumé + email      Need something built? → email   │
└──────────────────────────────────────────────────────────────┘
```

**Mobile (<1024px)**

```
┌──────────────────────┐        drawer open ────────────────┐
│ LA Labib Alam  ◐  ☰  │        │ (backdrop blur)  ┌────────┐│
├──────────────────────┤        │                  │      ✕ ││
│ Labib Alam, full…    │        │                  │ Work   ││
│ I build web apps     │        │                  │ Skills ││
│ that are fast…       │        │                  │ Exper… ││
│ intro text           │        │                  │ Contact││
│ [See experience]     │        │                  │        ││
│ [Email me]           │        │                  │ ● Open ││
│ ┌────────────┐       │        │                  │ gh in ✉││
│ │ portrait   │       │        │                  │ ◐ theme││
│ └┬──────────┬┘       │        │                  └────────┘│
│  │trace card│        │        └───────────────────────────┘
│ skills (stacked)     │
│ timeline (left rail) │
└──────────────────────┘
```

**Breakpoints:**

- Base (360px up): single column with a 16px gutter.
- `md` (768): skills split into 2+1 columns.
- `lg` (1024): the two-column hero appears and the full nav replaces the hamburger.
- `xl` (1280): max width 72rem, centred.

Text is left-aligned throughout. Line length stays under about 70 characters.

---

## 5. Header and mobile sidebar

**Header** (`components/site/site-header.tsx`):

- It's sticky and transparent at the top. Once you scroll, it gets a blurred background and a hairline border.
- Scrolling down hides it and scrolling up shows it again, using GSAP ScrollTrigger direction. With reduced motion it simply stays visible.
- Nav links highlight the section currently on screen, via an `IntersectionObserver` hook, `hooks/use-scroll-spy.ts`.
- The hover underline scales in from the left and is CSS only.
- Nav items live in `components/site/nav-items.ts`. For now they're home-page anchors (`#work` appears only when projects exist, then `#skills`, `#experience`, `#contact`). They switch to real pages when those are built.

**Mobile sidebar** (`components/site/mobile-nav.tsx`), shown below `lg`:

- **Built on the Radix Dialog primitive** (`@radix-ui/react-dialog` is already installed). That gives focus trapping, Esc to close, `aria-modal`, scroll lock and focus returning to the hamburger for free. GSAP drives the animation instead of CSS:
    - **Open:** the backdrop fades in, the panel slides in from the right with a slight overshoot, then the links reveal one by one behind a mask. The footer block (status, social icons, theme toggle) fades in last.
    - **Close:** the same timeline plays in reverse, and the dialog unmounts only when the reverse finishes. It closes on a link click, Esc, a backdrop tap, or an Inertia `navigate` event.
- **Hamburger button:** Font Awesome `faBars` and `faXmark` stack in the same spot and crossfade with a 90° rotation. The button has `aria-expanded`, `aria-controls` and an `aria-label` that switches between "Open menu" and "Close menu".
- **Panel:** width `min(88vw, 380px)`, raised Tide surface, and large links (text-3xl, semibold) with a teal marker on the active one. It ends with an "Open to freelance & full-time roles" status, social icons (GitHub, LinkedIn, email) and the theme toggle.

**Font Awesome setup:**

- Packages (new dependencies, which you asked for): `@fortawesome/fontawesome-svg-core`, `@fortawesome/react-fontawesome`, `@fortawesome/free-solid-svg-icons`, `@fortawesome/free-brands-svg-icons`.
- Icons are imported one by one, so the bundle only includes what's used. They render as SVG, not a webfont.
- `lib/fontawesome.ts` imports the FA core CSS once and sets `config.autoAddCss = false`, which stops icons flashing oversized on first load.
- The theme toggle switches from lucide to FA (`faSun` / `faMoon`).
- The Radix components in `ui/` keep lucide internally. Nothing visible changes.

---

## 6. Hero animation sequence

This is the page's one orchestrated moment: a single GSAP timeline of about 1.6 seconds.

1. The header slides down.
2. The small name line fades in.
3. The big headline reveals line by line behind a mask (the existing `components/motion/split-heading.tsx`, adapted for the two-part h1).
4. The intro text and the buttons fade in.
5. The portrait is revealed from the bottom up with a clip-path, scaling gently from 1.08 to 1.
6. The trace card rises in, and the "after" bar shrinks from 100% to 60% while the label counts down to "−40%".

With a mouse (pointer: fine) only, the portrait tilts very slightly toward the cursor using `gsap.quickTo`, a cheap transform. There's none on touch devices and none with reduced motion.

**Performance:**

- The portrait is a `<picture>` with AVIF/WebP, explicit width and height, and `fetchpriority="high"`, so it doesn't delay the largest paint.
- The text renders on the server, so it's visible immediately.
- The existing `.motion` CSS guard hides only the animated elements, and it has the 3-second failsafe.

---

## 7. Data (backend)

- **`app/Http/Controllers/HomeController.php`** (single action). It gets `ContentRepository` injected and renders `home` with:
    - `profile`, which now includes `impact`
    - `experienceDuration`
    - `skills`, grouped by tier in the order production → projects → learning, each tier with its label
    - `experience`, `featuredProjects` and `courses`
- **`routes/web.php`**: `Route::get('/', HomeController::class)->name('home')`.
- **`content/profile.php`** gets an `impact` list taken from your bio: 40% faster API responses, 20+ modules and APIs, and 10,000+ monthly users. The trace card and intro read from it, and `app/Content/Data/Profile.php` exposes it.
- **`resources/js/types/content.ts`**: TypeScript types that match the DTO `toArray()` output.
- **`app/Content/ContentRepository.php`**: fix the pending PHPStan line in `experienceDuration()`.
- **`<Head>`**: title "Labib Alam, Full Stack Developer (Laravel & React)" and a meta description. OpenGraph tags come in Phase 3.

---

## 8. Files

**New:**

- `components/site/`: `site-header.tsx`, `mobile-nav.tsx`, `nav-items.ts`, `site-footer.tsx`, `social-links.tsx`
- `components/home/`: `hero.tsx`, `api-trace-card.tsx`, `portrait.tsx`, `work-section.tsx`, `skills-section.tsx`, `experience-section.tsx`, `learning-section.tsx`, `contact-section.tsx`
- `hooks/use-scroll-spy.ts`
- `lib/fontawesome.ts`
- `types/content.ts`

**Changed:**

- `layouts/site-layout.tsx`: now just composes the header and footer.
- `components/site/theme-toggle.tsx`: switches to FA icons.
- `pages/home.tsx`: composes the sections.
- `components/motion/split-heading.tsx`
- `resources/css/app.css`: portrait rim light and trace-card styles.

**Removed:** `components/motion/reveal.tsx`, because section-by-section fade-ups are dropped.

---

## 9. Build steps (each one reviewed before the next)

1. **Data:** HomeController, route, impact data, TS types, PHPStan fix, and a feature test for the props.
2. **Chrome:** Font Awesome, header, mobile drawer and footer.
3. **Hero:** portrait (or the monogram fallback), trace card and the load timeline.
4. **Sections:** skills, experience timeline (scroll-drawn), learning and contact. Work appears automatically once projects exist.
5. **QA:**
    - Check at 360, 390, 768, 1024, 1280 and 1536px.
    - Keyboard-only walkthrough, including the drawer focus trap.
    - Reduced motion.
    - Heading outline.
    - Lighthouse mobile, target 95+.

**Next, after the home page:** the audience switch (`?for=recruiter|client`) from `docs/PLAN.md`. The hero keeps a slot for it.

---

## 10. Needed from you

1. **The portrait** (spec in §1). This isn't a blocker, because the monogram fallback works until then.
2. **Links:** your public email, GitHub and LinkedIn URLs, for the header, drawer and contact section. Missing ones are hidden.
3. **Confirm the three numbers** are fine to show publicly: 40% faster APIs, 20+ modules and APIs, 10,000+ monthly users.

---

## 11. Verification

- `php artisan test --compact`: the HomeController test checks the component, the skills grouped in tier order, `experienceDuration` and the name.
- `vendor/bin/pint --format agent`, `vendor/bin/phpstan analyse`, `npm run types:check`, `npm run check`.
- **Heading outline:** `npm run build:ssr`, start the SSR server, then `curl` the page and list h1–h3 in order. There must be exactly one h1 and no skipped levels.
- **Manual:**
    - Resize through all the breakpoints.
    - Open and close the drawer with the mouse, the keyboard (Tab / Esc) and a link click.
    - Turn on OS reduced motion and confirm nothing animates.
    - Block the JS and confirm all content is still visible.
- **Lighthouse (mobile):** 95+ for performance, accessibility and SEO.
