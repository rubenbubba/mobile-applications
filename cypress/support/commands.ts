declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    interface Chainable {
      byTestId(id: string): Chainable<JQuery<HTMLElement>>;
      visitApp(path?: string, options?: VisitAppOptions): Chainable<void>;
    }
  }
}

export interface VisitAppOptions {
  businessId?: string;
  themeMode?: 'system' | 'light' | 'dark';
  loggedIn?: boolean;
  keepServiceWorker?: boolean;
}

function persisted(state: object): string {
  return JSON.stringify({ state, version: 0 });
}

Cypress.Commands.add('byTestId', (id: string) => cy.get(`[data-testid="${id}"]`));

// Starts the app with a saved session. Most specs hide the service worker so every run starts clean.
Cypress.Commands.add('visitApp', (path = '/', options: VisitAppOptions = {}) => {
  const { businessId, themeMode, loggedIn = true, keepServiceWorker = false } = options;

  cy.visit(path, {
    onBeforeLoad(win) {
      if (!keepServiceWorker) {
        delete Object.getPrototypeOf(win.navigator).serviceWorker;
      }
      if (loggedIn) {
        win.localStorage.setItem(
          'vitrine-session',
          persisted({ user: { id: 'demo-user', email: 'test@example.com', name: 'Test' }, isAuthenticated: true }),
        );
      }
      if (businessId !== undefined) {
        win.localStorage.setItem('vitrine-monitoring', persisted({ businessId }));
      }
      if (themeMode !== undefined) {
        win.localStorage.setItem('vitrine-settings', persisted({ themeMode }));
      }
    },
  });
});

export {};
