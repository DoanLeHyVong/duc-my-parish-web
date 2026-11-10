# Parish Web image and CI/CD

The Web image is built with Vite and served by Nginx. `nginx.conf` provides the React history fallback required by BrowserRouter and immutable caching for hashed static assets. The image contains no API or database secret.

GitHub Actions runs `npm ci`, lint, tests, production build, dependency audit, and secret scanning on pull requests and `main`/`staging`. The staging workflow publishes a GHCR image tagged with the commit SHA and asks the authorized VPS deployment script to update only the staging Compose project. The production workflow is disabled unless the protected production Environment sets `PRODUCTION_DEPLOY_ENABLED=true` and the required reviewer approves the job.

Required Web build variables:

- Staging: `VITE_API_URL=https://api.hyvongofficial.online/api/v1`, `VITE_SITE_URL=https://giaoxu.hyvongofficial.online`.
- Production: `VITE_API_URL=https://api.giaoxuducmy.org/api/v1`, `VITE_SITE_URL=https://giaoxuducmy.org`.

If the VPS deployment or Cloudflare check fails, leave the previous image tag available and use the API repository rollback script. Do not treat a Web image rollback as a database rollback.
