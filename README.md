# Basement Next WebGL Starter

Minimal Next.js starter with Tailwind CSS, WebGL helpers, TypeScript, and Basement defaults.

## Quick Start

```bash
bun install
bun dev
```

## Scripts

| Command | Description |
|---------|-------------|
| `bun dev` | Start the development server |
| `bun dev:https` | Start the development server with HTTPS |
| `bun build` | Build for production |
| `bun start` | Start the production server |
| `bun lint` | Run Biome |
| `bun lint:fix` | Run Biome with fixes |
| `bun format` | Format the codebase |
| `bun typecheck` | Run TypeScript |
| `bun analyze` | Analyze the Next.js bundle |

## Project Structure

```txt
app/
components/
  webgl/
lib/
  hooks/
  integrations/
  scripts/
  store/
  styles/
    index.css
    tokens.css
    global.css
    fonts.ts
    cn.ts
  utils/
```

## Styling

- Import `@/lib/styles/index.css` once in `app/layout.tsx`.
- Edit `lib/styles/tokens.css` for theme variables, breakpoints, and custom Tailwind utilities.
- Edit `lib/styles/global.css` for reset rules and app-wide global styles.
- `lib/styles/fonts.ts` handles font variables.
