import { useQuery } from '@tanstack/react-query';
import type { AddonContext, Account } from '@wealthfolio/addon-sdk';

interface UseAccountsOptions {
  ctx: AddonContext;
  enabled?: boolean;
}

export function useAccounts({ ctx, enabled = true }: UseAccountsOptions) {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async (): Promise<Account[]> => {
      if (!ctx?.api) {
        throw new Error('Addon context not available');
      }
      return await ctx.api.accounts.getAll();
    },
    enabled,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
  });
}
