import { Button, Callout, Card, Icon, Spinner, Stepper } from '@capitec/design-system';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { api, ApiError } from './api/client';
import { Header } from './components/Header';
import { ChancePill } from './components/LiveChance';
import { LivePreview } from './components/LivePreview';
import { ResultsView } from './components/results/ResultsView';
import { AboutYouStep } from './components/steps/AboutYouStep';
import { LoanStep } from './components/steps/LoanStep';
import { MoneyStep } from './components/steps/MoneyStep';
import { useLiveEligibility } from './hooks/useLiveEligibility';
import { useLoanConfig } from './hooks/useLoanConfig';
import { useSessionState } from './hooks/useSessionState';
import { useTheme } from './hooks/useTheme';
import { clampToProduct, initialForm, productForPurpose, toEligibilityRequest, type FormState } from './lib/formState';
import { clearStored, STORAGE_KEYS } from './lib/storage';
import { firstIncompleteStep, mapServerErrors, stepForField, validateStep, type FormErrors, type StepId } from './lib/validation';
import type { EligibilityRequest, EligibilityResponse, LoanPurpose } from './types';

const STEPS: { id: StepId; label: string; title: string; intro: string }[] = [
  { id: 'about', label: 'About you', title: 'First, a little about you', intro: 'This helps us understand how steady your income is.' },
  { id: 'money', label: 'Your money', title: 'Your monthly budget', intro: "Rough numbers are fine. We'll show you what's left over." },
  { id: 'loan', label: 'Your loan', title: 'What would you like to borrow?', intro: 'Your estimated repayment updates as you go.' },
];

type Outcome = { request: EligibilityRequest; result: EligibilityResponse };

export default function App() {
  const config = useLoanConfig();
  const { theme, toggleTheme } = useTheme();
  const [form, setForm] = useSessionState<FormState>(STORAGE_KEYS.form, initialForm);
  const [stepIndex, setStepIndex] = useState(0);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  // Answers survive a refresh, so someone coming back mid-way is offered a jump to where they were.
  const [returning, setReturning] = useState(() => JSON.stringify(form) !== JSON.stringify(initialForm));
  const headingRef = useRef<HTMLHeadingElement>(null);
  const firstRender = useRef(true);

  // The running estimate starts once the first two steps are valid, then follows every answer.
  const ready = config.status === 'ready' ? config : null;
  const currentProduct = ready ? (ready.products.find((p) => p.id === form.productId) ?? ready.products[0]) : null;
  const pendingStep = ready && currentProduct ? firstIncompleteStep(form, ready.rules, currentProduct) : 'about';
  const chanceUnlocked = pendingStep === 'loan' || pendingStep === null;
  const live = useLiveEligibility(form, currentProduct, chanceUnlocked);

  // Move focus to the new step's heading so keyboard and screen-reader users land in the right place.
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    if (!outcome) headingRef.current?.focus();
  }, [stepIndex, outcome]);

  if (config.status === 'loading') {
    return (
      <Shell theme={theme} onToggleTheme={toggleTheme}>
        <div className="container loading" role="status">
          <Spinner /> Loading the simulator…
        </div>
      </Shell>
    );
  }
  if (config.status === 'error') {
    return (
      <Shell theme={theme} onToggleTheme={toggleTheme}>
        <div className="container">
          <Callout
            tone="danger"
            role="alert"
            action={
              <Button variant="secondary" size="sm" onClick={config.retry}>
                Try again
              </Button>
            }
          >
            {config.message}
          </Callout>
        </div>
      </Shell>
    );
  }

  const { products, rules } = config;
  const product = currentProduct!;
  const step = STEPS[stepIndex];
  const isLast = stepIndex === STEPS.length - 1;

  const update = (patch: Partial<FormState>) => {
    setForm((f) => ({ ...f, ...patch }));
    setErrors((e) => {
      const next = { ...e };
      for (const key of Object.keys(patch)) delete next[key as keyof FormState];
      return next;
    });
  };

  const focusFirstError = () =>
    requestAnimationFrame(() => document.querySelector<HTMLElement>('.field--invalid input')?.focus());

  const submit = async () => {
    setSubmitting(true);
    setSubmitError(null);
    const request = toEligibilityRequest(form);
    try {
      const result = await api.eligibility(request);
      setOutcome({ request, result });
      window.scrollTo({ top: 0 });
    } catch (err) {
      if (err instanceof ApiError && err.status === 422) {
        const mapped = mapServerErrors(err.fieldErrors);
        const first = Object.keys(mapped)[0] as keyof FormState | undefined;
        setErrors(mapped);
        if (first) setStepIndex(STEPS.findIndex((s) => s.id === stepForField(first)));
        focusFirstError();
      } else {
        setSubmitError(err instanceof Error ? err.message : 'Something went wrong.');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const choosePurpose = (loanPurpose: LoanPurpose) => {
    setForm((f) => ({ ...clampToProduct(f, productForPurpose(products, loanPurpose)), loanPurpose }));
    setErrors(({ loanPurpose: _cleared, requestedAmount: _clamped, ...rest }) => rest);
  };

  const resume = () => {
    const step = firstIncompleteStep(form, rules, product);
    setStepIndex(step ? STEPS.findIndex((s) => s.id === step) : STEPS.length - 1);
    setReturning(false);
  };

  const next = () => {
    setReturning(false);
    const stepErrors = validateStep(step.id, form, rules, product);
    if (Object.keys(stepErrors).length) {
      setErrors(stepErrors);
      focusFirstError();
      return;
    }
    if (isLast) void submit();
    else setStepIndex((i) => i + 1);
  };

  const restart = () => {
    setReturning(false);
    // Saved options and checklist ticks belong to the old answers.
    clearStored('session', STORAGE_KEYS.saved, STORAGE_KEYS.checklist);
    setForm(initialForm);
    setOutcome(null);
    setErrors({});
    setStepIndex(0);
  };

  if (outcome) {
    return (
      <Shell theme={theme} onToggleTheme={toggleTheme}>
        <ResultsView
          initialRequest={outcome.request}
          initialResult={outcome.result}
          product={product}
          onEdit={() => {
            setOutcome(null);
            setStepIndex(0);
          }}
          onRestart={restart}
        />
      </Shell>
    );
  }

  const stepProps = { form, errors, update };

  return (
    <Shell theme={theme} onToggleTheme={toggleTheme}>
      <section className="hero">
        <div className="container hero__inner">
          <h1 className="hero__title">See what you could borrow</h1>
          <p className="hero__lead">Check your loan eligibility in about two minutes, and see exactly how to improve it.</p>
          <ul className="trust">
            <li>
              <Icon name="shield" size={18} /> No credit check
            </li>
            <li>
              <Icon name="clock" size={18} /> About 2 minutes
            </li>
            <li>
              <Icon name="lock" size={18} /> Nothing is stored
            </li>
          </ul>
        </div>
      </section>

      <div className="container form-layout">
        <Card
          as="form"
          className="form-card"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            next();
          }}
        >
          {returning && stepIndex === 0 && (
            <Callout
              tone="info"
              icon="sparkle"
              className="welcome-back"
              action={
                <span className="welcome-back__actions">
                  <Button size="sm" onClick={resume}>
                    Pick up where I left off
                  </Button>
                  <Button variant="ghost" size="sm" onClick={restart}>
                    Start fresh
                  </Button>
                </span>
              }
            >
              <strong>Welcome back.</strong> We kept your answers for this session.
            </Callout>
          )}

          <Stepper steps={STEPS} current={stepIndex} onSelect={setStepIndex} />

          <div className="step" key={step.id}>
            <p className="eyebrow">
              Step {stepIndex + 1} of {STEPS.length}
            </p>
            <h2 className="step__title" ref={headingRef} tabIndex={-1}>
              {step.title}
            </h2>
            <p className="step__intro">{step.intro}</p>

            {step.id === 'about' && <AboutYouStep {...stepProps} />}
            {step.id === 'money' && <MoneyStep {...stepProps} />}
            {step.id === 'loan' && (
              <LoanStep {...stepProps} products={products} product={product} onPurposeChange={choosePurpose} live={live} />
            )}
          </div>

          {submitError && (
            <Callout tone="danger" role="alert">
              {submitError}
            </Callout>
          )}

          <div className="form-nav">
            <ChancePill live={live} />
            {stepIndex > 0 && (
              <Button variant="ghost" iconStart="arrowLeft" onClick={() => setStepIndex((i) => i - 1)}>
                Back
              </Button>
            )}
            <Button type="submit" className="form-nav__next" iconEnd="arrowRight" loading={submitting} loadingLabel="Checking…">
              {isLast ? 'Check my eligibility' : 'Continue'}
            </Button>
          </div>
        </Card>

        <LivePreview form={form} product={product} live={live} chanceUnlocked={chanceUnlocked} />
      </div>
    </Shell>
  );
}

function Shell({ children, theme, onToggleTheme }: { children: ReactNode; theme: 'light' | 'dark'; onToggleTheme: () => void }) {
  return (
    <>
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Header theme={theme} onToggleTheme={onToggleTheme} />
      <main id="main">{children}</main>
      <footer className="site-footer">
        <div className="container">
          <p>
            Concept project built for a job application. Not affiliated with or endorsed by Capitec Bank Limited. All results are
            simulated.
          </p>
        </div>
      </footer>
    </>
  );
}
