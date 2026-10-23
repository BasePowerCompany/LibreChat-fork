import fs from 'fs';
import path from 'path';
import { injectAppMetadata } from './metadata';

const SHELL = fs.readFileSync(path.resolve(__dirname, '../../../../client/index.html'), 'utf8');

describe('injectAppMetadata', () => {
  it('injects deployment metadata into the real shell', () => {
    const html = injectAppMetadata(SHELL, {
      appTitle: 'Base Chat',
      appDescription: 'Base Chat - powered by Base Infra',
    });

    expect(html).toMatch(/<title>Base Chat<\/title>/);
    expect(html).toMatch(/<meta\s+property="og:title"\s+content="Base Chat"\s*\/>/);
    expect(html).toMatch(/<meta\s+property="og:site_name"\s+content="Base Chat"\s*\/>/);
    expect(html).toMatch(
      /<meta\s+name="description"\s+content="Base Chat - powered by Base Infra"\s*\/>/,
    );
    expect(html).toMatch(
      /<meta\s+property="og:description"\s+content="Base Chat - powered by Base Infra"\s*\/>/,
    );
    expect(html).not.toContain('LibreChat');
  });

  it('keeps the upstream descriptions when only a title is set', () => {
    const html = injectAppMetadata(SHELL, { appTitle: 'Base Chat' });

    expect(html).toMatch(
      /<meta\s+name="description"\s+content="LibreChat - An open source chat application with support for multiple AI models"\s*\/>/,
    );
    expect(html).toMatch(
      /<meta\s+property="og:description"\s+content="LibreChat - An open source chat application with support for multiple AI models"\s*\/>/,
    );
  });

  it('returns the same shell for unset, empty, whitespace-only, null, or omitted metadata', () => {
    expect(injectAppMetadata(SHELL, {})).toBe(SHELL);
    expect(injectAppMetadata(SHELL, { appTitle: '', appDescription: '' })).toBe(SHELL);
    expect(injectAppMetadata(SHELL, { appTitle: '  ', appDescription: '\n\t' })).toBe(SHELL);
    expect(injectAppMetadata(SHELL, null)).toBe(SHELL);
    expect(injectAppMetadata(SHELL)).toBe(SHELL);
  });

  it('trims values before injecting them', () => {
    const html = injectAppMetadata(SHELL, {
      appTitle: '  Base Chat  ',
      appDescription: '  Base Chat - powered by Base Infra  ',
    });

    expect(html).toMatch(/<title>Base Chat<\/title>/);
    expect(html).toMatch(
      /<meta\s+name="description"\s+content="Base Chat - powered by Base Infra"\s*\/>/,
    );
  });

  it('escapes titles for both text and attribute contexts', () => {
    const html = injectAppMetadata(SHELL, { appTitle: 'A & B "<x>"' });

    expect(html).toMatch(/<title>A &amp; B &quot;&lt;x&gt;&quot;<\/title>/);
    expect(html).toMatch(
      /<meta\s+property="og:title"\s+content="A &amp; B &quot;&lt;x&gt;&quot;"\s*\/>/,
    );
  });

  it('inserts replacement tokens literally', () => {
    const html = injectAppMetadata(SHELL, { appTitle: '$&' });

    expect(html).toMatch(/<title>\$&amp;<\/title>/);
    expect(html).toMatch(/<meta\s+property="og:title"\s+content="\$&amp;"\s*\/>/);
  });
});
