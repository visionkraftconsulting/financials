export function calculateCompoundedDividends(initialShares, weeklyDividendPerShare, weeks) {
  let totalShares = initialShares;
  let totalDividends = 0;

  for (let i = 0; i < weeks; i++) {
    const weeklyDividend = totalShares * weeklyDividendPerShare;
    const additionalShares = weeklyDividend / getSharePrice();
    totalShares += additionalShares;
    totalDividends += weeklyDividend;
  }

  return {
    totalShares: typeof totalShares === 'number'
      ? parseFloat(totalShares.toFixed(4))
      : 0,
    totalDividends: typeof totalDividends === 'number'
      ? parseFloat(totalDividends.toFixed(2))
      : 0,
    isAnticipated: weeks < 1
  };
}

function getSharePrice() {
  return 10; // Static for now. Integrate live price API if needed.
}
