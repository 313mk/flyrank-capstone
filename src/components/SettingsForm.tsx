import type { FormEvent } from 'react';
import { useCallback, useMemo, useState } from 'react';
import {
  API_PROVIDERS,
  DEFAULT_RATE_LIMITS,
  DEFAULT_SETTINGS,
  MODEL_OPTIONS,
  PROVIDER_LABELS,
  RATE_LIMIT_BOUNDS,
  type ApiProvider,
  type RateLimitSettings,
  type SettingsFormValues,
} from '../types/settings';

export interface SettingsFormProps {
  initialValues?: SettingsFormValues;
  onSubmit: (values: SettingsFormValues) => Promise<void> | void;
  onCancel?: () => void;
  className?: string;
}

interface FormErrors {
  apiKeys?: Partial<Record<ApiProvider, string>>;
  modelId?: string;
  rateLimits?: Partial<Record<keyof RateLimitSettings, string>>;
  form?: string;
}

type RateLimitDrafts = Record<keyof RateLimitSettings, string>;

const RATE_LIMIT_FIELDS = [
  'requestsPerMinute',
  'tokensPerMinute',
  'maxConcurrentRequests',
] as const satisfies ReadonlyArray<keyof RateLimitSettings>;

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function toRateLimitDrafts(rateLimits: RateLimitSettings): RateLimitDrafts {
  return {
    requestsPerMinute: String(rateLimits.requestsPerMinute),
    tokensPerMinute: String(rateLimits.tokensPerMinute),
    maxConcurrentRequests: String(rateLimits.maxConcurrentRequests),
  };
}

function parseRateLimitDraft(
  field: keyof RateLimitSettings,
  rawValue: string,
): { value: number; error?: string } {
  const trimmed = rawValue.trim();

  if (trimmed === '') {
    return {
      value: DEFAULT_RATE_LIMITS[field],
      error: 'This field is required.',
    };
  }

  const parsed = Number.parseInt(trimmed, 10);

  if (!Number.isFinite(parsed)) {
    return {
      value: DEFAULT_RATE_LIMITS[field],
      error: 'Enter a valid whole number.',
    };
  }

  return { value: parsed };
}

function parseRateLimits(drafts: RateLimitDrafts): {
  rateLimits: RateLimitSettings;
  errors: Partial<Record<keyof RateLimitSettings, string>>;
} {
  const rateLimits = { ...DEFAULT_RATE_LIMITS };
  const errors: Partial<Record<keyof RateLimitSettings, string>> = {};

  RATE_LIMIT_FIELDS.forEach((field) => {
    const { value, error } = parseRateLimitDraft(field, drafts[field]);
    rateLimits[field] = value;

    if (error) {
      errors[field] = error;
      return;
    }

    const { min, max } = RATE_LIMIT_BOUNDS[field];
    if (value < min || value > max) {
      errors[field] = `Must be between ${min.toLocaleString()} and ${max.toLocaleString()}.`;
    }
  });

  return { rateLimits, errors };
}

function validate(
  values: Omit<SettingsFormValues, 'rateLimits'>,
  rateLimitDrafts: RateLimitDrafts,
): { errors: FormErrors; rateLimits: RateLimitSettings } {
  const errors: FormErrors = {};
  const selectedModel = MODEL_OPTIONS.find((model) => model.id === values.modelId);

  if (!selectedModel) {
    errors.modelId = 'Select a valid model.';
  }

  const requiredProvider = selectedModel?.provider;
  if (requiredProvider && !values.apiKeys[requiredProvider].trim()) {
    errors.apiKeys = {
      [requiredProvider]: `An API key is required for ${PROVIDER_LABELS[requiredProvider]}.`,
    };
  }

  const { rateLimits, errors: rateLimitErrors } = parseRateLimits(rateLimitDrafts);

  if (Object.keys(rateLimitErrors).length > 0) {
    errors.rateLimits = rateLimitErrors;
  }

  return { errors, rateLimits };
}

function hasErrors(errors: FormErrors): boolean {
  return Boolean(
    errors.form ||
      errors.modelId ||
      (errors.apiKeys && Object.keys(errors.apiKeys).length > 0) ||
      (errors.rateLimits && Object.keys(errors.rateLimits).length > 0),
  );
}

function errorId(fieldId: string): string {
  return `${fieldId}-error`;
}

function fieldAriaProps(fieldId: string, message?: string) {
  const describedBy = message ? errorId(fieldId) : undefined;

  return {
    'aria-invalid': message ? true : undefined,
    ...(describedBy ? { 'aria-describedby': describedBy } : {}),
  };
}

function FieldError({ fieldId, message }: { fieldId: string; message?: string }) {
  if (!message) {
    return null;
  }

  return (
    <p id={errorId(fieldId)} className="mt-1 text-sm text-red-600" role="alert">
      {message}
    </p>
  );
}

function SectionHeading({
  id,
  title,
  description,
}: {
  id: string;
  title: string;
  description: string;
}) {
  return (
    <div className="mb-4">
      <h3 id={id} className="text-base font-semibold text-slate-900">
        {title}
      </h3>
      <p className="mt-1 text-sm text-slate-600">{description}</p>
    </div>
  );
}

export function SettingsForm({
  initialValues = DEFAULT_SETTINGS,
  onSubmit,
  onCancel,
  className = '',
}: SettingsFormProps) {
  const [values, setValues] = useState<Omit<SettingsFormValues, 'rateLimits'>>({
    apiKeys: initialValues.apiKeys,
    modelId: initialValues.modelId,
  });
  const [rateLimitDrafts, setRateLimitDrafts] = useState<RateLimitDrafts>(() =>
    toRateLimitDrafts(initialValues.rateLimits),
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<ApiProvider, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
  });
  const [isSaving, setIsSaving] = useState(false);

  const selectedModel = useMemo(
    () => MODEL_OPTIONS.find((model) => model.id === values.modelId),
    [values.modelId],
  );

  const updateApiKey = useCallback((provider: ApiProvider, key: string) => {
    setValues((current) => ({
      ...current,
      apiKeys: { ...current.apiKeys, [provider]: key },
    }));
    setErrors((current) => ({
      ...current,
      apiKeys: current.apiKeys ? { ...current.apiKeys, [provider]: undefined } : undefined,
      form: undefined,
    }));
  }, []);

  const updateRateLimitDraft = useCallback(
    (field: keyof RateLimitSettings, rawValue: string) => {
      if (rawValue !== '' && !/^\d+$/.test(rawValue)) {
        return;
      }

      setRateLimitDrafts((current) => ({ ...current, [field]: rawValue }));
      setErrors((current) => ({
        ...current,
        rateLimits: current.rateLimits ? { ...current.rateLimits, [field]: undefined } : undefined,
        form: undefined,
      }));
    },
    [],
  );

  const normalizeRateLimitDraft = useCallback((field: keyof RateLimitSettings) => {
    setRateLimitDrafts((current) => {
      const trimmed = current[field].trim();

      if (trimmed === '') {
        return { ...current, [field]: String(DEFAULT_RATE_LIMITS[field]) };
      }

      const parsed = Number.parseInt(trimmed, 10);

      if (!Number.isFinite(parsed)) {
        return { ...current, [field]: String(DEFAULT_RATE_LIMITS[field]) };
      }

      const { min, max } = RATE_LIMIT_BOUNDS[field];
      return { ...current, [field]: String(clamp(parsed, min, max)) };
    });
  }, []);

  const toggleKeyVisibility = useCallback((provider: ApiProvider) => {
    setVisibleKeys((current) => ({
      ...current,
      [provider]: !current[provider],
    }));
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const { errors: nextErrors, rateLimits } = validate(values, rateLimitDrafts);
    setErrors(nextErrors);

    if (hasErrors(nextErrors)) {
      return;
    }

    setIsSaving(true);
    setErrors({});

    try {
      await onSubmit({ ...values, rateLimits });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to save settings. Please try again.';
      setErrors({ form: message });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`mx-auto w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 ${className}`}
      noValidate
      aria-describedby={errors.form ? 'settings-form-error' : undefined}
    >
      <header className="mb-8 border-b border-slate-100 pb-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">API Settings</h2>
        <p className="mt-2 text-sm text-slate-600">
          Configure provider credentials, choose a default model, and set client-side rate limits.
        </p>
      </header>

      <section className="mb-8" aria-labelledby="api-keys-heading">
        <SectionHeading
          id="api-keys-heading"
          title="API Keys"
          description="Keys are stored locally and never sent to our servers."
        />
        <div className="space-y-4">
          {API_PROVIDERS.map((provider) => {
            const isRequired = selectedModel?.provider === provider;
            const inputId = `api-key-${provider}`;
            const toggleId = `${inputId}-visibility-toggle`;
            const keyError = errors.apiKeys?.[provider];

            return (
              <div key={provider}>
                <label
                  htmlFor={inputId}
                  className="mb-1.5 flex items-center gap-2 text-sm font-medium text-slate-700"
                >
                  {PROVIDER_LABELS[provider]} API key
                  {isRequired && (
                    <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700">
                      Required
                    </span>
                  )}
                </label>
                <div className="relative">
                  <input
                    id={inputId}
                    type={visibleKeys[provider] ? 'text' : 'password'}
                    value={values.apiKeys[provider]}
                    onChange={(event) => updateApiKey(provider, event.target.value)}
                    placeholder={`Enter your ${PROVIDER_LABELS[provider]} API key`}
                    autoComplete="off"
                    spellCheck={false}
                    className="block w-full rounded-lg border border-slate-300 bg-white py-2.5 pr-24 pl-3 text-sm text-slate-900 shadow-sm placeholder:text-slate-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
                    {...fieldAriaProps(inputId, keyError)}
                  />
                  <button
                    id={toggleId}
                    type="button"
                    onClick={() => toggleKeyVisibility(provider)}
                    className="absolute inset-y-0 right-2 my-auto rounded-md px-2 py-1 text-xs font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                    aria-label={
                      visibleKeys[provider]
                        ? `Hide ${PROVIDER_LABELS[provider]} API key`
                        : `Show ${PROVIDER_LABELS[provider]} API key`
                    }
                    aria-controls={inputId}
                    aria-pressed={visibleKeys[provider]}
                  >
                    {visibleKeys[provider] ? 'Hide' : 'Show'}
                  </button>
                </div>
                <FieldError fieldId={inputId} message={keyError} />
              </div>
            );
          })}
        </div>
      </section>

      <section className="mb-8" aria-labelledby="model-heading">
        <SectionHeading
          id="model-heading"
          title="Default Model"
          description="The model used for new chat sessions and completions."
        />
        <label htmlFor="model-select" className="mb-1.5 block text-sm font-medium text-slate-700">
          Default model
        </label>
        <select
          id="model-select"
          value={values.modelId}
          onChange={(event) => {
            setValues((current) => ({ ...current, modelId: event.target.value }));
            setErrors((current) => ({ ...current, modelId: undefined, form: undefined }));
          }}
          className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
          {...fieldAriaProps('model-select', errors.modelId)}
        >
          {MODEL_OPTIONS.map((model) => (
            <option key={model.id} value={model.id}>
              {model.label} ({PROVIDER_LABELS[model.provider]})
            </option>
          ))}
        </select>
        <FieldError fieldId="model-select" message={errors.modelId} />
      </section>

      <section className="mb-8" aria-labelledby="rate-limits-heading">
        <SectionHeading
          id="rate-limits-heading"
          title="Rate Limits"
          description="Throttle outbound requests to stay within provider quotas."
        />
        <div className="grid gap-4 sm:grid-cols-3">
          <div>
            <label htmlFor="rpm" className="mb-1.5 block text-sm font-medium text-slate-700">
              Requests per minute
            </label>
            <input
              id="rpm"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rateLimitDrafts.requestsPerMinute}
              onChange={(event) =>
                updateRateLimitDraft('requestsPerMinute', event.target.value)
              }
              onBlur={() => normalizeRateLimitDraft('requestsPerMinute')}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              {...fieldAriaProps('rpm', errors.rateLimits?.requestsPerMinute)}
            />
            <FieldError
              fieldId="rpm"
              message={errors.rateLimits?.requestsPerMinute}
            />
          </div>

          <div>
            <label htmlFor="tpm" className="mb-1.5 block text-sm font-medium text-slate-700">
              Tokens per minute
            </label>
            <input
              id="tpm"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rateLimitDrafts.tokensPerMinute}
              onChange={(event) => updateRateLimitDraft('tokensPerMinute', event.target.value)}
              onBlur={() => normalizeRateLimitDraft('tokensPerMinute')}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              {...fieldAriaProps('tpm', errors.rateLimits?.tokensPerMinute)}
            />
            <FieldError fieldId="tpm" message={errors.rateLimits?.tokensPerMinute} />
          </div>

          <div>
            <label htmlFor="concurrent" className="mb-1.5 block text-sm font-medium text-slate-700">
              Max concurrent requests
            </label>
            <input
              id="concurrent"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              value={rateLimitDrafts.maxConcurrentRequests}
              onChange={(event) =>
                updateRateLimitDraft('maxConcurrentRequests', event.target.value)
              }
              onBlur={() => normalizeRateLimitDraft('maxConcurrentRequests')}
              className="block w-full rounded-lg border border-slate-300 px-3 py-2.5 text-sm text-slate-900 shadow-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 focus:outline-none"
              {...fieldAriaProps('concurrent', errors.rateLimits?.maxConcurrentRequests)}
            />
            <FieldError
              fieldId="concurrent"
              message={errors.rateLimits?.maxConcurrentRequests}
            />
          </div>
        </div>
      </section>

      {errors.form && (
        <div
          id="settings-form-error"
          className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
          role="alert"
        >
          {errors.form}
        </div>
      )}

      <footer className="flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            disabled={isSaving}
            className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSaving ? (
            <>
              <span
                className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white"
                aria-hidden="true"
              />
              Saving…
            </>
          ) : (
            'Save settings'
          )}
        </button>
      </footer>
    </form>
  );
}
