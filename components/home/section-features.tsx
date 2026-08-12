import { getTranslations } from 'next-intl/server';

import { FEATURE_VISUALS, SECTION_IDS } from '@/constants';

import { Container } from '@/components/shared';

import { FeatureCard } from './feature-card';

export async function SectionFeatures() {
  const l10n = await getTranslations();

  return (
    <section id={SECTION_IDS.FEATURES} className="bg-muted/40 section-py scroll-mt-16">
      <Container className="flex flex-col gap-10 lg:gap-12">
        <div className="flex max-w-3xl flex-col gap-3">
          <span className="tagline text-primary">{l10n('HOME_FEATURES_TAGLINE')}</span>
          <h2>{l10n('HOME_FEATURES_TITLE')}</h2>
          <p className="text-medium-normal text-muted-foreground text-pretty">{l10n('HOME_FEATURES_DESCRIPTION')}</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <FeatureCard visual={FEATURE_VISUALS.AUTH} title={l10n('HOME_FEATURES_AUTH_TITLE')} description={l10n('HOME_FEATURES_AUTH_DESCRIPTION')} />
          <FeatureCard visual={FEATURE_VISUALS.RBAC} title={l10n('HOME_FEATURES_RBAC_TITLE')} description={l10n('HOME_FEATURES_RBAC_DESCRIPTION')} />
          <FeatureCard
            visual={FEATURE_VISUALS.SCHEDULING}
            title={l10n('HOME_FEATURES_SCHEDULING_TITLE')}
            description={l10n('HOME_FEATURES_SCHEDULING_DESCRIPTION')}
          />
          <FeatureCard
            visual={FEATURE_VISUALS.MATERIALS}
            title={l10n('HOME_FEATURES_MATERIALS_TITLE')}
            description={l10n('HOME_FEATURES_MATERIALS_DESCRIPTION')}
          />
          <FeatureCard
            visual={FEATURE_VISUALS.NOTICES}
            title={l10n('HOME_FEATURES_NOTICES_TITLE')}
            description={l10n('HOME_FEATURES_NOTICES_DESCRIPTION')}
          />
          <FeatureCard
            visual={FEATURE_VISUALS.DASHBOARDS}
            title={l10n('HOME_FEATURES_DASHBOARDS_TITLE')}
            description={l10n('HOME_FEATURES_DASHBOARDS_DESCRIPTION')}
          />
        </div>
      </Container>
    </section>
  );
}
