import { BrandMark } from "@/components/BrandMark";
import { useLocation } from "wouter";

const effectiveDate = "25 August 2026";

export default function LegalPage() {
  const [location] = useLocation();
  const privacy = location === "/privacy";

  return (
    <main className="ca-public-page">
      <header>
        <BrandMark />
        <a href="/">Back to Arthra</a>
      </header>
      <article className="ca-public-card legal-page">
        <p className="workspace-kicker">Arthra policy</p>
        <h1>{privacy ? "Privacy policy" : "Terms of use"}</h1>
        <p><strong>Effective date:</strong> {effectiveDate}. <strong>Operator:</strong> Abhishek Rai A, individual operator.</p>
        {privacy ? <PrivacyContent /> : <TermsContent />}
      </article>
    </main>
  );
}

function PrivacyContent() {
  return <>
    <p>Arthra stores the financial records, attachment metadata, and workspace information you choose to create. Financial data is retrieved only through protected application procedures that verify your authenticated membership before returning a record.</p>
    <h2>Who this policy covers</h2>
    <p>Arthra is intended for people aged 18 and over. Do not create an account or submit a public form if you are under 18.</p>
    <h2>What we process</h2>
    <p>We process account identity, transactions, category and budget choices, Expense Space membership, and receipt attachments. Receipt files are stored separately from database records and are linked only to the related protected transaction.</p>
    <h2>Public forms and consent</h2>
    <p>The Contact form collects the name, email, subject, message, and explicit permission to reply. The Waitlist collects an email address, source, and explicit consent for product updates. These records are private, are not published, and are visible only to the configured site owner through protected Owner Operations.</p>
    <h2>Retention and deletion</h2>
    <p>Contact messages are retained for 90 days after resolution. Waitlist records are retained until the person withdraws consent or after 12 months of inactivity. You can ask to access or delete Contact or Waitlist information through the <a href="/contact">Contact page</a> by using “Privacy request” in the subject. The operator will verify the request before actioning it.</p>
    <p>You can delete transactions, revoke CA links, leave shared spaces, and stop weekly digest emails through the product controls. Expense Space members can see records only within spaces to which they have been invited. CA share links are read-only, time-limited, and can be revoked by the owner.</p>
    <h2>Sharing and contact</h2>
    <p>We do not sell personal financial data. The public support and privacy contact method is the private <a href="/contact">Contact page</a>. Do not include passwords, account numbers, card details, or transaction data in a public contact message. Material policy updates will be published on this page.</p>
  </>;
}

function TermsContent() {
  return <>
    <p>Arthra is a record-keeping tool operated by Abhishek Rai A as an individual operator. It provides organisational summaries and deterministic pattern observations; it does not provide tax, legal, accounting, credit, investment, or financial advice.</p>
    <h2>Age requirement</h2>
    <p>You must be at least 18 years old to use Arthra or submit a Contact, Waitlist, or feedback form.</p>
    <h2>Your responsibility</h2>
    <p>You are responsible for the accuracy of entries, the people invited to an Expense Space, and the recipients of any CA share link. Review financial and tax records with an appropriately qualified professional before acting on them.</p>
    <h2>Acceptable use</h2>
    <p>Do not use Arthra to upload unlawful material, attempt unauthorised access, or share a report link with someone who should not receive the underlying record. We may restrict access where needed to protect the service or its users.</p>
    <h2>Contact and policy updates</h2>
    <p>For support or privacy concerns, use the private <a href="/contact">Contact page</a>; use “Privacy request” in the subject for access or deletion requests. Contact messages are retained for 90 days after resolution, and Waitlist records are retained until withdrawal of consent or 12 months of inactivity. Material policy updates will be published here.</p>
  </>;
}
