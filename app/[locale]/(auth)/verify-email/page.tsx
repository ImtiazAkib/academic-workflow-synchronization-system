import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { EmailVerification } from '@/components/auth';
import { Container } from '@/components/shared';

type VerifyEmailPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: Pick<VerifyEmailPageProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('VERIFY_EMAIL_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  The token comes from the query string, which is the only place it can come from — the
  visitor arrives by clicking a link in an email. It is handed straight to a client
  component rather than acted on here: confirming an address writes, and a page that
  wrote while rendering would fire again on every refresh and every prefetch, spending a
  single-use token on a visit nobody made.

  A missing token is passed through as an empty string rather than special-cased. The
  service refuses it the same way it refuses a wrong one, and the screen says "that link
  is not valid" — which is exactly what a URL with no token is.
*/
export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const { token } = await searchParams;

  const l10n = await getTranslations();

  return (
    <section className="section-py flex items-center">
      <Container className="flex justify-center">
        <div className="surface-card flex w-full max-w-md flex-col gap-6 p-8">
          <EmailVerification
            token={token ?? ''}
            labels={{
              working: l10n('VERIFY_EMAIL_WORKING'),
              successTitle: l10n('VERIFY_EMAIL_SUCCESS_TITLE'),
              successDescription: l10n('VERIFY_EMAIL_SUCCESS_DESCRIPTION'),
              sentNote: l10n('VERIFY_EMAIL_SENT_NOTE'),
              approvalNote: l10n('VERIFY_EMAIL_APPROVAL_NOTE'),
              copy: l10n('VERIFY_EMAIL_COPY'),
              copied: l10n('VERIFY_EMAIL_COPIED'),
              signInCta: l10n('VERIFY_EMAIL_SIGN_IN_CTA'),
              resendCta: l10n('VERIFY_EMAIL_RESEND_CTA'),
              failures: {
                invalidTitle: l10n('VERIFY_EMAIL_INVALID_TITLE'),
                invalidDescription: l10n('VERIFY_EMAIL_INVALID_DESCRIPTION'),
                expiredTitle: l10n('VERIFY_EMAIL_EXPIRED_TITLE'),
                expiredDescription: l10n('VERIFY_EMAIL_EXPIRED_DESCRIPTION'),
              },
            }}
          />
        </div>
      </Container>
    </section>
  );
}
