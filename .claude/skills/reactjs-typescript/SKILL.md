---
name: reactjs-typescript
description: Guidance for building and modifying React 18 applications written in TypeScript, including component design, hooks, typed props, state management, form handling, and HTTP calls with the native fetch API. Use whenever the user is working on files in the Frontend/ folder or any .tsx/.ts React file.
---

# React.js + TypeScript Skill

Apply these conventions whenever you touch React TypeScript code in this
workspace (primarily the `Frontend/` folder).

## Project layout

- `Frontend/src/` — source files.
  - `main.tsx` — entry point that mounts `<App />`.
  - `App.tsx` — top-level component.
  - `components/` — reusable presentational components.
  - `api/` — thin wrappers around `fetch` calls.
  - `types/` — shared TypeScript interfaces / type aliases.
- `Frontend/vite.config.ts` — Vite config (React + TS template).
- `Frontend/tsconfig.json` — strict TypeScript settings.

## Coding rules

1. Use **function components** with hooks. Never write class components.
2. Type every prop and every state value. Prefer `interface` for props,
   `type` for unions/aliases.
3. Enable `"strict": true` in `tsconfig.json` and never use `any`. If a value
   is truly unknown, use `unknown` and narrow it.
4. Co-locate component files: `Component.tsx` next to `Component.module.css`
   (if styles are component-scoped).
5. Keep components small and pure. Extract side effects into `useEffect` or
   custom hooks named `useXxx`.
6. Prefer controlled inputs with `useState<string>('')` for form fields.

## HTTP / API calls

- Use the built-in **`fetch`** API (no axios).
- Wrap network calls in `Frontend/src/api/*.ts` helpers that return typed
  promises, e.g. `Promise<SubmitResponse>`.
- Always set `Content-Type: application/json` when POSTing JSON.
- Always check `response.ok` before calling `response.json()`.
- Surface errors to the UI via state — never swallow them.

Reference call pattern:

```ts
export async function submitPages(payload: PagesPayload): Promise<SubmitResponse> {
  const res = await fetch(`${import.meta.env.VITE_API_URL}/api/pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`Request failed: ${res.status} ${res.statusText}`);
  }
  return (await res.json()) as SubmitResponse;
}
```

## Form handling

- Use a single `useState` object for related fields, or one `useState` per
  field when they are independent.
- Disable the submit button while a request is in-flight.
- Show clear loading / success / error feedback.

## Environment

- Store the backend URL in `Frontend/.env` as `VITE_API_URL`.
- Never hard-code URLs inside components.

## Dev commands

```bash
cd Frontend
npm install
npm run dev        # start Vite dev server on http://localhost:5173
npm run build      # production build to dist/
npm run preview    # preview production build
```

## Do / Don't

- DO keep JSX readable: extract long conditional blocks into variables.
- DO use semantic HTML (`<form>`, `<label>`, `<button type="submit">`).
- DON'T mutate state directly — always use setters.
- DON'T reach for external state libraries unless the user asks; `useState`
  and `useReducer` are enough here.
