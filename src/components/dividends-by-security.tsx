import React, { useMemo, useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  EmptyPlaceholder,
  formatAmount,
  Icons,
} from '@wealthfolio/ui';
import type { SecurityDividendSummary } from '../types';
import type { Account } from '@wealthfolio/addon-sdk';

interface DividendsBySecurityProps {
  securityData: SecurityDividendSummary[];
  accounts: Account[];
  baseCurrency: string;
  isBalanceHidden: boolean;
  selectedYear: number;
}

const MONTH_NAMES = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
];

export function DividendsBySecurity({
  securityData,
  accounts,
  baseCurrency,
  isBalanceHidden,
  selectedYear,
}: DividendsBySecurityProps) {
  const [expandedAccounts, setExpandedAccounts] = useState<Set<string>>(new Set());

  const toggleAccount = (accountId: string) => {
    const newExpanded = new Set(expandedAccounts);
    if (newExpanded.has(accountId)) {
      newExpanded.delete(accountId);
    } else {
      newExpanded.add(accountId);
    }
    setExpandedAccounts(newExpanded);
  };

  const groupedData = useMemo(() => {
    // Group by account
    const byAccount = new Map<string, SecurityDividendSummary[]>();

    securityData.forEach((item) => {
      // Filter data for selected year only
      const yearMonthKeys = Object.keys(item.byMonth).filter((key) => {
        const year = parseInt(key.split('-')[0]);
        return year === selectedYear;
      });

      if (yearMonthKeys.length > 0) {
        const filteredItem = {
          ...item,
          byMonth: Object.fromEntries(
            yearMonthKeys.map((key) => [key, item.byMonth[key]])
          ),
          total: yearMonthKeys.reduce((sum, key) => sum + item.byMonth[key], 0),
        };

        if (!byAccount.has(item.accountId)) {
          byAccount.set(item.accountId, []);
        }
        byAccount.get(item.accountId)!.push(filteredItem);
      }
    });

    return byAccount;
  }, [securityData, selectedYear]);

  // Get all months for the selected year that have data
  const monthColumns = useMemo(() => {
    const allMonths = new Set<string>();
    securityData.forEach((item) => {
      Object.keys(item.byMonth).forEach((monthKey) => {
        const [year] = monthKey.split('-');
        if (parseInt(year) === selectedYear) {
          allMonths.add(monthKey);
        }
      });
    });
    return Array.from(allMonths).sort();
  }, [securityData, selectedYear]);

  if (groupedData.size === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Dividends by Security</CardTitle>
          <CardDescription>No dividend data for {selectedYear}</CardDescription>
        </CardHeader>
        <CardContent>
          <EmptyPlaceholder
            className="mx-auto flex h-[300px] max-w-[420px] items-center justify-center"
            icon={<Icons.TrendingUp className="size-10" />}
            title="No dividend data"
            description={`No dividends found for ${selectedYear}`}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Dividends by Security</CardTitle>
        <CardDescription>
          Monthly dividends per security for {selectedYear}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2 font-medium sticky left-0 bg-background">
                  Security
                </th>
                {monthColumns.map((monthKey) => {
                  const [, month] = monthKey.split('-');
                  return (
                    <th key={monthKey} className="text-right p-2 font-medium">
                      {MONTH_NAMES[parseInt(month) - 1]}
                    </th>
                  );
                })}
                <th className="text-right p-2 font-medium">Total</th>
              </tr>
            </thead>
            <tbody>
              {Array.from(groupedData.entries()).map(([accountId, securities]) => {
                const account = accounts.find((a) => a.id === accountId);
                const isExpanded = expandedAccounts.has(accountId);
                const accountTotal = securities.reduce((sum, sec) => sum + sec.total, 0);

                return (
                  <React.Fragment key={accountId}>
                    {/* Account Row */}
                    <tr
                      className="border-b bg-muted/50 cursor-pointer hover:bg-muted"
                      onClick={() => toggleAccount(accountId)}
                    >
                      <td className="p-2 font-semibold sticky left-0 bg-muted/50">
                        <div className="flex items-center gap-2">
                          {isExpanded ? (
                            <Icons.ChevronDown className="h-4 w-4" />
                          ) : (
                            <Icons.ChevronRight className="h-4 w-4" />
                          )}
                          {account?.name || accountId}
                        </div>
                      </td>
                      {monthColumns.map((monthKey) => {
                        const monthTotal = securities.reduce(
                          (sum, sec) => sum + (sec.byMonth[monthKey] || 0),
                          0
                        );
                        return (
                          <td key={monthKey} className="text-right p-2 font-mono tabular-nums">
                            {monthTotal > 0
                              ? isBalanceHidden
                                ? '••••'
                                : formatAmount(monthTotal, baseCurrency)
                              : '-'}
                          </td>
                        );
                      })}
                      <td className="text-right p-2 font-mono font-semibold tabular-nums">
                        {isBalanceHidden ? '••••' : formatAmount(accountTotal, baseCurrency)}
                      </td>
                    </tr>

                    {/* Security Rows (collapsible) */}
                    {isExpanded &&
                      [...securities].sort((a, b) => a.symbol.localeCompare(b.symbol)).map((security) => (
                        <tr key={`${accountId}-${security.symbol}`} className="border-b">
                          <td className="p-2 pl-10 sticky left-0 bg-background">
                            {security.symbol}
                          </td>
                          {monthColumns.map((monthKey) => {
                            const amount = security.byMonth[monthKey] || 0;
                            return (
                              <td key={monthKey} className="text-right p-2 font-mono tabular-nums">
                                {amount > 0
                                  ? isBalanceHidden
                                    ? '••••'
                                    : formatAmount(amount, baseCurrency)
                                  : '-'}
                              </td>
                            );
                          })}
                          <td className="text-right p-2 font-mono tabular-nums">
                            {isBalanceHidden
                              ? '••••'
                              : formatAmount(security.total, baseCurrency)}
                          </td>
                        </tr>
                      ))}
                  </React.Fragment>
                );
              })}

              {/* Grand Total Row */}
              <tr className="font-semibold bg-muted">
                <td className="p-2 sticky left-0 bg-muted">Total</td>
                {monthColumns.map((monthKey) => {
                  const monthTotal = Array.from(groupedData.values())
                    .flat()
                    .reduce((sum, sec) => sum + (sec.byMonth[monthKey] || 0), 0);
                  return (
                    <td key={monthKey} className="text-right p-2 font-mono tabular-nums">
                      {monthTotal > 0
                        ? isBalanceHidden
                          ? '••••'
                          : formatAmount(monthTotal, baseCurrency)
                        : '-'}
                    </td>
                  );
                })}
                <td className="text-right p-2 font-mono tabular-nums">
                  {isBalanceHidden
                    ? '••••'
                    : formatAmount(
                        Array.from(groupedData.values())
                          .flat()
                          .reduce((sum, sec) => sum + sec.total, 0),
                        baseCurrency
                      )}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
