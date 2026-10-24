# @capitec/design-system

The component library the simulator is built with. It stands in for the bank's own design system: it lives in this repo, but the app imports it as a package (see the alias in `client/vite.config.ts` and `client/tsconfig.json`) and treats it like one.

```tsx
import { Button, Card, Field, Slider } from '@capitec/design-system';
```

## Using it

- Import from the package root. Anything under `components/` is internal.
- Don't use the library's class names (`button`, `card`, `callout` and so on) in app code. If a component can't do what you need, add it to the library.
- `className` is for layout (spacing, grid placement), not for changing how a component looks.
- Styles only use semantic and component tokens from `tokens/tokens.json`, so components follow the theme without extra work.
- Hover styles only apply on devices that can hover, so a tap on a phone doesn't leave a button looking hovered.

## Components

**Actions**

- `Button`: variants `primary`, `secondary`, `ghost` and `link`; sizes `lg` (for the one main action on a page), `md` and `sm`. Takes `iconStart`/`iconEnd`, and `loading` with a `loadingLabel`. Defaults to `type="button"`, and on touch screens every size keeps a 44px tap target.
- `IconButton`: an icon on its own. `label` is required because it becomes the accessible name.

**Layout and content**

- `Card`: the standard surface, with optional `title`, `subtitle`, `titleIcon`, `actions` and `tone="accent"`. Renders `as` any element. With a title, it labels its own region.
- `Callout`: an inline message in `info`, `success`, `warning` or `danger`, with an optional `action`. Use `role="alert"` for errors and `role="status"` for updates that appear while someone types. The icon and text stay together; on narrow screens only the action wraps.
- `StatList`: label and value pairs (rate, total, term) as a description list. `plain` drops the divider above it.
- `Badge`: a short status label. The text has to carry the meaning on its own, not just the colour.
- `Meter`: a value within a range, like a score or checklist progress, with a readable `valueText`.
- `Dialog`: a modal on the native `<dialog>`, so focus, Escape and returning focus work properly. Put the primary action last in `actions`. On phones it opens as a bottom sheet.

**Forms**

- `Field`: wires up a label, hint and error for any control through a render prop. `aside` shows a live reading next to the label, like a slider's value.
- `NumberInput` and `CurrencyInput`: whole numbers and rand amounts, with the numeric keypad on phones. `CurrencyInput` groups thousands as you type and accepts pasted values like `R25,000.00`.
- `ChoiceGroup`: one choice from several, shown as `cards` or `chips`, with an optional `hint`. They're real radio buttons, so arrow keys work.
- `Checkbox`.
- `Slider`: see below.
- `Stepper`: progress through a multi-step form. Finished steps are buttons, so people can go back.

**Other**

- `Spinner`: always next to text that says what's happening.
- `Confetti`: a short burst for genuinely good news. It plays once when mounted (change its `key` to replay), doesn't block clicks or print, and is skipped for reduced motion. Always pair it with a message.
- `VisuallyHidden`: text for screen readers only.
- `Icon`: the library's stroke icons.
- `prefersReducedMotion()`: for any app code that animates.

## Sliders

A slider works when the rough value matters more than the exact one, the range has clear ends, and it helps to see where you sit on the scale: loan amount, term, time with an employer. If people know their exact figure and the range is wide, like income, use an input instead.

- Always show the value in words next to the label with Field's `aside`, so nobody has to read it off the track.
- Pass `value={null}` if the question hasn't been answered yet. The thumb looks unset and screen readers hear "Not set", so a default never passes for someone's answer.
- Add `stepButtons` when the track is crowded (more than about 40 steps on a phone) so people can land on an exact value. They're left out of the tab order because the keyboard already has arrow keys.
- `marker` shows a threshold, like where a budget runs out. Past it, the track and fill turn amber. Say what the marker means in text nearby, because screen readers don't announce it.

## Tests

Each component's tests sit next to it (`*.test.tsx`) and run with the client suite through `npm test`.
