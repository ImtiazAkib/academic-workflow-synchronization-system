import type { Graph } from 'schema-dts';

/**
 * Serialize a JSON-LD graph for safe injection into a `<script>` tag.
 *
 * The payload sits in a `type="application/ld+json"` script, so it is parsed as JSON rather
 * than executed - which makes the one breakout risk a string value containing `</script>`,
 * closing the tag so whatever follows renders as markup. `JSON.stringify` does not escape
 * `<`, so it is escaped here. The data is static today, but this is a reusable primitive:
 * escaping keeps it safe should a future caller ever pass user-supplied text.
 *
 * @param data - The schema.org graph.
 *
 * @returns A JSON string safe to place inside a script element.
 */
export function serializeJsonLd(data: Graph): string {
  return JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e');
}
