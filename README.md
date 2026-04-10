# thinking-in-sats

<!-- bright-builds-rules-readme-badges:begin -->
<!-- Managed upstream by bright-builds-rules. If this badge block needs a fix, open an upstream PR or issue instead of editing the downstream managed block. Keep repo-local README content outside this managed badge block. -->
[![GitHub Stars](https://img.shields.io/github/stars/bright-builds-llc/thinking-in-sats)](https://github.com/bright-builds-llc/thinking-in-sats)
[![Deploy Pages](https://img.shields.io/github/actions/workflow/status/bright-builds-llc/thinking-in-sats/deploy-pages.yml?style=flat-square&logo=github&label=Deploy%20Pages)](https://github.com/bright-builds-llc/thinking-in-sats/actions/workflows/deploy-pages.yml)
[![License](https://img.shields.io/github/license/bright-builds-llc/thinking-in-sats?style=flat-square)](./LICENSE)
[![TypeScript 6.0.2](https://img.shields.io/badge/TypeScript-6.0.2-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![SolidJS 1.9.12](https://img.shields.io/badge/SolidJS-1.9.12-2C4F7C?logo=solid&logoColor=white)](https://www.solidjs.com/)
[![Vite 8.0.3](https://img.shields.io/badge/Vite-8.0.3-646CFF?logo=vite&logoColor=white)](https://vite.dev/)
[![Bright Builds: Rules](https://raw.githubusercontent.com/bright-builds-llc/bright-builds-rules/main/public/badges/bright-builds-rules-flat.svg)](https://github.com/bright-builds-llc/bright-builds-rules)
<!-- bright-builds-rules-readme-badges:end -->

> **GitHub Pages deployment:** [https://bright-builds-llc.github.io/thinking-in-sats/](https://bright-builds-llc.github.io/thinking-in-sats/)

## Overview

thinking-in-sats is a static SolidJS web app for building intuition around
Bitcoin prices in satoshis instead of dollars. It takes a curated set of
everyday purchases, converts them into sats using a live BTC/USD quote, and
places them on a single logarithmic scale so small and large purchases can be
compared in one view.

The site is intentionally sats-first:

- the homepage leads with satoshi values and a vertical logarithmic timeline
- USD is available as an optional reveal instead of the default presentation
- the quiz reinforces rough powers-of-ten intuition rather than exact memorized
  conversions

The app is fully client-side. There is no application backend in this
repository. Runtime data comes from a live BTC/USD quote fetch, and everything
else is derived in the browser from checked-in item data and domain logic.

## What the app includes

### Homepage and timeline

The home route presents:

- a sats-first hero section
- a live BTC/USD reference panel
- featured price anchors for common purchases
- a scrollable logarithmic timeline that maps featured items into sats
- optional USD reveals for people who want to compare against a familiar anchor

### Quiz mode

The `/quiz` route turns the same item catalog into multiple-choice questions so
users can practice estimating the approximate order of magnitude for everyday
items in sats.

### Live quote handling

The app fetches a BTC/USD price from CoinGecko, caches the most recent quote in
`localStorage`, and can fall back to cached data when a fresh quote is
temporarily unavailable. The quote store also refreshes on an interval and when
the tab becomes visible again.

### Build provenance

The UI includes a build information panel that surfaces:

- app version
- git commit
- build timestamp

That data is generated during the Vite build and can be copied from the site to
make debugging and release verification easier.

## Tech stack

| Area | Choice |
| --- | --- |
| Language | TypeScript |
| UI framework | SolidJS |
| Routing | `@solidjs/router` with `HashRouter` |
| Build tool | Vite |
| UI primitives | Kobalte |
| Test runner | Vitest with jsdom |
| Linting | ESLint |
| Package manager / task runner | Bun |

## Repository layout

```text
.
|- src/
|  |- components/
|  |  |- layout/       # App shell, header, footer
|  |  |- quiz/         # Quiz card, choices, feedback
|  |  |- shared/       # Loading and build info UI
|  |  `- timeline/     # Timeline cards, scale, USD reveal popover
|  |- content/items/   # Curated everyday purchase data by category
|  |- domain/          # Pure pricing, formatting, quiz, and layout logic
|  |- routes/          # Home and quiz pages
|  |- services/        # Quote fetching, caching, and build metadata helpers
|  `- styles/          # Global and token CSS
|- scripts/            # Repo maintenance scripts
|- index.html          # SPA entry HTML
|- vite.config.ts      # Vite, Vitest, and build metadata wiring
`- package.json        # Scripts and dependencies
```

## Everyday item data

The curated item catalog is grouped into four broad categories:

- food and drink
- household
- transport and services
- larger purchases

Those checked-in estimates are the source material for both the timeline and the
quiz. Featured items appear on the main timeline, while the broader set is
available to quiz generation.

## Local development

This repo uses Bun for installs and for the repo-native verification command.

### Install dependencies

```bash
bun install
```

### Start the dev server

```bash
bun run dev
```

The Vite dev server runs on `http://localhost:4173`.

### Build and preview locally

```bash
bun run build
bun run preview
```

Because the app uses hash-based routing, static-hosted deep links are expressed
as hash routes such as `#/quiz`.

To build the site with the same asset base path used on GitHub Pages, run:

```bash
PAGES_BASE_PATH=/thinking-in-sats/ bun run build
bun run preview
```

That Pages-shaped preview is served from
`http://localhost:4173/thinking-in-sats/`.

## Available scripts

| Command | What it does |
| --- | --- |
| `bun run dev` | Starts the Vite development server |
| `bun run build` | Creates a production build |
| `bun run preview` | Serves the production build locally |
| `bun run lint` | Runs ESLint with zero warnings allowed |
| `bun run typecheck` | Runs `tsc -b` |
| `bun run test` | Runs the Vitest suite once |
| `bun run test:watch` | Runs Vitest in watch mode |
| `bun run verify` | Runs lint, typecheck, tests, and a production build |

## Testing and verification

Most of the focused automated tests live alongside the domain logic in
`src/domain/*.test.ts`. The repo-native verification entry point is:

```bash
bun run verify
```

That command is the quickest way to confirm that linting, typechecking, tests,
and the production build still pass together.

## Runtime data flow

At a high level, the app works like this:

1. The item catalog provides approximate USD prices in cents.
2. The quote client fetches a live BTC/USD anchor from CoinGecko.
3. Domain utilities convert item prices into sats and format them for display.
4. The homepage and quiz render those derived values using the current quote.
5. The latest quote is cached so the UI can stay useful during transient
   network issues.

## Deployment

This repository deploys to GitHub Pages on every push to `main` through
`.github/workflows/deploy-pages.yml`.

- **Pages URL:** `https://bright-builds-llc.github.io/thinking-in-sats/`
- **Publishing mode:** GitHub Pages with workflow-based builds
- **Deployment trigger:** pushes to `main` and manual `workflow_dispatch`

The deployment workflow:

1. installs dependencies with Bun
2. runs `bun run verify`
3. uploads the generated `dist/` directory to GitHub Pages

The workflow sets `PAGES_BASE_PATH=/thinking-in-sats/` so Vite emits asset URLs
for the repository-scoped Pages path. Because the app already uses
`HashRouter`, the static deployment does not need an additional route fallback
file for deep links such as `#/quiz`.

## External data source

Live price data is fetched from the CoinGecko simple price endpoint for Bitcoin
in USD. If that request fails, the app can continue using its freshest cached
quote until a later refresh succeeds.
