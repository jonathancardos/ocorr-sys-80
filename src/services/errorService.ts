export const errorService = {
  log: (error: unknown, context?: Record<string, any>) => {
    console.error('Application Error:', error, context);
    // TODO: Integrar com um serviço de log externo como Sentry ou LogRocket
    // Exemplo: Sentry.captureException(error, { extra: context });
  },
  // Adicionar outras funções de tratamento de erro conforme necessário
};