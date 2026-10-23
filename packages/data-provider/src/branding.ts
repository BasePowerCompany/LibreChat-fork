export const DEFAULT_APP_TITLE = 'LibreChat';
export const DEFAULT_APP_DESCRIPTION =
  'LibreChat - An open source chat application with support for multiple AI models';
export const APP_TITLE_PLACEHOLDER = '__APP_TITLE__';
export const APP_DESCRIPTION_PLACEHOLDER = '__APP_DESCRIPTION__';

export interface AppBranding {
  appTitle: string;
  appDescription: string;
}

export function resolveAppBranding(env: {
  APP_TITLE?: string;
  APP_DESCRIPTION?: string;
}): AppBranding {
  return {
    appTitle: env.APP_TITLE?.trim() || DEFAULT_APP_TITLE,
    appDescription: env.APP_DESCRIPTION?.trim() || DEFAULT_APP_DESCRIPTION,
  };
}

const escapeHtmlAttribute = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    switch (character) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return character;
    }
  });

export function fillAppBranding(html: string, branding: AppBranding): string {
  const appTitle = escapeHtmlAttribute(branding.appTitle);
  const appDescription = escapeHtmlAttribute(branding.appDescription);
  return html
    .split(APP_TITLE_PLACEHOLDER)
    .join(appTitle)
    .split(APP_DESCRIPTION_PLACEHOLDER)
    .join(appDescription);
}
