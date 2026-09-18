planned
===

### Changed

- **Sentry collects the same data through `dataCollection` instead of `sendDefaultPii`.** The old
  option is deprecated and is removed in SDK v11; `sendDefaultPii: true` already behaved like
  enabling every category, so the four categories are now named one by one and nothing changes
  about what is sent. They stay spelled out even where they match today's defaults, so a default
  moving in v11 cannot quietly change what we collect.

- **`profilesSampleRate` is gone.** Deprecated in favour of `profileSessionSampleRate` and
  `profileLifecycle`, and without a browser profiling integration it never did anything.

### Removed

- **Our own error logging.** Without a Sentry dsn the app used to post errors to an endpoint of
  ours; Sentry is everywhere now, so `ErrorHandlerApiService`, `createLog`, the `apiLogError`
  config they read and the `createLog` test are gone.

- **`dam.imageUrl`.** Delivered by the config and assigned into `envConfig`, never read since the
  initial commit. What goes to common-admin is spelled out in `main.ts` — timeout, upload
  fallback, admin domain and notification — and the image domain is not among them.

### Deployment

- **`API_LOG_ERROR_ENABLED`, `API_LOG_ERROR_URL` and `DAM_IMAGE_URL` can be removed from whatever
  supplies the config templates — but not yet.** The deploy step substitutes the templates on
  every deploy, so redeploying or rolling back a version whose `config.json.dist` still carries
  these tokens would leave them unresolved and the json invalid. Remove them once no version that
  still has those placeholders is a rollback target. This admin deploys through GitHub Actions
  rather than the Azure variable groups the petit admins use, so the names live elsewhere.
