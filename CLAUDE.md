# CLAUDE.md

This file is read automatically by Claude Code at the start of every session.

## Project Guides

The starting point for all project guides is [`docs/project-guide.md`](docs/project-guide.md).

It covers:
- Feature development workflow (branching, PRs, specs)
- GitHub CLI usage
- Directory structure
- Branch naming conventions

## Technical Guides

All technical guides are in [`docs/guides/`](docs/guides/). Use them by language/topic:

| Guide | When to use |
|-------|-------------|
| [`docs/guides/ai-agent.md`](docs/guides/ai-agent.md) | **Always** — plan mode, doc structure, feature workflow, agents, git rules |
| [`docs/guides/coding-standards.md`](docs/guides/coding-standards.md) | When writing or reviewing TypeScript/JavaScript code |
| [`docs/guides/code-comments.md`](docs/guides/code-comments.md) | When adding or reviewing code comments |
| [`docs/guides/git.md`](docs/guides/git.md) | Branch naming, commit format, PR workflow, push rules |
| [`docs/guides/documentation-and-automation.md`](docs/guides/documentation-and-automation.md) | When to write docs, where to put them, how to spot automation opportunities |
| [`docs/guides/product-landing-page.md`](docs/guides/product-landing-page.md) | Building/editing static product pages — design tokens, SEO, OG, sync rules, Vercel deploy |
| [`docs/guides/what-ever-mail.md`](docs/guides/what-ever-mail.md) | WhatEver Mail app specifics — Electron, IPC, seed.db workflow |

> Guides in `docs/guides/` are symlinks to the shared `../guides/` folder at the `eversoft/` level. Edit there; all projects see the change immediately.

> `docs/guides/ai-agent.md` must always be read and followed.
