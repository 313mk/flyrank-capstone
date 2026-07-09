export type ApiProvider = 'openai' | 'anthropic' | 'google';

export interface ApiKeyEntry {
  provider: ApiProvider;
  key: string;
}

export interface RateLimitSettings {
  requestsPerMinute: number;
  tokensPerMinute: number;
  maxConcurrentRequests: number;
}

export interface ModelOption {
  id: string;
  label: string;
  provider: ApiProvider;
}

export interface SettingsFormValues {
  apiKeys: Record<ApiProvider, string>;
  modelId: string;
  rateLimits: RateLimitSettings;
}

export const DEFAULT_RATE_LIMITS: RateLimitSettings = {
  requestsPerMinute: 60,
  tokensPerMinute: 100_000,
  maxConcurrentRequests: 5,
};

export const DEFAULT_SETTINGS: SettingsFormValues = {
  apiKeys: {
    openai: '',
    anthropic: '',
    google: '',
  },
  modelId: 'gpt-4o',
  rateLimits: DEFAULT_RATE_LIMITS,
};

export const API_PROVIDERS: readonly ApiProvider[] = [
  'openai',
  'anthropic',
  'google',
] as const;

export const PROVIDER_LABELS: Record<ApiProvider, string> = {
  openai: 'OpenAI',
  anthropic: 'Anthropic',
  google: 'Google AI',
};

export const MODEL_OPTIONS: readonly ModelOption[] = [
  { id: 'gpt-4o', label: 'GPT-4o', provider: 'openai' },
  { id: 'gpt-4o-mini', label: 'GPT-4o Mini', provider: 'openai' },
  { id: 'o3-mini', label: 'o3 Mini', provider: 'openai' },
  { id: 'claude-sonnet-4-6', label: 'Claude Sonnet 4.6', provider: 'anthropic' },
  { id: 'claude-haiku-4-5', label: 'Claude Haiku 4.5', provider: 'anthropic' },
  { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', provider: 'google' },
  { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', provider: 'google' },
] as const;

export const RATE_LIMIT_BOUNDS = {
  requestsPerMinute: { min: 1, max: 10_000 },
  tokensPerMinute: { min: 1_000, max: 10_000_000 },
  maxConcurrentRequests: { min: 1, max: 100 },
} as const;
