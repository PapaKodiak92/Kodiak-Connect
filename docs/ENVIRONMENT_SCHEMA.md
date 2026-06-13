# Kodiak Connect Client Environment Schema

Use this as the shared public client configuration shape for web, Windows, Linux, and Android builds.

Only public `VITE_*` values belong in client build configuration. Backend secrets, updater private keys, provider secret keys, VPS paths, and tokens must stay on the backend or in GitHub/VPS secrets.

```text
VITE_KODIAK_API_BASE_URL=https://api.kodiak-connect.com
VITE_KODIAK_AUTH_API_BASE_URL=https://auth.kodiak-connect.com
VITE_KODIAK_MEDIA_API_BASE_URL=https://api.kodiak-connect.com
VITE_KODIAK_CALLS_API_BASE_URL=https://api.kodiak-connect.com
VITE_MATRIX_BASE_URL=https://matrix.kodiak-connect.com
VITE_MATRIX_SERVER_NAME=kodiak-connect.com
VITE_TURNSTILE_SITE_KEY=
```

`VITE_GIPHY_API_KEY` is legacy and should be removed after GIF/media search is routed through the Kodiak media API. Clients should call Kodiak media endpoints instead of directly owning provider keys.
