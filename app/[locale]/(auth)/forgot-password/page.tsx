import type { Metadata } from 'next';

import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { ROUTES } from '@/constants';
import { Link } from '@/l10n/navigation';

import { ForgotPasswordForm } from '@/components/auth';
import { Container } from '@/components/shared';

type ForgotPasswordPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ForgotPasswordPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('FORGOT_PASSWORD_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  Public, and it has to be: somebody who cannot remember their password cannot sign in
  either, so a guard here would lock the door from the inside — the same reason
  resend-confirmation sits outside the session.
*/
export default async function ForgotPasswordPage() {
  const l10n = await getTranslations();

  return (
    <section className="section-py flex items-center">
      <Container className="flex justify-center">
        <div className="surface-card flex w-full max-w-md flex-col gap-6 p-8">
          <div className="flex flex-col gap-3">
            <Link
              href={ROUTES.SIGN_IN.HREF}
              className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors">
              <ArrowLeft className="size-4" />
              {l10n('FORGOT_PASSWORD_BACK')}
            </Link>

            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl">{l10n('FORGOT_PASSWORD_TITLE')}</h1>
              <p className="text-muted-foreground text-sm">{l10n('FORGOT_PASSWORD_INTRO')}</p>
            </div>
          </div>

          <ForgotPasswordForm
            labels={{
              emailLabel: l10n('FORGOT_PASSWORD_EMAIL_LABEL'),
              submit: l10n('FORGOT_PASSWORD_SUBMIT'),
              submitting: l10n('FORGOT_PASSWORD_SUBMITTING'),
              sentTitle: l10n('FORGOT_PASSWORD_SENT_TITLE'),
              sentDescription: l10n('FORGOT_PASSWORD_SENT_DESCRIPTION'),
              errors: {
                notRegistered: l10n('FORGOT_PASSWORD_ERROR_NOT_REGISTERED'),
                invalidEmail: l10n('USERS_FIELD_EMAIL_INVALID'),
                tooManyAttempts: l10n('ERROR_TOO_MANY_ATTEMPTS'),
                generic: l10n('FORGOT_PASSWORD_ERROR_GENERIC'),
              },
            }}
          />
        </div>
      </Container>
    </section>
  );
}
