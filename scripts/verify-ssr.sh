#!/usr/bin/env bash
set -euo pipefail
BASE="${BASE:-http://127.0.0.1:4101}"

check_body() {
  local route="$1" needle="$2" html
  html="$(curl -fsS "$BASE$route")"
  grep -q '<div id="root">' <<<"$html"
  grep -q "$needle" <<<"$html"
}

check_body / 'A more'
check_body /privacy 'Privacy policy'
check_body /terms 'Terms of use'
check_body /dashboard 'Your money, with context'
grep -q 'noindex, follow' <<<"$(curl -fsS "$BASE/dashboard")"
grep -q 'rel="canonical"' <<<"$(curl -fsS "$BASE/")"
printf 'SSR route verification passed for public and protected shells.\n'
