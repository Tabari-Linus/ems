#!/bin/sh
# Runs from the nginx image's /docker-entrypoint.sh before nginx starts.
# Writes the SPA's runtime config and the security headers (CSP connect-src) from env, so
# one image can be promoted between environments without a rebuild.
#
#   API_URL           required  absolute http(s) URL of the backend, e.g. https://api.example.com
#   CSP_CONNECT_EXTRA optional  extra space-separated connect-src sources
set -eu

HTML_DIR="${HTML_DIR:-/usr/share/nginx/html}"
SNIPPET_DIR="${SNIPPET_DIR:-/etc/nginx/ems}"

if [ -z "${API_URL:-}" ]; then
  echo "[ems] ERROR: API_URL is not set (e.g. -e API_URL=https://api.example.com)." >&2
  exit 1
fi

case "$API_URL" in
  http://*|https://*) ;;
  *)
    echo "[ems] ERROR: API_URL must be an absolute http(s) URL, got: $API_URL" >&2
    exit 1
    ;;
esac

# Reject characters that could break out of the JSON string or the nginx header value.
case "$API_URL" in
  *'"'*|*"'"*|*'\'*|*' '*|*';'*|*'$'*)
    echo "[ems] ERROR: API_URL contains an illegal character: $API_URL" >&2
    exit 1
    ;;
esac

case "${CSP_CONNECT_EXTRA:-}" in
  *'"'*|*';'*|*'$'*)
    echo "[ems] ERROR: CSP_CONNECT_EXTRA contains an illegal character." >&2
    exit 1
    ;;
esac

API_URL="${API_URL%/}"
# scheme://host[:port] only; CSP sources are origins.
API_ORIGIN="$(printf '%s' "$API_URL" | sed -E 's#^(https?://[^/?#]+).*#\1#')"

printf '{ "apiUrl": "%s" }\n' "$API_URL" > "$HTML_DIR/config.json"

CSP="default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data:; connect-src 'self' ${API_ORIGIN}${CSP_CONNECT_EXTRA:+ $CSP_CONNECT_EXTRA}; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'none'"

mkdir -p "$SNIPPET_DIR"
cat > "$SNIPPET_DIR/security-headers.conf" <<EOF
add_header Content-Security-Policy "$CSP" always;
add_header X-Content-Type-Options "nosniff" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header X-Frame-Options "DENY" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
add_header Cross-Origin-Opener-Policy "same-origin" always;
EOF

echo "[ems] Runtime config written: apiUrl=$API_URL, connect-src origin=$API_ORIGIN"
