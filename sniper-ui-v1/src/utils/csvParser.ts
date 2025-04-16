import Papa from 'papaparse';

export async function loadTrades(): Promise<any[]> {
  const res = await fetch('/simulated_trades.csv');
  const text = await res.text();

  const parsed = Papa.parse(text, { header: true });
  return parsed.data as any[];
}
export function analyzeStats(trades: any[]) {
  const valid = trades.filter(t => !isNaN(parseFloat(t.Profit)));
  const winCount = valid.filter(t => parseFloat(t.Profit) > 0).length;
  const total = valid.length;
  const winRate = total === 0 ? 0 : (winCount / total) * 100;
  const avgROI =
    total === 0
      ? 0
      : valid.reduce((sum, t) => sum + parseFloat(t.Profit), 0) / total;

  return {
    winRate: winRate.toFixed(2),
    avgROI: avgROI.toFixed(2),
    totalTrades: total,
  };
}
