import type { AppBranding } from 'librechat-data-provider';

export function brandWebManifest(manifestJson: string, branding: AppBranding): string {
  const manifest = JSON.parse(manifestJson) as Record<string, unknown>;
  manifest.name = branding.appTitle;
  manifest.short_name = branding.appTitle;
  manifest.description = branding.appDescription;
  return JSON.stringify(manifest);
}
