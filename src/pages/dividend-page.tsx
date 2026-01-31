import React, { useState, useMemo } from 'react';
import type { AddonContext } from '@wealthfolio/addon-sdk';
import {
  Page,
  PageContent,
  PageHeader,
  EmptyPlaceholder,
  Icons,
  Skeleton,
  Card,
  CardContent,
  CardHeader,
  useBalancePrivacy,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@wealthfolio/ui';
import { useDividendSummary, useAccounts } from '../hooks';
import { DividendsByYear, DividendsByMonth, DividendsBySecurity } from '../components';

interface DividendPageProps {
  ctx: AddonContext;
}

export default function DividendPage({ ctx }: DividendPageProps) {
  const { isBalanceHidden } = useBalancePrivacy();

  const {
    data: dividendSummary,
    isLoading: isDividendLoading,
    error: dividendError,
  } = useDividendSummary({ ctx });

  const {
    data: accounts = [],
    isLoading: isAccountsLoading,
    error: accountsError,
  } = useAccounts({ ctx });

  // Get the latest year from the data for the default selected year
  const latestYear = useMemo(() => {
    if (!dividendSummary || dividendSummary.byYear.length === 0) {
      return new Date().getFullYear();
    }
    return Math.max(...dividendSummary.byYear.map((y) => y.year));
  }, [dividendSummary]);

  const [selectedYear, setSelectedYear] = useState(latestYear);

  // Update selected year when data loads
  React.useEffect(() => {
    setSelectedYear(latestYear);
  }, [latestYear]);

  // Get available years from the data
  const availableYears = useMemo(() => {
    if (!dividendSummary) return [];
    const years = new Set(dividendSummary.byMonth.map((m) => m.year));
    return Array.from(years).sort((a, b) => b - a); // Descending order
  }, [dividendSummary]);

  // Get base currency from settings or use USD as default
  const baseCurrency = 'USD'; // You can fetch this from settings if needed

  if (isDividendLoading || isAccountsLoading) {
    return <DividendPageSkeleton />;
  }

  if (dividendError) {
    ctx.api.logger.error('Dividend data error: ' + dividendError.message);
  }
  if (accountsError) {
    ctx.api.logger.error('Accounts data error: ' + accountsError.message);
  }

  if (dividendError || accountsError || !dividendSummary || !accounts) {
    const errorMessage =
      dividendError?.message || accountsError?.message || 'Unable to load dividend information.';

    return (
      <Page>
        <PageHeader heading="Dividend Tracker" />
        <PageContent>
          <div className="flex h-[calc(100vh-200px)] items-center justify-center">
            <EmptyPlaceholder
              className="border-border/50 w-full max-w-[420px] border border-dashed"
              icon={<Icons.TrendingUp className="h-10 w-10" />}
              title="Failed to load dividend data"
              description={errorMessage}
            />
          </div>
        </PageContent>
      </Page>
    );
  }

  if (dividendSummary.byYear.length === 0) {
    return (
      <Page>
        <PageHeader heading="Dividend Tracker" />
        <PageContent>
          <div className="flex h-[calc(100vh-200px)] items-center justify-center">
            <EmptyPlaceholder
              className="border-border/50 w-full max-w-[420px] border border-dashed"
              icon={<Icons.TrendingUp className="h-10 w-10" />}
              title="No dividend data available"
              description="Start tracking dividend activities to see your dividend income breakdown across accounts, years, months, and securities."
            />
          </div>
        </PageContent>
      </Page>
    );
  }

  return (
    <Page>
      <div className="sticky top-0 z-10 border-b bg-background" style={{ paddingLeft: '1rem', paddingRight: '1rem' }}>
        <div className="flex items-center justify-between py-6">
          <div>
            <h1 className="text-3xl font-bold">Dividend Tracker</h1>
          </div>
          {availableYears.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Year:</span>
              <Select
                value={selectedYear.toString()}
                onValueChange={(val) => setSelectedYear(Number(val))}
              >
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select year" />
                </SelectTrigger>
                <SelectContent>
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>
      <PageContent>
        <div className="space-y-6">
          {/* Zone 1: Dividends by Year */}
          <section>
            <DividendsByYear
              yearlyData={dividendSummary.byYear}
              accounts={accounts}
              baseCurrency={baseCurrency}
              isBalanceHidden={isBalanceHidden}
            />
          </section>

          {/* Zone 2: Dividends by Month */}
          <section>
            <DividendsByMonth
              monthlyData={dividendSummary.byMonth}
              accounts={accounts}
              baseCurrency={baseCurrency}
              isBalanceHidden={isBalanceHidden}
              selectedYear={selectedYear}
            />
          </section>

          {/* Zone 3: Dividends by Security */}
          <section>
            <DividendsBySecurity
              securityData={dividendSummary.bySecurityAndAccount}
              accounts={accounts}
              baseCurrency={baseCurrency}
              isBalanceHidden={isBalanceHidden}
              selectedYear={selectedYear}
            />
          </section>
        </div>
      </PageContent>
    </Page>
  );
}

function DividendPageSkeleton() {
  return (
    <Page>
      <PageHeader heading="Dividend Tracker" />
      <PageContent>
        <div className="space-y-6">
          {/* Zone 1 Skeleton */}
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[200px]" />
                <Skeleton className="h-4 w-[300px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-[150px]" />
                <Skeleton className="h-4 w-[200px]" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-[300px] w-full" />
              </CardContent>
            </Card>
          </div>

          {/* Zone 2 Skeleton */}
          <div className="grid gap-4 md:grid-cols-[2fr_1fr]">
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-[200px]" />
                  <Skeleton className="h-4 w-[300px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <Skeleton className="h-6 w-[150px]" />
                  <Skeleton className="h-4 w-[200px]" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-[300px] w-full" />
                </CardContent>
              </Card>
            </div>

          {/* Zone 3 Skeleton */}
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-[200px]" />
              <Skeleton className="h-4 w-[300px]" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-[400px] w-full" />
            </CardContent>
          </Card>
        </div>
      </PageContent>
    </Page>
  );
}
