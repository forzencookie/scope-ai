import { normalizeBalances } from '../use-normalized-balances'

describe('normalizeBalances', () => {
  it('returns zeroes for empty array', () => {
    const result = normalizeBalances([])
    expect(result).toEqual({
      assets: 0,
      liabilities: 0,
      equity: 0,
      revenue: 0,
      expenses: 0,
      netIncome: 0,
    })
  })

  it('handles assets (class 1) — debit-normal, positive stays positive', () => {
    const result = normalizeBalances([
      { accountNumber: '1920', balance: 50000 }, // Bank — debit balance = positive
    ])
    expect(result.assets).toBe(50000)
  })

  it('handles liabilities (class 21-29) — credit-normal, flipped to positive', () => {
    // Raw balance: credit-heavy = negative (debit - credit)
    const result = normalizeBalances([
      { accountNumber: '2440', balance: -30000 }, // Leverantörsskulder
    ])
    // Flipped: -30000 * -1 = 30000 (positive = company owes 30k)
    expect(result.liabilities).toBe(30000)
  })

  it('handles equity (class 20) — credit-normal, flipped to positive', () => {
    const result = normalizeBalances([
      { accountNumber: '2081', balance: -100000 }, // Aktiekapital (credit balance)
    ])
    expect(result.equity).toBe(100000)
  })

  it('handles revenue (class 3) — credit-normal, flipped to positive', () => {
    const result = normalizeBalances([
      { accountNumber: '3010', balance: -200000 }, // Försäljning (credit balance)
    ])
    expect(result.revenue).toBe(200000)
  })

  it('handles expenses (class 4-8) — debit-normal, positive stays positive', () => {
    const result = normalizeBalances([
      { accountNumber: '4010', balance: 80000 },  // Varuinköp
      { accountNumber: '5010', balance: 10000 },  // Lokalhyra
      { accountNumber: '7010', balance: 30000 },  // Löner
    ])
    expect(result.expenses).toBe(120000)
  })

  it('calculates netIncome = revenue - expenses', () => {
    const result = normalizeBalances([
      { accountNumber: '3010', balance: -200000 }, // Revenue (credit)
      { accountNumber: '4010', balance: 80000 },   // Cost of goods
      { accountNumber: '7010', balance: 30000 },   // Salaries
    ])
    expect(result.revenue).toBe(200000)
    expect(result.expenses).toBe(110000)
    expect(result.netIncome).toBe(90000) // Profit
  })

  it('netIncome is negative when expenses exceed revenue (loss)', () => {
    const result = normalizeBalances([
      { accountNumber: '3010', balance: -50000 },
      { accountNumber: '4010', balance: 80000 },
    ])
    expect(result.netIncome).toBe(-30000) // Loss
  })

  it('keeps equity separate from liabilities (20xx vs 21xx+)', () => {
    const result = normalizeBalances([
      { accountNumber: '2081', balance: -100000 },  // Equity
      { accountNumber: '2440', balance: -50000 },   // Liability
    ])
    expect(result.equity).toBe(100000)
    expect(result.liabilities).toBe(50000)
  })

  it('handles zero balances without errors', () => {
    const result = normalizeBalances([
      { accountNumber: '1920', balance: 0 },
      { accountNumber: '3010', balance: 0 },
    ])
    expect(result.assets).toBe(0)
    expect(result.revenue).toBe(0)
    expect(result.netIncome).toBe(0)
  })

  it('accepts alternative "account" field name', () => {
    const result = normalizeBalances([
      { account: '1920', balance: 50000 },
    ])
    expect(result.assets).toBe(50000)
  })

  it('handles a complete realistic scenario', () => {
    const result = normalizeBalances([
      // Assets
      { accountNumber: '1920', balance: 500000 },  // Bank
      { accountNumber: '1510', balance: 100000 },  // Kundfordringar
      // Equity & Liabilities
      { accountNumber: '2081', balance: -50000 },   // Aktiekapital
      { accountNumber: '2091', balance: -150000 },  // Balanserad vinst — still 20xx = equity
      { accountNumber: '2440', balance: -200000 },  // Leverantörsskulder
      // Revenue
      { accountNumber: '3010', balance: -800000 },  // Försäljning
      // Expenses
      { accountNumber: '4010', balance: 300000 },   // Varuinköp
      { accountNumber: '5010', balance: 50000 },    // Lokalhyra
      { accountNumber: '7010', balance: 200000 },   // Löner
      { accountNumber: '8310', balance: 10000 },    // Ränteintäkter (debit = unusual but test)
    ])

    expect(result.assets).toBe(600000)
    expect(result.equity).toBe(200000) // 50k + 150k (both 20xx)
    expect(result.liabilities).toBe(200000)
    expect(result.revenue).toBe(800000)
    expect(result.expenses).toBe(560000) // 300k + 50k + 200k + 10k
    expect(result.netIncome).toBe(240000) // 800k - 560k
  })

  it('skips entries without valid account numbers', () => {
    const result = normalizeBalances([
      { accountNumber: '', balance: 1000 },
      { accountNumber: 'abc', balance: 2000 },
      { accountNumber: '1920', balance: 50000 },
    ])
    expect(result.assets).toBe(50000)
  })
})
