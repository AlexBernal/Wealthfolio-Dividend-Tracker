import type { AddonContext, AddonEnableFunction } from '@wealthfolio/addon-sdk';
import { Icons } from '@wealthfolio/ui';
import React from 'react';

function MinimalPage() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold">Dividend Tracker - Minimal Test</h1>
      <p>If you see this, the addon loaded successfully!</p>
    </div>
  );
}

const enable: AddonEnableFunction = (context) => {
  context.api.logger.info('Dividend Tracker addon enabled');

  const sidebarItem = context.sidebar.addItem({
    id: 'dividend-tracker',
    label: 'Dividend Tracker',
    icon: <Icons.TrendingUp className="h-5 w-5" />,
    route: '/addons/dividend-tracker',
    order: 150,
  });

  context.router.add({
    path: '/addons/dividend-tracker',
    component: React.lazy(() => Promise.resolve({ default: MinimalPage })),
  });

  context.onDisable(() => {
    sidebarItem.remove();
    context.api.logger.info('Dividend Tracker addon disabled');
  });
};

export default enable;
