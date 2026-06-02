# badhope/github.io Profile README Specification

> 📅 最近更新: 2026-05-29 - 增加 marker 规范、common 模块说明

## Overview

This document specifies the design, structure, and automation strategy for the `badhope/badhope` GitHub Profile README repository.

---

## 1. Profile Information

| Field | Value |
|-------|-------|
| GitHub Username | `badhope` |
| Display Name | badhope |
| Pronouns | he/him |
| Identity | AI-Era Full-Stack Developer |
| Location | Shenzhen, Guangdong, China |
| Email | x18825407105@outlook.com |
| Homepage | https://badhope.github.io/github.io/ |
| CSDN | https://blog.csdn.net/weixin_56622231 |

---

## 2. Design Language

### Visual Theme
- **Primary Palette**: Deep dark background (#0d1117, #161b22)
- **Accent Colors**: Cyan (#00F5FF), Purple (#7c3aed), Blue (#06b6d4)
- **Style**: Modern, tech-forward, AI-era aesthetic
- **Consistency**: Consistent use of tokency Night theme for stats

### Typography
- System fonts with monospace for code elements
- Fira Code for typing animation

### Dynamic Elements
- Typing SVG animation (readme-typing-svg)
- GitHub Stats cards (github-readme-stats)
- Streak stats (streak-stats)
- Contribution snake animation
- Daily quote badge
- Profile views counter

---

## 3. README Structure

```
┌─────────────────────────────────────────────────┐
│  HERO SECTION                                   │
│  - Main title with colored name                 │
│  - Tagline (AI-Era Full-Stack Dev | Open Source)│
│  - Typing animation                             │
│  - Badge row (views, followers, stars)         │
│  - Daily quote badge                            │
├─────────────────────────────────────────────────┤
│  ABOUT ME                                       │
│  - Opening quote                                │
│  - Bullet points with key attributes            │
├─────────────────────────────────────────────────┤
│  TECH STACK                                     │
│  - Skill icons row                              │
│  - AI/Big Data badge row                        │
├─────────────────────────────────────────────────┤
│  FEATURED PROJECTS                              │
│  - 4 project cards with descriptions             │
├─────────────────────────────────────────────────┤
│  GITHUB ANALYTICS                               │
│  - Stats card                                   │
│  - Top languages card                           │
│  - Streak card                                  │
├─────────────────────────────────────────────────┤
│  CONNECT WITH ME                                │
│  - Email, Homepage, CSDN, Juejin badges         │
├─────────────────────────────────────────────────┤
│  CURRENT FOCUS                                 │
│  - Bullet list of current interests             │
├─────────────────────────────────────────────────┤
│  CONTRIBUTION SNAKE                             │
│  - Snake animation SVG                          │
├─────────────────────────────────────────────────┤
│  AUTOMATION PLACEHOLDERS                        │
│  - <!-- views:start --> <!-- views:end -->       │
│  - <!-- blog:start --> <!-- blog:end -->         │
│  - <!-- quote:start --> <!-- quote:end -->       │
└─────────────────────────────────────────────────┘
```

---

## 4. Featured Projects

| Project | URL | Description |
|---------|-----|-------------|
| LingXu | https://github.com/badhope/LingXu | AI-oriented experimentation and intelligent system exploration |
| HumanOS | https://github.com/badhope/HumanOS | Human-centered system concept exploring cognition and productivity |
| skill | https://github.com/badhope/skill | Structured repository for technical skills and engineering patterns |
| national_stats | https://github.com/badhope/national_stats | Data exploration and statistical analysis project |

---

## 5. Tech Stack Display

### Primary Skills
Python, Java, JavaScript, TypeScript, React, Vue, Node.js, FastAPI, Spring Boot, MySQL, MongoDB, Redis, Docker, Git, Linux, VS Code

### AI & Data Skills
- Spark (Big Data)
- Hadoop (Big Data)
- PyTorch (AI)
- Pandas (Data)
- Scikit-learn (ML)

---

## 6. Automation Workflows

### A. Snake Animation (`snake.yml`)
- **Trigger**: Daily at midnight, manual dispatch, on push to main
- **Action**: Generates GitHub contribution snake SVG
- **Output**: Pushes to `output` branch

### B. Daily Quote (`quote.yml`)
- **Trigger**: Daily at 6:00 AM, manual dispatch, on push to main
- **Action**: Fetches quote, updates README via Python script
- **Placeholders**: `<!-- quote:start -->` ... `<!-- quote:end -->`

### C. Blog Sync (`blog.yml`)
- **Trigger**: Daily at 8:00 AM, manual dispatch, on push to main
- **Action**: Fetches latest posts from CSDN/Juejin
- **Placeholders**: `<!-- blog:start -->` ... `<!-- blog:end -->`

---

## 7. Placeholder Markers

README contains HTML comments for automation injection:

```markdown
<!-- views:start -->
<!-- views:end -->

<!-- blog:start -->
<!-- blog:end -->

<!-- quote:start -->
<!-- quote:end -->
```

---

## 8. External Services Used

| Service | Purpose | URL |
|---------|---------|-----|
| readme-typing-svg | Typing animation | https://readme-typing-svg.demolab.com |
| github-readme-stats | Stats card | https://github-readme-stats.vercel.app |
| streak-stats | Streak card | https://streak-stats.demolab.com |
| quotes-github-readme | Quote badge | https://quotes-github-readme.vercel.app |
| komarev.com | Profile views | https://komarev.com/ghpvc |
| skillicons.dev | Tech icons | https://skillicons.dev |

---

## 9. File Structure

```
badhope/
├── README.md
├── .github/
│   └── workflows/
│       ├── snake.yml
│       ├── quote.yml
│       └── blog.yml
├── scripts/
│   ├── update_quote.py
│   └── update_blog.py
└── docs/
    └── profile-readme-spec.md
```

---

## 10. Implementation Phases

### Phase 1 - Immediate
- [x] README.md with all core modules
- [x] snake.yml workflow
- [x] quote.yml workflow (placeholder)
- [x] blog.yml workflow (placeholder)
- [x] Python scripts for quote/blog

### Phase 2 - Enhancement
- [ ] Custom view counter service (external API)
- [ ] Advanced quote selection (tech-focused quotes)
- [ ] Blog fetching reliability improvements

### Phase 3 - Future
- [ ] RSS feed integration
- [ ] Custom SVG badge generation
- [ ] Interactive elements via external services

---

## 11. Constraints

1. GitHub README does NOT support:
   - Custom JavaScript execution
   - CSS animations (inline)
   - Iframes (limited support)

2. All dynamic content must use:
   - External SVG/image services
   - GitHub Actions to write back
   - Static badges with dynamic parameters

---

## 12. Maintenance

- Review automation workflows monthly
- Update Python dependencies as needed
- Monitor external service availability
- Keep personal information current
