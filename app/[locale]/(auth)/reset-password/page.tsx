import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { ResetPasswordForm } from '@/components/auth';
import { Container } from '@/components/shared';

type ResetPasswordPageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ token?: string }>;
};

export async function generateMetadata({ params }: Pick<ResetPasswordPageProps, 'params'>): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('RESET_PASSWORD_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  Public and outside the session, like verify-email-change: the link is opened from an
  inbox, as often on a phone that never signed in as in the browser that asked. A missing
  token is passed through as an empty string — the service refuses it the same way it
  refuses a wrong one, and the screen says the link is not valid, which is what a URL with
  no token is.
*/
export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const { token } = await searchParams;

  const l10n = await getTranslations();

  return (
    <section className="section-py flex items-center">
      <Container className="flex justify-center">
        <div className="surface-card flex w-full max-w-md flex-col gap-6 p-8">
          <div className="flex flex-col gap-1 text-center">
            <h1 className="text-2xl sm:text-3xl">{l10n('RESET_PASSWORD_TITLE')}</h1>
            <p className="text-muted-foreground text-sm">{l10n('RESET_PASSWORD_INTRO')}</p>
          </div>

          <ResetPasswordForm
            token={token ?? ''}
            labels={{
              newLabel: l10n('RESET_PASSWORD_NEW_LABEL'),
              confirmLabel: l10n('RESET_PASSWORD_CONFIRM_LABEL'),
              submit: l10n('RESET_PASSWORD_SUBMIT'),
              submitting: l10n('RESET_PASSWORD_SUBMITTING'),
              showPassword: l10n('PASSWORD_SHOW'),
              hidePassword: l10n('PASSWORD_HIDE'),
              successTitle: l10n('RESET_PASSWORD_SUCCESS_TITLE'),
              successDescription: l10n('RESET_PASSWORD_SUCCESS_DESCRIPTION'),
              signInCta: l10n('RESET_PASSWORD_SIGN_IN_CTA'),
              requestNewCta: l10n('RESET_PASSWORD_REQUEST_NEW_CTA'),
              fieldErrors: {
                passwordTooShort: l10n('USERS_FIELD_PASSWORD_TOO_SHORT'),
                passwordsDoNotMatch: l10n('RESET_PASSWORD_MISMATCH'),
              },
              failures: {
                invalidTitle: l10n('RESET_PASSWORD_INVALID_TITLE'),
                invalidDescription: l10n('RESET_PASSWORD_INVALID_DESCRIPTION'),
                expiredTitle: l10n('RESET_PASSWORD_EXPIRED_TITLE'),
                expiredDescription: l10n('RESET_PASSWORD_EXPIRED_DESCRIPTION'),
              },
            }}
          />
        </div>
      </Container>
    </section>
  );
}
