# Project Guide

Project-specific workflow instructions for ever-tools.

---

## Feature Development Workflow

1. **Branch from develop** — always create a new branch off `develop` before starting any work. Never work directly on `develop` or `main`.

2. **Feature specs first** — features are documented in the app repo's `dev/features/plan/` before implementation begins. Pick up a feature from there, read the spec, then start coding.

3. **Branch naming** — use `feature/<NNN>-<slug>` matching the spec filename (number included):

   ```
   git checkout develop
   git pull
   git checkout -b feature/001-example-tool
   ```

4. **PR to develop** — once the feature is complete, open a pull request targeting `develop` using `gh pr create`. Do not merge directly.

5. **Move the spec** — before committing the final changes, move the feature doc from `dev/features/plan/` to `dev/features/complete/` so the move is included in the commit.

6. **Feature numbering** — feature specs are numbered sequentially (`001`, `002`, …). When creating a new spec, check `dev/features/plan/` and `dev/features/complete/` for the highest existing number and use the next available. Do not reuse numbers from completed or in-progress specs.

7. **Write user guides** — for every shipped feature, create a user-facing guide in `ever-tools/docs/user-guides/<feature-name>.md`.

8. **Update about.md** — add a short (2–3 sentence) entry for the feature in `docs/user-guides/000-about.md` under a **Features** section.

## GitHub CLI

Always use `gh` for GitHub operations — never construct git push + manual PR URLs.

```bash
# Create PR
gh pr create --title "feat: ..." --body "..." --base develop

# View PRs
gh pr list

# Check PR status
gh pr status
```

## Directory Structure

```
ever-tools/
├── docs/
│   ├── guides/         ← symlinks to ../guides/ (shared across projects)
│   ├── user-guides/    ← end-user facing guides
│   └── project-guide.md
├── repos/
│   └── what-ever-mail/
│       └── dev/        ← development docs live inside each app repo
│           ├── features/
│           │   ├── plan/     ← specs for features not yet implemented
│           │   └── complete/ ← specs for shipped features
│           ├── enhancements/
│           │   ├── plan/
│           │   └── complete/
│           └── architecture/
│               ├── plan/
│               └── complete/
└── templates/
    └── emails/
```

## Repo Bootstrap

When adding a new app repo under `repos/`, create the standard `dev/` scaffold:

```bash
APP=your-app-name
mkdir -p repos/$APP/dev/features/plan \
         repos/$APP/dev/features/complete \
         repos/$APP/dev/enhancements/plan \
         repos/$APP/dev/enhancements/complete \
         repos/$APP/dev/architecture/plan \
         repos/$APP/dev/architecture/complete
```

Add this to `project-guide.md` when you register the new app.

## Shared Guides

All generic guides live in `../guides/` (one level above `ever-tools/`, i.e. the `eversoft/` parent folder). Each project's `docs/guides/` contains symlinks pointing there.

| Guide | Projects using it |
|-------|-------------------|
| `ai-agent.md` | ever-tools, ever-admin |
| `coding-standards.md` | ever-tools, ever-admin |
| `code-comments.md` | ever-tools, ever-admin |
| `git.md` | ever-tools, ever-admin |
| `documentation-and-automation.md` | ever-tools, ever-admin |
| `email-templates.md` | ever-admin |
| `nestjs.md` | ever-admin |
| `nextjs.md` | ever-admin |
| `react.md` | ever-admin |
| `resend-email-provider.md` | ever-admin |

### Adding a new shared guide

```bash
# 1. Create the guide in the shared folder
nano ../guides/new-guide.md

# 2. Add symlinks in each project that needs it
cd ever-tools/docs/guides && ln -s ../../../guides/new-guide.md new-guide.md
cd ever-admin/docs/guides && ln -s ../../../guides/new-guide.md new-guide.md

# 3. Register it in each project's CLAUDE.md guide table
# 4. Update the table in this file
```

### Adding a project-specific guide

Create the file directly in `docs/guides/` as a regular file (not a symlink). It will only exist in this project.

## Branch Naming

| Type    | Pattern                | Example                    |
| ------- | ---------------------- | -------------------------- |
| Feature | `feature/<NNN>-<name>` | `feature/001-example-tool` |
| Bug fix | `fix/<name>`           | `fix/parser-edge-case`     |
| Chore   | `chore/<name>`         | `chore/update-deps`        |

All branches off `develop`. PRs target `develop`. `main` is updated via release PRs from `develop`.
