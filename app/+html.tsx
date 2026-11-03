import { ScrollViewStyleReset } from 'expo-router/html';
import type { PropsWithChildren } from 'react';
import { darkTheme, lightTheme } from '@/theme/tokens';

// Runs only at build time. The inline style only colours the page behind the app before it loads.
const DOCUMENT_BACKGROUND = `
body { background-color: ${lightTheme.colors.background}; }
@media (prefers-color-scheme: dark) { body { background-color: ${darkTheme.colors.background}; } }
`;

export default function RootHtml({ children }: PropsWithChildren) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no, viewport-fit=cover" />
        <meta name="description" content="See how your business is doing online: website, Google reviews, search and speed, all in one place." />
        <meta name="application-name" content="Vitrine" />
        <meta name="theme-color" media="(prefers-color-scheme: light)" content={lightTheme.colors.background} />
        <meta name="theme-color" media="(prefers-color-scheme: dark)" content={darkTheme.colors.background} />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Vitrine" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
        <ScrollViewStyleReset />
        <style dangerouslySetInnerHTML={{ __html: DOCUMENT_BACKGROUND }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
