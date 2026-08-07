import type { Metadata } from 'next';

import { MailCheck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { ROUTES } from '@/constants';
import { Link } from '@/l10n/navigation';

import { isMailConfigured } from '@/lib/mail';

import { Container } from '@/components/shared';
import { Button } from '@/components/ui';

type RegistrationReceivedPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: RegistrationReceivedPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('REGISTRATION_RECEIVED_TITLE'),
    robots: { index: false, follow: false },
  };
}

/*
  Deliberately carries no identifier. One does not exist yet — it is issued by following
  the link in the email, not by submitting the form — and a screen that showed something
  here would be showing a promise it cannot keep.

  There is no account state on this page either, and no email address echoed back. It is
  reachable by anyone who types the URL, so it says only what a stranger may already
  know: that registering sends a link.
*/
export default async function RegistrationReceivedPage() {
  const l10n = await getTranslations();

  return (
    <section className="section-py flex items-center">
      <Container className="flex justify-center">
        <div className="surface-card flex w-full max-w-md flex-col items-center gap-5 p-8 text-center">
          <MailCheck className="text-primary size-10" aria-hidden />

          <div className="flex flex-col gap-2">
            <h1 className="text-2xl sm:text-3xl">{l10n('REGISTRATION_RECEIVED_TITLE')}</h1>
            <p className="text-muted-foreground text-sm">{l10n('REGISTRATION_RECEIVED_DESCRIPTION')}</p>
          </div>

          <p className="border-border text-muted-foreground w-full rounded-lg border border-dashed px-4 py-3 text-xs">
            {l10n('REGISTRATION_RECEIVED_APPROVAL')}
          </p>

          {/*
            Shown only when no mail server is configured, which is a developer's problem
            rather than an applicant's — on a real deploy this never renders. Without it,
            a local registration looks like it silently did nothing.
          */}
          {!isMailConfigured && (
            <p className="border-border text-muted-foreground w-full rounded-lg border border-dashed px-4 py-3 text-xs">
              {l10n('REGISTRATION_RECEIVED_NO_MAIL')}
            </p>
          )}

          <Button variant="appPrimary" nativeButton={false} render={<Link href={ROUTES.SIGN_IN.HREF} />}>
            {l10n('REGISTRATION_RECEIVED_SIGN_IN')}
          </Button>
        </div>
      </Container>
    </section>
  );
}
