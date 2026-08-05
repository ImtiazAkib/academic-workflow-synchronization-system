import { setRequestLocale } from 'next-intl/server';

import { SectionFeatures, SectionHero, SectionRoadmap, SectionRoles, SectionStack } from '@/components/home';

type PageProps = {
  params: Promise<{ locale: string }>;
};

export default async function Page({ params }: PageProps) {
  const { locale } = await params;

  setRequestLocale(locale);

  return (
    <>
      <SectionHero />
      <SectionRoles />
      <SectionFeatures />
      <SectionStack />
      <SectionRoadmap />
    </>
  );
}
