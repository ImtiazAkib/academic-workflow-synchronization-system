import type { Metadata } from 'next';

import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { ROUTES } from '@/constants';
import { Link } from '@/l10n/navigation';

import { ResendConfirmationForm } from '@/components/auth';
import { Container } from '@/components/shared';

type ResendConfirmationPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: ResendConfirmationPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('RESEND_METADATA_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  The way out of the one dead end registration can reach: a confirmation email that never
  arrived. The token is single-use and the identifier is delivered once, so without this
  a spam filter is enough to strand an account permanently.

  Deliberately not behind a session — somebody who cannot confirm their address cannot
  sign in either, so a guard here would lock the door from the inside.
*/
export default async function ResendConfirmationPage() {
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
              {l10n('RESEND_BACK')}
            </Link>

            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl">{l10n('RESEND_TITLE')}</h1>
              <p className="text-muted-foreground text-sm">{l10n('RESEND_INTRO')}</p>
            </div>
          </div>

          <ResendConfirmationForm
            labels={{
              emailLabel: l10n('RESEND_EMAIL_LABEL'),
              submit: l10n('RESEND_SUBMIT'),
              submitting: l10n('RESEND_SUBMITTING'),
              sentTitle: l10n('RESEND_SENT_TITLE'),
              sentDescription: l10n('RESEND_SENT_DESCRIPTION'),
            }}
          />
        </div>
      </Container>
    </section>
  );
}
