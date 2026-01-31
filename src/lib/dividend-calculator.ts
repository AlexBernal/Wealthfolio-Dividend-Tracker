import type { ActivityDetails, Account } from '@wealthfolio/addon-sdk';
import { format, parseISO } from 'date-fns';
import type {
  DividendData,
  DividendSummary,
  YearlyDividendSummary,
  MonthlyDividendSummary,
  SecurityDividendSummary,
} from '../types';

export function extractDividendData(
  activities: ActivityDetails[],
  accounts: Account[]
): DividendData[] {
  const accountMap = new Map(accounts.map((acc) => [acc.id, acc.name]));

  const dividendActivities = activities.filter((activity) => activity.activityType === 'DIVIDEND');

  return dividendActivities
    .filter((activity) => activity.date != null && activity.accountId != null)
    .map((activity) => ({
      accountId: activity.accountId,
      accountName: accountMap.get(activity.accountId) || activity.accountId,
      symbol: activity.assetSymbol || activity.symbol || 'UNKNOWN',
      date: activity.date,
      amount: Number(activity.amount || 0),
      currency: activity.currency || 'USD',
    }));
}

export function calculateDividendSummary(
  dividendData: DividendData[]
): DividendSummary {
  // Calculate by year
  const yearMap = new Map<number, Record<string, number>>();

  dividendData.forEach((dividend) => {
    const year = parseISO(dividend.date).getFullYear();
    if (!yearMap.has(year)) {
      yearMap.set(year, {});
    }
    const yearData = yearMap.get(year)!;
    yearData[dividend.accountId] = (yearData[dividend.accountId] || 0) + dividend.amount;
  });

  const byYear: YearlyDividendSummary[] = Array.from(yearMap.entries())
    .map(([year, byAccount]) => ({
      year,
      total: Object.values(byAccount).reduce((sum, val) => sum + val, 0),
      byAccount,
    }))
    .sort((a, b) => a.year - b.year);

  // Calculate by month
  const monthMap = new Map<string, Record<string, number>>();

  dividendData.forEach((dividend) => {
    const date = parseISO(dividend.date);
    const monthKey = format(date, 'yyyy-MM');
    const year = date.getFullYear();
    const month = date.getMonth() + 1;

    if (!monthMap.has(monthKey)) {
      monthMap.set(monthKey, {});
    }
    const monthData = monthMap.get(monthKey)!;
    monthData[dividend.accountId] = (monthData[dividend.accountId] || 0) + dividend.amount;
  });

  const byMonth: MonthlyDividendSummary[] = Array.from(monthMap.entries())
    .filter(([monthKey]) => monthKey != null && monthKey.includes('-'))
    .map(([monthKey, byAccount]) => {
      const [yearStr, monthStr] = monthKey.split('-');
      return {
        year: parseInt(yearStr),
        month: parseInt(monthStr),
        monthKey,
        total: Object.values(byAccount).reduce((sum, val) => sum + val, 0),
        byAccount,
      };
    })
    .sort((a, b) => a.monthKey.localeCompare(b.monthKey));

  // Calculate by security and account
  const securityAccountMap = new Map<string, Record<string, number>>();

  dividendData.forEach((dividend) => {
    const key = `${dividend.accountId}|${dividend.symbol}`;
    const date = parseISO(dividend.date);
    const monthKey = format(date, 'yyyy-MM');

    if (!securityAccountMap.has(key)) {
      securityAccountMap.set(key, {});
    }
    const securityData = securityAccountMap.get(key)!;
    securityData[monthKey] = (securityData[monthKey] || 0) + dividend.amount;
  });

  const bySecurityAndAccount: SecurityDividendSummary[] = Array.from(
    securityAccountMap.entries()
  )
    .filter(([key]) => key != null && key.includes('|'))
    .map(([key, byMonth]) => {
      const [accountId, symbol] = key.split('|');
      const dividend = dividendData.find(
        (d) => d.accountId === accountId && d.symbol === symbol
      );
      return {
        symbol,
        accountId,
        accountName: dividend?.accountName || accountId,
        byMonth,
        total: Object.values(byMonth).reduce((sum, val) => sum + val, 0),
      };
    });

  return {
    byYear,
    byMonth,
    bySecurityAndAccount,
  };
}
