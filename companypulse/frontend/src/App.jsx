import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity, ArrowDownRight, ArrowUpRight, Bell, BriefcaseBusiness,
  CalendarDays, CheckCircle2, ChevronDown, CircleHelp, Download,
  LayoutDashboard, Menu, Search, ShoppingBag, Users, Wallet,
  RefreshCw, Building2, Clock3
} from "lucide-react";
import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement,
  BarElement, Tooltip, Legend, Filler
} from "chart.js";
import { Line, Bar } from "react-chartjs-2";
import {
  getSummary, getRevenue, getEmployeeStats, getOrders, downloadOrdersCsv
} from "./api";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Tooltip, Legend, Filler);

const money = (value) => new Intl.NumberFormat("en-IN", {
  style: "currency", currency: "INR", maximumFractionDigits: 0
}).format(value || 0);

const number = (value) => new Intl.NumberFormat("en-IN").format(value || 0);

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: { display: false },
    tooltip: {
      backgroundColor: "#172033",
      padding: 12,
      displayColors: false,
      titleFont: { family: "Inter, sans-serif", size: 12 },
      bodyFont: { family: "Inter, sans-serif", size: 13 }
    }
  },
  scales: {
    x: { grid: { display: false }, ticks: { color: "#8b95a7", font: { size: 11 } }, border: { display: false } },
    y: { grid: { color: "#edf0f5" }, ticks: { color: "#8b95a7", font: { size: 11 }, callback: (v) => `₹${Number(v).toLocaleString("en-IN")}` }, border: { display: false } }
  }
};

function StatCard({ title, value, note, icon: Icon, tone, trend }) {
  return (
    <article className="stat-card">
      <div className="stat-top">
        <span className={`stat-icon ${tone}`}><Icon size={20} strokeWidth={2.1} /></span>
        <span className={`trend ${trend === "down" ? "trend-down" : ""}`}>
          {trend === "down" ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}
          {note}
        </span>
      </div>
      <p className="stat-label">{title}</p>
      <h2>{value}</h2>
      <p className="stat-foot">Compared with previous period</p>
    </article>
  );
}

function Avatar({ name, color = "blue" }) {
  const initials = name.split(" ").map((part) => part[0]).slice(0, 2).join("").toUpperCase();
  return <span className={`avatar avatar-${color}`}>{initials}</span>;
}

export default function App() {
  const [summary, setSummary] = useState(null);
  const [revenue, setRevenue] = useState([]);
  const [employeeStats, setEmployeeStats] = useState([]);
  const [orders, setOrders] = useState([]);
  const [startDate, setStartDate] = useState("2026-01-01");
  const [endDate, setEndDate] = useState("2026-12-31");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [notice, setNotice] = useState("");

  const loadDashboard = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    setError("");
    try {
      const [summaryData, revenueData, employeeData, orderData] = await Promise.all([
        getSummary(),
        getRevenue(startDate, endDate),
        getEmployeeStats(),
        getOrders()
      ]);
      setSummary(summaryData);
      setRevenue(revenueData);
      setEmployeeStats(employeeData);
      setOrders(orderData);
    } catch (err) {
      setError(`${err.message} Make sure the Python backend is running on port 5000.`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const revenueData = useMemo(() => ({
    labels: revenue.map((item) => new Date(`${item.month}-01T12:00:00`).toLocaleDateString("en-IN", { month: "short" })),
    datasets: [{
      label: "Revenue",
      data: revenue.map((item) => item.revenue),
      borderColor: "#5b7cfa",
      backgroundColor: (context) => {
        const chart = context.chart;
        const { ctx, chartArea } = chart;
        if (!chartArea) return "rgba(91,124,250,0.12)";
        const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
        gradient.addColorStop(0, "rgba(91,124,250,0.22)");
        gradient.addColorStop(1, "rgba(91,124,250,0.01)");
        return gradient;
      },
      fill: true,
      tension: 0.38,
      pointRadius: 4,
      pointHoverRadius: 6,
      pointBackgroundColor: "#ffffff",
      pointBorderColor: "#5b7cfa",
      pointBorderWidth: 2,
      borderWidth: 3
    }]
  }), [revenue]);

  const departmentData = useMemo(() => ({
    labels: employeeStats.map((item) => item.department),
    datasets: [{
      label: "Employees",
      data: employeeStats.map((item) => item.employees),
      backgroundColor: ["#5b7cfa", "#38bfa7", "#ffb454", "#a78bfa", "#f28b9b"],
      borderRadius: 7,
      borderSkipped: false,
      barThickness: 24
    }]
  }), [employeeStats]);

  const employeeOptions = useMemo(() => ({
    ...chartOptions,
    indexAxis: "y",
    scales: {
      x: { grid: { color: "#edf0f5" }, ticks: { color: "#8b95a7", stepSize: 1 }, border: { display: false } },
      y: { grid: { display: false }, ticks: { color: "#677287", font: { size: 11 } }, border: { display: false } }
    }
  }), []);

  async function handleExport() {
    try {
      await downloadOrdersCsv();
      setNotice("Your CSV report has been downloaded.");
    } catch (err) {
      setNotice(err.message);
    }
    window.setTimeout(() => setNotice(""), 3000);
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${mobileMenu ? "sidebar-open" : ""}`}>
        <div className="brand">
          <div className="brand-mark"><Activity size={22} strokeWidth={2.7} /></div>
          <div><strong>company<span>pulse</span></strong><small>BUSINESS INTELLIGENCE</small></div>
        </div>
        <div className="workspace-label">WORKSPACE</div>
        <nav className="side-nav">
          <a className="nav-link active" href="#overview" onClick={() => setMobileMenu(false)}><LayoutDashboard size={18} /> Overview <span className="nav-dot" /></a>
          <a className="nav-link" href="#analytics" onClick={() => setMobileMenu(false)}><Activity size={18} /> Analytics</a>
          <a className="nav-link" href="#orders" onClick={() => setMobileMenu(false)}><ShoppingBag size={18} /> Orders</a>
          <a className="nav-link" href="#team" onClick={() => setMobileMenu(false)}><Users size={18} /> Team</a>
        </nav>
        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon"><CircleHelp size={18} /></div>
            <strong>Need a hand?</strong>
            <p>Your company overview, all in one place.</p>
            <a href="#about">About this dashboard <span>↗</span></a>
          </div>
          <div className="profile">
            <Avatar name="Alex Morgan" color="purple" />
            <div className="profile-text"><strong>Alex Morgan</strong><small>Workspace admin</small></div>
            <ChevronDown size={16} className="profile-chevron" />
          </div>
        </div>
      </aside>

      <main className="main-content" id="overview">
        <header className="topbar">
          <button className="mobile-menu-button icon-button" aria-label="Toggle menu" onClick={() => setMobileMenu(!mobileMenu)}><Menu size={21} /></button>
          <div className="breadcrumb"><span>Workspace</span><span className="crumb-slash">/</span><strong>Overview</strong></div>
          <div className="top-actions">
            <div className="search-box"><Search size={17} /><input aria-label="Search" placeholder="Search anything..." /></div>
            <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
            <div className="top-profile"><Avatar name="Alex Morgan" color="purple" /><span>Alex Morgan</span><ChevronDown size={15} /></div>
          </div>
        </header>

        <section className="page-heading">
          <div>
            <div className="eyebrow"><span className="live-dot" /> YOUR BUSINESS AT A GLANCE</div>
            <h1>Good morning, Alex <span className="wave">✦</span></h1>
            <p>Here’s what’s happening with your company today.</p>
          </div>
          <div className="heading-actions">
            <button className="button button-secondary" onClick={() => loadDashboard(true)} disabled={refreshing}>
              <RefreshCw size={16} className={refreshing ? "spin" : ""} /> Refresh
            </button>
            <button className="button button-primary" onClick={handleExport}><Download size={16} /> Export report</button>
          </div>
        </section>

        {error && <div className="error-banner"><strong>Couldn’t load dashboard data.</strong><span>{error}</span><button onClick={() => loadDashboard(true)}>Try again</button></div>}
        {notice && <div className="notice-banner"><CheckCircle2 size={16} />{notice}</div>}

        <section className="filter-row">
          <div className="filter-intro"><CalendarDays size={17} /><span>Reporting period</span></div>
          <label className="date-field"><span>From</span><input type="date" value={startDate} max={endDate} onChange={(e) => setStartDate(e.target.value)} /></label>
          <span className="date-divider">—</span>
          <label className="date-field"><span>To</span><input type="date" value={endDate} min={startDate} onChange={(e) => setEndDate(e.target.value)} /></label>
          <span className="filter-status"><span className="live-dot" /> Live data</span>
        </section>

        <section className="stats-grid" aria-label="Company key statistics">
          <StatCard title="Total revenue" value={loading ? "—" : money(summary?.total_revenue)} note="8.2%" icon={Wallet} tone="blue" />
          <StatCard title="Completed orders" value={loading ? "—" : number(summary?.total_orders)} note="5.4%" icon={ShoppingBag} tone="mint" />
          <StatCard title="Active customers" value={loading ? "—" : number(summary?.active_customers)} note="3.1%" icon={Users} tone="orange" />
          <StatCard title="Team members" value={loading ? "—" : number(summary?.active_employees)} note="2.0%" icon={BriefcaseBusiness} tone="violet" />
        </section>
        <p className="demo-note"><span className="note-dot" /> Demo workspace · All figures are sample data. Growth percentages are illustrative.</p>

        <section className="charts-grid" id="analytics">
          <article className="panel revenue-panel">
            <div className="panel-heading">
              <div><div className="panel-title">Revenue overview</div><p>Completed orders over your selected period</p></div>
              <span className="panel-chip"><span className="chip-dot" /> Revenue</span>
            </div>
            <div className="chart-summary"><strong>{loading ? "—" : money(revenue.reduce((sum, item) => sum + item.revenue, 0))}</strong><span>in selected period</span></div>
            <div className="chart-wrap line-chart">
              {loading ? <div className="chart-placeholder">Loading revenue...</div> :
                revenue.length ? <Line data={revenueData} options={chartOptions} /> :
                <div className="chart-placeholder">No completed orders found for this period.</div>}
            </div>
          </article>

          <article className="panel team-panel" id="team">
            <div className="panel-heading">
              <div><div className="panel-title">Team distribution</div><p>Active employees by department</p></div>
              <button className="subtle-icon" aria-label="Team details"><Building2 size={17} /></button>
            </div>
            <div className="chart-wrap bar-chart">
              {loading ? <div className="chart-placeholder">Loading team data...</div> :
                employeeStats.length ? <Bar data={departmentData} options={employeeOptions} /> :
                <div className="chart-placeholder">No employee data available.</div>}
            </div>
            <div className="chart-foot"><Users size={15} /><span>{number(summary?.active_employees)} active team members across {employeeStats.length} departments</span></div>
          </article>
        </section>

        <section className="panel orders-panel" id="orders">
          <div className="panel-heading orders-heading">
            <div><div className="panel-title">Recent orders</div><p>A quick look at the latest customer activity</p></div>
            <button className="text-button" onClick={handleExport}>Download CSV <Download size={15} /></button>
          </div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>ORDER</th><th>CUSTOMER</th><th>DATE</th><th>AMOUNT</th><th>STATUS</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan="5" className="table-message">Loading recent orders...</td></tr> :
                  orders.length ? orders.map((order, index) => (
                    <tr key={order.id}>
                      <td><span className="order-id">ORD-{String(order.id).padStart(4, "0")}</span></td>
                      <td><div className="customer-cell"><Avatar name={order.customer} color={["blue", "mint", "orange", "purple"][index % 4]} /><span>{order.customer}</span></div></td>
                      <td className="muted-cell">{new Date(order.order_date).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
                      <td className="amount-cell">{money(order.total_amount)}</td>
                      <td><span className={`status-pill ${order.status.toLowerCase()}`}><span />{order.status}</span></td>
                    </tr>
                  )) : <tr><td colSpan="5" className="table-message">No orders to display.</td></tr>}
              </tbody>
            </table>
          </div>
          <div className="table-footer"><span>Showing {orders.length} recent orders</span><span><Clock3 size={14} /> Updated from database</span></div>
        </section>

        <footer className="footer" id="about">
          <span>© 2026 CompanyPulse <span className="footer-separator">·</span> Built for better business clarity</span>
          <span><span className="footer-live" /> API connection status is reflected above</span>
        </footer>
      </main>
    </div>
  );
}
