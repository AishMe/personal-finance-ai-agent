import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PiggyBank,
} from "lucide-react";

const summaryCards = [
  {
    label: "Monthly Income",
    value: "₹50,000",
    change: "+0%",
    positive: true,
    icon: TrendingUp,
    color: "bg-green-50 text-green-600",
  },
  {
    label: "Total Expenses",
    value: "₹32,400",
    change: "-8% vs last month",
    positive: true,
    icon: TrendingDown,
    color: "bg-red-50 text-red-600",
  },
  {
    label: "Remaining Balance",
    value: "₹17,600",
    change: "35% of income",
    positive: true,
    icon: Wallet,
    color: "bg-blue-50 text-blue-600",
  },
  {
    label: "Savings Goal",
    value: "₹10,000",
    change: "76% achieved",
    positive: true,
    icon: PiggyBank,
    color: "bg-purple-50 text-purple-600",
  },
];

const recentTransactions = [
  { name: "Grocery store",   category: "Food",          amount: "-₹1,200", date: "Today",     color: "bg-orange-100 text-orange-700" },
  { name: "Salary credit",   category: "Income",        amount: "+₹50,000", date: "Mar 1",    color: "bg-green-100 text-green-700"  },
  { name: "Netflix",         category: "Subscription",  amount: "-₹649",   date: "Feb 28",    color: "bg-red-100 text-red-700"      },
  { name: "Electricity bill",category: "Utilities",     amount: "-₹1,800", date: "Feb 27",    color: "bg-yellow-100 text-yellow-700"},
  { name: "Freelance work",  category: "Income",        amount: "+₹8,000", date: "Feb 25",    color: "bg-green-100 text-green-700"  },
];

export default function DashboardPage() {
  return (
    <div className="p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 text-sm mt-1">
          Welcome back — here is your financial snapshot for March 2026.
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 mb-8 lg:grid-cols-4">
        {summaryCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs text-gray-500 font-medium">{card.label}</p>
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${card.color}`}>
                  <Icon size={16} />
                </div>
              </div>
              <p className="text-xl font-semibold text-gray-800">{card.value}</p>
              <p className="text-xs text-gray-400 mt-1">{card.change}</p>
            </div>
          );
        })}
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-800">Recent Transactions</h2>
          <a href="/transactions" className="text-indigo-600 text-sm hover:underline">
            View all
          </a>
        </div>
        <div className="divide-y divide-gray-50">
          {recentTransactions.map((tx) => (
            <div key={tx.name} className="px-6 py-4 flex items-center gap-4">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-bold ${tx.color}`}>
                {tx.category[0]}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">{tx.name}</p>
                <p className="text-xs text-gray-400">{tx.category} · {tx.date}</p>
              </div>
              <p className={`text-sm font-semibold ${tx.amount.startsWith("+") ? "text-green-600" : "text-gray-800"}`}>
                {tx.amount}
              </p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}