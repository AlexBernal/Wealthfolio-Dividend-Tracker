import { useQuery } from '@tanstack/react-query';
import type { AddonContext } from '@wealthfolio/addon-sdk';
import { useAccounts } from './use-accounts';
import { useActivities } from './use-activities';
import { extractDividendData, calculateDividendSummary } from '../lib/dividend-calculator';
import type { DividendSummary } from '../types';

interface UseDividendSummaryOptions {
  ctx: AddonContext;
  enabled?: boolean;
}

export function useDividendSummary({ ctx, enabled = true }: UseDividendSummaryOptions) {
  const {
    data: accounts = [],
    isLoading: accountsLoading,
    error: accountsError,
  } = useAccounts({ ctx, enabled });

  const {
    data: activities = [],
    isLoading: activitiesLoading,
    error: activitiesError,
  } = useActivities({ ctx, enabled });

  return useQuery({
    queryKey: ['dividend-summary', accounts.length, activities.length],
    queryFn: (): DividendSummary => {
      console.log('[Dividend Tracker] Total activities:', activities.length);
      console.log('[Dividend Tracker] Activity types:', [...new Set(activities.map(a => a.activityType))]);
      console.log('[Dividend Tracker] Dividend activities:', activities.filter(a => a.activityType === 'DIVIDEND').length);

      const dividendData = extractDividendData(activities, accounts);
      console.log('[Dividend Tracker] Extracted dividend data:', dividendData.length, 'items');

      const summary = calculateDividendSummary(dividendData);
      console.log('[Dividend Tracker] Summary:', summary);

      return summary;
    },
    enabled:
      enabled &&
      !accountsLoading &&
      !activitiesLoading &&
      !accountsError &&
      !activitiesError &&
      accounts.length > 0,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
