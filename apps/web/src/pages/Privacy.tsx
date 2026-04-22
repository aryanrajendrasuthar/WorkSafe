import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-white">
      <nav className="sticky top-0 z-50 glass border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 gradient-brand rounded-lg flex items-center justify-center">
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">WorkSafe</span>
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-16">
        <Link to="/" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900 mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: April 21, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Information We Collect</h2>
            <p>We collect information you provide directly:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Account data:</strong> name, work email, organization name, role</li>
              <li><strong>Health data:</strong> daily check-in responses, body area pain reports, intensity ratings</li>
              <li><strong>Usage data:</strong> exercise session logs, program completion, login timestamps</li>
              <li><strong>Device data:</strong> IP address, browser type, operating system (for security and audit purposes)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. How We Use Your Information</h2>
            <p>We use collected data to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Provide, maintain, and improve the WorkSafe platform</li>
              <li>Compute risk scores and generate health insights for your organization</li>
              <li>Send notifications, reminders, and alerts relevant to your role</li>
              <li>Maintain security audit logs as required by enterprise compliance standards</li>
              <li>Comply with legal obligations including OSHA reporting requirements</li>
            </ul>
            <p className="mt-3">
              We do not sell your personal information or health data to third parties.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Health Data & HIPAA Compliance</h2>
            <p>
              WorkSafe handles protected health information (PHI) in compliance with the Health Insurance
              Portability and Accountability Act (HIPAA). We maintain appropriate administrative, physical,
              and technical safeguards including:
            </p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>AES-256 encryption at rest for all health data</li>
              <li>TLS 1.3 encryption in transit</li>
              <li>Role-based access controls limiting data visibility by organizational role</li>
              <li>Full audit logging of all data access and mutations</li>
              <li>Business Associate Agreements (BAAs) available for covered entities</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Data Sharing</h2>
            <p>We share data only in the following circumstances:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li><strong>Within your organization:</strong> Role-based — therapists see individual worker data; safety managers see anonymized aggregate data only</li>
              <li><strong>Service providers:</strong> Infrastructure and email providers under strict data processing agreements</li>
              <li><strong>Legal requirements:</strong> When required by law, court order, or governmental authority</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Data Retention</h2>
            <p>
              We retain your data for the duration of your active subscription plus 30 days after
              termination to allow for data export. Health check-in data may be retained longer
              where required by applicable occupational health regulations.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Your Rights</h2>
            <p>Depending on your jurisdiction, you may have the right to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Access your personal data and receive a copy in a portable format</li>
              <li>Correct inaccurate personal data</li>
              <li>Request deletion of your personal data (subject to legal retention requirements)</li>
              <li>Object to or restrict certain processing activities</li>
              <li>Withdraw consent where processing is based on consent</li>
            </ul>
            <p className="mt-3">
              To exercise these rights, contact your organization's admin or email us at{' '}
              <a href="mailto:aryanrajendrasuthar@gmail.com" className="text-brand-600 hover:underline">aryanrajendrasuthar@gmail.com</a>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Cookies</h2>
            <p>
              WorkSafe uses only functional cookies necessary for authentication and session management.
              We do not use advertising or tracking cookies. You can disable cookies in your browser
              settings, but this will prevent you from logging in to the platform.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. International Data Transfers</h2>
            <p>
              WorkSafe is hosted in the United States. If you access the Service from outside the US,
              your data will be transferred to and processed in the US. We implement appropriate
              safeguards including Standard Contractual Clauses for transfers from the European Economic Area.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to This Policy</h2>
            <p>
              We will notify you of material changes to this policy via email at least 14 days before
              changes take effect. The current policy is always available at{' '}
              <Link to="/privacy" className="text-brand-600 hover:underline">worksafe.io/privacy</Link>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact</h2>
            <p>
              For privacy questions or to exercise your rights, contact our Data Protection team at{' '}
              <a href="mailto:aryanrajendrasuthar@gmail.com" className="text-brand-600 hover:underline">aryanrajendrasuthar@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t py-8 px-4 text-center text-sm text-gray-500">
        <Link to="/terms" className="hover:text-gray-900 transition-colors">Terms of Service</Link>
        {' · '}
        <Link to="/" className="hover:text-gray-900 transition-colors">Back to WorkSafe</Link>
      </footer>
    </div>
  );
}
