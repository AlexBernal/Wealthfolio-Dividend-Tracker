import { QueryClientProvider, type QueryClient } from '@tanstack/react-query';
import type { AddonContext, AddonEnableFunction } from '@wealthfolio/addon-sdk';
import { Icons } from '@wealthfolio/ui';
import React from 'react';
import { DividendPage } from './pages';

// Main addon component
function DividendTrackerAddon({ ctx }: { ctx: AddonContext }) {
  return (
    <div className="dividend-tracker-addon">
      <DividendPage ctx={ctx} />
    </div>
  );
}

// Addon enable function - called when the addon is loaded
const enable: AddonEnableFunction = (context) => {
  context.api.logger.info('💰 Dividend Tracker addon is being enabled!');

  // Store references to items for cleanup
  const addedItems: Array<{ remove: () => void }> = [];

  try {
    // Add sidebar navigation item
    const sidebarItem = context.sidebar.addItem({
      id: 'dividend-tracker',
      label: 'Dividend Tracker',
      icon: <Icons.DollarSign className="h-5 w-5" />,
      route: '/addons/dividend-tracker',
      order: 150,
    });
    addedItems.push(sidebarItem);

    context.api.logger.debug('Sidebar navigation item added successfully');

    // Create wrapper component with QueryClientProvider using shared client
    const DividendTrackerWrapper = () => {
      const sharedQueryClient = context.api.query.getClient() as QueryClient;
      return (
        <QueryClientProvider client={sharedQueryClient}>
          <DividendTrackerAddon ctx={context} />
        </QueryClientProvider>
      );
    };

    // Register route
    context.router.add({
      path: '/addons/dividend-tracker',
      component: React.lazy(() =>
        Promise.resolve({
          default: DividendTrackerWrapper,
        })
      ),
    });

    context.api.logger.debug('Route registered successfully');
    context.api.logger.info('Dividend Tracker addon enabled successfully');
  } catch (error) {
    context.api.logger.error('Failed to initialize addon: ' + (error as Error).message);
    // Re-throw the error so the addon system can handle it
    throw error;
  }

  // Register cleanup callback
  context.onDisable(() => {
    context.api.logger.info('🛑 Dividend Tracker addon is being disabled');

    // Remove all sidebar items
    addedItems.forEach((item) => {
      try {
        item.remove();
      } catch (error) {
        context.api.logger.error('Error removing sidebar item: ' + (error as Error).message);
      }
    });

    context.api.logger.info('Dividend Tracker addon disabled successfully');
  });
};

// Export the enable function as default
export default enable;
