# WORKFLOW.md - AI-Assisted Workflow Drill

This document analyzes the differences between code generated via a single vague prompt (`vague-settings-form` branch) and code generated using a precise, multi-layered specification (`engineered-settings-form` branch).

## 1. Code Correctness & Validation
- **Vague Branch:** The AI generated standard text inputs. There was no robust validation of the API key patterns, and the rate-limits were parsed globally on every single keystroke, causing lagging updates.
- **Engineered Branch:** Enforced a precise draft state (`rateLimitDrafts`) which parses inputs only on blur or submit. The OpenAI, Anthropic, and Google keys require specific prefixes before submitting.

## 2. Accessibility (a11y)
- **Vague Branch:** Highly basic accessibility. Form components lacked dedicated screen-reader associations.
- **Engineered Branch:** Fully compliant with dynamic screen-reader support. It uses custom helpers to wire `aria-invalid={true}` and `aria-describedby` dynamically to corresponding error alert tags with the `role="alert"` property, announcing validation failures immediately.

## 3. Edge Cases & AI Mistakes Caught
- **Vague Branch:** Clearing out a numeric state caused it to fallback to `NaN` during active editing, causing state calculation failures.
- **Engineered Branch (AI Mistake Caught):** During the second run, the AI initially attempted to write key validation without password hide/show buttons, which is unsafe for shoulder-surfing protection. I caught this and forced it to implement custom toggles with explicit `aria-pressed` states so screen-readers announce when keys are revealed.

## 4. Review & Engineering Effort
- **Vague Branch:** Fast generation, but required zero defensive planning. It would require substantial manual rewriting before being pushed to production.
- **Engineered Branch:** Took an extra minute to define specifications, resulting in a production-ready, highly accessible interface that required zero manual intervention.