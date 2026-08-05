import { AppLocale } from './app-locale';
import { MessageLocale } from './message-locale';

export type LocaleModel = {
  /**
   * English name, used in code and documentation.
   */
  name: string;
  /**
   * The language's own name, used in the language selector.
   */
  nativeName: string;
  /**
   * URL locale.
   */
  locale: AppLocale;
  /**
   * Message dictionary locale.
   */
  code: MessageLocale;
  /**
   * Whether this is the default locale, served without a URL prefix.
   */
  default?: boolean;
};
