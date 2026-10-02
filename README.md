# 👋 Labib Alam — Portfolio

My personal portfolio, built with **Laravel 13**, **React 19** and **Inertia.js**. It's where I show my work, my resume and what I can build for clients. It also has a few small AI features I wanted to play with.

🌐 **Live site:** [labibalam.in](https://labibalam.in/) · hosted on Hostinger

![Laravel](https://img.shields.io/badge/Laravel-13-FF2D20?logo=laravel&logoColor=white)
![PHP](https://img.shields.io/badge/PHP-8.4-777BB4?logo=php&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)
![Inertia](https://img.shields.io/badge/Inertia.js-3-9553E9?logo=inertia&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss&logoColor=white)

---

## ✨ What's inside

| Page | What it does |
| --- | --- |
| 🏠 **Home** | Hero, services, selected work, experience, my process and an "ask me anything" assistant |
| 🛠️ **Services** | What I offer, a FAQ, and an AI **project brief planner** that turns a rough idea into a plan |
| 📄 **Resume** | Experience and skills, plus a **job matcher**: paste a job description and see how well I fit |
| 💼 **Work** | Case studies for each project, written as Markdown files |
| 🧪 **AI Lab** | A small playground for the AI assistant |
| 📬 **Contact** | Contact form with rate limiting |

Smaller things I care about: dark/light theme, GSAP animations, SEO meta tags, a generated `sitemap.xml`, and a custom error page.

## 🧰 Tech stack

**Backend**
- 🐘 PHP 8.4 + Laravel 13
- 🗄️ SQLite by default (easy to switch)
- 🤖 Groq API for the AI features (`openai/gpt-oss-120b`)
- 🧭 Laravel Wayfinder for typed route helpers

**Frontend**
- ⚛️ React 19 + TypeScript
- 🔗 Inertia.js 3 (no separate API layer)
- 🎨 Tailwind CSS 4, Radix UI, shadcn-style components
- 🎞️ GSAP for motion
- ⚡ Vite (via Vite+)

**Quality**
- 🧪 Pest for tests
- 🧹 Laravel Pint for code style
- 🔍 Larastan (PHPStan) for static analysis
- 🔁 GitHub Actions runs the tests

## 📁 How it's organised

```
app/Ai/              AI providers, brief planner, job matcher, knowledge pack
app/Http/Controllers/ One small controller per page or action
content/             All site copy lives here (profile, services, FAQ, skills...)
content/projects/    One Markdown file per case study
resources/js/pages/  Inertia pages (React)
resources/js/components/  UI split by page: home, services, resume, lab...
tests/Feature/       Feature tests for every page and AI endpoint
```

Most of the text on the site comes from the `content/` folder, so I can update my bio, skills or projects without touching any React code.

## 🚀 Running it locally

You'll need PHP 8.4+, Composer and Node.js.

```bash
# 1. Clone
git clone https://github.com/Labib000/ai-react-portfolio.git
cd ai-react-portfolio

# 2. Install, create .env, migrate and build assets
composer setup

# 3. Add your Groq key to .env (only needed for the AI features)
#    GROQ_API_KEY=your-key-here

# 4. Start the dev server
composer dev
```

Then open [http://localhost:8000](http://localhost:8000).

> 💡 Without a `GROQ_API_KEY` the site still works. The AI features just show an "unavailable" message instead of an answer.

## ⚙️ Environment variables

| Variable | Purpose |
| --- | --- |
| `APP_NAME` | Site name |
| `APP_URL` | Base URL of the app |
| `DB_CONNECTION` | Defaults to `sqlite` |
| `MAIL_MAILER` | Defaults to `log`, so contact messages go to the log in dev |
| `AI_PROVIDER` | Defaults to `groq` |
| `GROQ_API_KEY` | Your Groq API key |
| `GROQ_MODEL` | Defaults to `openai/gpt-oss-120b` |

## 🧪 Testing and code style

```bash
php artisan test --compact   # run the test suite
composer lint                # format PHP with Pint
npm run check                # lint and format the frontend
npm run types:check          # TypeScript check
```

## 🚢 Deployment

The site is live at **[labibalam.in](https://labibalam.in/)** and hosted on **Hostinger** 🟣.

To build the frontend assets for production:

```bash
npm run build
```

AI endpoints (`/ask`, `/ai-lab/chat`, `/resume/match`, `/services/brief`) and the contact form are rate limited so nobody can run up my API bill. 😅

## 📬 Get in touch

I'm a full stack developer based in Kolkata, India, open to freelance projects and conversations.

- 🌐 Website: [labibalam.in](https://labibalam.in)
- 📧 Contact form: [labibalam.in/contact](https://labibalam.in/contact)
- 💻 GitHub: [@Labib000](https://github.com/Labib000)

---

⭐ If you like the project, a star on the repo is always appreciated.
