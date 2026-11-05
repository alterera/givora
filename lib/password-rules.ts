/** Password rules shared by the browser (live checklist) and the server (final say). */
export const PASSWORD_RULES = [
  { id: 'len', label: '8+ characters', required: true, test: (p: string) => p.length >= 8 },
  { id: 'case', label: 'Upper & lower case', required: true, test: (p: string) => /[a-z]/.test(p) && /[A-Z]/.test(p) },
  { id: 'num', label: 'A number', required: true, test: (p: string) => /\d/.test(p) },
  { id: 'sym', label: 'A symbol', required: false, test: (p: string) => /[^A-Za-z0-9]/.test(p) },
] as const

export function checkPassword(p: string) {
  const results = PASSWORD_RULES.map((r) => ({ id: r.id, label: r.label, required: r.required, pass: r.test(p) }))
  const ok = results.every((r) => !r.required || r.pass)
  // 0–4: how many rules pass, plus a point for length 12+ (capped).
  const score = Math.min(4, results.filter((r) => r.pass).length - 1 + (p.length >= 12 ? 1 : 0))
  return { ok, results, score: p ? Math.max(0, score) : 0 }
}

export const PASSWORD_ERROR = 'Use at least 8 characters with upper and lower case letters and a number.'
