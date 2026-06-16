export const INCOME_TYPES = [
  { value: "salary", label: "Salary" },
  { value: "freelancing", label: "Freelancing" },
  { value: "business", label: "Business" },
  { value: "rental_income", label: "Rental Income" },
  { value: "bonus", label: "Bonus" },
  { value: "other", label: "Other" },
] as const;

export const PERSONAL_EXPENSE_CATEGORIES = [
  { value: "food", label: "Food" },
  { value: "travel", label: "Travel" },
  { value: "fuel", label: "Fuel" },
  { value: "shopping", label: "Shopping" },
  { value: "entertainment", label: "Entertainment" },
  { value: "bills", label: "Bills" },
  { value: "healthcare", label: "Healthcare" },
  { value: "education", label: "Education" },
  { value: "family", label: "Family" },
  { value: "other", label: "Other" },
] as const;

export const INVESTMENT_TYPES = [
  { value: "sip", label: "SIP" },
  { value: "mutual_fund", label: "Mutual Fund" },
  { value: "stocks", label: "Stocks" },
  { value: "ppf", label: "PPF" },
  { value: "fd", label: "FD" },
  { value: "crypto", label: "Crypto" },
  { value: "gold", label: "Gold" },
  { value: "other", label: "Other" },
] as const;

export const LOAN_TYPES = [
  { value: "home_loan", label: "Home Loan" },
  { value: "car_loan", label: "Car Loan" },
  { value: "personal_loan", label: "Personal Loan" },
  { value: "education_loan", label: "Education Loan" },
  { value: "credit_card_emi", label: "Credit Card EMI" },
  { value: "other", label: "Other" },
] as const;

export const INCOME_TYPE_COLORS: Record<string, string> = {
  salary: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  freelancing: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  business: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  rental_income: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  bonus: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export const EXPENSE_CATEGORY_COLORS: Record<string, string> = {
  food: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  travel: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  fuel: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  shopping: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-400",
  entertainment: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  bills: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  healthcare: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  education: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  family: "bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export const INVESTMENT_TYPE_COLORS: Record<string, string> = {
  sip: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  mutual_fund: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  stocks: "bg-violet-100 text-violet-800 dark:bg-violet-900/30 dark:text-violet-400",
  ppf: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400",
  fd: "bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400",
  crypto: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  gold: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export const LOAN_TYPE_COLORS: Record<string, string> = {
  home_loan: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  car_loan: "bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400",
  personal_loan: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
  education_loan: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  credit_card_emi: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
  other: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
};

export const PAGE_SIZE = 20;
