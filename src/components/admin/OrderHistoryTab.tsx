import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { CalendarIcon, Download, Search, Filter, TrendingUp, ShoppingBag, DollarSign, FileText, Eye, Printer } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Order, getOrders, getBusinesses } from "@/lib/store";
import { toast } from "sonner";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { printReceipt } from "@/lib/printReceipt";

interface OrderHistoryTabProps {
  businessId: string;
}

const getBusinessInfo = () => {
  try {
    const stored = localStorage.getItem("dp_active_business");
    if (stored) return JSON.parse(stored);
  } catch {}
  return { name: "Business", logo: "" };
};

const OrderHistoryTab = ({ businessId }: OrderHistoryTabProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [viewOrder, setViewOrder] = useState<Order | null>(null);

  useEffect(() => {
    const refresh = async () => setOrders(await getOrders(businessId));
    refresh();
    const interval = setInterval(refresh, 5000);
    return () => clearInterval(interval);
  }, [businessId]);

  const filtered = orders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (dateFrom && new Date(o.createdAt) < dateFrom) return false;
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      if (new Date(o.createdAt) > end) return false;
    }
    if (search) {
      const q = search.toLowerCase();
      const matchId = o.id.toLowerCase().includes(q);
      const matchItems = o.items.some(i => i.name.toLowerCase().includes(q));
      const matchCustomer = ((o as any).customerName || "").toLowerCase().includes(q);
      if (!matchId && !matchItems && !matchCustomer) return false;
    }
    return true;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const totalRevenue = filtered.reduce((s, o) => s + o.total, 0);
  const avgOrder = filtered.length ? totalRevenue / filtered.length : 0;

  const exportPDF = () => {
    const biz = getBusinessInfo();
    const doc = new jsPDF();
    
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

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("Order History Report", 14, yPos);
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
    yPos += 5;
    
    const dateRange = dateFrom || dateTo 
      ? `Date Range: ${dateFrom ? format(dateFrom, "MMM dd, yyyy") : "All"} - ${dateTo ? format(dateTo, "MMM dd, yyyy") : "All"}`
      : "Date Range: All";
    doc.text(dateRange, 14, yPos);
    yPos += 5;
    doc.text(`Total Orders: ${filtered.length} | Total Revenue: $${totalRevenue.toFixed(2)} | Avg Order: $${avgOrder.toFixed(2)}`, 14, yPos);
    yPos += 8;

    const headers = ["Order ID", "Customer", "Items", "Total", "Status", "Date"];
    const rows = filtered.map(o => [
      o.id.slice(0, 12),
      (o as any).customerName || "Guest",
      o.items.map(i => `${i.quantity}x ${i.name}`).join(", ").slice(0, 30) + (o.items.map(i => `${i.quantity}x ${i.name}`).join(", ").length > 30 ? "..." : ""),
      `$${o.total.toFixed(2)}`,
      o.status,
      new Date(o.createdAt).toLocaleDateString(),
    ]);

    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 85], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      columnStyles: {
        0: { cellWidth: 25 },
        2: { cellWidth: 50 },
      },
    });

    doc.save(`${biz.name.replace(/\s+/g, "_")}_Order_History_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF exported ✓");
  };

  const exportJSON = () => {
    const biz = getBusinessInfo();
    const data = {
      businessName: biz.name,
      exportedAt: new Date().toISOString(),
      dateRange: { from: dateFrom?.toISOString() || "all", to: dateTo?.toISOString() || "all" },
      statusFilter,
      totalOrders: filtered.length,
      totalRevenue,
      orders: filtered.map(o => ({
        id: o.id,
        customer: (o as any).customerName || "Guest",
        phone: (o as any).customerPhone || "",
        table: o.tableId,
        items: o.items.map(i => ({ name: i.name, qty: i.quantity, price: i.price })),
        total: o.total,
        status: o.status,
        date: o.createdAt,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-history-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported ✓");
  };

  const exportCSV = () => {
    const headers = ["Order ID", "Customer", "Phone", "Table", "Items", "Total", "Status", "Date"];
    const rows = filtered.map(o => [
      o.id,
      (o as any).customerName || "Guest",
      (o as any).customerPhone || "",
      o.tableId,
      `"${o.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}"`,
      o.total.toFixed(2),
      o.status,
      new Date(o.createdAt).toLocaleString(),
    ]);
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `order-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported ✓");
  };

  const handlePrintReceipt = async (order: Order) => {
    const businesses = await getBusinesses();
    const business = businesses.find(b => b.id === businessId);
    if (!business) {
      toast.error("Business not found");
      return;
    }
    printReceipt({ order, business, servedBy: "Staff" });
  };

  const clearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const statusColors: Record<string, string> = {
    pending: "bg-secondary/20 text-secondary-foreground",
    preparing: "bg-accent/20 text-accent",
    ready: "bg-emerald-500/20 text-emerald-700",
    delivered: "bg-muted text-muted-foreground",
    cancelled: "bg-destructive/15 text-destructive",
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Order History</h2>
          <p className="text-sm text-muted-foreground">{filtered.length} of {orders.length} orders</p>
        </div>
        <div className="flex gap-2">
          <Button variant="hero" size="sm" onClick={exportPDF}>
            <FileText className="w-4 h-4 mr-1.5" /> PDF
          </Button>
          <Button variant="outline" size="sm" onClick={exportCSV}>
            <Download className="w-4 h-4 mr-1.5" /> CSV
          </Button>
          <Button variant="outline" size="sm" onClick={exportJSON}>
            <Download className="w-4 h-4 mr-1.5" /> JSON
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Total Orders", value: filtered.length, icon: ShoppingBag },
          { label: "Total Revenue", value: `$${totalRevenue.toFixed(2)}`, icon: DollarSign },
          { label: "Avg Order", value: `$${avgOrder.toFixed(2)}`, icon: TrendingUp },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4 shadow-card-custom">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-display font-bold mt-1">{s.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center">
                <s.icon className="w-5 h-5 text-accent" />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-card-custom">
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-semibold">Filters</span>
          {(search || statusFilter !== "all" || dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="text-xs text-destructive ml-auto" onClick={clearFilters}>
              Clear All
            </Button>
          )}
        </div>
        <div className="flex gap-3 flex-wrap items-end">
          <div className="relative flex-1 min-w-[180px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search orders, items, customers..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[150px] justify-start text-left text-xs font-normal", !dateFrom && "text-muted-foreground")}>
                <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                {dateFrom ? format(dateFrom, "MMM dd, yyyy") : "From date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateFrom} onSelect={setDateFrom} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className={cn("w-[150px] justify-start text-left text-xs font-normal", !dateTo && "text-muted-foreground")}>
                <CalendarIcon className="w-3.5 h-3.5 mr-1.5" />
                {dateTo ? format(dateTo, "MMM dd, yyyy") : "To date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dateTo} onSelect={setDateTo} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-card-custom overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Items</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No orders match your filters</TableCell></TableRow>
            ) : filtered.map((o, i) => (
              <motion.tr key={o.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                className="border-b border-border hover:bg-muted/50 transition-colors duration-200">
                <TableCell className="font-mono text-xs">{o.id.slice(0, 12)}</TableCell>
                <TableCell>
                  <div>
                    <p className="text-sm font-medium">{(o as any).customerName || "Guest"}</p>
                    <p className="text-[10px] text-muted-foreground">{(o as any).customerPhone || ""} · Table #{o.tableId}</p>
                  </div>
                </TableCell>
                <TableCell className="text-xs max-w-[200px] truncate">{o.items.map(i => `${i.quantity}× ${i.name}`).join(", ")}</TableCell>
                <TableCell className="font-bold text-accent">${o.total.toFixed(2)}</TableCell>
                <TableCell>
                  <Badge variant="secondary" className={`text-[10px] ${statusColors[o.status] || ""}`}>
                    {o.status}
                  </Badge>
                </TableCell>
                <TableCell className="text-xs text-muted-foreground">
                  <div>{new Date(o.createdAt).toLocaleDateString()}</div>
                  <div className="text-[10px]">{new Date(o.createdAt).toLocaleTimeString()}</div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewOrder(o)} title="View Details">
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handlePrintReceipt(o)} title="Print Receipt">
                      <Printer className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </motion.tr>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Order Detail Dialog */}
      <Dialog open={!!viewOrder} onOpenChange={() => setViewOrder(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>Order #{viewOrder?.id.slice(0, 12)}</DialogDescription>
          </DialogHeader>
          {viewOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Customer</p>
                  <p className="font-medium">{(viewOrder as any).customerName || "Guest"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Phone</p>
                  <p className="font-medium">{(viewOrder as any).customerPhone || "—"}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Table</p>
                  <p className="font-medium">#{viewOrder.tableId}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge className={`${statusColors[viewOrder.status]} border mt-1`}>{viewOrder.status}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-medium text-sm">{new Date(viewOrder.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <p className="text-sm font-semibold mb-2">Items</p>
                <div className="space-y-2">
                  {viewOrder.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{item.image}</span>
                        <div>
                          <p className="text-sm font-medium">{item.name}</p>
                          <p className="text-xs text-muted-foreground">${item.price.toFixed(2)} × {item.quantity}</p>
                        </div>
                      </div>
                      <span className="font-bold text-accent">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
                <div className="flex justify-between items-center mt-4 pt-3 border-t border-border">
                  <span className="font-semibold">Total</span>
                  <span className="font-display font-bold text-xl text-accent">${viewOrder.total.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" className="flex-1" onClick={() => viewOrder && handlePrintReceipt(viewOrder)}>
                  <Printer className="w-4 h-4 mr-1.5" /> Print Receipt
                </Button>
                <Button variant="outline" onClick={() => setViewOrder(null)}>Close</Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrderHistoryTab;
