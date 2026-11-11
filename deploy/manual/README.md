# Native Nginx static release

The existing Dockerfile is retained for history; the active release path is `dist` from successful `main` CI, served by native Nginx. Use `D:\AppGLV\_bmad-output\implementation-artifacts\ducmy-manual-vps-deployment-guide.md` for complete Windows and Ubuntu steps. `web-release.sh` and `web-rollback.sh` require explicit operator invocation. They verify the archive and switch `/opt/ducmy/web/current` atomically. Nginx binds `127.0.0.1:8080` for the Cloudflare Tunnel. Static Web releases do not store uploads; CMS images remain on Cloudinary.
