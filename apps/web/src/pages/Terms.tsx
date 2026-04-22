import { Link } from 'react-router-dom';
import { ShieldCheck, ArrowLeft } from 'lucide-react';

export default function Terms() {
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

        <h1 className="text-4xl font-bold text-gray-900 mb-2">Terms of Service</h1>
        <p className="text-sm text-gray-500 mb-10">Last updated: April 21, 2026</p>

        <div className="prose prose-gray max-w-none space-y-8 text-gray-700 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">1. Acceptance of Terms</h2>
            <p>
              By accessing or using WorkSafe ("the Service"), you agree to be bound by these Terms of Service.
              If you are using the Service on behalf of an organization, you represent that you have authority
              to bind that organization to these terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">2. Description of Service</h2>
            <p>
              WorkSafe is an enterprise occupational health platform that provides musculoskeletal injury
              prevention tools, daily health check-ins, exercise programs, risk analytics, and return-to-work
              management. The Service is intended for use by employers, occupational therapists, safety
              managers, and workers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">3. Account Registration</h2>
            <p>
              You must provide accurate, complete information when creating an account. You are responsible
              for maintaining the confidentiality of your credentials and for all activities under your
              account. You must immediately notify us of any unauthorized use.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">4. Acceptable Use</h2>
            <p>You agree not to:</p>
            <ul className="list-disc pl-6 mt-2 space-y-1">
              <li>Use the Service for any unlawful purpose or in violation of these terms</li>
              <li>Attempt to access data belonging to other organizations</li>
              <li>Reverse engineer, decompile, or disassemble any part of the Service</li>
              <li>Use automated tools to scrape or harvest data from the Service</li>
              <li>Interfere with the security or integrity of the Service</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">5. Health Data & HIPAA</h2>
            <p>
              WorkSafe processes protected health information (PHI) as defined under HIPAA. We act as a
              Business Associate under applicable Business Associate Agreements with covered entities. Health
              data is encrypted at rest and in transit using AES-256. You retain ownership of all health
              data submitted through the Service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">6. Subscription and Billing</h2>
            <p>
              Subscriptions are billed monthly or annually in advance. You may cancel at any time; your
              subscription will remain active until the end of the current billing period. Refunds are not
              provided for partial subscription periods except where required by law.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">7. Data Retention</h2>
            <p>
              Upon termination of your account, we will retain your data for 30 days to allow for export,
              after which it will be permanently deleted. You may request data export at any time during
              your subscription.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">8. Limitation of Liability</h2>
            <p>
              WorkSafe is a supplemental wellness tool and does not constitute medical advice, diagnosis,
              or treatment. The Service does not replace professional medical evaluation. To the maximum
              extent permitted by law, WorkSafe's total liability shall not exceed the amounts paid by
              you in the twelve months preceding the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">9. Changes to Terms</h2>
            <p>
              We may update these terms at any time. We will notify you of material changes via email
              or in-app notification at least 14 days before they take effect. Continued use of the
              Service after changes take effect constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-gray-900 mb-3">10. Contact</h2>
            <p>
              For questions about these terms, contact us at{' '}
              <a href="mailto:aryanrajendrasuthar@gmail.com" className="text-brand-600 hover:underline">aryanrajendrasuthar@gmail.com</a>.
            </p>
          </section>
        </div>
      </main>

      <footer className="border-t py-8 px-4 text-center text-sm text-gray-500">
        <Link to="/privacy" className="hover:text-gray-900 transition-colors">Privacy Policy</Link>
        {' · '}
        <Link to="/" className="hover:text-gray-900 transition-colors">Back to WorkSafe</Link>
      </footer>
    </div>
  );
}
