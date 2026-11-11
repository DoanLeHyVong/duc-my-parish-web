# Parish Web single-VPS delivery

`staging` runs CI only. After the owner enables both repository-level gates (`PRODUCTION_DEPLOY_ENABLED=true`, `PRODUCTION_READINESS_CONFIRMED=true`) and configures the production Environment, successful `main` CI builds the Web image in GitHub Actions and updates the one Compose project on the authorized VPS. Keep gates closed until the shared API deployment guide's readiness checks pass.

Vite builds use `VITE_API_URL=https://api.hyvongofficial.online/api/v1` and `VITE_SITE_URL=https://giaoxu.hyvongofficial.online` by default. Repository variables `PUBLIC_API_URL` and `PUBLIC_WEB_URL` permit a later owner-approved domain switch. The image serves static files with Nginx and contains no DB or JWT secrets. `PRODUCTION_DEPLOY_PATH` points to the API-owned Compose directory. Both repos need matching SSH secrets and separately verified release gates.

If health or public smoke checks fail, use the API repository's rollback script with previous immutable API and Web image tags. Application rollback does not undo Prisma migrations. See the API deployment guide for backup, tunnel, restore and operations requirements.
