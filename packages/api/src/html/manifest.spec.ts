import { brandWebManifest } from './manifest';

describe('brandWebManifest', () => {
  it('updates branding while preserving other manifest fields', () => {
    const manifest = {
      name: 'Build title',
      short_name: 'Build title',
      description: 'Build description',
      display: 'standalone',
      theme_color: '#009688',
      icons: [{ src: 'assets/icon-192x192.png', sizes: '192x192', type: 'image/png' }],
    };

    const result = JSON.parse(
      brandWebManifest(JSON.stringify(manifest), {
        appTitle: 'Base Chat',
        appDescription: 'Base Chat - powered by Base Infra',
      }),
    );

    expect(result).toEqual({
      ...manifest,
      name: 'Base Chat',
      short_name: 'Base Chat',
      description: 'Base Chat - powered by Base Infra',
    });
  });
});
