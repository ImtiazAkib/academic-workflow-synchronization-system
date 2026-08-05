import fs from 'node:fs';
import path from 'node:path';

import { parse } from 'csv-parse/sync';

const [, , inputFile, outputDir] = process.argv;

if (!inputFile || !outputDir) {
  console.error('Usage: npm run i18n:generate ./l10n/l10n.csv ./l10n');
  process.exit(1);
}

const csvContent = fs.readFileSync(inputFile, 'utf-8');

const records = parse(csvContent, {
  columns: true,
  skip_empty_lines: true,
  trim: true,
  bom: true,
});

if (records.length === 0) {
  console.error(`No rows found in "${inputFile}"`);
  process.exit(1);
}

const locales = Object.keys(records[0]).filter(column => column !== 'key');
const defaultLocale = locales[0];

fs.mkdirSync(outputDir, { recursive: true });

const result = Object.fromEntries(locales.map(locale => [locale, {}]));
const untranslated = Object.fromEntries(locales.map(locale => [locale, []]));

for (const row of records) {
  const key = row.key;

  if (!key) {
    throw new Error('Every row must have a key');
  }

  if (key.includes('.')) {
    throw new Error(`Invalid key "${key}" - "." not allowed`);
  }

  const fallback = row[defaultLocale]?.trim() ?? '';

  if (!fallback) {
    throw new Error(`Missing translation for key "${key}" in the default locale "${defaultLocale}"`);
  }

  for (const locale of locales) {
    const value = row[locale]?.trim() ?? '';

    /*
      A blank cell falls back to the default locale rather than failing the build.
      A missing key at runtime is a visible defect; an untranslated string is not.
      The keys that fell back are reported below so they are never silently lost.
    */
    if (!value) {
      untranslated[locale].push(key);
      result[locale][key] = fallback;
      continue;
    }

    result[locale][key] = value;
  }
}

for (const locale of locales) {
  const filePath = path.join(outputDir, `${locale}.json`);
  fs.writeFileSync(filePath, `${JSON.stringify(result[locale], null, 2)}\n`);
  console.log(`Generated "${locale}" with ${Object.keys(result[locale]).length} keys in "${filePath}"`);
}

for (const locale of locales) {
  const missing = untranslated[locale];

  if (missing.length > 0) {
    console.warn(`\n"${locale}" is missing ${missing.length} translation(s), falling back to "${defaultLocale}":`);
    missing.forEach(key => console.warn(`  - ${key}`));
  }
}

console.log(`\nIn total ${locales.length} locale files are generated in "${outputDir}"`);
