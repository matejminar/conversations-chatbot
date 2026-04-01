import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://3cdc9ca73272950d608d6829ff8146ea@o339668.ingest.us.sentry.io/4510917762285569",
  tracesSampleRate: 1.0,
  integrations: [Sentry.vercelAIIntegration()],
});
