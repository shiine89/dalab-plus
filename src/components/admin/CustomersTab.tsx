import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Users, Trophy, TrendingUp, ShoppingBag, Search, Crown, Download, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Customer, getCustomers, Order, getOrders } from "@/lib/store";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";

interface CustomersTabProps {
  businessId: string;
}

const padId = (n: number) => String(n).padStart(5, "0");

const getBusinessInfo = () => {
  try {
    const stored = localStorage.getItem("dp_active_business");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { name: "Business", logo: "" };
};

const CustomersTab = ({ businessId }: CustomersTabProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");

  const refreshData = async () => {
    setCustomers(await getCustomers(businessId));
    setOrders(await getOrders(businessId));
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [businessId]);

  // Build customer stats from orders if no customer records exist
  const customerStats = (() => {
    const map = new Map<string, { name: string; phone: string; totalOrders: number; totalSpent: number; lastOrder: string; shortId: number }>();
    // From registered customers
    customers.forEach(c => {
      map.set(c.id, { name: c.name, phone: c.phone, totalOrders: c.totalOrders, totalSpent: c.totalSpent, lastOrder: c.registeredAt, shortId: c.shortId });
    });
    // From orders with customerId - enrich with name from order
    orders.forEach(o => {
      if (o.customerId) {
        const existing = map.get(o.customerId);
        if (existing) {
          existing.totalOrders++;
          existing.totalSpent += o.total;
          existing.lastOrder = o.createdAt;
          if ((o as any).customerName && existing.name === o.customerId.slice(0, 8)) {
            existing.name = (o as any).customerName;
          }
          if ((o as any).customerPhone && !existing.phone) {
            existing.phone = (o as any).customerPhone;
          }
        } else {
          map.set(o.customerId, {
            name: (o as any).customerName || o.customerId.slice(0, 8),
            phone: (o as any).customerPhone || "",
            totalOrders: 1,
            totalSpent: o.total,
            lastOrder: o.createdAt,
            shortId: 0,
          });
        }
      }
    });
    return Array.from(map.entries()).map(([id, data]) => ({ id, ...data }));
  })();

  const sorted = [...customerStats].sort((a, b) => b.totalOrders - a.totalOrders);
  const top10 = sorted.slice(0, 10);
  const filtered = sorted.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    (c.shortId && padId(c.shortId).includes(search))
  );

  const totalCustomers = customerStats.length;
  const totalRevenue = customerStats.reduce((s, c) => s + c.totalSpent, 0);
  const avgSpend = totalCustomers ? totalRevenue / totalCustomers : 0;

  const exportPDF = () => {
    const biz = getBusinessInfo();
    const doc = new jsPDF();
    let yPos = 15;
    if (biz.logo && biz.logo.startsWith("data:")) {
      try { doc.addImage(biz.logo, "PNG", 14, yPos, 20, 20); } catch {}
      doc.setFontSize(18); doc.setFont("helvetica", "bold");
      doc.text(biz.name || "Business", 40, yPos + 10);
      yPos = 42;
    } else {
      doc.setFontSize(18); doc.setFont("helvetica", "bold");
      doc.text(biz.name || "Business", 14, yPos + 5);
      yPos = 28;
    }
    doc.setFontSize(14); doc.setFont("helvetica", "bold");
    doc.text("Customer Report", 14, yPos); yPos += 6;
    doc.setFontSize(9); doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos); yPos += 5;
    doc.text(`Total Customers: ${totalCustomers} | Total Revenue: $${totalRevenue.toFixed(2)}`, 14, yPos); yPos += 8;

    const headers = ["ID", "Name", "Phone", "Orders", "Total Spent", "Last Order"];
    const rows = filtered.map(c => [
      c.shortId ? padId(c.shortId) : "—",
      c.name, c.phone || "—", c.totalOrders,
      `$${c.totalSpent.toFixed(2)}`, new Date(c.lastOrder).toLocaleDateString(),
    ]);
    autoTable(doc, {
      startY: yPos, head: [headers], body: rows,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [41, 128, 85], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });
    doc.save(`${biz.name.replace(/\s+/g, "_")}_Customers_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF exported ✓");
  };

  const exportCSV = () => {
    const biz = getBusinessInfo();
    const headers = ["ID", "Name", "Phone", "Orders", "Total Spent", "Last Order"];
    const rows = filtered.map(c => [
      c.shortId ? padId(c.shortId) : "—",
      c.name, c.phone || "—", c.totalOrders,
      c.totalSpent.toFixed(2), new Date(c.lastOrder).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${biz.name.replace(/\s+/g, "_")}_Customers_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV exported ✓");
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Customers</h2>
          <p className="text-sm text-muted-foreground">{totalCustomers} total customers</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="hero" size="sm" onClick={exportPDF}>
            <FileText className="w-4 h-4 mr-1.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1.5" /> CSV
          </Button>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Total Customers", value: totalCustomers, icon: Users },
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: TrendingUp },
          { label: "Avg Spend", value: `$${avgSpend.toFixed(2)}`, icon: ShoppingBag },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4 shadow-card-custom hover:shadow-gold transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-display font-bold mt-1">{s.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <s.icon className="w-5 h-5 text-accent" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Top 10 */}
      {top10.length > 0 && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-card-custom">
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-accent" />
            <h3 className="font-display font-bold text-lg">Top 10 Customers</h3>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {top10.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                className="relative bg-muted/50 rounded-xl p-4 text-center hover:bg-accent/5 hover:shadow-gold transition-all duration-300 group cursor-default">
                {i < 3 && (
                  <div className="absolute -top-2 -right-2">
                    <Crown className={`w-5 h-5 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : "text-amber-600"}`} />
                  </div>
                )}
                <div className="w-12 h-12 rounded-full bg-accent/15 flex items-center justify-center mx-auto mb-2 text-accent font-bold text-lg group-hover:scale-110 transition-transform duration-300">
                  {c.name.charAt(0).toUpperCase()}
                </div>
                <p className="font-medium text-sm truncate">{c.name}</p>
                {c.shortId > 0 && <p className="text-[10px] text-muted-foreground font-mono">#{padId(c.shortId)}</p>}
                <p className="text-xs text-muted-foreground">{c.totalOrders} orders</p>
                <p className="text-xs font-semibold text-accent mt-1">${c.totalSpent.toFixed(2)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All Customers Table */}
      <div className="bg-card border border-border rounded-xl shadow-card-custom overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Orders</TableHead>
              <TableHead>Total Spent</TableHead>
              <TableHead>Last Order</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No customers found</TableCell></TableRow>
            ) : filtered.map((c, i) => (
              <motion.tr key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="border-b border-border hover:bg-muted/50 transition-colors duration-200">
                <TableCell className="text-sm font-mono text-muted-foreground">{c.shortId ? padId(c.shortId) : (i + 1)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">
                      {c.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-sm">{c.name}</span>
                  </div>
                </TableCell>
                <TableCell className="text-sm">{c.phone || "—"}</TableCell>
                <TableCell><Badge variant="secondary">{c.totalOrders}</Badge></TableCell>
                <TableCell className="font-semibold text-accent">${c.totalSpent.toFixed(2)}</TableCell>
                <TableCell className="text-xs text-muted-foreground">{new Date(c.lastOrder).toLocaleDateString()}</TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default CustomersTab;
