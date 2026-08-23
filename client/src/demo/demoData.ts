export const demoTransactions = [
  { id: "salary", date: "01 Aug", description: "Salary credit", category: "Income", amountPaise: 75_000_00, kind: "income" as const },
  { id: "rent", date: "03 Aug", description: "Home lease", category: "Rent", amountPaise: 18_000_00, kind: "expense" as const },
  { id: "groceries", date: "07 Aug", description: "Fresh Basket", category: "Food", amountPaise: 3_460_00, kind: "expense" as const },
  { id: "food", date: "11 Aug", description: "QuickBite delivery", category: "Food", amountPaise: 685_00, kind: "expense" as const },
  { id: "fuel", date: "13 Aug", description: "CityFuel", category: "Transport", amountPaise: 2_400_00, kind: "expense" as const },
  { id: "stream", date: "16 Aug", description: "StreamFlix plan", category: "Subscriptions", amountPaise: 649_00, kind: "expense" as const },
  { id: "power", date: "18 Aug", description: "Power service", category: "Utilities", amountPaise: 1_870_00, kind: "expense" as const },
  { id: "mobile", date: "20 Aug", description: "Mobile prepaid", category: "Utilities", amountPaise: 799_00, kind: "expense" as const },
  { id: "sip", date: "22 Aug", description: "Index fund SIP", category: "Investment", amountPaise: 8_000_00, kind: "expense" as const },
  { id: "shopping", date: "24 Aug", description: "Everyday Store", category: "Shopping", amountPaise: 4_250_00, kind: "expense" as const },
];

export const demoBudgets = [
  { name: "Food", spentPaise: 4_145_00, budgetPaise: 6_000_00, state: "healthy" as const },
  { name: "Rent", spentPaise: 18_000_00, budgetPaise: 18_000_00, state: "near" as const },
  { name: "Transport", spentPaise: 2_400_00, budgetPaise: 3_000_00, state: "near" as const },
  { name: "Entertainment", spentPaise: 1_499_00, budgetPaise: 1_200_00, state: "over" as const },
  { name: "Shopping", spentPaise: 4_250_00, budgetPaise: 5_000_00, state: "healthy" as const },
  { name: "Utilities", spentPaise: 2_669_00, budgetPaise: 3_500_00, state: "healthy" as const },
];

export const demoMonthlyTrend = [
  { month: "Mar", incomePaise: 72_000_00, expensePaise: 39_800_00 },
  { month: "Apr", incomePaise: 72_000_00, expensePaise: 42_600_00 },
  { month: "May", incomePaise: 75_000_00, expensePaise: 44_900_00 },
  { month: "Jun", incomePaise: 75_000_00, expensePaise: 41_200_00 },
  { month: "Jul", incomePaise: 75_000_00, expensePaise: 47_600_00 },
  { month: "Aug", incomePaise: 75_000_00, expensePaise: 42_113_00 },
];

export const demoSpaces = [
  { name: "Personal", role: "Owner", description: "Everyday income, bills, and goals.", members: ["You"] },
  { name: "Family", role: "Editor", description: "A shared household view with deliberate access.", members: ["You", "Asha", "Rohan"] },
];

export const demoInsights = [
  { label: "Calculated spending alert", title: "Entertainment is over its monthly limit", description: "Demo spending is ₹299 above the ₹1,200 category budget." },
  { label: "Calculated recurring spend", title: "One recurring subscription identified", description: "StreamFlix appears monthly at ₹649 in this fictional demo history." },
  { label: "AI summary example", title: "Food is the largest flexible category", description: "This illustrated summary is based only on the labelled demo entries, not on a real account." },
];
