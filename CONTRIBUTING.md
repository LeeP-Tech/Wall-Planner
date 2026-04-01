# Contributing to Wall Planner

Thank you for considering contributing! Wall Planner is a community project and all contributions are welcome — whether that's fixing a bug, suggesting a new feature, improving the docs, or just sharing how you use it.

---

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Ways to Contribute](#ways-to-contribute)
- [Reporting Bugs](#reporting-bugs)
- [Requesting Features](#requesting-features)
- [Setting Up for Development](#setting-up-for-development)
- [Making a Pull Request](#making-a-pull-request)
- [Coding Conventions](#coding-conventions)
- [Commit Messages](#commit-messages)

---

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating you agree to uphold it.

---

## Ways to Contribute

- **Bug reports** — open a [bug report issue](.github/ISSUE_TEMPLATE/bug_report.md)
- **Feature suggestions** — open a [feature request issue](.github/ISSUE_TEMPLATE/feature_request.md)
- **Code** — fork, branch, code, test, open a PR
- **Docs** — improve the README, add examples, fix typos
- **Spread the word** — share it with anyone who hangs things on walls!

---

## Reporting Bugs

Before you open a bug report, please:

1. Search [existing issues](../../issues) to see if it has already been reported.
2. If not, open a new issue using the **Bug report** template.

Good bug reports include:
- A clear title and description
- Steps to reproduce (wall width, item widths, hole counts you entered)
- What you expected vs. what actually happened
- Browser and OS version
- A screenshot if helpful

---

## Requesting Features

Open a [Feature Request](../../issues/new?template=feature_request.md) and describe:
- The problem you're trying to solve
- Your proposed solution (if you have one)
- Any alternatives you've considered

---

## Setting Up for Development

```bash
# 1. Fork the repo on GitHub, then clone your fork
git clone https://github.com/YOUR_USERNAME/Wall-Planner.git
cd Wall-Planner

# 2. Install dependencies
npm install

# 3. Start the dev server (hot reload at http://localhost:5173)
npm run dev

# 4. Check the build passes
npm run build
```

---

## Making a Pull Request

1. **Create a branch** from `main` with a descriptive name:
   ```bash
   git checkout -b fix/hole-spacing-validation
   git checkout -b feat/vertical-positioning
   ```

2. **Make your changes** — keep commits small and focused.

3. **Make sure the build passes:**
   ```bash
   npm run build
   npm run lint
   ```

4. **Push your branch** and open a PR against `main`.
   - Fill in the PR template.
   - Link any related issues (e.g. `Closes #12`).

5. A maintainer will review your PR. We aim to respond within a few days.

---

## Coding Conventions

- **TypeScript** — all new code should be typed. Avoid `any`.
- **React** — functional components with hooks only.
- **Tailwind CSS** — use utility classes; no custom CSS unless unavoidable.
- **Pure functions** — keep calculation logic in `src/lib/calculations.ts`, free of React dependencies (makes it easy to unit test).
- **`import type`** — use for type-only imports (`import type { Foo } from '...'`).
- **No secrets** — never commit API keys, tokens, or credentials.

---

## Commit Messages

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add vertical dimension support
fix: hole spacing validation with step=any
docs: improve deployment instructions
chore: remove unused Vite template assets
```

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.

---

Thanks again — every contribution, big or small, makes the project better!
