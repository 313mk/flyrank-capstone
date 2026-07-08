# CLAUDE.md - Development Guidelines

## Build & Test Commands
- **Install Dependencies:** `npm install`
- **Start Dev Server:** `npm run dev`
- **Build Production:** `npm run build`
- **Lint Code:** `npm run lint`

## Tech Stack & Architecture
- **Framework:** React (TypeScript) via Vite
- **Styling:** Tailwind CSS (utility-first styling)
- **State Management:** React Context / Custom Hooks (defensive error handling)

## Code Quality & Guidelines
- Use TypeScript strictly; avoid using `any` types.
- Implement explicit loading indicators and async try/catch blocks on all API actions.
- Keep components modular, self-contained, and reusable.
- Follow the Conventional Commits format for all version control changes.