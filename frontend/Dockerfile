# syntax=docker/dockerfile:1.7
# EMS frontend: Angular build served by unprivileged nginx (port 8080, uid 101).
# The API URL is runtime configuration: docker run -e API_URL=https://api.example.com ...

# ---- build -----------------------------------------------------------------
FROM node:22-alpine AS build
WORKDIR /app

COPY package.json package-lock.json ./
# npm workspaces (design-system packages, versioned with Changesets) must exist for `npm ci`.
COPY projects/tokens/package.json projects/tokens/
COPY projects/icons/package.json projects/icons/
COPY projects/ui/package.json projects/ui/
RUN npm ci --no-audit --no-fund

COPY . .
RUN npx ng build --configuration production

# ---- runtime ---------------------------------------------------------------
FROM nginxinc/nginx-unprivileged:1.29-alpine AS runtime

# Writable locations for the start-up script (the image runs as the non-root nginx user).
USER root
RUN mkdir -p /etc/nginx/ems \
 && chown -R nginx:root /etc/nginx/ems /usr/share/nginx/html \
 && chmod -R g+w /etc/nginx/ems /usr/share/nginx/html \
 && rm -f /usr/share/nginx/html/*

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --chmod=0755 docker/40-ems-runtime-config.sh /docker-entrypoint.d/40-ems-runtime-config.sh
COPY --from=build --chown=nginx:root /app/dist/ems-frontend/browser/ /usr/share/nginx/html/

USER nginx
EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:8080/healthz || exit 1
