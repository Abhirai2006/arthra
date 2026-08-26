# Arthra Data Access Boundaries

Arthra’s finance data is scoped by authenticated user and Expense Space at the **application procedure layer**. The deployed schema uses a MySQL/TiDB-compatible connection and is not configured with database-native row-level-security policies. Therefore, calling the system “RLS on every endpoint” would be misleading. Instead, each private tRPC route must validate identity and then apply an ownership or membership predicate before a finance record is read or changed.

| Surface | Enforced boundary | Public exposure |
| --- | --- | --- |
| Finance data | `protectedProcedure` establishes an authenticated user; finance helpers verify space membership, required role, and transaction ownership before query or mutation. | None. Protected pages do not serialize finance data into public SSR output. |
| Expense Spaces | Owner, Editor, and Viewer roles are checked server-side for the requested space. | Only tokenized invite preview has a deliberately limited public response. |
| Receipts | Receipt actions require transaction/space access; storage proxy validates path format and restricts signed redirects to HTTPS. | No unrestricted transaction-receipt listing endpoint exists. |
| CA reports | The owner creates/revokes links; public reads require an unexpired, non-revoked random token and return only the intended report scope. | Deliberately shared, revocable report links only. |
| Contact and waitlist | Public forms can write a bounded, consent-based submission after honeypot and rate-limit checks. There is no public list or read endpoint. | No public message or email lookup. |
| Public feedback | Valid feedback submissions publish automatically after disclosed form submission, validation, and anti-spam checks. Permanent deletion requires the configured owner identity. | Published feedback fields only: display name, rating, message, and creation time. Email and contact preferences are never returned publicly. |

> **Legacy transition:** On 26 August 2026, a pending feedback entry was promoted only because it already carried its prior public-display permission. Pending entries without that permission were not changed.

## Why the distinction matters

TiDB follows MySQL-style privilege patterns, while database-native row access can require a different deployment feature set or a views/policy design. Arthra’s current boundary is intentionally enforced where user identity and the requested Expense Space are available: the protected server procedure. That means every new finance route must follow the same access-helper pattern and must not query a finance table by raw identifier alone. TiDB’s own materials discuss row-level controls separately from ordinary MySQL-compatible privileges.[1] [2]

## Required review for new endpoints

New private endpoints must use `protectedProcedure`, scope queries with the authenticated user’s permitted Space or record, validate role before mutation, avoid returning contact details or private finance data in public procedures, and receive an authorization test. New public endpoints must have bounded validation, anti-automation controls, and no public read path for submitted personal information.

> **Operational requirement:** A database credential with broad table access must be treated as a server secret. Network isolation, secret rotation, backups, and platform access control remain necessary alongside application-level row checks.

## References

[1]: https://www.pingcap.com/article/ensuring-tidb-security-best-practices-and-key-features/ "Ensuring TiDB Security: Best Practices and Key Features"
[2]: https://docs.pingcap.com/tidb/stable/privilege-management/ "TiDB Privilege Management"
