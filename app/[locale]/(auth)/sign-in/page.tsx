import type { Metadata } from 'next';

import { getTranslations } from 'next-intl/server';

import { ROUTES } from '@/constants';
import { Link, redirect } from '@/l10n/navigation';

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
              identifierLabel: l10n('SIGN_IN_IDENTIFIER_LABEL'),
              identifierPlaceholder: l10n('SIGN_IN_IDENTIFIER_PLACEHOLDER'),
              identifierRequired: l10n('SIGN_IN_IDENTIFIER_REQUIRED'),
              identifierHint: l10n('SIGN_IN_IDENTIFIER_HINT'),
              passwordLabel: l10n('SIGN_IN_PASSWORD_LABEL'),
              passwordRequired: l10n('SIGN_IN_PASSWORD_REQUIRED'),
              submit: l10n('SIGN_IN_SUBMIT'),
              submitting: l10n('SIGN_IN_SUBMITTING'),
              errors: {
                invalidCredentials: l10n('SIGN_IN_ERROR_INVALID_CREDENTIALS'),
                useLoginId: l10n('SIGN_IN_ERROR_USE_LOGIN_ID'),
                notVerified: l10n('SIGN_IN_ERROR_NOT_VERIFIED'),
                notApproved: l10n('SIGN_IN_ERROR_NOT_APPROVED'),
                deactivated: l10n('SIGN_IN_ERROR_DEACTIVATED'),
                unexpected: l10n('SIGN_IN_ERROR_UNEXPECTED'),
              },
            }}
          />

          <p className="text-muted-foreground border-border border-t pt-5 text-center text-xs">{l10n('SIGN_IN_NO_ACCOUNT')}</p>

          <div className="flex flex-col gap-1 text-center text-sm">
            <p className="text-muted-foreground">
              {l10n('SIGN_IN_REGISTER_PROMPT')}{' '}
              <Link href={ROUTES.REGISTER.HREF} className="text-primary hover:underline">
                {l10n('SIGN_IN_REGISTER_LINK')}
              </Link>
            </p>
            <Link href={ROUTES.RESEND_CONFIRMATION.HREF} className="text-muted-foreground hover:text-foreground text-xs transition-colors">
              {l10n('SIGN_IN_RESEND_LINK')}
            </Link>
          </div>
        </div>
      </Container>
    </section>
  );
}
