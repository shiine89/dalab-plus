import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, TrendingDown, Wallet, Plus, Trash2, Receipt, PieChart, Landmark } from "lucide-react";
import { toast } from "sonner";
import { Business, getOrders, getHotelBookings, Order, HotelBooking } from "@/lib/store";
import {
  Expense, Purchase, Department, getExpenses, saveExpense, deleteExpense,
  getPurchases, departmentsFor, defaultDepartment,
} from "@/lib/inventory";
import { exportToPdf, exportToExcel } from "@/lib/exportUtils";
import { ExportBar } from "./InventoryTab";

interface Props { business: Business }

type Entry = {
  date: string;
  kind: "income" | "expense";
  department: Department;
  source: string;
  description: string;
  amount: number;
};

const RANGES = [
  { id: "today", label: "Today" },
  { id: "7d", label: "Last 7 Days" },
  { id: "30d", label: "Last 30 Days" },
  { id: "all", label: "All Time" },
];

const AccountingTab = ({ business }: Props) => {
  const deps = departmentsFor(business.type);
  const defDep = defaultDepartment(business.type);
  const salesDep: Department = business.type === "cafe" ? "cafe" : "restaurant";

  const [orders, setOrders] = useState<Order[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [depFilter, setDepFilter] = useState<string>("all");
  const [range, setRange] = useState("30d");
  const [expDialog, setExpDialog] = useState(false);
  const [form, setForm] = useState({ title: "", category: "operations", department: defDep as Department, amount: "", note: "" });

  const refresh = async () => {
    setOrders(await getOrders(business.id));
    setPurchases(await getPurchases(business.id));
    setExpenses(await getExpenses(business.id));
    if (business.type === "hotel") setBookings(await getHotelBookings(business.id));
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [business.id]);

  const fromDate = useMemo(() => {
    const now = new Date();
    if (range === "today") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (range === "7d") return new Date(now.getTime() - 7 * 864e5);
    if (range === "30d") return new Date(now.getTime() - 30 * 864e5);
    return new Date(0);
  }, [range]);

  const entries = useMemo<Entry[]>(() => {
    const list: Entry[] = [];
    orders.filter(o => o.status === "paid").forEach(o => list.push({
      date: o.paidAt || o.createdAt, kind: "income", department: salesDep,
      source: "Sales", description: `Order · ${o.items.length} items · ${o.paymentMethod || "—"}`, amount: o.total,
    }));
    bookings.filter(b => b.status !== "cancelled").forEach(b => list.push({
      date: b.checkIn, kind: "income", department: "hotel",
      source: "Rooms", description: `Booking · ${b.guestName} · ${b.nights} night(s)`, amount: b.totalPrice,
    }));
    purchases.forEach(p => list.push({
      date: p.purchasedAt, kind: "expense", department: p.department,
      source: "Purchase", description: `${p.itemName} · ${p.quantity} @ $${p.unitCost.toFixed(2)}`, amount: p.totalCost,
    }));
    expenses.forEach(e => list.push({
      date: e.spentAt, kind: "expense", department: e.department,
      source: "Expense", description: `${e.title} · ${e.category}`, amount: e.amount,
    }));
    return list
      .filter(e => new Date(e.date) >= fromDate)
      .filter(e => depFilter === "all" || e.department === depFilter)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [orders, bookings, purchases, expenses, fromDate, depFilter, salesDep]);

  const income = entries.filter(e => e.kind === "income").reduce((s, e) => s + e.amount, 0);
  const spend = entries.filter(e => e.kind === "expense").reduce((s, e) => s + e.amount, 0);
  const profit = income - spend;
  const margin = income ? (profit / income) * 100 : 0;

  const byDepartment = deps.filter(d => d.id !== "all").map(d => {
    const inc = entries.filter(e => e.kind === "income" && e.department === d.id).reduce((s, e) => s + e.amount, 0);
    const exp = entries.filter(e => e.kind === "expense" && e.department === d.id).reduce((s, e) => s + e.amount, 0);
    return { ...d, income: inc, expense: exp, profit: inc - exp };
  });

  const addExpense = async () => {
    if (!form.title.trim()) return toast.error("Expense title is required");
    if (!Number(form.amount)) return toast.error("Enter an amount");
    await saveExpense(business.id, { title: form.title.trim(), category: form.category, department: form.department, amount: Number(form.amount), note: form.note });
    toast.success("Expense recorded ✅");
    setExpDialog(false);
    setForm({ title: "", category: "operations", department: defDep, amount: "", note: "" });
    refresh();
  };

  const ledgerExport = () => ({
    title: `${business.name} · General Accounts`,
    subtitle: `${deps.find(d => d.id === depFilter)?.label || "All Departments"} · ${RANGES.find(r => r.id === range)?.label}`,
    headers: ["Date", "Type", "Department", "Source", "Description", "Amount"],
    rows: entries.map(e => [new Date(e.date).toLocaleDateString(), e.kind === "income" ? "Income" : "Expense",
      e.department, e.source, e.description, `${e.kind === "income" ? "+" : "-"}${e.amount.toFixed(2)}`]),
    fileName: `accounts-${business.name.replace(/\s+/g, "-").toLowerCase()}`,
    summary: [
      { label: "Income", value: `$${income.toFixed(2)}` },
      { label: "Expenses", value: `$${spend.toFixed(2)}` },
      { label: "Net Profit", value: `$${profit.toFixed(2)}` },
    ],
  });

  const deptExport = () => ({
    title: `${business.name} · Department Accounts`,
    subtitle: RANGES.find(r => r.id === range)?.label,
    headers: ["Department", "Income", "Expenses", "Net Profit"],
    rows: byDepartment.map(d => [d.label, d.income.toFixed(2), d.expense.toFixed(2), d.profit.toFixed(2)]),
    fileName: `department-accounts-${business.name.replace(/\s+/g, "-").toLowerCase()}`,
    summary: [{ label: "Net Profit", value: `$${profit.toFixed(2)}` }],
  });

  const stats = [
    { label: "Total Income", value: `$${income.toFixed(2)}`, icon: TrendingUp, tone: "text-emerald-600" },
    { label: "Total Expenses", value: `$${spend.toFixed(2)}`, icon: TrendingDown, tone: "text-destructive" },
    { label: "Net Profit", value: `$${profit.toFixed(2)}`, icon: Wallet, tone: profit >= 0 ? "text-accent" : "text-destructive" },
    { label: "Profit Margin", value: `${margin.toFixed(1)}%`, icon: PieChart, tone: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}
            className="bg-card border border-border rounded-xl p-5 shadow-card-custom">
            <s.icon className={`w-5 h-5 mb-2 ${s.tone}`} />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-display font-bold mt-1 ${s.tone}`}>{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Select value={depFilter} onValueChange={setDepFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>{deps.map(d => <SelectItem key={d.id} value={d.id}>{d.icon} {d.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={range} onValueChange={setRange}>
          <SelectTrigger className="w-44"><SelectValue /></SelectTrigger>
          <SelectContent>{RANGES.map(r => <SelectItem key={r.id} value={r.id}>{r.label}</SelectItem>)}</SelectContent>
        </Select>
        <div className="flex-1" />
        <Button variant="hero" onClick={() => setExpDialog(true)}><Plus className="w-4 h-4 mr-2" /> Add Expense</Button>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview"><Landmark className="w-4 h-4 mr-1.5" /> Departments</TabsTrigger>
          <TabsTrigger value="ledger"><Receipt className="w-4 h-4 mr-1.5" /> Ledger</TabsTrigger>
          <TabsTrigger value="expenses"><TrendingDown className="w-4 h-4 mr-1.5" /> Expenses</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 space-y-3">
          <ExportBar onPdf={() => exportToPdf(deptExport())} onExcel={() => exportToExcel(deptExport())} />
          <div className="grid md:grid-cols-2 gap-4">
            {byDepartment.map((d, i) => (
              <motion.div key={d.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06, duration: 0.45 }}
                className="bg-card border border-border rounded-xl p-5 shadow-card-custom">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-display font-bold flex items-center gap-2">{d.icon} {d.label}</h3>
                  <Badge variant={d.profit >= 0 ? "secondary" : "destructive"} className="text-[10px]">
                    {d.profit >= 0 ? "Profit" : "Loss"} ${Math.abs(d.profit).toFixed(2)}
                  </Badge>
                </div>
                <div className="space-y-3">
                  <Bar label="Income" value={d.income} max={Math.max(d.income, d.expense, 1)} color="bg-emerald-500" />
                  <Bar label="Expenses" value={d.expense} max={Math.max(d.income, d.expense, 1)} color="bg-destructive" />
                </div>
              </motion.div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ledger" className="mt-4 space-y-3">
          <ExportBar onPdf={() => exportToPdf(ledgerExport())} onExcel={() => exportToExcel(ledgerExport())} />
          <div className="bg-card border border-border rounded-xl shadow-card-custom overflow-hidden">
            {entries.length === 0 ? (
              <div className="py-14 text-center text-muted-foreground"><Receipt className="w-10 h-10 mx-auto mb-3 opacity-20" /><p className="text-sm">No transactions in this period</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Dept</TableHead>
                    <TableHead>Source</TableHead><TableHead>Description</TableHead><TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.slice(0, 200).map((e, i) => (
                    <TableRow key={i}>
                      <TableCell className="text-xs">{new Date(e.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={`text-[10px] ${e.kind === "income" ? "text-emerald-600 border-emerald-600/40" : "text-destructive border-destructive/40"}`}>
                          {e.kind === "income" ? "Income" : "Expense"}
                        </Badge>
                      </TableCell>
                      <TableCell><Badge variant="secondary" className="text-[10px] capitalize">{e.department}</Badge></TableCell>
                      <TableCell className="text-xs">{e.source}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{e.description}</TableCell>
                      <TableCell className={`text-right font-bold ${e.kind === "income" ? "text-emerald-600" : "text-destructive"}`}>
                        {e.kind === "income" ? "+" : "−"}${e.amount.toFixed(2)}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="expenses" className="mt-4">
          <div className="bg-card border border-border rounded-xl shadow-card-custom overflow-hidden">
            {expenses.length === 0 ? (
              <div className="py-14 text-center text-muted-foreground"><TrendingDown className="w-10 h-10 mx-auto mb-3 opacity-20" /><p className="text-sm">No manual expenses yet</p></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Title</TableHead><TableHead>Category</TableHead>
                    <TableHead>Dept</TableHead><TableHead>Amount</TableHead><TableHead className="text-right">—</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {expenses.map(e => (
                    <TableRow key={e.id}>
                      <TableCell className="text-xs">{new Date(e.spentAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{e.title}</TableCell>
                      <TableCell className="text-xs capitalize">{e.category}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] capitalize">{e.department}</Badge></TableCell>
                      <TableCell className="font-bold text-destructive">${e.amount.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={async () => { await deleteExpense(e.id); refresh(); }}>
                          <Trash2 className="w-3.5 h-3.5 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={expDialog} onOpenChange={setExpDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add Expense</DialogTitle>
            <DialogDescription>Recorded against the selected department's account.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
              <Input validate="text" value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="e.g. Electricity bill" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                <Select value={form.category} onValueChange={v => setForm({ ...form, category: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["operations", "salary", "rent", "utilities", "maintenance", "marketing", "other"].map(c => (
                      <SelectItem key={c} value={c} className="capitalize">{c}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Department</label>
                <Select value={form.department} onValueChange={v => setForm({ ...form, department: v as Department })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{deps.filter(d => d.id !== "all").map(d => <SelectItem key={d.id} value={d.id}>{d.icon} {d.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Amount ($)</label>
              <Input type="number" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} placeholder="0.00" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Note</label>
              <Textarea rows={2} value={form.note} onChange={e => setForm({ ...form, note: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setExpDialog(false)}>Cancel</Button>
            <Button variant="hero" onClick={addExpense}>Save Expense</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Bar = ({ label, value, max, color }: { label: string; value: number; max: number; color: string }) => (
  <div>
    <div className="flex justify-between text-xs mb-1">
      <span className="font-medium">{label}</span>
      <span className="text-muted-foreground">${value.toFixed(2)}</span>
    </div>
    <div className="w-full h-2.5 rounded-full bg-muted overflow-hidden">
      <motion.div initial={{ width: 0 }} animate={{ width: `${(value / max) * 100}%` }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }} className={`h-full rounded-full ${color}`} />
    </div>
  </div>
);

export default AccountingTab;
