import fs from 'fs';
import path from 'path';
import {
  DEFAULT_APP_DESCRIPTION,
  DEFAULT_APP_TITLE,
  fillAppBranding,
  resolveAppBranding,
} from './branding';

const SHELL = fs.readFileSync(path.resolve(__dirname, '../../../client/index.html'), 'utf8');

describe('resolveAppBranding', () => {
  it('uses defaults for unset, empty, or whitespace-only values', () => {
    expect(resolveAppBranding({})).toEqual({
      appTitle: DEFAULT_APP_TITLE,
      appDescription: DEFAULT_APP_DESCRIPTION,
    });
    expect(resolveAppBranding({ APP_TITLE: '', APP_DESCRIPTION: '' })).toEqual({
      appTitle: DEFAULT_APP_TITLE,
      appDescription: DEFAULT_APP_DESCRIPTION,
    });
    expect(resolveAppBranding({ APP_TITLE: '  ', APP_DESCRIPTION: '\n\t' })).toEqual({
      appTitle: DEFAULT_APP_TITLE,
      appDescription: DEFAULT_APP_DESCRIPTION,
    });
  });

  it('trims configured values', () => {
    expect(
      resolveAppBranding({ APP_TITLE: '  Base Chat  ', APP_DESCRIPTION: '  Base app  ' }),
    ).toEqual({
      appTitle: 'Base Chat',
      appDescription: 'Base app',
    });
  });
});

describe('fillAppBranding', () => {
  it('fills every branding placeholder in the real shell', () => {
    const html = fillAppBranding(SHELL, {
      appTitle: 'Base Chat',
      appDescription: 'Base Chat - powered by Base Infra',
    });

    expect(html).toContain('<title>Base Chat</title>');
    expect(html).toContain('<meta property="og:site_name" content="Base Chat" />');
    expect(html).toContain('<meta property="og:title" content="Base Chat" />');
    expect(html).toContain(
      '<meta name="description" content="Base Chat - powered by Base Infra" />',
    );
    expect(html).toContain(
      '<meta property="og:description" content="Base Chat - powered by Base Infra" />',
    );
    expect(html).not.toContain('__APP_');
    expect(html).not.toContain('LibreChat');
  });

  it('uses the shared defaults in the real shell when values are unset', () => {
    const html = fillAppBranding(SHELL, resolveAppBranding({}));

    expect(html).toContain(`<title>${DEFAULT_APP_TITLE}</title>`);
    expect(html).toContain(`<meta property="og:site_name" content="${DEFAULT_APP_TITLE}" />`);
    expect(html).toContain(`<meta property="og:title" content="${DEFAULT_APP_TITLE}" />`);
    expect(html).toContain(`<meta name="description" content="${DEFAULT_APP_DESCRIPTION}" />`);
    expect(html).toContain(
      `<meta property="og:description" content="${DEFAULT_APP_DESCRIPTION}" />`,
    );
    expect(html).not.toContain('__APP_');
  });

  it('escapes HTML-sensitive characters in titles and descriptions', () => {
    const html = fillAppBranding(SHELL, {
      appTitle: 'A & B "<x>"',
      appDescription: 'A & B "<x>"',
    });

    expect(html).toContain('<title>A &amp; B &quot;&lt;x&gt;&quot;</title>');
    expect(html).toContain(
      '<meta property="og:title" content="A &amp; B &quot;&lt;x&gt;&quot;" />',
    );
    expect(html).toContain('<meta name="description" content="A &amp; B &quot;&lt;x&gt;&quot;" />');
  });

  it('inserts replacement tokens literally', () => {
    const html = fillAppBranding(SHELL, {
      appTitle: '$&',
      appDescription: '$&',
    });

    expect(html).toContain('<title>$&amp;</title>');
    expect(html).toContain('<meta property="og:title" content="$&amp;" />');
    expect(html).toContain('<meta name="description" content="$&amp;" />');
  });
});
