# Frontend UI

UI patterns and conventions.

## Styling Stack

- Tailwind CSS v4
- styled-components
- Barlow font

## Rules

- Maintain visual consistency with nearby components
- Reuse existing UI primitives
- Don't mix in new styling approach
- Don't hardcode different font family

## Radix Polymorphism

Use Radix `Slot` / `asChild` pattern.

From `src/components/ui/button.tsx`:

```tsx
const Comp = asChild ? Slot : "button";
return <Comp {...props} />;
```

Components that may render as link use asChild, not separate `as` API.

## Imports

Use configured alias: `@/*` → `./src/*`

```tsx
import { Button } from "@/components/ui/button";
```

Avoid long relative chains.

## Accessibility

- Preserve accessible names and semantics
- Icon-only controls need accessible label
- Don't lose keyboard/focus behavior
