export interface DividendData {
  accountId: string;
  accountName: string;
  symbol: string;
  date: string;
  amount: number;
  currency: string;
}

export interface YearlyDividendSummary {
  year: number;
  total: number;
  byAccount: Record<string, number>;
}

export interface MonthlyDividendSummary {
  year: number;
  month: number;
  monthKey: string; // Format: "YYYY-MM"
  total: number;
  byAccount: Record<string, number>;
}

export interface SecurityDividendSummary {
  symbol: string;
  accountId: string;
  accountName: string;
  byMonth: Record<string, number>; // monthKey -> amount
  total: number;
}

export interface DividendSummary {
  byYear: YearlyDividendSummary[];
  byMonth: MonthlyDividendSummary[];
  bySecurityAndAccount: SecurityDividendSummary[];
}
