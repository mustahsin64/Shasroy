const bnNumber = new Intl.NumberFormat("bn-BD", { maximumFractionDigits: 2 });

export function formatNumberBn(value: number) {
  return bnNumber.format(value);
}

/** 45000 paisa -> "৳৪৫০" */
export function formatTaka(paisa: number) {
  return `৳${bnNumber.format(paisa / 100)}`;
}

export const LOW_STOCK_THRESHOLD = 5;

export function stockLabel(quantity: number) {
  if (quantity <= 0) return { tone: "out", text: "স্টক শেষ" } as const;
  if (quantity <= LOW_STOCK_THRESHOLD) return { tone: "low", text: `মাত্র ${formatNumberBn(quantity)}টি বাকি` } as const;
  return { tone: "in", text: "স্টকে আছে" } as const;
}

const bnDateTime = new Intl.DateTimeFormat("bn-BD", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Dhaka" });

export function formatDateTimeBn(date: Date) {
  return bnDateTime.format(date);
}
