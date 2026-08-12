import { LucideIcon } from 'lucide-react';

/**
 * The non-textual half of a feature card. The text lives in the dictionary.
 */
export type FeatureVisual = {
  icon: LucideIcon;
  accentClassName: string;
  surfaceClassName: string;
};
