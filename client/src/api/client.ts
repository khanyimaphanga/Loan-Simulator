import type {
  EligibilityRequest,
  EligibilityResponse,
  LoanProduct,
  RateRequest,
  RateResponse,
  ValidationRules,
} from '../types';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly fieldErrors: Record<string, string> = {},
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const isAbortError = (err: unknown) => err instanceof DOMException && err.name === 'AbortError';

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`/api/loans${path}`, {
      ...init,
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch (err) {
    // A cancelled request isn't a connection problem; let callers recognise and ignore it.
    if (isAbortError(err)) throw err;
    throw new ApiError("We couldn't reach the simulator. Check your connection and try again.", 0);
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = res.status === 422 ? 'Some details need another look.' : 'Something went wrong on our side. Please try again.';
    throw new ApiError(message, res.status, body.errors);
  }
  return body as T;
}

const post = <T>(path: string, payload: unknown, signal?: AbortSignal) =>
  request<T>(path, { method: 'POST', body: JSON.stringify(payload), signal });

export const api = {
  products: () => request<{ products: LoanProduct[] }>('/products').then((r) => r.products),
  validationRules: () => request<ValidationRules>('/validation-rules'),
  eligibility: (payload: EligibilityRequest, signal?: AbortSignal) => post<EligibilityResponse>('/eligibility', payload, signal),
  calculateRate: (payload: RateRequest, signal?: AbortSignal) => post<RateResponse>('/calculate-rate', payload, signal),
};
