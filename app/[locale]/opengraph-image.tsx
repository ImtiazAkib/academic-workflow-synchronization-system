import { ImageResponse } from 'next/og';

import { APP_DATA } from '@/constants';

export const alt = APP_DATA.NAME;
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

/*
  Latin-only by design. `next/og` renders with no Bengali glyphs unless a font file is
  passed through `ImageResponse`, and the only text here — the product name and its
  tagline — is Latin in both locales anyway. A Bangla card would need a bundled Noto
  Sans Bengali subset; logged in the plan's backlog.

  Styles are inline because satori has no stylesheet: the design tokens are repeated
  here as literals rather than read from `globals.css`.
*/
export default async function OpengraphImage() {
  return new ImageResponse(
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '90px',
        background: 'linear-gradient(135deg, #4f46e5 0%, #0ea5e9 100%)',
        color: '#ffffff',
        fontFamily: 'sans-serif',
      }}>
      <div style={{ display: 'flex', fontSize: 104, fontWeight: 700, letterSpacing: '-0.03em' }}>{APP_DATA.SHORT_NAME}</div>

      <div style={{ display: 'flex', marginTop: 28, fontSize: 40, opacity: 0.95 }}>{APP_DATA.NAME}</div>

      <div style={{ display: 'flex', marginTop: 44, fontSize: 30, opacity: 0.85 }}>{APP_DATA.TAGLINE}</div>
    </div>,
    { ...size }
  );
}
