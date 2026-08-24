# Arthra Security Hardening Record

## Scope and security posture

Arthra is a personal-finance application, so its threat model includes unauthorised account access, cross-site scripting, clickjacking, request abuse, malicious uploads, accidental data exposure, and dependency risk. No internet-facing application can be made impossible to attack. This hardening pass improves the application boundary and documents remaining operational responsibilities without changing finance records, screens, or normal product flows.

## Authoritative implementation guidance

Express recommends TLS, secure cookies, input validation, security headers, brute-force protection, and dependency maintenance for production applications. [1] Content Security Policy can restrict loaded resources, reduce cross-site scripting exposure, and prevent embedding/clickjacking when deployed as a response header. [2]

## Initial code observations

The existing application already provides OAuth state/nonce validation, HTTP-only secure session cookies, protected and admin tRPC procedures, server-side Zod input validation, ownership checks for finance data, receipt MIME/size checks, and consent-gated feedback publication. The initial boundary review found three compatible improvement areas: global response headers, a bounded request body, and validation of public storage-proxy keys. A durable, infrastructure-level rate-limit store remains an operational follow-up for multi-instance production.

## Implemented safeguards

| Area | Safeguard | Verification |
| --- | --- | --- |
| Browser isolation | A request-scoped nonce-based CSP restricts scripts to Arthra, the required analytics origin, and a matching nonce. It also denies frames, plug-ins, cross-origin opener reuse, unsafe browser permissions, MIME sniffing, and overly broad referrers. | `server/security.test.ts`; local header and nonce smoke test. |
| API boundary | The API now has a bounded 12 MB parser, a per-client request budget, and `Cache-Control: no-store`. The limit preserves the existing 7 MB receipt upload constraint after encoding. | `server/security.test.ts`; type-check. |
| Server disclosure | Express fingerprinting is disabled and the application trusts a single managed reverse-proxy hop for secure-cookie and request-address evaluation. | Local header baseline versus hardened response. |
| Storage proxy | Public storage keys reject traversal, empty segments, backslashes, overlong values, and non-file characters. Signed redirects must use HTTPS and omit referrers. | `server/security.test.ts`. |
| Dependencies | Axios was updated to `1.19.0`; the AWS S3 client and presigner were updated to `3.1116.0`, removing the critical `fast-xml-parser` transitive advisory; direct NanoID is now `5.1.16`, removing its fixable high advisory. | `pnpm audit --prod --json`. |

## Verification summary

`pnpm check` passed after the hardening changes. The focused security suite passes three contracts covering response headers and nonces, request throttling, and storage-proxy validation. The full regression suite passes **47 tests across 21 files**, and a fresh production dependency audit reports **0 critical**, **7 high**, **30 moderate**, and **7 low** production advisories.

## Residual risks and operating requirements

Security is ongoing risk reduction, not a promise that no attacker can ever succeed. The in-process rate limiter is deliberately conservative and provides one runtime’s request-abuse protection; production traffic across multiple instances should be backed by an edge or shared-store limiter. TLS termination, secret management, database network isolation, host patching, backups, and incident response are platform and operations responsibilities that must remain enabled.

The project continues to import user-selected `.xlsx` and `.xls` files through the direct `xlsx` dependency. The audit flags the installed npm package for published high-severity advisories without a standard npm-published patched version. The current application constrains review/commit behavior and does not automatically persist imports, but uploaded spreadsheets should still be treated as untrusted. Replace this parser with a maintained, compatibility-tested alternative before expanding spreadsheet-import exposure, and continue to run dependency audit checks in CI or before releases.

## References

[1] [Express — Production Best Practices: Security](https://expressjs.com/en/advanced/best-practice-security/)

[2] [MDN — Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CSP)
