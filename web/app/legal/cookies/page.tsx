import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Cookie Policy — DocuBot',
  description: 'What cookies DocuBot uses: only one technical session cookie, no tracking or advertising cookies.',
};

const SECTIONS = [
  { id: 'que-son', title: '1. What a cookie is' },
  { id: 'que-usamos', title: '2. What cookies we use' },
  { id: 'terceros', title: '3. Third-party cookies' },
  { id: 'widget', title: '4. The embedded widget' },
  { id: 'gestionar', title: '5. How to manage them' },
  { id: 'cambios', title: '6. Changes to this policy' },
  { id: 'contacto', title: '7. Contact' },
];

export default function CookiesPage() {
  return (
    <LegalPage
      title="Cookie Policy"
      updatedAt="September 18, 2026"
      sections={SECTIONS}
    >
      <p>
        This page explains what cookies DocuBot uses and why. In short: we
        use a single technical cookie, strictly necessary for login to
        work. We do not use analytics, advertising, or cross-site tracking
        cookies.
      </p>

      <h2 id="que-son">1. What a cookie is</h2>
      <p>
        A cookie is a small file that a site stores in your browser to
        remember information between visits, such as keeping a session
        active.
      </p>

      <h2 id="que-usamos">2. What cookies we use</h2>
      <table>
        <thead>
          <tr>
            <th>Cookie</th>
            <th>Purpose</th>
            <th>Type</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><code>docubot_token</code></td>
            <td>Keep your session active on the DocuBot dashboard</td>
            <td>Strictly necessary, technical. <code>httpOnly</code> (not accessible by JavaScript) and <code>secure</code> in production (only travels over HTTPS).</td>
            <td>7 days, or until you sign out</td>
          </tr>
        </tbody>
      </table>
      <p>
        This cookie is essential for the dashboard to function: without it
        you cannot stay signed in. Because it is a cookie strictly
        necessary for the Service you requested, it does not require prior
        consent under applicable regulations, although we still inform you
        of its existence on this page.
      </p>
      <p>We do not use analytics, audience measurement, advertising, or social media cookies on the DocuBot dashboard.</p>

      <h2 id="terceros">3. Third-party cookies</h2>
      <p>
        The DocuBot dashboard does not load third-party scripts that set
        cookies (no Google Analytics, no advertising pixels, no
        third-party support chats). If we add any in the future, we will
        update this page and, when necessary, request your consent before
        activating it.
      </p>

      <h2 id="widget">4. The chat widget embedded on other sites</h2>
      <p>
        The widget a Customer installs on their own website does not set
        tracking cookies on its visitors. It uses a conversation session
        identifier to be able to show the chat history during the visit;
        that identifier is not used to track the visitor across different
        sites or for advertising purposes.
      </p>

      <h2 id="gestionar">5. How to manage cookies</h2>
      <p>
        You can delete or block the <code>docubot_token</code> cookie from
        your browser settings, though doing so will sign you out and
        you'll need to sign in again to use the dashboard.
      </p>

      <h2 id="cambios">6. Changes to this policy</h2>
      <p>
        If we add new cookies that are not strictly necessary, we will
        update this page and request your consent when required by
        regulation.
      </p>

      <h2 id="contacto">7. Contact</h2>
      <p>
        Questions about this policy:{' '}
        <a href="mailto:hola@docubot.dev">hola@docubot.dev</a>.
      </p>

      <div className="legal-note">
        This policy reflects the cookies in use as of this update. If the
        project adds analytics, third-party billing, or other
        cookie-setting scripts, this document must be updated before they
        are deployed, and a non-essential cookie consent banner will
        likely be needed.
      </div>
    </LegalPage>
  );
}
