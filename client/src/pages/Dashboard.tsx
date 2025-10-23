import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.dashboard.stats.useQuery();
  const { data: timeSeries, isLoading: timeSeriesLoading } = trpc.dashboard.documentsTimeSeries.useQuery({ days: 30 });
  const { data: newUsers, isLoading: newUsersLoading } = trpc.dashboard.newUsersPerWeek.useQuery({ weeks: 8 });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // Transform time series data for chart
  const chartData = timeSeries ? transformTimeSeriesData(timeSeries) : [];
  const userChartData = newUsers ? transformUserData(newUsers) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 mb-2">SMS Invoice Dashboard</h1>
          <p className="text-slate-600">Monitor your invoicing system performance</p>
        </header>

        {/* User Stats */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">User Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Users"
              value={stats?.users.total || 0}
              description="All registered users"
            />
            <StatCard
              title="New This Week"
              value={stats?.users.newThisWeek || 0}
              description="Users joined this week"
            />
            <StatCard
              title="New This Month"
              value={stats?.users.newThisMonth || 0}
              description="Users joined this month"
            />
            <StatCard
              title="Active Users"
              value={stats?.users.active || 0}
              description="Active in last 30 days"
            />
          </div>
        </section>

        {/* Document Stats */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Document Statistics</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <StatCard
              title="Total Invoices"
              value={stats?.documents.totalInvoices || 0}
              description="All time"
              highlight
            />
            <StatCard
              title="Total Quotes"
              value={stats?.documents.totalQuotes || 0}
              description="All time"
              highlight
            />
            <StatCard
              title="Avg per User"
              value={stats?.avgInvoicesPerUser || '0'}
              description="Invoices per user"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <StatCard
              title="Today"
              value={`${stats?.documents.invoicesToday || 0} inv / ${stats?.documents.quotesToday || 0} quo`}
              description="Documents created today"
            />
            <StatCard
              title="This Week"
              value={`${stats?.documents.invoicesWeek || 0} inv / ${stats?.documents.quotesWeek || 0} quo`}
              description="Documents this week"
            />
            <StatCard
              title="This Month"
              value={`${stats?.documents.invoicesMonth || 0} inv / ${stats?.documents.quotesMonth || 0} quo`}
              description="Documents this month"
            />
          </div>
        </section>

        {/* SMS Activity */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">SMS Activity</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <StatCard
              title="Total Messages"
              value={stats?.sms.total || 0}
              description="All SMS messages"
            />
            <StatCard
              title="Messages Today"
              value={stats?.sms.today || 0}
              description="SMS sent/received today"
            />
          </div>
        </section>

        {/* Charts */}
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-4">Trends</h2>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Documents Created (Last 30 Days)</CardTitle>
              <CardDescription>Invoices and quotes generated over time</CardDescription>
            </CardHeader>
            <CardContent>
              {timeSeriesLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="invoices" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="quotes" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>New Users Per Week</CardTitle>
              <CardDescription>User growth over the last 8 weeks</CardDescription>
            </CardHeader>
            <CardContent>
              {newUsersLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={userChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="users" fill="#8b5cf6" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}

interface StatCardProps {
  title: string;
  value: string | number;
  description: string;
  highlight?: boolean;
}

function StatCard({ title, value, description, highlight }: StatCardProps) {
  return (
    <Card className={highlight ? "border-blue-200 bg-blue-50" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-slate-600">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-slate-900">{value}</div>
        <p className="text-xs text-slate-500 mt-1">{description}</p>
      </CardContent>
    </Card>
  );
}

// Transform time series data for recharts
function transformTimeSeriesData(data: any[]) {
  const dateMap = new Map<string, { invoices: number; quotes: number }>();

  data.forEach(item => {
    const existing = dateMap.get(item.date) || { invoices: 0, quotes: 0 };
    if (item.type === 'invoice') {
      existing.invoices = item.count;
    } else {
      existing.quotes = item.count;
    }
    dateMap.set(item.date, existing);
  });

  return Array.from(dateMap.entries()).map(([date, counts]) => ({
    date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    invoices: counts.invoices,
    quotes: counts.quotes,
  }));
}

// Transform user data for recharts
function transformUserData(data: any[]) {
  return data.map(item => ({
    week: `Week ${item.week.slice(-2)}`,
    users: item.count,
  }));
}

