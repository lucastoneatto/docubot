import type { Metadata } from 'next';
import { LegalPage } from '@/components/legal/LegalPage';

export const metadata: Metadata = {
  title: 'Terms of Service — DocuBot',
  description: 'Terms of use for DocuBot: account, document uploads, limits, data ownership, and liability.',
};

const SECTIONS = [
  { id: 'quienes-somos', title: '1. Who we are' },
  { id: 'objeto', title: '2. What the Service is' },
  { id: 'cuenta', title: '3. Your account' },
  { id: 'uso-permitido', title: '4. Permitted use of document uploads' },
  { id: 'contenido', title: '5. Content and ownership' },
  { id: 'ia', title: '6. Nature of the bot\'s responses' },
  { id: 'terceros', title: '7. Third-party providers' },
  { id: 'disponibilidad', title: '8. Availability and changes' },
  { id: 'suspension', title: '9. Suspension and termination' },
  { id: 'responsabilidad', title: '10. Limitation of liability' },
  { id: 'ley', title: '11. Governing law' },
  { id: 'contacto', title: '12. Contact' },
];

export default function TerminosPage() {
  return (
    <LegalPage
      title="Terms of Service"
      updatedAt="September 18, 2026"
      sections={SECTIONS}
    >
      <p>
        These Terms of Service (the &quot;Terms&quot;) govern the use of
        DocuBot (the &quot;Service&quot;), a platform that lets you upload
        files and folders and generates an embeddable chatbot from their
        content. By creating an account or using the Service you accept
        these Terms. If you do not agree, do not use the Service.
      </p>

      <h2 id="quienes-somos">1. Who we are</h2>
      <p>
        DocuBot is operated by <strong>[FULL NAME], National ID/Tax ID
        [NUMBER]</strong>, with address at [ADDRESS], Argentina
        (&quot;we&quot;, &quot;the operator&quot;). You can contact us at{' '}
        <a href="mailto:hola@docubot.dev">hola@docubot.dev</a>.
      </p>

      <h2 id="objeto">2. What the Service is</h2>
      <p>
        You (the &quot;Customer&quot;) upload files or folders that you own
        or that you are authorized to use. DocuBot:
      </p>
      <ul>
        <li>Extracts the text content of the documents you upload and stores it.</li>
        <li>Generates vector representations (&quot;embeddings&quot;) of that content so it can be searched by semantic similarity.</li>
        <li>Exposes an embeddable chat widget that, when a visitor to your site asks a question, looks up the most relevant content fragments and generates an answer from them, citing the source document.</li>
      </ul>
      <p>
        The Service is provided &quot;as is,&quot; in the phase and with the
        functionality described in the dashboard at any given time, which
        may be expanded or modified.
      </p>

      <h2 id="cuenta">3. Your account</h2>
      <p>
        To use the Service you need an account with an email and password.
        You are responsible for keeping your credentials confidential and
        for all activity that occurs under your account. Notify us
        immediately of any unauthorized use.
      </p>
      <p>You must provide accurate information when registering and keep it up to date.</p>

      <h2 id="uso-permitido">4. Permitted use of document uploads</h2>
      <p>By uploading a file or folder, you represent and warrant that:</p>
      <ul>
        <li>You are the owner of the document, or you have the express authorization of its owner to upload it and index its content with DocuBot.</li>
        <li>You will not use the Service to upload content that infringes third-party intellectual property rights without permission, sensitive personal data you are not authorized to process, or illegal content.</li>
      </ul>
      <p>
        We reserve the right to suspend the upload or the account if we
        detect use that violates this section, without prejudice to other
        legal actions that may apply.
      </p>
      <p>
        Configurable technical limits also apply (maximum number of files,
        maximum file size) to protect the Service's infrastructure.
      </p>

      <h2 id="contenido">5. Content and ownership</h2>
      <p>
        The content of the documents you upload remains yours (or that of
        whoever holds its original ownership). We only store and process it
        to provide you the Service: generating the chatbot and answering
        through it.
      </p>
      <p>
        The conversations that your visitors have with the widget
        (questions, answers, and ratings) are associated with your account
        and you can view them from the dashboard. See the detail of how we
        handle this data in our{' '}
        <a href="/legal/privacidad">Privacy Policy</a> and in the{' '}
        <a href="/legal/procesamiento-datos">Data Processing Agreement</a>.
      </p>
      <p>
        Deleting a collection from the dashboard cascades to delete all of
        its uploaded documents, indexed content, conversation history, and
        associated configuration, irreversibly.
      </p>

      <h2 id="ia">6. Nature of the bot's responses</h2>
      <p>
        The chatbot's responses are generated by a language model
        (generative AI) based on your uploaded documents' indexed content.
        Even though the system is designed to answer only with information
        present in your documents and cite its source:
      </p>
      <ul>
        <li>We do not guarantee that responses will always be accurate, complete, or free of model interpretation errors.</li>
        <li>The bot may indicate that it lacks sufficient information instead of answering, depending on its configuration.</li>
        <li>You are responsible for reviewing that the tone, content, and accuracy of the responses are appropriate for your use case, and for adjusting the configuration (prompt, temperature) as needed.</li>
      </ul>
      <p>
        The Service must not be used as the sole source for medical,
        legal, financial, or safety decisions affecting your visitors.
      </p>

      <h2 id="terceros">7. Third-party providers</h2>
      <p>
        To generate chat responses, the relevant content from your
        documents and the visitor's question are sent to an external
        language model provider (currently OpenAI) under its own terms and
        privacy policy. Embeddings (content indexing) are generated locally
        on our infrastructure, without being sent to third parties. More
        detail in the{' '}
        <a href="/legal/privacidad">Privacy Policy</a>.
      </p>

      <h2 id="disponibilidad">8. Availability and changes</h2>
      <p>
        We will make reasonable efforts to keep the Service available, but
        we do not guarantee continuous or interruption-free availability.
        We may modify, limit, or discontinue functionality, with prior
        notice when the change is material.
      </p>
      <p>
        We may update these Terms. Material changes will be notified by
        email or via a notice in the dashboard before they take effect.
        Continued use of the Service implies acceptance of the version in
        force.
      </p>

      <h2 id="suspension">9. Suspension and termination</h2>
      <p>
        You may deactivate your account at any time from the dashboard or
        by writing to us. We may suspend or cancel an account that
        violates these Terms, makes abusive use of the upload feature, or
        creates risk for third parties or for the Service, notifying the
        reason when reasonably possible.
      </p>

      <h2 id="responsabilidad">10. Limitation of liability</h2>
      <p>
        To the extent permitted by applicable law, we will not be liable
        for indirect damages, lost profits, or loss of data or business
        arising from use of the Service, including AI-generated responses.
        The Service is provided without implied warranties of fitness for
        a particular purpose.
      </p>

      <h2 id="ley">11. Governing law</h2>
      <p>
        These Terms are governed by the laws of the Argentine Republic.
        For any dispute, the parties submit to the ordinary competent
        courts of [CITY/JURISDICTION], waiving any other venue that might
        otherwise apply.
      </p>

      <h2 id="contacto">12. Contact</h2>
      <p>
        Questions about these Terms:{' '}
        <a href="mailto:hola@docubot.dev">hola@docubot.dev</a>.
      </p>

      <div className="legal-note">
        This document is an informational template and does not replace
        the advice of a lawyer. Before publishing it, fill in the
        bracketed data and have it reviewed by a licensed professional in
        Argentina, especially if you process data from users in the EU or
        other jurisdictions.
      </div>
    </LegalPage>
  );
}
