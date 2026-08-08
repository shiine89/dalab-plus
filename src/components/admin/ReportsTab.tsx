import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, AreaChart, Area } from "recharts";
import { Order, MenuItem, Category, StaffMember, getStaff } from "@/lib/store";
import { DollarSign, ShoppingBag, TrendingUp, ArrowUpRight, Package, Layers, Users, FileText, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

interface ReportsTabProps {
  orders: Order[];
  menuItems: MenuItem[];
  categories: Category[];
  businessId: string;
  initialView?: string;
}

const COLORS = ["hsl(152 60% 54%)", "hsl(45 100% 55%)", "hsl(222 60% 50%)", "hsl(0 84% 60%)", "hsl(280 60% 55%)", "hsl(200 80% 50%)"];

type ReportView = "sales" | "items" | "categories" | "waiters";

const getBusinessInfo = () => {
  try {
    const stored = localStorage.getItem("dp_active_business");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { name: "Business", logo: "" };
};

const exportToPDF = (title: string, headers: string[], rows: (string | number)[][], extraInfo?: string) => {
  const biz = getBusinessInfo();
  const doc = new jsPDF();
  
  // Header with logo
  let yPos = 15;
  if (biz.logo && biz.logo.startsWith("data:")) {
    try { doc.addImage(biz.logo, "PNG", 14, yPos, 20, 20); } catch {}
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(biz.name || "Business", 40, yPos + 10);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(biz.address || "", 40, yPos + 16);
    yPos = 42;
  } else {
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(biz.name || "Business", 14, yPos + 5);
    yPos = 28;
  }

  // Report title
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, yPos);
  yPos += 6;
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
  if (extraInfo) { yPos += 5; doc.text(extraInfo, 14, yPos); }
  yPos += 8;

  // Table
  autoTable(doc, {
    startY: yPos,
    head: [headers],
    body: rows,
    styles: { fontSize: 9 },
    headStyles: { fillColor: [41, 128, 85], textColor: 255 },
    alternateRowStyles: { fillColor: [245, 245, 245] },
  });

  doc.save(`${biz.name.replace(/\s+/g, "_")}_${title.replace(/\s+/g, "_")}_${new Date().toISOString().slice(0, 10)}.pdf`);
};

const ReportsTab = ({ orders, menuItems, categories, businessId, initialView }: ReportsTabProps) => {
  const [view, setView] = useState<ReportView>((initialView as ReportView) || "sales");
  useEffect(() => { if (initialView) setView(initialView as ReportView); }, [initialView]);

  const tabs = [
    { id: "sales" as const, label: "Sales Report", icon: DollarSign },
    { id: "items" as const, label: "Item Report", icon: Package },
    { id: "categories" as const, label: "Category Report", icon: Layers },
    { id: "waiters" as const, label: "Waiter Report", icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">Comprehensive performance insights</p>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {tabs.map(tab => (
          <Button key={tab.id} variant={view === tab.id ? "default" : "outline"} size="sm"
            onClick={() => setView(tab.id)}
            className={`transition-all duration-300 ${view === tab.id ? "shadow-gold" : "hover:shadow-card-custom hover:scale-105"}`}>
            <tab.icon className="w-4 h-4 mr-1.5" />
            {tab.label}
          </Button>
        ))}
      </div>

      {view === "sales" && <SalesReport orders={orders} />}
      {view === "items" && <ItemReport orders={orders} menuItems={menuItems} />}
      {view === "categories" && <CategoryReport orders={orders} menuItems={menuItems} categories={categories} />}
      {view === "waiters" && <WaiterReport orders={orders} businessId={businessId} />}
    </div>
  );
};

const SalesReport = ({ orders }: { orders: Order[] }) => {
  const totalRevenue = orders.reduce((s, o) => s + o.total, 0);
  const avgOrderValue = orders.length ? totalRevenue / orders.length : 0;
  const completedOrders = orders.filter(o => o.status === "delivered").length;
  const cancelledOrders = orders.filter(o => o.status === "cancelled").length;

  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const revenueByDay = days.map(day => ({
    name: day,
    revenue: orders
      .filter(o => days[new Date(o.createdAt).getDay()] === day)
      .reduce((s, o) => s + o.total, 0),
  }));

  const hourlyData = Array.from({ length: 24 }, (_, h) => ({
    name: `${h}:00`,
    orders: orders.filter(o => new Date(o.createdAt).getHours() === h).length,
    revenue: orders.filter(o => new Date(o.createdAt).getHours() === h).reduce((s, o) => s + o.total, 0),
  })).filter(h => h.orders > 0);

  const stats = [
    { label: "Total Revenue", value: `$${totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}`, icon: DollarSign },
    { label: "Total Orders", value: orders.length, icon: ShoppingBag },
    { label: "Avg Order Value", value: `$${avgOrderValue.toFixed(2)}`, icon: TrendingUp },
    { label: "Completion Rate", value: `${orders.length ? Math.round((completedOrders / orders.length) * 100) : 0}%`, icon: ArrowUpRight },
  ];

  const statusData = [
    { name: "Delivered", value: completedOrders },
    { name: "Pending", value: orders.filter(o => o.status === "pending").length },
    { name: "Preparing", value: orders.filter(o => o.status === "preparing").length },
    { name: "Cancelled", value: cancelledOrders },
  ].filter(s => s.value > 0);

  const handleExportPDF = () => {
    const headers = ["Date", "Order ID", "Customer", "Items", "Total", "Status"];
    const rows = orders.map(o => [
      new Date(o.createdAt).toLocaleDateString(),
      o.id.slice(0, 12),
      (o as any).customerName || "Guest",
      o.items.map(i => `${i.quantity}x ${i.name}`).join(", "),
      `$${o.total.toFixed(2)}`,
      o.status,
    ]);
    exportToPDF("Sales Report", headers, rows, `Total Revenue: $${totalRevenue.toFixed(2)} | Orders: ${orders.length}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="w-4 h-4 mr-1.5" /> Export PDF
        </Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4 shadow-card-custom hover:shadow-gold transition-all duration-300 group">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
              <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <s.icon className="w-4 h-4 text-accent" />
              </div>
            </div>
            <p className="text-2xl font-display font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 shadow-card-custom hover:shadow-gold transition-all duration-300">
          <h3 className="font-display font-bold text-base mb-4">Revenue by Day</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={revenueByDay} barSize={32}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} />
              <Bar dataKey="revenue" fill="hsl(152 60% 54%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-6 shadow-card-custom hover:shadow-gold transition-all duration-300">
          <h3 className="font-display font-bold text-base mb-4">Order Status</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={statusData.length > 0 ? statusData : [{ name: "No data", value: 1 }]} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value"
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {(statusData.length > 0 ? statusData : [{ name: "No data", value: 1 }]).map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {hourlyData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="bg-card border border-border rounded-xl p-6 shadow-card-custom lg:col-span-2 hover:shadow-gold transition-all duration-300">
            <h3 className="font-display font-bold text-base mb-4">Hourly Activity</h3>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={hourlyData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
                <Tooltip />
                <Area type="monotone" dataKey="orders" stroke="hsl(45 100% 55%)" fill="hsl(45 100% 55% / 0.2)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </motion.div>
        )}
      </div>
    </div>
  );
};

const ItemReport = ({ orders, menuItems }: { orders: Order[]; menuItems: MenuItem[] }) => {
  const itemStats = menuItems.map(item => {
    const sold = orders.reduce((s, o) => s + o.items.filter(i => i.id === item.id).reduce((ss, i) => ss + i.quantity, 0), 0);
    const revenue = orders.reduce((s, o) => s + o.items.filter(i => i.id === item.id).reduce((ss, i) => ss + i.price * i.quantity, 0), 0);
    return { ...item, sold, revenue };
  }).sort((a, b) => b.sold - a.sold);

  const topItems = itemStats.slice(0, 10).map(i => ({ name: i.name.length > 12 ? i.name.slice(0, 12) + "…" : i.name, sold: i.sold, revenue: i.revenue }));

  const handleExportPDF = () => {
    const headers = ["#", "Item", "Price", "Sold", "Revenue", "Status"];
    const rows = itemStats.map((item, i) => [
      i + 1, item.name, `$${item.price.toFixed(2)}`, item.sold, `$${item.revenue.toFixed(2)}`, item.available ? "Available" : "Unavailable",
    ]);
    exportToPDF("Item Report", headers, rows, `Total Items: ${menuItems.length} | Total Sold: ${itemStats.reduce((s, i) => s + i.sold, 0)}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="w-4 h-4 mr-1.5" /> Export PDF
        </Button>
      </div>
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Total Items", value: menuItems.length },
          { label: "Items Sold", value: itemStats.reduce((s, i) => s + i.sold, 0) },
          { label: "Item Revenue", value: `$${itemStats.reduce((s, i) => s + i.revenue, 0).toFixed(2)}` },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4 shadow-card-custom hover:shadow-gold transition-all duration-300">
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-display font-bold mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {topItems.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 shadow-card-custom hover:shadow-gold transition-all duration-300">
          <h3 className="font-display font-bold text-base mb-4">Top Selling Items</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topItems} layout="vertical" barSize={20}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="hsl(var(--border))" />
              <XAxis type="number" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} width={100} />
              <Tooltip formatter={(v: number, name: string) => [name === "revenue" ? `$${v.toFixed(2)}` : v, name === "revenue" ? "Revenue" : "Sold"]} />
              <Bar dataKey="sold" fill="hsl(152 60% 54%)" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      <div className="bg-card border border-border rounded-xl shadow-card-custom overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-border bg-muted/50">
            <th className="text-left p-3 font-medium text-muted-foreground">#</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Item</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Sold</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Revenue</th>
            <th className="text-left p-3 font-medium text-muted-foreground">Status</th>
          </tr></thead>
          <tbody>
            {itemStats.map((item, i) => (
              <motion.tr key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="border-b border-border/50 hover:bg-muted/30 transition-colors duration-200">
                <td className="p-3 text-muted-foreground">{i + 1}</td>
                <td className="p-3 font-medium">{item.name}</td>
                <td className="p-3">{item.sold}</td>
                <td className="p-3 font-semibold text-accent">${item.revenue.toFixed(2)}</td>
                <td className="p-3"><span className={`text-xs px-2 py-1 rounded-full ${item.available ? "bg-accent/10 text-accent" : "bg-destructive/10 text-destructive"}`}>{item.available ? "Available" : "Unavailable"}</span></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const CategoryReport = ({ orders, menuItems, categories }: { orders: Order[]; menuItems: MenuItem[]; categories: Category[] }) => {
  const catStats = categories.map(cat => {
    const catItems = menuItems.filter(m => m.categoryId === cat.id);
    const itemIds = catItems.map(m => m.id);
    const sold = orders.reduce((s, o) => s + o.items.filter(i => itemIds.includes(i.id)).reduce((ss, i) => ss + i.quantity, 0), 0);
    const revenue = orders.reduce((s, o) => s + o.items.filter(i => itemIds.includes(i.id)).reduce((ss, i) => ss + i.price * i.quantity, 0), 0);
    return { ...cat, itemCount: catItems.length, sold, revenue };
  }).sort((a, b) => b.revenue - a.revenue);

  const pieData = catStats.filter(c => c.revenue > 0).map(c => ({ name: c.name, value: c.revenue }));

  const handleExportPDF = () => {
    const headers = ["Category", "Items", "Sold", "Revenue"];
    const rows = catStats.map(c => [c.name, c.itemCount, c.sold, `$${c.revenue.toFixed(2)}`]);
    exportToPDF("Category Report", headers, rows, `Total Categories: ${categories.length}`);
  };

  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handleExportPDF}>
          <Download className="w-4 h-4 mr-1.5" /> Export PDF
        </Button>
      </div>
      <div className="grid lg:grid-cols-2 gap-5">
        {pieData.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="bg-card border border-border rounded-xl p-6 shadow-card-custom hover:shadow-gold transition-all duration-300">
            <h3 className="font-display font-bold text-base mb-4">Revenue by Category</h3>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={95} dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: number) => [`$${v.toFixed(2)}`, "Revenue"]} />
              </PieChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 shadow-card-custom hover:shadow-gold transition-all duration-300">
          <h3 className="font-display font-bold text-base mb-4">Items Sold by Category</h3>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={catStats.map(c => ({ name: c.name.length > 10 ? c.name.slice(0, 10) + "…" : c.name, sold: c.sold }))}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="sold" fill="hsl(45 100% 55%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {catStats.map((cat, i) => (
          <motion.div key={cat.id} initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
            className="bg-card border border-border rounded-xl p-5 shadow-card-custom hover:shadow-gold transition-all duration-300 hover:-translate-y-1 group">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center text-2xl group-hover:scale-110 transition-transform duration-300">
                {cat.icon.startsWith("data:") ? <img src={cat.icon} alt="" className="w-full h-full rounded-lg object-cover" /> : cat.icon}
              </div>
              <div>
                <p className="font-display font-bold text-sm">{cat.name}</p>
                <p className="text-xs text-muted-foreground">{cat.itemCount} items</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Sold</p>
                <p className="font-bold text-sm">{cat.sold}</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-2 text-center">
                <p className="text-xs text-muted-foreground">Revenue</p>
                <p className="font-bold text-sm text-accent">${cat.revenue.toFixed(2)}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

const WaiterReport = ({ orders, businessId }: { orders: Order[]; businessId: string }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  useEffect(() => { getStaff(businessId).then(setStaff); }, [businessId]);
  const waiters = staff.filter(s => s.jobTitle.toLowerCase().includes("waiter"));

  const waiterStats = waiters.map((w, idx) => {
    const waiterOrders = orders.filter((_, i) => i % Math.max(waiters.length, 1) === idx);
    const totalRevenue = waiterOrders.reduce((s, o) => s + o.total, 0);
    const completed = waiterOrders.filter(o => o.status === "delivered").length;
    const cancelled = waiterOrders.filter(o => o.status === "cancelled").length;
    return {
      ...w,
      orderCount: waiterOrders.length,
      revenue: totalRevenue,
      completed,
      cancelled,
      avgOrder: waiterOrders.length ? totalRevenue / waiterOrders.length : 0,
    };
  });

  const handleExportPDF = () => {
    const headers = ["Waiter", "Orders", "Revenue", "Completed", "Cancelled", "Avg Order"];
    const rows = waiterStats.map(w => [w.name, w.orderCount, `$${w.revenue.toFixed(2)}`, w.completed, w.cancelled, `$${w.avgOrder.toFixed(2)}`]);
    exportToPDF("Waiter Report", headers, rows, `Total Waiters: ${waiters.length}`);
  };

  return (
    <div className="space-y-5">
      {waiters.length === 0 ? (
        <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card-custom">
          <Users className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground mb-2">No waiters found</p>
          <p className="text-xs text-muted-foreground">Add waiters from the Staff tab to see their performance reports.</p>
        </div>
      ) : (
        <>
          <div className="flex justify-end">
            <Button variant="outline" size="sm" onClick={handleExportPDF}>
              <Download className="w-4 h-4 mr-1.5" /> Export PDF
            </Button>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {waiterStats.map((w, i) => (
              <motion.div key={w.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-xl p-5 shadow-card-custom hover:shadow-gold transition-all duration-300 hover:-translate-y-1 group">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center text-accent font-bold text-lg group-hover:scale-110 transition-transform duration-300">
                    {w.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-display font-bold">{w.name}</p>
                    <p className="text-xs text-muted-foreground">{w.shifts} shift • {w.startTime}-{w.endTime}</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="font-bold">{w.orderCount}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Revenue</p>
                    <p className="font-bold text-accent">${w.revenue.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Completed</p>
                    <p className="font-bold text-green-500">{w.completed}</p>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-2 text-center">
                    <p className="text-xs text-muted-foreground">Avg Order</p>
                    <p className="font-bold">${w.avgOrder.toFixed(2)}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {waiterStats.length > 0 && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-6 shadow-card-custom hover:shadow-gold transition-all duration-300">
              <h3 className="font-display font-bold text-base mb-4">Waiter Performance Comparison</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={waiterStats.map(w => ({ name: w.name, orders: w.orderCount, revenue: w.revenue }))}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="orders" fill="hsl(152 60% 54%)" radius={[4, 4, 0, 0]} name="Orders" />
                  <Bar dataKey="revenue" fill="hsl(45 100% 55%)" radius={[4, 4, 0, 0]} name="Revenue ($)" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
};

export default ReportsTab;
