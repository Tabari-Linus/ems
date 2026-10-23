#!/bin/sh
# Generate the RSA key pair used to sign and verify JWT access tokens.
#
#   scripts/generate-jwt-keys.sh [--force] [output-dir]
#
# Writes (default output dir: ./.keys, relative to the current directory):
#   jwt-private-key.pem  RSA 2048 private key, PKCS#8, unencrypted
#   jwt-public-key.pem   matching X.509 SubjectPublicKeyInfo public key
#
# Existing keys are never overwritten unless --force is given (rotating the key pair
# invalidates every access token already issued). Requires: openssl.

set -eu

usage() {
    echo "Usage: $0 [--force] [output-dir]" >&2
}

force=0
out_dir=./.keys

while [ $# -gt 0 ]; do
    case "$1" in
        -f|--force) force=1 ;;
        -h|--help) usage; exit 0 ;;
        -*) echo "Unknown option: $1" >&2; usage; exit 2 ;;
        *) out_dir=$1 ;;
    esac
    shift
done

if ! command -v openssl >/dev/null 2>&1; then
    echo "error: openssl is required but was not found on PATH" >&2
    exit 1
fi

private_key="$out_dir/jwt-private-key.pem"
public_key="$out_dir/jwt-public-key.pem"

if [ "$force" -ne 1 ] && { [ -e "$private_key" ] || [ -e "$public_key" ]; }; then
    echo "error: keys already exist in $out_dir (use --force to overwrite)" >&2
    exit 1
fi

mkdir -p "$out_dir"
umask 077

tmp_key="$out_dir/.jwt-private-key.tmp.$$"
trap 'rm -f "$tmp_key"' EXIT INT TERM

# genpkey writes PKCS#8 ("BEGIN PRIVATE KEY") directly.
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out "$tmp_key" 2>/dev/null
openssl pkey -in "$tmp_key" -pubout -out "$public_key"
mv "$tmp_key" "$private_key"
chmod 600 "$private_key"
chmod 644 "$public_key"

echo "Wrote $private_key"
echo "Wrote $public_key"
