import { describe, expect, it } from 'vitest';

import { DEFAULT_APP_LOCALE } from '@/constants/i18n.const';

import { buildLocaleUrl, splitLocaleFromPathname } from '@/lib/utils';

describe('splitLocaleFromPathname', () => {
  it('treats an unprefixed path as the default locale', () => {
    expect(splitLocaleFromPathname('/admin')).toEqual({ locale: DEFAULT_APP_LOCALE, routePath: '/admin' });
  });

  it('peels a non-default locale prefix off the route', () => {
    expect(splitLocaleFromPathname('/bn/admin')).toEqual({ locale: 'bn', routePath: '/admin' });
  });

  it('maps a bare locale prefix to the root route', () => {
    expect(splitLocaleFromPathname('/bn')).toEqual({ locale: 'bn', routePath: '/' });
  });

  it('treats the root as the default locale', () => {
    expect(splitLocaleFromPathname('/')).toEqual({ locale: DEFAULT_APP_LOCALE, routePath: '/' });
  });
});

describe('buildLocaleUrl', () => {
  it('omits the prefix for the default locale', () => {
    expect(buildLocaleUrl('https://x.test', DEFAULT_APP_LOCALE, '/admin')).toBe('https://x.test/admin');
  });

  it('adds the prefix for a non-default locale', () => {
    expect(buildLocaleUrl('https://x.test', 'bn', '/admin')).toBe('https://x.test/bn/admin');
  });
});
