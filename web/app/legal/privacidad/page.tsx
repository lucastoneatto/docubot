import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Privacy Policy — DocuBot',
  description: 'What data DocuBot collects, what it uses it for, who it shares it with, and how to exercise your rights, in accordance with Law 25.326.',
};

const SECTIONS = [
  { id: 'responsable', title: '1. Data controller' },
  { id: 'a-quien-aplica', title: '2. Who this applies to' },
  { id: 'que-datos', title: '3. What data we collect' },
  { id: 'para-que', title: '4. What we use it for' },
  { id: 'base-legal', title: '5. Legal basis' },
  { id: 'con-quien-compartimos', title: '6. Who we share it with' },
  { id: 'transferencias', title: '7. International transfers' },
  { id: 'conservacion', title: '8. How long we keep it' },
  { id: 'seguridad', title: '9. Security' },
  { id: 'derechos', title: '10. Your rights (access, rectification, erasure, objection)' },
  { id: 'visitantes', title: '11. If you are a visitor to a site with the widget' },
  { id: 'menores', title: '12. Minors' },
  { id: 'cambios', title: '13. Changes to this policy' },
  { id: 'contacto', title: '14. Contact' },
];

export default function PrivacidadPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      updatedAt="September 18, 2026"
      sections={SECTIONS}
    >
      <p>
        This Privacy Policy explains what personal data DocuBot processes,
        for what purpose, who we share it with, and how you can exercise
        your rights, in accordance with Argentina's Personal Data
        Protection Law No. 25.326 and, to the extent applicable due to
        having visitors in the European Union, the principles of the
        General Data Protection Regulation (GDPR).
      </p>

      <h2 id="responsable">1. Data controller</h2>
      <p>
        <strong>[FULL NAME]</strong>, National ID/Tax ID [NUMBER], with
        address at [ADDRESS], Argentina, is the controller of the personal
        data described in this policy. Contact:{' '}
        <a href="mailto:hola@docubot.dev">hola@docubot.dev</a>.
      </p>
      <p>
        The Agency for Access to Public Information, as the Enforcement
        Authority under Law 25.326, has the power to handle complaints
        and claims filed in relation to non-compliance with personal data
        protection regulations.
      </p>

      <h2 id="a-quien-aplica">2. Who this policy applies to</h2>
      <p>This policy covers two distinct profiles of people:</p>
      <ul>
        <li><strong>Customers:</strong> those who create a DocuBot account to generate a chatbot from their own documents.</li>
        <li><strong>End visitors:</strong> the people who use the chat widget embedded on a Customer's site, without having a DocuBot account.</li>
      </ul>
      <p>
        For end visitors, the Customer who installed the widget on their
        site acts as the controller with respect to their own users, and
        DocuBot acts as the data processor. The detail of this role is in
        our{' '}
        <a href="/legal/procesamiento-datos">Data Processing Agreement</a>.
      </p>

      <h2 id="que-datos">3. What data we collect</h2>
      <h3>From Customers (account holders)</h3>
      <ul>
        <li><strong>Account data:</strong> email and password (stored as a hash, never in plain text).</li>
        <li><strong>Configuration data:</strong> collection name, allowed origins for the widget, bot personality settings (prompt, color, greeting), configured usage limits.</li>
        <li><strong>Session cookie:</strong> an authentication token (JWT) in a technical, httpOnly, and secure cookie, needed to keep the session active. See the detail in the <a href="/legal/cookies">Cookie Policy</a>.</li>
        <li><strong>Service usage data:</strong> upload history, message statistics, and approximate cost of dashboard usage.</li>
      </ul>
      <h3>From the documents you upload</h3>
      <ul>
        <li>The content of the files you upload (extracted to text), the filename and path of each document, and a hash of its content to detect changes.</li>
      </ul>
      <p>
        We only process the files you choose to upload. We do not access
        any other files or storage on your device beyond what you select
        for upload.
      </p>
      <h3>From end visitors (widget users)</h3>
      <ul>
        <li>The content of the messages they write in the chat and the responses generated.</li>
        <li>The rating (👍/👎) they give a response, if they use it.</li>
        <li>A chat session identifier, not linked to an identity unless the visitor themselves reveals it in their message.</li>
      </ul>
      <p>
        We do not require end visitors to register to use the widget. If a
        visitor voluntarily writes personal data within their message (for
        example, their email so they can be contacted), that data is
        stored as part of the conversation and is treated as described in
        this policy.
      </p>

      <h2 id="para-que">4. What we use the data for</h2>
      <ul>
        <li>Creating and maintaining your account and authenticating you.</li>
        <li>Processing and indexing the documents you upload, to generate the chatbot.</li>
        <li>Generating chatbot responses from the indexed content, in response to visitor questions.</li>
        <li>Showing you in the dashboard the conversation history, usage analytics, and estimated cost of the Service.</li>
        <li>Sending you operational communications necessary for the Service (for example, notice that an upload has finished processing, password reset, changes to these legal documents).</li>
        <li>Preventing abuse, fraud, or misuse of the Service, and protecting its security.</li>
        <li>Complying with legal obligations when applicable.</li>
      </ul>
      <p>We do not use your data for advertising nor do we sell it to third parties.</p>

      <h2 id="base-legal">5. Legal basis</h2>
      <p>
        We process your data because it is necessary to provide the
        Service you contracted (performance of a contract), because you
        have given your consent by creating the account or by voluntarily
        using the widget, or because we have a legitimate interest in
        maintaining the security and operation of the Service, provided
        that interest does not override your rights.
      </p>

      <h2 id="con-quien-compartimos">6. Who we share the data with</h2>
      <p>We do not share your data except with the following third parties, strictly to operate the Service:</p>
      <table>
        <thead>
          <tr>
            <th>Provider</th>
            <th>Purpose</th>
            <th>What data it sees</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>OpenAI (or another compatible language model provider, configurable)</td>
            <td>Generate the chat response from the relevant content found</td>
            <td>The content fragment from your documents relevant to the question, and the text of the visitor's question. No credentials or account data are sent.</td>
          </tr>
          <tr>
            <td>Hosting and infrastructure provider (database and servers)</td>
            <td>Host the application and the database</td>
            <td>All stored information, encrypted in transit</td>
          </tr>
        </tbody>
      </table>
      <p>
        Embeddings (vector representation of content used to search for
        relevant information) are generated with a model that runs on our
        own infrastructure; they are not sent to an external provider for
        that step.
      </p>
      <p>
        We may disclose information if a competent authority legally
        requires it of us, or to protect our rights, those of our users,
        or those of third parties.
      </p>

      <h2 id="transferencias">7. International transfers</h2>
      <p>
        Some of our providers (such as OpenAI) process data on servers
        outside Argentina, including the United States. When this occurs,
        we contractually require those providers to maintain an adequate
        level of data protection, in line with their own privacy and
        security commitments.
      </p>

      <h2 id="conservacion">8. How long we keep the data</h2>
      <ul>
        <li><strong>Account data:</strong> while your account is active. Upon deletion, it is erased within a reasonable period, except where legally required to be retained.</li>
        <li><strong>Uploaded documents and conversations:</strong> while the collection exists in your account. Deleting a collection cascades to erase all of its documents, conversation history, and configuration, immediately and irreversibly.</li>
        <li><strong>Backups:</strong> may persist for a limited period after deletion, solely for disaster recovery, and are overwritten in the normal rotation cycle.</li>
      </ul>

      <h2 id="seguridad">9. Security</h2>
      <p>We apply reasonable technical and organizational measures to protect the data, including:</p>
      <ul>
        <li>Passwords stored as a hash, never in plain text.</li>
        <li>Session via httpOnly and secure cookie, not accessible by browser JavaScript.</li>
        <li>Authentication required to access any collection data or its conversations.</li>
        <li>Validation of the widget request's origin to prevent unauthorized access.</li>
        <li>Limits on file size and count to protect the Service's infrastructure from abuse.</li>
      </ul>
      <p>
        No system is 100% secure. If we detect a security breach affecting
        personal data, we will notify affected Customers and, when
        applicable, the competent authority, within the timeframes
        required by applicable regulations.
      </p>

      <h2 id="derechos">10. Your rights (access, rectification, erasure, objection)</h2>
      <p>
        As the owner of your data, under Law 25.326, you have the right to:
      </p>
      <ul>
        <li><strong>Access:</strong> know what data we hold about you.</li>
        <li><strong>Rectification:</strong> correct inaccurate or outdated data.</li>
        <li><strong>Cancellation/Erasure:</strong> request that we delete your data when applicable.</li>
        <li><strong>Objection:</strong> object to a specific processing of your data.</li>
      </ul>
      <p>
        You can exercise these rights by writing to{' '}
        <a href="mailto:hola@docubot.dev">hola@docubot.dev</a> from the
        email associated with your account. We will respond within a
        reasonable time and, in any case, within the timeframes
        established by applicable law. If you are not satisfied with the
        response, you can file a complaint with the Agency for Access to
        Public Information (www.argentina.gob.ar/aaip).
      </p>
      <p>
        Most of these rights you can also exercise yourself from the
        dashboard: by editing your settings, or by deleting a collection
        (which cascades to erase all of its documents and associated
        conversations).
      </p>

      <h2 id="visitantes">11. If you are a visitor to a site with the DocuBot widget</h2>
      <p>
        If you are chatting with a DocuBot widget on a third party's site,
        that third party (the Customer) is who decides what content to
        index and how to configure the bot, and is your primary point of
        contact for questions about your data, unless you want to ask us
        something specific about the technical operation of the Service,
        in which case you can write to us directly.
      </p>

      <h2 id="menores">12. Minors</h2>
      <p>
        The Service is not directed at children under 13 and we do not
        deliberately collect account data from minors of that age. If an
        end visitor using a widget turns out to be a minor, the same
        protections in this policy apply; the Customer is responsible for
        ensuring the widget's use on their site is appropriate for their
        audience.
      </p>

      <h2 id="cambios">13. Changes to this policy</h2>
      <p>
        We may update this Privacy Policy. If the change is significant,
        we will notify you by email or via a notice in the dashboard
        before it takes effect. The &quot;Last updated&quot; date at the
        top of this page reflects the version in force.
      </p>

      <h2 id="contacto">14. Contact</h2>
      <p>
        For any question about this Privacy Policy or your personal data,
        write to us at{' '}
        <a href="mailto:hola@docubot.dev">hola@docubot.dev</a>.
      </p>

      <div className="legal-note">
        This document is an informational template and does not replace
        the advice of a lawyer. Before publishing it, fill in the
        bracketed data, confirm the AI provider(s) you actually use in
        production, and have it reviewed by a licensed professional,
        particularly if you have Customers or visitors in the EU (where a
        more detailed GDPR analysis and, depending on the volume of data
        processed, a Data Protection Officer may be required).
      </div>
    </LegalPage>
  );
}
