import { escapeHtmlAttribute } from '~/security/html';

export interface AppMetadata {
  appTitle?: string | null;
  appDescription?: string | null;
}

const replaceMetaContent = (
  html: string,
  attribute: 'name' | 'property',
  key: string,
  value: string,
): string => {
  const pattern = new RegExp(
    `(<meta\\b(?=[^>]*\\s${attribute}\\s*=\\s*"${key}")[^>]*?\\scontent\\s*=\\s*")[^"]*(")`,
    'i',
  );
  return html.replace(
    pattern,
    (_match, prefix: string, suffix: string) => `${prefix}${value}${suffix}`,
  );
};

/** Link unfurlers don't run JS, so the served shell must carry the deployment's title and description. */
export const injectAppMetadata = (html: string, metadata?: AppMetadata | null): string => {
  const appTitle = metadata?.appTitle?.trim();
  if (appTitle) {
    const escapedTitle = escapeHtmlAttribute(appTitle);
    html = html.replace(
      /(<title\b[^>]*>)[\s\S]*?(<\/title>)/i,
      (_match, prefix: string, suffix: string) => `${prefix}${escapedTitle}${suffix}`,
    );
    html = replaceMetaContent(html, 'property', 'og:title', escapedTitle);
    html = replaceMetaContent(html, 'property', 'og:site_name', escapedTitle);
  }

  const appDescription = metadata?.appDescription?.trim();
  if (appDescription) {
    const escapedDescription = escapeHtmlAttribute(appDescription);
    html = replaceMetaContent(html, 'name', 'description', escapedDescription);
    html = replaceMetaContent(html, 'property', 'og:description', escapedDescription);
  }

  return html;
};
