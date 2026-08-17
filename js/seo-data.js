/* Per-tool SEO + content data. Loadable in browser (window.SEO) and Node (module.exports). */
(function (root) {
  'use strict';

  // 15 universal features that every calculator on the site provides.
  var FEATURES = [
    'Instant, live results as you type',
    'Step-by-step solution with the exact formula used',
    'Interactive charts & graphs (pie, line, bar, gauge)',
    'Download a clean PDF report',
    'Export results to Excel / CSV',
    'One-tap copy result to clipboard',
    'Shareable result link (pre-filled inputs)',
    'Embed on any website with an iframe snippet',
    'Save & reload your calculations',
    'Automatic calculation history',
    'Multi-currency support (\u20B9, $, \u20AC, \u00A3, \u00A5 \u2026)',
    'Dark & light mode',
    'Fully mobile-responsive layout',
    'Works 100% offline \u2014 no data ever leaves your device',
    'Related calculators & one-click switching'
  ];

  var CATS = {
    'Financial': { slug: 'financial', desc: 'Loans, investments, tax, salary and money tools.' },
    'Math': { slug: 'math', desc: 'Everyday and advanced math calculators.' },
    'Health': { slug: 'health', desc: 'Fitness, body and nutrition calculators.' },
    'Date & Time': { slug: 'datetime', desc: 'Age, date and time calculators.' }
  };

  function faq(q, a) { return { q: q, a: a }; }

  var TOOLS = {
    emi: {
      slug: 'emi-calculator', cat: 'Financial', icon: '\uD83C\uDFE6', name: 'EMI Calculator',
      title: 'EMI Calculator \u2013 Loan EMI, Interest & Amortization (Free)',
      desc: 'Free EMI calculator with prepayment, extra EMI, processing fee, amortization schedule, pie chart and loan comparison. Calculate monthly EMI instantly.',
      keywords: 'emi calculator, loan emi calculator, home loan emi, car loan emi, amortization schedule, prepayment calculator',
      intro: 'Calculate your loan EMI (Equated Monthly Installment) in seconds. See total interest, total payment, a full amortization schedule, and how much you save with prepayments and extra EMIs.',
      options: ['Loan amount (principal)', 'Annual interest rate (%)', 'Loan tenure in years or months', 'Loan start date', 'Processing fee (flat or %)', 'Down payment', 'Prepayment amount', 'Prepayment frequency (one-time / yearly / monthly)', 'Extra EMI per year', 'Insurance cost', 'Moratorium / EMI holiday period', 'Balloon (final) payment', 'Interest type (reducing / flat)', 'GST on interest component', 'Display currency'],
      faqs: [faq('How is EMI calculated?', 'EMI = P \u00D7 r \u00D7 (1+r)^n / ((1+r)^n \u2212 1), where P is principal, r is the monthly interest rate, and n is the number of months.'), faq('Does prepayment reduce my EMI or tenure?', 'You can choose either. Keeping the EMI the same and reducing tenure usually saves the most interest \u2014 this calculator shows both effects.'), faq('Is the amortization schedule accurate?', 'Yes. It uses the reducing-balance method month by month, the same way banks compute it.')],
      related: ['loan', 'interest', 'sip', 'tax']
    },
    loan: {
      slug: 'loan-calculator', cat: 'Financial', icon: '\uD83D\uDCB0', name: 'Loan Calculator',
      title: 'Loan Calculator \u2013 EMI, Eligibility & Affordability',
      desc: 'All-in-one loan calculator for home, car, personal and education loans. Check EMI, eligibility, affordability and debt-to-income ratio with a repayment schedule.',
      keywords: 'loan calculator, home loan, car loan, personal loan, education loan, loan eligibility, affordability calculator, dti',
      intro: 'Estimate EMIs and check how much loan you qualify for across home, car, personal and education loans, including eligibility and debt-to-income analysis.',
      options: ['Loan type (home / car / personal / education)', 'Loan amount', 'Annual interest rate (%)', 'Tenure', 'Repayment frequency (monthly / quarterly)', 'Monthly net income', 'Existing EMIs / obligations', 'Co-applicant income', 'Processing fee', 'Down payment', 'Foreclosure / part-payment charges', 'Maximum FOIR / DTI %', 'Eligibility check', 'Affordability target EMI', 'Display currency'],
      faqs: [faq('How much loan can I get on my salary?', 'Lenders usually cap total EMIs at 40\u201350% of net monthly income (FOIR). Enter your income and existing EMIs to see your eligible amount.'), faq('What is debt-to-income ratio?', 'DTI is your total monthly debt payments divided by gross monthly income. A lower DTI improves approval odds.'), faq('Which loan type should I pick?', 'Choose the type that matches your need \u2014 rates and tenures differ. The calculator preloads typical ranges for each.')],
      related: ['emi', 'interest', 'salary', 'tax']
    },
    sip: {
      slug: 'sip-calculator', cat: 'Financial', icon: '\uD83D\uDCC8', name: 'SIP Calculator',
      title: 'SIP Calculator \u2013 Mutual Fund SIP Returns & Goal Planner',
      desc: 'Calculate SIP returns with step-up, inflation adjustment, tax and goal tracking. See future value, wealth gain, growth chart and year-wise table.',
      keywords: 'sip calculator, mutual fund calculator, step up sip, sip returns, investment calculator, goal planner',
      intro: 'Project the future value of your monthly SIP investments, factor in annual step-ups, inflation and tax, and track progress towards a financial goal.',
      options: ['Monthly investment', 'Expected annual return (%)', 'Investment duration (years)', 'Annual step-up (%)', 'One-time lump sum addition', 'Inflation rate (%)', 'Capital gains tax (%)', 'Target goal amount', 'SIP frequency (monthly / quarterly)', 'Existing corpus', 'Expense ratio (%)', 'Investment start date', 'Inflation-adjusted view', 'Compare two SIP plans', 'Display currency'],
      faqs: [faq('What is a step-up SIP?', 'A step-up SIP increases your monthly contribution by a fixed percentage each year, helping your investments grow with your income.'), faq('How are SIP returns calculated?', 'Each installment compounds at the expected monthly rate until the end date; the calculator sums all installments\u2019 future values.'), faq('Should I adjust for inflation?', 'Yes \u2014 the inflation-adjusted view shows your corpus in today\u2019s purchasing power, which is more realistic for goals.')],
      related: ['cagr', 'roi', 'inflation', 'interest']
    },
    interest: {
      slug: 'interest-calculator', cat: 'Financial', icon: '\uD83D\uDCB9', name: 'Interest Calculator',
      title: 'Interest Calculator \u2013 Simple & Compound Interest',
      desc: 'Calculate simple and compound interest with daily, monthly, quarterly or yearly compounding, recurring deposits and a growth schedule.',
      keywords: 'interest calculator, simple interest, compound interest, compounding, fd calculator, rd calculator',
      intro: 'Compute simple or compound interest, compare the two, and add recurring monthly deposits to see how your money grows over time.',
      options: ['Principal amount', 'Annual interest rate (%)', 'Time period', 'Interest type (simple / compound)', 'Compounding frequency (daily / monthly / quarterly / yearly)', 'Additional monthly deposit', 'Start date', 'Tax on interest (%)', 'Inflation adjustment', 'Payout mode (reinvest / payout)', 'Rate-change schedule', 'Decimal / rounding', 'Show year-wise schedule', 'Compare simple vs compound', 'Display currency'],
      faqs: [faq('What is the difference between simple and compound interest?', 'Simple interest is charged only on the principal; compound interest is charged on principal plus accumulated interest, so it grows faster.'), faq('How does compounding frequency matter?', 'More frequent compounding (daily vs yearly) yields slightly higher returns for the same rate.'), faq('Can I include monthly deposits?', 'Yes \u2014 add a recurring deposit to model an RD-style growing balance.')],
      related: ['sip', 'cagr', 'emi', 'inflation']
    },
    gst: {
      slug: 'gst-calculator', cat: 'Financial', icon: '\uD83E\uDDFE', name: 'GST Calculator',
      title: 'GST Calculator \u2013 Add or Remove GST (CGST/SGST/IGST)',
      desc: 'Add or remove GST instantly with 0/3/5/12/18/28% slabs, CGST/SGST/IGST split, cess and reverse calculation.',
      keywords: 'gst calculator, add gst, remove gst, cgst sgst igst, gst slab, reverse gst',
      intro: 'Add GST to a base amount or extract GST from a gross amount, with automatic CGST/SGST/IGST split across all standard slabs.',
      options: ['Amount', 'Mode (add GST / remove GST)', 'GST slab (0 / 3 / 5 / 12 / 18 / 28%)', 'Custom GST rate', 'CGST + SGST split', 'IGST (inter-state)', 'Cess (%)', 'Profit margin', 'HSN/SAC reference', 'Country GST mode', 'Quantity', 'Discount before GST', 'Reverse charge', 'Rounding', 'Display currency'],
      faqs: [faq('How do I remove GST from a total?', 'Base = Total \u00D7 100 / (100 + GST%). The calculator shows the base, GST amount and split automatically.'), faq('What is the difference between CGST/SGST and IGST?', 'Intra-state sales split GST into CGST + SGST; inter-state sales use a single IGST at the same total rate.'), faq('Which GST slab applies to my product?', 'Slabs depend on the HSN/SAC code. Use the custom rate field if your item differs from the standard slabs.')],
      related: ['tax', 'discount', 'profit', 'salary']
    },
    tax: {
      slug: 'income-tax-calculator', cat: 'Financial', icon: '\uD83D\uDCCA', name: 'Income Tax Calculator',
      title: 'Income Tax Calculator \u2013 Old vs New Regime (FY 2024-25)',
      desc: 'Compare old vs new tax regime, apply 80C/80D/HRA/NPS deductions, standard deduction, rebate 87A and cess to find your exact tax liability.',
      keywords: 'income tax calculator, old vs new regime, 80c, 80d, hra, nps, tax saving, fy 2024-25',
      intro: 'Find your income tax under both the old and new regimes for FY 2024-25, apply all major deductions, and see which regime saves you more.',
      options: ['Annual income', 'Tax regime (old / new)', 'Age group (<60 / 60\u201380 / 80+)', 'Standard deduction', '80C investments', '80D health insurance', 'HRA exemption', 'Home loan interest (Sec 24b)', 'NPS (80CCD-1B)', 'Education loan interest (80E)', 'Other deductions', 'Capital gains', 'Rebate 87A', 'Health & education cess', 'Financial year'],
      faqs: [faq('Which regime is better, old or new?', 'It depends on your deductions. With large 80C/HRA/home-loan claims the old regime often wins; otherwise the new regime\u2019s lower rates help. The calculator compares both.'), faq('What is rebate under 87A?', 'If taxable income is within the threshold, the tax payable is reduced to zero under section 87A.'), faq('Is the standard deduction included?', 'Yes \u2014 \u20B975,000 (new) / \u20B950,000 (old) for salaried individuals is applied automatically.')],
      related: ['salary', 'gst', 'loan', 'emi']
    },
    salary: {
      slug: 'salary-calculator', cat: 'Financial', icon: '\uD83D\uDCB5', name: 'Salary Calculator',
      title: 'Salary Calculator \u2013 CTC to In-Hand Take-Home Pay',
      desc: 'Convert CTC to monthly in-hand salary with PF, gratuity, professional tax, HRA and tax deductions. Monthly, quarterly and yearly breakdown.',
      keywords: 'salary calculator, ctc to in hand, take home salary, in-hand salary, pf gratuity, net salary',
      intro: 'Break down your CTC into gross and net (in-hand) salary, including PF, gratuity, professional tax and income tax across monthly, quarterly and yearly views.',
      options: ['Total CTC', 'Basic salary (%)', 'HRA (%)', 'Special allowance', 'Annual bonus', 'Employee + employer PF', 'Professional tax', 'Gratuity', 'Insurance / other deductions', 'Tax regime', 'Metro / non-metro city', 'Variable pay', 'Reimbursements', 'Other deductions', 'Output frequency (monthly / yearly)'],
      faqs: [faq('What is the difference between CTC and in-hand salary?', 'CTC includes employer contributions and benefits; in-hand is what reaches your bank after PF, taxes and deductions.'), faq('How is PF calculated?', 'PF is typically 12% of basic salary from both employee and employer; the employee share is deducted from take-home.'), faq('Is gratuity part of take-home?', 'No \u2014 gratuity is a long-term benefit paid on exit, so it is excluded from monthly in-hand pay.')],
      related: ['tax', 'emi', 'loan', 'gst']
    },
    discount: {
      slug: 'discount-calculator', cat: 'Financial', icon: '\uD83C\uDFF7\uFE0F', name: 'Discount Calculator',
      title: 'Discount Calculator \u2013 Sale Price, Savings & Stacked Offers',
      desc: 'Calculate final price and savings for single, stacked and seasonal discounts, with tax after discount, coupons and cashback.',
      keywords: 'discount calculator, sale price calculator, percentage off, stacked discount, coupon, cashback',
      intro: 'Find the final price and total savings for any discount \u2014 single, stacked, seasonal or coupon-based \u2014 with optional tax and cashback.',
      options: ['Original price', 'Discount (%)', 'Flat discount amount', 'Second / stacked discount', 'Coupon value', 'Tax after discount (%)', 'Quantity', 'Shipping cost', 'Seasonal / festive preset', 'Loyalty discount', 'Cashback (%)', 'Target final price (reverse)', 'Bulk tier discount', 'Rounding', 'Display currency'],
      faqs: [faq('How do I calculate a percentage discount?', 'Final price = Original \u00D7 (1 \u2212 discount/100). The calculator also adds tax and stacks multiple discounts.'), faq('How do stacked discounts work?', 'Discounts apply one after another, not added together \u2014 e.g. 20% then 10% equals 28% off, not 30%.'), faq('Can I find the original price from a sale price?', 'Yes \u2014 use reverse mode to back-calculate the original price from the final price and discount.')],
      related: ['profit', 'gst', 'unitprice', 'percentage']
    },
    profit: {
      slug: 'profit-calculator', cat: 'Financial', icon: '\uD83D\uDCC9', name: 'Profit Calculator',
      title: 'Profit Calculator \u2013 Margin, Markup & Break-even',
      desc: 'Calculate profit, profit margin, markup and break-even point from cost and selling price, with quantity, overheads and tax.',
      keywords: 'profit calculator, margin calculator, markup calculator, break-even, gross profit, net profit',
      intro: 'Work out profit, margin and markup from cost and selling price, and find your break-even point including overheads and tax.',
      options: ['Cost price', 'Selling price', 'Quantity', 'Markup (%)', 'Margin (%)', 'Fixed / overhead cost', 'Variable cost', 'Tax (%)', 'Discount', 'Target profit', 'Break-even units', 'Revenue', 'Profit type (gross / net)', 'Rounding', 'Display currency'],
      faqs: [faq('What is the difference between margin and markup?', 'Markup is profit as a percentage of cost; margin is profit as a percentage of selling price. Both are shown.'), faq('How is break-even calculated?', 'Break-even units = fixed costs / (selling price \u2212 variable cost per unit).'), faq('How do I price for a target margin?', 'Enter cost and target margin to get the required selling price instantly.')],
      related: ['discount', 'gst', 'roi', 'unitprice']
    },
    cagr: {
      slug: 'cagr-calculator', cat: 'Financial', icon: '\uD83D\uDCCA', name: 'CAGR Calculator',
      title: 'CAGR Calculator \u2013 Compound Annual Growth Rate',
      desc: 'Calculate Compound Annual Growth Rate (CAGR) from initial and final values over a period, with a growth chart and absolute return.',
      keywords: 'cagr calculator, compound annual growth rate, investment growth, annualized return',
      intro: 'Measure the smoothed annual growth rate of an investment between two values over any number of years, with absolute return and a growth chart.',
      options: ['Initial value', 'Final value', 'Number of years', 'Periodic additions', 'Date-range mode', 'Dividend reinvestment', 'Inflation adjustment', 'Compare investments', 'Annualized vs absolute view', 'Growth chart', 'Tax on gains (%)', 'Compounding frequency', 'Target CAGR (reverse)', 'Rounding', 'Display currency'],
      faqs: [faq('What is CAGR?', 'CAGR = (Final/Initial)^(1/years) \u2212 1. It is the constant annual rate that would grow the initial value to the final value.'), faq('Is CAGR the same as average return?', 'No \u2014 CAGR is geometric (compounded), so it is usually lower than a simple average of yearly returns.'), faq('When should I use CAGR?', 'Use it to compare investments over different periods on an apples-to-apples annual basis.')],
      related: ['roi', 'sip', 'interest', 'inflation']
    },
    roi: {
      slug: 'roi-calculator', cat: 'Financial', icon: '\uD83D\uDCB8', name: 'ROI Calculator',
      title: 'ROI Calculator \u2013 Return on Investment & Annualized ROI',
      desc: 'Calculate ROI and annualized ROI from investment and returns, including costs, holding period, fees and tax.',
      keywords: 'roi calculator, return on investment, annualized roi, investment return',
      intro: 'Calculate simple and annualized return on investment, factoring in extra costs, cashflows, fees and holding period.',
      options: ['Initial investment', 'Final value / total return', 'Additional costs', 'Holding period', 'Income / cashflow received', 'Tax (%)', 'Fees', 'Inflation adjustment', 'ROI type (simple / annualized)', 'Reinvestment', 'Compare investments', 'Target ROI (reverse)', 'Currency', 'Rounding', 'Show chart'],
      faqs: [faq('How is ROI calculated?', 'ROI = (Net return / Investment) \u00D7 100, where net return is final value minus total cost.'), faq('What is annualized ROI?', 'It expresses total ROI as an equivalent yearly rate, useful when comparing investments of different durations.'), faq('Should I include fees and tax?', 'Yes \u2014 net ROI after fees and tax reflects your real return.')],
      related: ['cagr', 'sip', 'profit', 'inflation']
    },
    inflation: {
      slug: 'inflation-calculator', cat: 'Financial', icon: '\uD83C\uDF88', name: 'Inflation Calculator',
      title: 'Inflation Calculator \u2013 Value of Money Over Time',
      desc: 'See how inflation changes the value of money between years, estimate future value and lost purchasing power.',
      keywords: 'inflation calculator, purchasing power, value of money, future value, cpi',
      intro: 'Find what an amount is worth across years \u2014 convert past money to today, estimate future value, and see lost purchasing power.',
      options: ['Amount', 'Inflation rate (%)', 'Start year', 'End year', 'Direction (past\u2192present / future)', 'Custom CPI', 'Country preset', 'Compounding', 'Salary adjustment', 'Purchasing-power view', 'Average vs specific-year rate', 'Growth chart', 'Target future value', 'Rounding', 'Display currency'],
      faqs: [faq('How does inflation reduce money\u2019s value?', 'At x% inflation, \u20B9100 today buys less next year; future value = amount \u00D7 (1 + rate)^years, and purchasing power falls inversely.'), faq('What inflation rate should I use?', 'Use your country\u2019s long-run average (often 4\u20136%), or enter a custom CPI for accuracy.'), faq('Can I adjust my salary for inflation?', 'Yes \u2014 the salary-adjustment option shows the raise needed to maintain purchasing power.')],
      related: ['cagr', 'sip', 'interest', 'roi']
    },
    currency: {
      slug: 'currency-converter', cat: 'Financial', icon: '\uD83D\uDCB1', name: 'Currency Converter',
      title: 'Currency Converter \u2013 Offline Multi-Currency Conversion',
      desc: 'Convert between currencies using editable offline rates, favorite pairs, multi-target conversion and rate markup.',
      keywords: 'currency converter, exchange rate calculator, offline currency, money converter',
      intro: 'Convert between major world currencies using manually editable offline rates \u2014 perfect when you have no internet or want fixed rates.',
      options: ['From currency', 'To currency', 'Amount', 'Manual / offline rate', 'Favorite pairs', 'Multi-target conversion', 'Reverse / swap', 'Rate date note', 'Fee / markup (%)', 'Decimal places', 'Rounding', 'Quick amount buttons', 'Base currency', 'Strength comparison', 'Conversion history'],
      faqs: [faq('Are the exchange rates live?', 'No \u2014 to stay fully offline, rates are manually editable. Set them once and they are saved on your device.'), faq('How do I update a rate?', 'Open the rate editor, type the current rate, and it is stored locally for future conversions.'), faq('Can I convert to several currencies at once?', 'Yes \u2014 enable multi-target conversion to see one amount in several currencies together.')],
      related: ['gst', 'unitprice', 'discount', 'profit']
    },
    unitprice: {
      slug: 'unit-price-calculator', cat: 'Financial', icon: '\uD83D\uDED2', name: 'Unit Price Calculator',
      title: 'Unit Price Calculator \u2013 Compare Cost Per Unit & Best Deal',
      desc: 'Compare cost per unit across products and pack sizes to find the best value, with unit normalization and tax.',
      keywords: 'unit price calculator, cost per unit, price comparison, best deal, value for money',
      intro: 'Compare the real cost per unit across up to three products and pack sizes to instantly spot the best deal.',
      options: ['Product A price', 'Product A quantity', 'Unit (g / kg / ml / L / pcs)', 'Product B price & quantity', 'Product C price & quantity', 'Tax-included toggle', 'Discount', 'Cost per unit', 'Per-100g / per-100ml normalization', 'Quantity unit conversion', 'Membership price', 'Bulk vs single', 'Best-deal highlight', 'Rounding', 'Display currency'],
      faqs: [faq('How do I find the best value pack?', 'Divide price by quantity to get cost per unit; the lowest cost-per-unit is the best deal, which is highlighted automatically.'), faq('Can I compare different units?', 'Yes \u2014 the calculator normalizes to a common base (e.g. per 100g) so different sizes are comparable.'), faq('Does it account for discounts and tax?', 'Yes \u2014 enable tax-included and discount options for a true per-unit price.')],
      related: ['discount', 'profit', 'percentage', 'currency']
    },
    basic: {
      slug: 'basic-calculator', cat: 'Math', icon: '\uD83E\uDDEE', name: 'Basic Calculator',
      title: 'Basic Calculator \u2013 Online Calculator with Memory & History',
      desc: 'A fast online basic calculator with memory (M+, M-, MR, MC), keyboard support, history tape, percentages and voice input.',
      keywords: 'basic calculator, online calculator, simple calculator, memory calculator, calculator with history',
      intro: 'A clean, fast everyday calculator with memory keys, full keyboard support, a running history tape and even voice input.',
      options: ['On-screen number pad', 'Keyboard input support', 'Memory M+ / M- / MR / MC', 'Percentage key', 'Square & square root', 'Sign toggle (+/-)', 'Decimal precision', 'Thousands separator', 'History tape', 'Copy result', 'Voice input', 'Currency formatting', 'Backspace', 'Repeat last operation', 'Dark mode'],
      faqs: [faq('How do the memory keys work?', 'M+ adds the display to memory, M- subtracts, MR recalls it, and MC clears it \u2014 handy for running totals.'), faq('Can I use my keyboard?', 'Yes \u2014 number and operator keys, Enter for equals and Backspace all work.'), faq('Does it keep a history?', 'Yes \u2014 every calculation is saved in a tape you can copy or reuse.')],
      related: ['scientific', 'percentage', 'average', 'fraction']
    },
    scientific: {
      slug: 'scientific-calculator', cat: 'Math', icon: '\uD83D\uDD2C', name: 'Scientific Calculator',
      title: 'Scientific Calculator \u2013 Trig, Log, Graph & Equation Solver',
      desc: 'Full scientific calculator with trigonometry, logarithms, powers, factorial, constants, a graph plotter and equation solver.',
      keywords: 'scientific calculator, trigonometry calculator, log calculator, graph plotter, equation solver',
      intro: 'A complete scientific calculator with trig, logarithms, powers, roots, constants, a graph plotter and a built-in equation solver.',
      options: ['Trigonometry (sin / cos / tan)', 'Inverse trig functions', 'Degree / radian switch', 'Logarithm & natural log', 'Powers & exponents', 'Roots (\u221A, \u221B)', 'Factorial', 'Constants (\u03C0, e)', 'Parentheses & order of operations', 'Memory keys', 'Scientific notation', 'Graph plotter', 'Equation solver', 'Modulo', 'Random number'],
      faqs: [faq('Does it support degrees and radians?', 'Yes \u2014 toggle between degree and radian mode for all trigonometric functions.'), faq('Can it solve equations?', 'Yes \u2014 the solver handles linear and quadratic equations and shows the roots.'), faq('Can I plot graphs?', 'Yes \u2014 enter a function like x^2 and the plotter draws it instantly.')],
      related: ['basic', 'percentage', 'fraction', 'average']
    },
    percentage: {
      slug: 'percentage-calculator', cat: 'Math', icon: '\uFF05', name: 'Percentage Calculator',
      title: 'Percentage Calculator \u2013 % of, Increase, Decrease & Difference',
      desc: 'Solve every percentage problem: X% of Y, increase, decrease, difference, reverse percentage and profit percentage with steps.',
      keywords: 'percentage calculator, percent calculator, percentage increase, percentage decrease, percentage difference',
      intro: 'Solve any percentage problem with step-by-step working \u2014 percent of a number, increase, decrease, difference and reverse percentage.',
      options: ['X% of Y', 'Y is what % of X', 'Percentage increase', 'Percentage decrease', 'Percentage difference', 'Reverse percentage', 'Add a percentage', 'Subtract a percentage', 'Percentage to fraction', 'Step-by-step solution', 'Multiple values', 'Tip preset', 'Discount preset', 'Rounding', 'Result chart'],
      faqs: [faq('How do I find X% of a number?', 'Multiply the number by X/100. For example, 20% of 250 = 250 \u00D7 0.20 = 50.'), faq('How do I calculate a percentage increase?', 'Increase = (new \u2212 old) / old \u00D7 100. A drop gives a negative value (decrease).'), faq('What is reverse percentage?', 'It finds the original value before a percentage change \u2014 e.g. a price before a 20% discount.')],
      related: ['discount', 'profit', 'fraction', 'average']
    },
    fraction: {
      slug: 'fraction-calculator', cat: 'Math', icon: '\u00BD', name: 'Fraction Calculator',
      title: 'Fraction Calculator \u2013 Add, Subtract, Multiply & Divide',
      desc: 'Add, subtract, multiply and divide fractions and mixed numbers with simplification and decimal conversion, step by step.',
      keywords: 'fraction calculator, add fractions, mixed number calculator, simplify fractions, fraction to decimal',
      intro: 'Perform any operation on fractions and mixed numbers, simplify the result, and convert between fractions and decimals \u2014 with full steps.',
      options: ['Numerator', 'Denominator', 'Operation (+ \u2212 \u00D7 \u00F7)', 'Mixed-number input', 'Second fraction', 'Simplify result', 'Decimal to fraction', 'Fraction to decimal', 'Compare fractions', 'LCD / GCD', 'Reciprocal', 'Negative fractions', 'Multiple fractions', 'Round decimal', 'Step-by-step solution'],
      faqs: [faq('How do I add fractions with different denominators?', 'Find the least common denominator, convert both fractions, add the numerators, then simplify \u2014 the calculator shows each step.'), faq('Can it handle mixed numbers?', 'Yes \u2014 enter mixed numbers like 1 1/2 and it converts and computes automatically.'), faq('Does it simplify the answer?', 'Yes \u2014 results are reduced to lowest terms using the GCD.')],
      related: ['percentage', 'basic', 'average', 'scientific']
    },
    average: {
      slug: 'average-calculator', cat: 'Math', icon: '\uD83D\uDCCF', name: 'Average Calculator',
      title: 'Average Calculator \u2013 Mean, Median, Mode & Std Deviation',
      desc: 'Calculate mean, median, mode, range, sum, weighted average, standard deviation and variance from a list of numbers.',
      keywords: 'average calculator, mean median mode, standard deviation, weighted average, statistics calculator',
      intro: 'Enter a list of numbers to instantly get mean, median, mode, range, standard deviation, variance and more.',
      options: ['Numbers input', 'Separator (comma / space / newline)', 'Mean', 'Median', 'Mode', 'Range', 'Sum', 'Count', 'Min & max', 'Weighted average', 'Standard deviation', 'Variance', 'Geometric mean', 'Ignore blanks', 'Sorted output'],
      faqs: [faq('What is the difference between mean, median and mode?', 'Mean is the average, median is the middle value, and mode is the most frequent value.'), faq('How do I enter many numbers?', 'Paste them separated by commas, spaces or new lines \u2014 the calculator parses all formats.'), faq('What is a weighted average?', 'Each value is multiplied by its weight before averaging \u2014 useful for grades and portfolios.')],
      related: ['percentage', 'basic', 'fraction', 'scientific']
    },
    bmi: {
      slug: 'bmi-calculator', cat: 'Health', icon: '\u2696\uFE0F', name: 'BMI Calculator',
      title: 'BMI Calculator \u2013 Body Mass Index, Ideal Weight & Body Fat',
      desc: 'Calculate BMI with category, ideal weight range, body fat estimate and lean body mass in metric or imperial units.',
      keywords: 'bmi calculator, body mass index, ideal weight, body fat calculator, healthy weight',
      intro: 'Calculate your Body Mass Index and category, plus ideal weight range, body-fat estimate and lean body mass, in metric or imperial units.',
      options: ['Height (cm / ft-in)', 'Weight (kg / lb)', 'Age', 'Gender', 'Unit system (metric / imperial)', 'Activity level', 'Waist circumference', 'Body frame size', 'Ideal weight range', 'Body fat estimate', 'Lean body mass', 'Healthy weight range', 'BMI prime', 'Weight tracker', 'Goal weight'],
      faqs: [faq('What is a healthy BMI?', 'For adults, 18.5\u201324.9 is considered normal; below is underweight and above is overweight or obese.'), faq('Is BMI accurate for athletes?', 'BMI can overestimate fat for very muscular people \u2014 use the body-fat estimate alongside it.'), faq('What is ideal weight?', 'It is the weight range that keeps your BMI in the healthy zone for your height.')],
      related: ['bmr', 'calorie', 'age', 'percentage']
    },
    bmr: {
      slug: 'bmr-calculator', cat: 'Health', icon: '\uD83D\uDD25', name: 'BMR Calculator',
      title: 'BMR Calculator \u2013 Basal Metabolic Rate & Daily Calories (TDEE)',
      desc: 'Calculate BMR using Mifflin-St Jeor, Harris-Benedict or Katch-McArdle, plus TDEE and calorie targets for your goal.',
      keywords: 'bmr calculator, basal metabolic rate, tdee calculator, daily calories, mifflin st jeor',
      intro: 'Find your Basal Metabolic Rate with multiple formulas, then get your total daily energy expenditure (TDEE) and calorie target.',
      options: ['Gender', 'Age', 'Height', 'Weight', 'Unit system', 'Formula (Mifflin / Harris-Benedict / Katch-McArdle)', 'Body fat % (for Katch)', 'Activity level (TDEE)', 'Goal (maintain / cut / bulk)', 'Calorie target', 'Protein target', 'Macro split', 'Daily step estimate', 'Rounding', 'Compare formulas'],
      faqs: [faq('What is BMR?', 'Basal Metabolic Rate is the calories your body burns at complete rest to maintain vital functions.'), faq('Which formula is best?', 'Mifflin-St Jeor is the modern standard; Katch-McArdle is most accurate if you know your body-fat percentage.'), faq('What is TDEE?', 'Total Daily Energy Expenditure is BMR multiplied by an activity factor \u2014 your real daily calorie burn.')],
      related: ['calorie', 'bmi', 'age', 'average']
    },
    calorie: {
      slug: 'calorie-calculator', cat: 'Health', icon: '\uD83C\uDF4E', name: 'Calorie Calculator',
      title: 'Calorie Calculator \u2013 Daily Calorie Needs & Macros',
      desc: 'Calculate daily calories for weight loss, maintenance or gain with macro split (protein/carbs/fat) and goal timeline.',
      keywords: 'calorie calculator, daily calorie needs, weight loss calories, macro calculator, tdee',
      intro: 'Calculate how many calories you need to lose, maintain or gain weight, with a personalized macronutrient breakdown.',
      options: ['Gender', 'Age', 'Height', 'Weight', 'Unit system', 'Activity level', 'Goal (lose / maintain / gain)', 'Rate (kg per week)', 'Formula', 'Macro ratio', 'Protein / fat / carb grams', 'Meal split', 'Deficit / surplus', 'BMR display', 'Target date'],
      faqs: [faq('How many calories should I eat to lose weight?', 'A deficit of ~500 kcal/day typically loses about 0.5 kg/week. The calculator sets a safe target from your TDEE.'), faq('What are macros?', 'Macronutrients \u2014 protein, carbohydrates and fat \u2014 make up your calories; the calculator splits them by your chosen ratio.'), faq('Is rapid weight loss safe?', 'Very large deficits can be unsafe; the tool caps the rate at sustainable levels.')],
      related: ['bmr', 'bmi', 'age', 'average']
    },
    age: {
      slug: 'age-calculator', cat: 'Date & Time', icon: '\uD83C\uDF82', name: 'Age Calculator',
      title: 'Age Calculator \u2013 Exact Age in Years, Months & Days',
      desc: 'Calculate exact age in years, months, weeks, days, hours and seconds, with zodiac sign, birthstone and next-birthday countdown.',
      keywords: 'age calculator, date of birth calculator, exact age, zodiac sign, next birthday, chinese zodiac',
      intro: 'Find your exact age in every unit, plus your zodiac sign, Chinese zodiac, birthstone and a live countdown to your next birthday.',
      options: ['Date of birth', 'As-of / current date', 'Future date', 'Time of birth', 'Output units (y/m/w/d/h/m/s)', 'Next birthday countdown', 'Zodiac sign', 'Chinese zodiac', 'Birthstone', 'Day of week born', 'Retirement countdown', 'Life expectancy progress', 'Age in months / days toggle', 'Time zone', 'Leap-year handling'],
      faqs: [faq('How is exact age calculated?', 'It counts complete years, then remaining months and days from your date of birth to the chosen date \u2014 accounting for leap years.'), faq('Can I find my age on a future date?', 'Yes \u2014 set a future \u201Cas-of\u201D date to see how old you will be then.'), faq('What extra details are shown?', 'Zodiac sign, Chinese zodiac, birthstone, the weekday you were born and your next-birthday countdown.')],
      related: ['date', 'time', 'bmi', 'calorie']
    },
    date: {
      slug: 'date-calculator', cat: 'Date & Time', icon: '\uD83D\uDCC5', name: 'Date Calculator',
      title: 'Date Calculator \u2013 Days Between Dates & Add/Subtract Days',
      desc: 'Calculate the difference between two dates or add/subtract days, weeks, months and years, with business-day and holiday options.',
      keywords: 'date calculator, days between dates, add days, business days, date difference, working days',
      intro: 'Find the number of days between two dates or add/subtract a duration, with options for business days, weekends and holidays.',
      options: ['Start date', 'End date', 'Mode (difference / add / subtract)', 'Days / weeks / months / years to add', 'Include or exclude end day', 'Business days only', 'Exclude weekends', 'Custom holiday list', 'Country holiday preset', 'Leap-year detection', 'Output format', 'Include time', 'Recurring interval', 'Week number', 'Age between dates'],
      faqs: [faq('How do I count days between two dates?', 'Enter both dates and the calculator returns the total days, weeks and months, optionally excluding weekends/holidays.'), faq('Can I add business days only?', 'Yes \u2014 enable business-days mode to skip weekends and any holidays you add.'), faq('Does it handle leap years?', 'Yes \u2014 February 29 and leap years are handled automatically.')],
      related: ['age', 'time', 'interest', 'emi']
    },
    time: {
      slug: 'time-calculator', cat: 'Date & Time', icon: '\u23F1\uFE0F', name: 'Time Calculator',
      title: 'Time Calculator \u2013 Add, Subtract & Duration Between Times',
      desc: 'Add or subtract hours, minutes and seconds, find duration between times, and calculate work hours and pay.',
      keywords: 'time calculator, add time, subtract time, work hours calculator, time duration, hours calculator',
      intro: 'Add or subtract time values, find the duration between two times, and compute work hours with breaks and hourly pay.',
      options: ['Time A (h:m:s)', 'Time B (h:m:s)', 'Operation (add / subtract)', 'Duration between times', '12 / 24-hour format', 'Work-hours mode', 'Break deduction', 'Hourly pay rate', 'Time-zone conversion', 'Lap / split', 'Decimal hours output', 'Countdown', 'Include days', 'Round to minutes', 'Repeat / multiply'],
      faqs: [faq('How do I add hours and minutes?', 'Enter both times and choose add \u2014 the calculator carries minutes and seconds correctly into hours.'), faq('Can it calculate work hours?', 'Yes \u2014 enter start and end times, subtract breaks, and get total work hours and pay.'), faq('Does it convert to decimal hours?', 'Yes \u2014 e.g. 1h 30m becomes 1.5 hours for payroll use.')],
      related: ['date', 'age', 'salary', 'basic']
    }
  };

  var ORDER = ['emi','loan','sip','interest','gst','tax','salary','discount','profit','cagr','roi','inflation','currency','unitprice','basic','scientific','percentage','fraction','average','bmi','bmr','calorie','age','date','time'];

  var API = { FEATURES: FEATURES, CATS: CATS, TOOLS: TOOLS, ORDER: ORDER };
  root.SEO = API;
  if (typeof module !== 'undefined' && module.exports) { module.exports = API; }
})(typeof window !== 'undefined' ? window : this);
