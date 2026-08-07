import type { Metadata } from 'next';

import { ArrowLeft } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { ROUTES } from '@/constants';
import { Link, redirect } from '@/l10n/navigation';

import { getSessionUser } from '@/lib/auth';
import { buildRegisterLabels } from '@/lib/utils';

import { RegisterStudentForm } from '@/components/auth';
import { Container } from '@/components/shared';

type RegisterStudentPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: RegisterStudentPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('REGISTER_STUDENT_TITLE'),
    robots: { index: false, follow: false },
  };
}

export default async function RegisterStudentPage({ params }: RegisterStudentPageProps) {
  const { locale } = await params;

  const sessionUser = await getSessionUser();

  if (sessionUser) {
    redirect({ href: ROUTES.HOME.HREF, locale });
  }

  const l10n = await getTranslations();

  return (
    <section className="section-py flex items-center">
      <Container className="flex justify-center">
        <div className="surface-card flex w-full max-w-2xl flex-col gap-6 p-8">
          <div className="flex flex-col gap-3">
            <Link
              href={ROUTES.REGISTER.HREF}
              className="text-muted-foreground hover:text-foreground inline-flex w-fit items-center gap-1.5 text-sm font-medium transition-colors">
              <ArrowLeft className="size-4" />
              {l10n('REGISTER_BACK')}
            </Link>

            <div className="flex flex-col gap-1">
              <h1 className="text-2xl sm:text-3xl">{l10n('REGISTER_STUDENT_TITLE')}</h1>
              <p className="text-muted-foreground text-sm">{l10n('REGISTER_STUDENT_INTRO')}</p>
            </div>
          </div>

          <RegisterStudentForm labels={buildRegisterLabels(l10n)} />
        </div>
      </Container>
    </section>
  );
}
