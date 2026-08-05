import type { Metadata } from 'next';

import { getTranslations, setRequestLocale } from 'next-intl/server';

import { ROUTES } from '@/constants';
import { redirect } from '@/l10n/navigation';

import { getSessionUser } from '@/lib/auth';

import { SignInForm } from '@/components/auth';
import { AppLogo, Container } from '@/components/shared';

type SignInPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: SignInPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('SIGN_IN_METADATA_TITLE'),
    // Never indexed, regardless of the ROBOTS_ENABLED flag.
    robots: { index: false, follow: false },
  };
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  const sessionUser = await getSessionUser();

  // Nobody signs in twice.
  if (sessionUser) {
    redirect({ href: ROUTES.HOME.HREF, locale });
  }

  const l10n = await getTranslations();

  return (
    <section className="section-py flex items-center">
      <Container className="flex justify-center">
        <div className="surface-card flex w-full max-w-md flex-col gap-6 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <AppLogo className="size-11" />
            <h1 className="text-2xl sm:text-3xl">{l10n('SIGN_IN_TITLE')}</h1>
            <p className="text-muted-foreground text-sm">{l10n('SIGN_IN_SUBTITLE')}</p>
          </div>

          <SignInForm
            labels={{
              emailLabel: l10n('SIGN_IN_EMAIL_LABEL'),
              emailPlaceholder: l10n('SIGN_IN_EMAIL_PLACEHOLDER'),
              emailInvalid: l10n('SIGN_IN_EMAIL_INVALID'),
              passwordLabel: l10n('SIGN_IN_PASSWORD_LABEL'),
              passwordRequired: l10n('SIGN_IN_PASSWORD_REQUIRED'),
              submit: l10n('SIGN_IN_SUBMIT'),
              submitting: l10n('SIGN_IN_SUBMITTING'),
              errorInvalidCredentials: l10n('SIGN_IN_ERROR_INVALID_CREDENTIALS'),
              errorNotApproved: l10n('SIGN_IN_ERROR_NOT_APPROVED'),
              errorDeactivated: l10n('SIGN_IN_ERROR_DEACTIVATED'),
              errorUnexpected: l10n('SIGN_IN_ERROR_UNEXPECTED'),
            }}
          />

          <p className="text-muted-foreground border-border border-t pt-5 text-center text-xs">{l10n('SIGN_IN_NO_ACCOUNT')}</p>
        </div>
      </Container>
    </section>
  );
}
