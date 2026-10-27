// Local test transport only; production profiles inherit official DeepSeek defaults.
export const localModelPatch = (port) => JSON.stringify([
  { id: 'llm-deepseek', disabled: true },
  { id: 'llm-pi-ai', config: { providers: { 'deepseek-official': {
    displayName: 'Local test model', api: 'openai-completions', apiKeyEnv: 'DJIAN_TEST_LLM_KEY',
    baseURL: `http://127.0.0.1:${port}/v1`, defaultMaxTokens: 8192,
    models: [{ id: 'local-test-model', name: 'Local test model', contextWindow: 128000, maxTokens: 8192, input: ['text','image'], reasoningEfforts: false }],
  } } } },
  { id: 'agent-default-model', config: { provider: 'deepseek-official', model: 'local-test-model' } },
], null, 2);
