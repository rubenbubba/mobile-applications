// Screenshots for reviewing layouts by eye. They end up in cypress/screenshots.
const THEME_MODES: ('light' | 'dark')[] = ['light', 'dark'];

const VIEWPORTS: { name: string; width: number; height: number }[] = [
  { name: 'phone', width: 360, height: 780 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 900 },
];

const ROUTES: { path: string; screen: string }[] = [
  { path: '/', screen: 'screen-home' },
  { path: '/issues', screen: 'screen-issues' },
  { path: '/website', screen: 'screen-website' },
  { path: '/seo', screen: 'screen-seo' },
  { path: '/performance', screen: 'screen-performance' },
  { path: '/reviews', screen: 'screen-reviews' },
  { path: '/settings', screen: 'screen-settings' },
];

describe('Responsive layouts', () => {
  for (const viewport of VIEWPORTS) {
    for (const themeMode of THEME_MODES) {
      it(`has no sideways scrolling on a ${viewport.name} in ${themeMode} mode`, () => {
        cy.viewport(viewport.width, viewport.height);

        for (const route of ROUTES) {
          cy.visitApp(route.path, { themeMode });
          cy.byTestId(route.screen).should('be.visible');
          cy.byTestId('loading-skeleton').should('not.exist');

          cy.document().then((doc) => {
            expect(doc.documentElement.scrollWidth, `${route.path} width`).to.be.at.most(viewport.width);
          });
          cy.byTestId(route.screen).should(($screen) => {
            const screen = $screen[0];
            expect(screen?.scrollWidth, `${route.path} content width`).to.be.at.most(screen?.clientWidth ?? 0);
          });

          cy.screenshot(`${viewport.name}-${themeMode}${route.path.replace('/', '-') || '-home'}`, {
            capture: 'viewport',
            overwrite: true,
          });
        }
      });
    }
  }
});
