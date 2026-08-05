import { SectionFeatures, SectionHero, SectionRoadmap, SectionRoles, SectionStack } from '@/components/home';

/*
  No `params` and no locale plumbing: each section calls `getTranslations()`, which
  resolves the locale from the `[locale]` root param in `l10n/request.config.ts`.
*/
export default function Page() {
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
