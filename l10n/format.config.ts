import { Formats } from 'next-intl';

/*
  `numberingSystem: 'latn'` is the important part. `bn-BD` defaults to Bengali
  numerals, which read awkwardly beside identifiers like `CSE-401` and room numbers.
  Pinning Latin digits is a no-op for English and a deliberate choice for Bangla.
*/
export const i18nFormats = {
  dateTime: {
    short: {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      numberingSystem: 'latn',
    },
    long: {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      numberingSystem: 'latn',
    },
    full: {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
      numberingSystem: 'latn',
    },
    monthYear: {
      month: 'long',
      year: 'numeric',
      numberingSystem: 'latn',
    },
    shortDateTime: {
      dateStyle: 'short',
      timeStyle: 'short',
      hour12: false,
      numberingSystem: 'latn',
    },
    time: {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
      numberingSystem: 'latn',
    },
    weekday: {
      weekday: 'long',
    },
  },
  number: {
    integer: {
      maximumFractionDigits: 0,
      numberingSystem: 'latn',
    },
    precise: {
      maximumFractionDigits: 5,
      numberingSystem: 'latn',
    },
  },
  list: {
    enumeration: {
      style: 'long',
      type: 'conjunction',
    },
  },
} as const satisfies Formats;
