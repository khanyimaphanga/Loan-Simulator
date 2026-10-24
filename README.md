# Loan Eligibility Simulator

A loan eligibility simulator built for a Capitec take-home brief. You enter your income, expenses and the loan you'd like, and it tells you how likely you are to qualify, why, and what you could change. The lending decisions are simulated.

React and TypeScript on the front end (Vite), Node and Express on the back end, design tokens for styling, and Vitest for tests.

This is a concept project for a job application. It isn't affiliated with or endorsed by Capitec Bank Limited.

## Getting started

There are two ways to run it: with Node on your machine, or in Docker.

### With Node

You'll need Node 18.18 or later.

```bash
npm install
npm run dev     # API on :4000, app on http://localhost:5173
npm test        # server and client tests
npm run build   # builds tokens, then server, then client
npm start       # serves the built app and the API from one Node process
```

### With Docker

You only need [Docker](https://docs.docker.com/get-docker/) for this. Node doesn't have to be installed.

1. Make sure Docker is running (on a Mac or Windows, open Docker Desktop). `docker info` should print details rather than an error.
2. In a terminal, go to the project folder, the one with the `Dockerfile` in it.
3. Build the image. The first build takes a minute or two while it downloads Node and the dependencies:

   ```bash
   docker build -t loan-simulator .
   ```

4. Start a container from it:

   ```bash
   docker run --rm -p 4000:4000 loan-simulator
   ```

   You should see `Loan simulator API listening on http://localhost:4000`.
5. Open http://localhost:4000 in your browser. The app and the API are served from the same port.
6. Press `Ctrl+C` in the terminal to stop it. `--rm` removes the container once it stops.

If port 4000 is already in use, map a different one on your machine, for example `-p 8080:4000`, then open http://localhost:8080 instead.

To run it in the background instead, start it detached and stop it by name:

```bash
docker run -d --rm -p 4000:4000 --name loan-simulator loan-simulator
docker stop loan-simulator
```

`docker ps` shows whether it's running and healthy. The container checks `/api/health` every 30 seconds.

The image is built in two stages. The first installs everything and builds the tokens, API and React app. The second keeps only the built output and the server's production dependencies, and runs as a non-root user.

## The idea

Most loan calculators stop at yes or no. When someone checks their eligibility, what they actually want to know is whether they'll get the loan and, if not, what they can do about it. I spent most of my time on that second part.

The result page breaks the score into four parts (affordability, debt load, credit profile and income stability) and says in plain words how each one went. Under that, the server tries a few realistic changes, like borrowing less, paying over longer or settling some debt, and shows the ones that would help most. "Borrow R 110 000, +30%" can be tried with one tap. When a longer term would help, it also says how much more interest that costs.

If someone asks for more than their budget allows, the app tells them what does fit ("R 158 000 is what fits your budget") and offers to use that amount.

### The form

Three short steps: about you, your money, your loan. I cut a few questions along the way:

- The loan type comes from what the loan is for. Picking "New vehicle" switches to Vehicle Finance, so there's no separate "Which type of loan?" question.
- Credit score is a band (Excellent, Good, Fair, Poor or Not sure) rather than a number, since most people don't know theirs. Each band sends a typical score from its range, and "Not sure" assumes an average.
- Time with your employer is a slider from 0 to 5+ years that reads back in words ("1 year 6 months"). It starts empty so no answer is assumed, and the − and + buttons help on a phone. Scoring stops improving at two years, so capping it at five loses nothing.

Once the money step is filled in, the panel next to the form starts showing your chances, and it updates every time you change something, briefly showing how far the last change moved it. On a phone that panel sits below the form, so a small "64% chance" badge goes in the bottom bar instead.

On the loan step the amount slider has a mark where your budget runs out. Go past it and the bar turns amber, with a button to drop back to the amount that fits.

Answers are kept in session storage, so a refresh doesn't lose anything, and they're gone once the tab closes. If you come back halfway through, you can pick up at the first unfinished step.

### Results

The results page works as a sandbox. You can drag the amount and term and the result re-runs. You can try any of the suggestions, save up to three options to compare side by side (the best chance and lowest total cost are marked), and load any of them back.

There's a short burst of confetti when the news is good, either straight away or when a what-if gets you there. It's skipped if your device asks for reduced motion.

Further down is a checklist of the documents you'd usually need (ID, payslip or pension statement, bank statements, proof of address), which changes with how you earn.

### Applying

When the result is eligible there's one primary button on the page, "Apply for R 80 000", right under the offer, with two short reassurances below it. Once you scroll past it, a bar with the amount and an "Apply now" button appears at the bottom of the screen, and it hides again when the main button is back in view. Applying opens a review of the loan and the three next steps. It's a simulation, so nothing gets submitted, and the dialog says so.

I left out the usual pressure tactics on purpose: no countdowns, no "X people applied today", no pre-ticked boxes. They don't belong in a lending product.

### Accessibility

Form controls are native, with labels, hints and errors linked to the right input. Tap targets are at least 44px on touch screens, focus is always visible, and moving to a new step moves focus to its heading. The app follows the system's dark mode, reduced motion and high-contrast settings, the repayment chart has a table view, and the results page prints cleanly.

## Design tokens

The tokens are in [tokens/tokens.json](tokens/tokens.json), in the W3C design tokens format, in three layers:

- primitives: the raw palette, spacing, radius, type and motion scales
- semantic tokens: roles like `brand`, `action`, `danger` and `surface`, each with a light and a dark value
- component tokens: things like button height, card padding and the minimum tap target

`npm run tokens` turns them into CSS custom properties and a typed TypeScript module. Components only use the semantic and component layers, so switching theme just swaps the semantic values.

The brand colours are my approximation of Capitec's public brand (blue `#009DE0`, red `#DA291C`, navy `#0A2240`). The brand blue is too light for text on white, so buttons and links use a darker blue (`#006A9C`, 5.6:1). Inter stands in for the brand font.

## How it's organised

```
tokens/              design tokens
scripts/             token build script
server/src/domain/   eligibility engine, finance maths, products, validation (no Express in here)
server/src/routes/   Express handlers
client/src/
  design-system/     component library, imported as @capitec/design-system
  components/        the app's screens and cards, built from the library
  hooks/             data fetching, scenario state, saved options, session-backed state
  lib/               formatting, form state, validation, storage helpers
docs/API-SPEC.md     the spec that came with the brief
```

I built the UI as if the bank had handed me a component library. It lives in `client/src/design-system` and the app imports it as `@capitec/design-system`, like an installed package, without ever using its class names directly. The library has its own [README](client/src/design-system/README.md).

## API

All four endpoints in the spec are implemented with the request and response shapes it describes:

- `POST /api/loans/eligibility`, which also returns `factors` and `improvementLevers` for the explanations and suggestions
- `GET /api/loans/products`
- `POST /api/loans/calculate-rate`, with the full monthly schedule
- `GET /api/loans/validation-rules`, which the form uses too, so the limits only live in one place

A bad request gets a `422` with an error per field.

The example figures in the spec don't quite add up. R 150 000 over 24 months at 12.5% comes to R 7 096.10 a month, not R 7 089.50, and the first month's interest is R 1 562.50 (150 000 × 12.5% ÷ 12), not R 1 562.33. I went with the correct maths.

### How the decision is simulated

- The affordable repayment is the lower of 80% of what's left after expenses, or half of income minus existing debt repayments.
- The rate sits inside the product's range, based on credit score and term. No score means an average one is assumed.
- The likelihood adds up the four factor scores. 50% or more counts as eligible: 75% and up is low risk, 50 to 74% medium, under 50% high.
- Some things stop an application whatever the score: no regular income, expenses that already match income, or a repayment bigger than everything left over each month.

## Tests

111 tests in Vitest: 41 on the server, 70 on the client.

The server tests cover the finance maths, the eligibility engine and its suggestions, validation, and the API contract (with Supertest). On the client there are unit tests for formatting, validation and the API client, tests for the library components, and integration tests that click through the whole flow against a stubbed API: the live estimate, the purpose picking the loan type, the over-budget fix, saving and loading options, applying, the checklist and coming back to a half-finished form.

I also ran the app in headless Chrome at widths from 320px to 1536px, in light and dark mode, checking for console errors, spacing problems and anything spilling off screen.

## If I had more time

- Connect the token file to Figma through Tokens Studio, and add visual regression tests.
- Translations into Afrikaans, isiZulu and isiXhosa.
- Test it with real customers, especially the suggestions and the live chances panel, and track where people drop off.
- Replace the simulated engine with a real affordability assessment behind the same API.
