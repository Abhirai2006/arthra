# Arthra Launch Operations Runbook

**Status:** Owner handoff checklist for a controlled beta. This is an operating guide, not legal advice or a claim of legal compliance.

## 1. Support and consented public records

Arthra now provides **Owner Operations** at `/operations` for the configured project owner only. New Contact and Waitlist submissions create a private record and attempt to send an owner alert without including message contents. The owner must use the inbox to classify the record, reply only where consent permits, and delete it when a verified deletion request or the documented retention rule requires it.

| Trigger | Owner action | Record of action |
| --- | --- | --- |
| New Contact message | Check the private inbox, confirm `consentedToReply`, respond through the approved support channel, and set the status to `in_progress`, `resolved`, or `archived`. | Status and `lastActionAt` inside Owner Operations. |
| New Waitlist record | Confirm the source and consent record before using it for product updates. Mark it `reviewed` after handling. | Status and `lastActionAt` inside Owner Operations. |
| Privacy/deletion request | Verify the requester’s control of the relevant email/account through an approved process; use Owner Operations to delete Contact/Waitlist records. For financial-account data, use the product’s protected controls and a documented account-verification process. | Support case identifier and deletion confirmation retained outside the product according to the owner’s approved policy. |
| Notification failure | Owner Operations remains the source of truth. Check it manually at the agreed operating cadence; do not assume an alert was delivered. | Incident note with time, affected records, and recovery action. |

## 2. Incident response

> Do not conceal, delete, or alter evidence during an incident. Preserve timestamps, request identifiers, deployment version, and relevant application logs.

| Stage | Required action |
| --- | --- |
| Detect | Record the alert, user report, unavailable route, suspicious request pattern, or security finding. Determine whether financial data, account access, attachments, or public forms may be affected. |
| Contain | Disable the affected public flow or share link if possible, rotate exposed credentials through the project secret flow, revoke inappropriate access, and preserve logs. |
| Assess | Identify what data and users could be affected, the time window, root cause, and whether obligations to users, providers, or regulators apply. Seek qualified legal/security advice where required. |
| Recover | Patch, test, deploy, and monitor the corrected path. Confirm that the reported route or workflow works in production before declaring recovery. |
| Learn | Write a dated incident record with cause, impact, decisions, communications, and preventive changes. Add a regression test when the issue was code-related. |

## 3. Daily automated health alert

The project-level daily health check uses a platform-managed authenticated callback. It is scheduled at **09:00 UTC** each day. It verifies the public home’s sign-in entry, the sitemap, and the known missing-route contract. It records the most recent status in a private configuration row and sends the owner an alert only when a new or changed failure is detected. The monitor intentionally sends no finance data, session data, Contact data, or Waitlist data.

The owner should use the alert as a prompt to follow the incident-response table above. A passing check is not a guarantee of availability, security, Google indexing, or successful third-party OAuth; it is a limited route-contract signal.

## 4. Backup and restore drill

Do not claim that backups are tested until this drill has been completed and recorded. At least once before broad launch, the owner should confirm the platform’s current database and storage recovery options, restore a non-production copy or equivalent test data where supported, and verify that the restored data can be read by the application without exposing it publicly. Record the date, scope, recovery objective, restoration result, and follow-up actions.

## 5. Release controls

Before a broad release, the owner should retain the following evidence: a passing full regression suite; a production route check for the public site and authentication return path; a current dependency audit with assigned owners for high-severity findings; a completed independent first-time sign-in; a Search Console record for sitemap/indexing work; and a signed-off privacy, terms, retention, and grievance process. The unresolved gateway 503 for arbitrary unknown paths remains a release blocker until the hosting platform forwards it to Arthra’s 404 or provides an equivalent noindex 404 response.

## 6. Privacy notice inputs still required from the owner

Before removing the controlled-beta label, provide and have counsel review the following factual inputs: legal controller/operator name; jurisdiction and service address where applicable; public privacy/support contact; effective date; data-retention periods by data type; current subprocessors and international transfer facts; account-verification and deletion process; grievance route; and the final position on whether the service is only for adults. The official text of India’s Digital Personal Data Protection Act, 2023 is a primary source for counsel’s review.[1]

## References

[1]: https://www.meity.gov.in/static/uploads/2024/06/2bf1f0e9f04e6fb4f8fef35e82c42aa5.pdf "Ministry of Electronics and Information Technology — The Digital Personal Data Protection Act, 2023"
