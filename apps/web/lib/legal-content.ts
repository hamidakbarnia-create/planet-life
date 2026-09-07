export type LegalSection = {
  heading: string;
  paragraphs: string[];
};

export type LegalPageContent = {
  title: string;
  lastUpdated: string;
  intro?: string;
  sections: LegalSection[];
};

export const LEGAL_LAST_UPDATED = '2 July 2026';

// TODO(legal): Add the verified operator/controller identity, registered address,
// and governing-law/venue clause before paid launch.

export const privacyContent: LegalPageContent = {
  title: 'Privacy Policy',
  lastUpdated: LEGAL_LAST_UPDATED,
  intro:
    'METIORO ("we", "us", or "our") operates the METIORO personal decision intelligence platform at metioro.com. This Privacy Policy explains how we collect, use, disclose, and safeguard information when you use our website and services.',
  sections: [
    {
      heading: '1. Information We Collect',
      paragraphs: [
        'Account and profile information: If you create an account or save a profile, we may collect identifiers such as your name, email address, and authentication credentials.',
        'Birth and location data: To generate analytical outputs, you may provide birth date, birth time, birth location, and related location preferences used for calculations.',
        'Usage data: We collect technical information about how you interact with METIORO, including device type, browser, IP address, pages viewed, features used, and approximate timestamps.',
        'Communications: If you contact us, we retain the content of your message and associated contact details.',
        'Payment information: If you purchase a subscription, payment processing is handled by third-party payment providers. We do not store full payment card numbers on our servers.',
      ],
    },
    {
      heading: '2. How We Use Information',
      paragraphs: [
        'We use collected information to provide, maintain, and improve METIORO; generate personalized analytical outputs; authenticate users; process subscriptions; respond to support requests; monitor performance and security; and comply with legal obligations.',
        'We may use aggregated or de-identified data for analytics, product improvement, and research that does not identify individual users.',
      ],
    },
    {
      heading: '3. Legal Bases for Processing',
      paragraphs: [
        'Where applicable under GDPR and similar laws, we process personal data based on: performance of a contract (providing the service you request); legitimate interests (security, analytics, product improvement); consent (where required, such as non-essential cookies); and legal obligation.',
      ],
    },
    {
      heading: '4. Sharing and Disclosure',
      paragraphs: [
        'We do not sell your personal information. We may share information with infrastructure and service providers who assist in hosting, analytics, authentication, email delivery, and payment processing, subject to contractual confidentiality and data protection obligations.',
        'We may disclose information if required by law, regulation, legal process, or governmental request, or to protect the rights, safety, and integrity of METIORO, our users, or others.',
        'In connection with a merger, acquisition, or asset sale, user information may be transferred subject to this Privacy Policy.',
      ],
    },
    {
      heading: '5. International Transfers',
      paragraphs: [
        'METIORO may process and store information in countries other than your country of residence. Where required, we implement appropriate safeguards for cross-border transfers, such as Standard Contractual Clauses.',
      ],
    },
    {
      heading: '6. Data Retention',
      paragraphs: [
        'We retain personal information for as long as necessary to provide the service, fulfill the purposes described in this policy, comply with legal obligations, resolve disputes, and enforce agreements. Retention periods vary based on data type and legal requirements.',
        'You may request deletion of certain account data subject to applicable law and legitimate retention needs.',
      ],
    },
    {
      heading: '7. Your Rights',
      paragraphs: [
        'Depending on your jurisdiction, you may have rights to access, correct, delete, restrict, or port your personal data, and to object to or withdraw consent for certain processing.',
        'To exercise these rights, contact us using the details on our Contact page. We may verify your identity before responding. You may also lodge a complaint with your local data protection authority.',
      ],
    },
    {
      heading: '8. Security',
      paragraphs: [
        'We implement administrative, technical, and organizational measures designed to protect personal information. No method of transmission or storage is completely secure; we cannot guarantee absolute security.',
      ],
    },
    {
      heading: '9. Children',
      paragraphs: [
        'METIORO is not directed to individuals under 16 (or the applicable age of digital consent in your jurisdiction). We do not knowingly collect personal information from children. If you believe a child has provided us data, please contact us so we can delete it.',
      ],
    },
    {
      heading: '10. Changes to This Policy',
      paragraphs: [
        'We may update this Privacy Policy from time to time. The "Last updated" date at the top indicates the latest revision. Material changes will be communicated through the service or by other appropriate means where required by law.',
      ],
    },
    {
      heading: '11. Contact',
      paragraphs: [
        'Privacy inquiries: privacy@metioro.com — see our Contact page for current details.',
      ],
    },
  ],
};

export const termsContent: LegalPageContent = {
  title: 'Terms of Service',
  lastUpdated: LEGAL_LAST_UPDATED,
  intro:
    'These Terms of Service ("Terms") govern your access to and use of the METIORO website, applications, and related services (collectively, the "Service"). By accessing or using METIORO, you agree to these Terms. If you do not agree, do not use the Service.',
  sections: [
    {
      heading: '1. About METIORO',
      paragraphs: [
        'METIORO is a personal decision intelligence platform that combines astronomical calculation, analytical modeling, and AI-assisted interpretation to help users evaluate timing and context for personal decisions.',
        'METIORO is not a licensed financial, legal, medical, or mental health service provider.',
      ],
    },
    {
      heading: '2. Eligibility',
      paragraphs: [
        'You must be at least 16 years old (or the age of digital consent in your jurisdiction) and capable of forming a binding contract to use the Service. You represent that information you provide is accurate and that you will comply with applicable laws.',
      ],
    },
    {
      heading: '3. Account Registration',
      paragraphs: [
        'Certain features may require an account. You are responsible for maintaining the confidentiality of your credentials and for all activity under your account. Notify us promptly of unauthorized access.',
      ],
    },
    {
      heading: '4. Subscriptions and Payments',
      paragraphs: [
        'Paid plans, billing cycles, pricing, and feature entitlements are described at the point of purchase. Subscriptions renew automatically unless canceled before the renewal date, except where prohibited by law.',
        'Fees are non-refundable except as stated in our Refund Policy or required by applicable consumer protection law. Taxes may apply based on your location.',
        // TODO: Link to dedicated Refund Policy page when published.
      ],
    },
    {
      heading: '5. Acceptable Use',
      paragraphs: [
        'You agree not to misuse the Service, including by: violating laws or third-party rights; attempting unauthorized access; scraping or reverse engineering except as permitted by law; interfering with Service operation; submitting false birth or location data to manipulate outputs; or using METIORO outputs to harm, harass, or defraud others.',
        'We may suspend or terminate access for violations of these Terms or conduct that poses risk to the Service or other users.',
      ],
    },
    {
      heading: '6. Intellectual Property',
      paragraphs: [
        'METIORO and its logos, software, designs, text, and analytical frameworks are owned by us or our licensors and protected by intellectual property laws. We grant you a limited, non-exclusive, non-transferable license to access and use the Service for personal, non-commercial purposes unless otherwise agreed in writing.',
        'You retain ownership of content you submit. You grant us a license to process that content solely to provide and improve the Service.',
      ],
    },
    {
      heading: '7. AI-Generated and Analytical Content',
      paragraphs: [
        'Outputs may include AI-generated text, scores, summaries, and recommendations derived from astronomical data and models. Such content is provided for informational and educational purposes only. It may be incomplete, inaccurate, or unsuitable for your specific circumstances. See our Disclaimer page for additional limitations.',
      ],
    },
    {
      heading: '8. Disclaimers',
      paragraphs: [
        'THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS, IMPLIED, OR STATUTORY, INCLUDING IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, ACCURACY, AND NON-INFRINGEMENT, TO THE MAXIMUM EXTENT PERMITTED BY LAW.',
      ],
    },
    {
      heading: '9. Limitation of Liability',
      paragraphs: [
        'TO THE MAXIMUM EXTENT PERMITTED BY LAW, METIORO AND ITS AFFILIATES, OFFICERS, DIRECTORS, EMPLOYEES, AND AGENTS SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, GOODWILL, OR OTHER INTANGIBLE LOSSES, ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE.',
        'OUR TOTAL LIABILITY FOR ANY CLAIM ARISING OUT OF OR RELATING TO THESE TERMS OR THE SERVICE SHALL NOT EXCEED THE GREATER OF (A) THE AMOUNT YOU PAID TO METIORO IN THE TWELVE (12) MONTHS PRECEDING THE CLAIM, OR (B) ONE HUNDRED US DOLLARS (USD $100), EXCEPT WHERE LIABILITY CANNOT BE LIMITED BY APPLICABLE LAW.',
      ],
    },
    {
      heading: '10. Indemnification',
      paragraphs: [
        'You agree to indemnify and hold harmless METIORO and its affiliates from claims, damages, losses, and expenses (including reasonable legal fees) arising from your use of the Service, your content, or your violation of these Terms or applicable law.',
      ],
    },
    {
      heading: '11. Termination',
      paragraphs: [
        'You may stop using the Service at any time. We may suspend or terminate your access with or without notice if you breach these Terms, if required by law, or if we discontinue the Service. Provisions that by nature should survive termination will survive, including intellectual property, disclaimers, and limitation of liability.',
      ],
    },
    {
      heading: '12. Changes to Terms',
      paragraphs: [
        'We may modify these Terms from time to time. Continued use after the effective date of revised Terms constitutes acceptance, except where applicable law requires explicit consent.',
      ],
    },
    {
      heading: '13. Contact',
      paragraphs: [
        'Legal inquiries: legal@metioro.com — see our Contact page.',
      ],
    },
  ],
};

export const cookiesContent: LegalPageContent = {
  title: 'Cookie Policy',
  lastUpdated: LEGAL_LAST_UPDATED,
  intro:
    'This Cookie Policy explains how METIORO uses cookies and similar technologies when you visit metioro.com or use our applications.',
  sections: [
    {
      heading: '1. What Are Cookies and Similar Technologies',
      paragraphs: [
        'Cookies are small text files stored on your device by your browser. We also use similar technologies such as local storage and session storage to remember preferences and maintain application state.',
      ],
    },
    {
      heading: '2. How We Use These Technologies',
      paragraphs: [
        'Strictly necessary: Required for core functionality, security, and load balancing. These cannot be disabled without affecting the Service.',
        'Preferences: Remember language selection, display settings, disclaimer acceptance, and other choices you make.',
        'Analytics: Help us understand usage patterns, diagnose errors, and improve performance. Where required by law, we obtain consent before placing non-essential analytics technologies.',
        'Authentication: Maintain signed-in sessions when you use account features.',
      ],
    },
    {
      heading: '3. Examples of Storage Keys We Use',
      paragraphs: [
        'METIORO and its prior versions may store data under keys including: language preference, disclaimer acceptance status, birth profile data, saved locations, membership tier indicators, and feature-specific settings. These are stored locally in your browser unless synced to your account where applicable.',
      ],
    },
    {
      heading: '4. Third-Party Technologies',
      paragraphs: [
        'We may use third-party infrastructure providers (such as hosting and content delivery networks) that set essential cookies for security and delivery. Payment processors may use cookies when you complete a transaction on their pages.',
        'We do not use third-party advertising cookies on the core METIORO application at the time of this policy. If this changes, we will update this policy and, where required, request consent.',
      ],
    },
    {
      heading: '5. Managing Cookies',
      paragraphs: [
        'You can control cookies through your browser settings, including blocking or deleting cookies. Blocking strictly necessary cookies may prevent parts of METIORO from functioning correctly.',
        'To clear locally stored application data, use your browser\'s site data or storage controls for metioro.com.',
      ],
    },
    {
      heading: '6. Updates',
      paragraphs: [
        'We may update this Cookie Policy to reflect changes in technology or legal requirements. Check the "Last updated" date above for the current version.',
      ],
    },
    {
      heading: '7. Contact',
      paragraphs: [
        'Questions about this Cookie Policy: privacy@metioro.com — see our Contact page.',
      ],
    },
  ],
};

export const disclaimerContent: LegalPageContent = {
  title: 'Disclaimer',
  lastUpdated: LEGAL_LAST_UPDATED,
  intro:
    'METIORO provides personal decision intelligence tools for informational and educational purposes. Please read this Disclaimer carefully before relying on any output from the Service.',
  sections: [
    {
      heading: '1. AI-Generated Insights',
      paragraphs: [
        'METIORO uses automated systems, including artificial intelligence, to generate summaries, scores, narratives, and recommendations. AI outputs may contain errors, omissions, or biases and should not be treated as definitive or authoritative.',
        'AI-generated content is probabilistic and context-dependent. It does not constitute professional advice of any kind. Always apply independent judgment and verify important information through qualified sources.',
      ],
    },
    {
      heading: '2. Astrology-Based Analytical Service',
      paragraphs: [
        'METIORO applies astronomical calculations and astrological interpretive frameworks as analytical inputs. These methods are not recognized as scientific by mainstream academic science and have not been validated as predictive of future events or outcomes.',
        'Scores, timing windows, and interpretive text reflect model outputs based on the data you provide and selected analytical parameters. They are offered as one perspective to support reflection and planning—not as factual predictions or guarantees.',
        'METIORO is positioned as a decision intelligence tool, not a mystical or fortune-telling service. We present analysis in a calm, analytical manner intended to support thoughtful decision-making.',
      ],
    },
    {
      heading: '3. No Medical Advice',
      paragraphs: [
        'METIORO does not provide medical advice, diagnosis, treatment recommendations, or mental health counseling. Nothing in the Service should be used to make health-related decisions or to delay or disregard professional medical care.',
        'If you have a medical or mental health concern, consult a qualified healthcare provider.',
      ],
    },
    {
      heading: '4. No Legal Advice',
      paragraphs: [
        'METIORO does not provide legal advice or create an attorney-client relationship. Outputs must not be relied upon for legal decisions, contract interpretation, compliance obligations, immigration matters, or dispute resolution.',
        'Consult a licensed attorney in your jurisdiction for legal guidance.',
      ],
    },
    {
      heading: '5. No Financial Advice',
      paragraphs: [
        'METIORO does not provide investment, tax, accounting, or financial planning advice. Scores and timing suggestions related to business, finance, or real estate are analytical and educational only.',
        'Do not use METIORO as the sole basis for investment, trading, borrowing, tax planning, or major financial commitments. Consult qualified financial professionals before making financial decisions.',
      ],
    },
    {
      heading: '6. User Responsibility for Decisions',
      paragraphs: [
        'You are solely responsible for evaluating METIORO outputs and for all decisions and actions you take based on or in connection with the Service.',
        'By using METIORO, you acknowledge that you assume full responsibility for outcomes resulting from your choices, including decisions made in business, financial, legal, health, and personal domains.',
      ],
    },
    {
      heading: '7. Limitation of Liability',
      paragraphs: [
        'To the maximum extent permitted by applicable law, METIORO, its operators, affiliates, and contributors disclaim all liability for any direct, indirect, incidental, special, consequential, or punitive damages arising from your use of or reliance on the Service, including damages related to lost profits, lost data, business interruption, or personal injury, whether based on warranty, contract, tort, or any other legal theory.',
        'Some jurisdictions do not allow certain limitations of liability; in those cases, our liability is limited to the fullest extent permitted by law.',
      ],
    },
    {
      heading: '8. No Guarantee of Results',
      paragraphs: [
        'We do not guarantee that use of METIORO will improve outcomes, prevent losses, or produce any particular result. Past analytical patterns do not ensure future performance.',
      ],
    },
    {
      heading: '9. External Links',
      paragraphs: [
        'The Service may reference or link to third-party content. METIORO is not responsible for the accuracy, policies, or practices of third parties.',
      ],
    },
    {
      heading: '10. Contact',
      paragraphs: [
        'Questions about this Disclaimer: support@metioro.com — see our Contact page.',
      ],
    },
  ],
};

export const contactContent: LegalPageContent = {
  title: 'Contact',
  lastUpdated: LEGAL_LAST_UPDATED,
  intro:
    'We welcome inquiries about METIORO, your account, privacy, legal matters, and partnerships. Use the channels below to reach the appropriate team.',
  sections: [
    {
      heading: 'General Enquiries',
      paragraphs: ['Email: contact@metioro.com'],
    },
    {
      heading: 'General Support',
      paragraphs: [
        'For product questions, account help, and technical issues:',
        // TODO(operations): Publish response-time guidance only after the support workflow is verified.
        'Email: support@metioro.com',
      ],
    },
    {
      heading: 'Privacy and Data Protection',
      paragraphs: [
        'For privacy requests, data subject access requests, and cookie-related inquiries:',
        'Email: privacy@metioro.com',
      ],
    },
    {
      heading: 'Legal and Compliance',
      paragraphs: [
        'For terms of service, compliance, law enforcement requests, and legal notices:',
        'Email: legal@metioro.com',
      ],
    },
    {
      heading: 'Business and Partnerships',
      paragraphs: [
        'For enterprise inquiries, media, and partnership opportunities:',
        'Email: partners@metioro.com',
      ],
    },
    {
      heading: 'Service Availability',
      paragraphs: [
        'METIORO is provided globally via metioro.com. Report security issues to security@metioro.com.',
      ],
    },
  ],
};
