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

## Project-Specific Rules
- **API Form Security:** Never store raw API keys directly in local state unless they are masked. Always use a password-visibility toggle for sensitive key inputs with explicit `aria-pressed` states.
- **Form Accessibility:** All form inputs must have associated semantic labels. Dynamic validation error messages must be announced to screen readers using `aria-describedby` and `aria-invalid` on custom hooks.
- **Numeric Inputs:** Never allow raw `NaN` values to propagate into React state when parsing text inputs to integers; always use structured draft strings during editing.