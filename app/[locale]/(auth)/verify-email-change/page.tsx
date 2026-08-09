import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { EmailChangeVerification } from '@/components/auth';
import { Container } from '@/components/shared';

type VerifyEmailChangePageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: Pick<VerifyEmailChangePageProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('VERIFY_EMAIL_CHANGE_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  Under `(auth)` rather than `(dashboard)`, and that is the point of it being its own
  route. The link is opened from an inbox, which is as often a phone that has never signed
  in as the browser that asked for the change — a screen behind the session guard would
  bounce exactly the person it was sent to, and the token would expire in a redirect loop.

  The token proves the request on its own, which is what makes requiring no session safe:
  it is 32 bytes of `randomBytes`, it lives a day, it is single-use, and only its hash is
  stored. Anybody holding it read the inbox it was sent to, which is the whole thing being
  proven.

  A missing token is passed through as an empty string rather than special-cased. The
  service refuses it the same way it refuses a wrong one, and the screen says the link is
  not valid — which is what a URL with no token is.
*/
export default async function VerifyEmailChangePage({ searchParams }: VerifyEmailChangePageProps) {
  const { token } = await searchParams;

  const l10n = await getTranslations();

  return (
    <section className="section-py flex items-center">
      <Container className="flex justify-center">
        <div className="surface-card flex w-full max-w-md flex-col gap-6 p-8">
          <EmailChangeVerification
            token={token ?? ''}
            labels={{
              working: l10n('VERIFY_EMAIL_CHANGE_WORKING'),
              successTitle: l10n('VERIFY_EMAIL_CHANGE_SUCCESS_TITLE'),
              successDescription: l10n('VERIFY_EMAIL_CHANGE_SUCCESS_DESCRIPTION'),
              signInCta: l10n('VERIFY_EMAIL_SIGN_IN_CTA'),
              failures: {
                invalidTitle: l10n('VERIFY_EMAIL_CHANGE_INVALID_TITLE'),
                invalidDescription: l10n('VERIFY_EMAIL_CHANGE_INVALID_DESCRIPTION'),
                expiredTitle: l10n('VERIFY_EMAIL_CHANGE_EXPIRED_TITLE'),
                expiredDescription: l10n('VERIFY_EMAIL_CHANGE_EXPIRED_DESCRIPTION'),
                takenTitle: l10n('VERIFY_EMAIL_CHANGE_TAKEN_TITLE'),
                takenDescription: l10n('VERIFY_EMAIL_CHANGE_TAKEN_DESCRIPTION'),
              },
            }}
          />
        </div>
      </Container>
    </section>
  );
}
