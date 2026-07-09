const ESC = "\x1b";

export const color = {
  green: (s: string) => `${ESC}[32m${s}${ESC}[39m`,
  red: (s: string) => `${ESC}[31m${s}${ESC}[39m`,
  yellow: (s: string) => `${ESC}[33m${s}${ESC}[39m`,
  dim: (s: string) => `${ESC}[2m${s}${ESC}[22m`,
  bold: (s: string) => `${ESC}[1m${s}${ESC}[22m`,
  cyan: (s: string) => `${ESC}[36m${s}${ESC}[39m`,
  grey: (s: string) => `${ESC}[90m${s}${ESC}[39m`,
};

export const icon = {
  pass: color.green("\u2713"),
  fail: color.red("\u2717"),
  warn: color.yellow("!"),
  info: color.cyan("i"),
};

export function formatCheckResult(
  results: Array<{ key: string; status: "ok" | "missing" | "invalid"; message: string }>
): string {
  if (results.length === 0) return color.dim("  No variables defined in schema.\n");

  const keyWidth = Math.min(Math.max(...results.map((r) => r.key.length), 4), 50);

  const lines: string[] = [];
  lines.push(
    `  ${color.dim("KEY".padEnd(keyWidth))}  ${color.dim("STATUS")}  ${color.dim("VALUE")}`
  );
  lines.push(
    `  ${color.dim("\u2500".repeat(keyWidth))}  ${color.dim("\u2500".repeat(6))}  ${color.dim("\u2500".repeat(20))}`
  );

  for (const item of results) {
    const key = item.key.padEnd(keyWidth);

    let statusText: string;
    let valueText: string;

    switch (item.status) {
      case "ok":
        statusText = color.green("pass");
        valueText = color.dim(item.message);
        break;
      case "missing":
        statusText = color.red("MISSING");
        valueText = item.message;
        break;
      case "invalid":
        statusText = color.yellow("INVALID");
        valueText = item.message;
        break;
    }

    lines.push(`  ${key}  ${statusText}  ${valueText}`);
  }

  return lines.join("\n") + "\n";
}

export function formatSummary(passed: number, failed: number): string {
  if (failed === 0) {
    return color.green(`\u2713 All ${passed} variable(s) pass.\n`);
  }
  const parts: string[] = [];
  if (failed > 0) parts.push(color.red(`${failed} issue(s)`));
  if (passed > 0) parts.push(color.green(`${passed} pass`));
  return `  ${parts.join(", ")}\n`;
}

export function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  const dp: number[][] = [];
  for (let i = 0; i <= m; i++) {
    dp.push([]);
    for (let j = 0; j <= n; j++) {
      dp[i]!.push(0);
    }
  }
  for (let i = 0; i <= m; i++) dp[i]![0] = i;
  for (let j = 0; j <= n; j++) dp[0]![j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i]![j] = Math.min(dp[i - 1]![j]! + 1, dp[i]![j - 1]! + 1, dp[i - 1]![j - 1]! + cost);
    }
  }
  return dp[m]![n]!;
}

export function suggestKeys(missingKey: string, allKeys: string[], maxSuggestions = 3): string[] {
  const scored = allKeys
    .map((k) => ({ key: k, score: levenshtein(missingKey.toLowerCase(), k.toLowerCase()) }))
    .filter((s) => s.score <= 4 && s.score > 0)
    .sort((a, b) => a.score - b.score);

  return scored.slice(0, maxSuggestions).map((s) => s.key);
}
