function formatNumber(num: number, significanDigits: number): string {
  return num.toPrecision(significanDigits);
}
