import type { Metadata } from 'next';

import { GraduationCap, Presentation } from 'lucide-react';
import { getTranslations } from 'next-intl/server';

import { ROUTES } from '@/constants';
import { Link, redirect } from '@/l10n/navigation';

import { getSessionUser } from '@/lib/auth';

import { AppLogo, Container } from '@/components/shared';

type RegisterPageProps = {
  params: Promise<{ locale: string }>;
};

export async function generateMetadata({ params }: RegisterPageProps): Promise<Metadata> {
  const { locale } = await params;
  const l10n = await getTranslations({ locale });

  return {
    title: l10n('REGISTER_METADATA_TITLE'),
    // Public, but never indexed — a sign-up form is not a landing page.
    robots: { index: false, follow: false },
  };
}

/*
  A chooser rather than one form with a role select. The two registrations ask for
  different things — a student has a roll number and a session, a teacher does not — so
  picking first means neither form shows a field that does not apply.

  It is also what keeps the role out of the request body: each branch posts to its own
  action, and the role is decided by which one ran.
*/
export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;

  const sessionUser = await getSessionUser();

  // Somebody already signed in has an account by definition.
  if (sessionUser) {
    redirect({ href: ROUTES.HOME.HREF, locale });
  }

  const l10n = await getTranslations();

  const choices = [
    {
      href: ROUTES.REGISTER_STUDENT.HREF,
      icon: GraduationCap,
      label: l10n('REGISTER_CHOOSE_STUDENT'),
      hint: l10n('REGISTER_CHOOSE_STUDENT_HINT'),
    },
    {
      href: ROUTES.REGISTER_TEACHER.HREF,
      icon: Presentation,
      label: l10n('REGISTER_CHOOSE_TEACHER'),
      hint: l10n('REGISTER_CHOOSE_TEACHER_HINT'),
    },
  ];

  return (
    <section className="section-py flex items-center">
      <Container className="flex justify-center">
        <div className="surface-card flex w-full max-w-md flex-col gap-6 p-8">
          <div className="flex flex-col items-center gap-3 text-center">
            <AppLogo className="size-11" />
            <h1 className="text-2xl sm:text-3xl">{l10n('REGISTER_TITLE')}</h1>
            <p className="text-muted-foreground text-sm">{l10n('REGISTER_INTRO')}</p>
          </div>

          <div className="flex flex-col gap-3">
            {choices.map(x => (
              <Link
                key={x.href}
                href={x.href}
                className="border-border hover:border-primary/40 flex flex-col gap-1 rounded-lg border p-4 transition-colors">
                <span className="flex items-center gap-2">
                  <x.icon className="text-muted-foreground size-4" aria-hidden />
                  <span className="text-regular-semibold">{x.label}</span>
                </span>
                <span className="text-muted-foreground text-xs">{x.hint}</span>
              </Link>
            ))}
          </div>

          <p className="text-muted-foreground text-center text-sm">
            <Link href={ROUTES.SIGN_IN.HREF} className="text-primary hover:underline">
              {l10n('VERIFY_EMAIL_SIGN_IN_CTA')}
            </Link>
          </p>
        </div>
      </Container>
    </section>
  );
}
