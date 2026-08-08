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
import { Package, Plus, Trash2, Pencil, ShoppingCart, AlertTriangle, Boxes, DollarSign, FileDown, Sheet as SheetIcon, Search } from "lucide-react";
import { toast } from "sonner";
import { Business } from "@/lib/store";
import {
  InventoryItem, Purchase, Department, getInventoryItems, saveInventoryItem, updateInventoryItem,
  deleteInventoryItem, getPurchases, savePurchase, deletePurchase, departmentsFor, defaultDepartment,
} from "@/lib/inventory";
import { exportToPdf, exportToExcel } from "@/lib/exportUtils";

interface Props { business: Business }

const emptyItem = (dep: Department) => ({
  name: "", sku: "", unit: "pcs", category: "general", department: dep,
  quantity: "0", reorderLevel: "5", costPrice: "0", sellPrice: "0", supplier: "",
});

const InventoryTab = ({ business }: Props) => {
  const deps = departmentsFor(business.type);
  const defDep = defaultDepartment(business.type);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [depFilter, setDepFilter] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [itemDialog, setItemDialog] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyItem(defDep));
  const [buyDialog, setBuyDialog] = useState(false);
  const [buyForm, setBuyForm] = useState({ itemId: "", supplier: "", quantity: "1", unitCost: "0", paymentMethod: "cash", note: "" });

  const refresh = async () => {
    setItems(await getInventoryItems(business.id));
    setPurchases(await getPurchases(business.id));
  };
  useEffect(() => { refresh(); /* eslint-disable-next-line */ }, [business.id]);

  const visibleItems = useMemo(() => items.filter(i =>
    (depFilter === "all" || i.department === depFilter) &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || i.sku.toLowerCase().includes(search.toLowerCase()))
  ), [items, depFilter, search]);

  const visiblePurchases = useMemo(() =>
    purchases.filter(p => depFilter === "all" || p.department === depFilter), [purchases, depFilter]);

  const stockValue = visibleItems.reduce((s, i) => s + i.quantity * i.costPrice, 0);
  const lowStock = visibleItems.filter(i => i.quantity <= i.reorderLevel);
  const purchaseTotal = visiblePurchases.reduce((s, p) => s + p.totalCost, 0);

  const openNew = () => { setEditId(null); setForm(emptyItem(defDep)); setItemDialog(true); };
  const openEdit = (i: InventoryItem) => {
    setEditId(i.id);
    setForm({
      name: i.name, sku: i.sku, unit: i.unit, category: i.category, department: i.department,
      quantity: String(i.quantity), reorderLevel: String(i.reorderLevel),
      costPrice: String(i.costPrice), sellPrice: String(i.sellPrice), supplier: i.supplier,
    });
    setItemDialog(true);
  };

  const saveItem = async () => {
    if (!form.name.trim()) return toast.error("Item name is required");
    const payload = {
      name: form.name.trim(), sku: form.sku, unit: form.unit, category: form.category,
      department: form.department as Department,
      quantity: Number(form.quantity) || 0, reorderLevel: Number(form.reorderLevel) || 0,
      costPrice: Number(form.costPrice) || 0, sellPrice: Number(form.sellPrice) || 0, supplier: form.supplier,
    };
    if (editId) await updateInventoryItem(editId, payload);
    else await saveInventoryItem(business.id, payload);
    toast.success(editId ? "Item updated ✅" : "Item added ✅");
    setItemDialog(false);
    refresh();
  };

  const removeItem = async (id: string, name: string) => {
    if (!confirm(`Delete "${name}"?`)) return;
    await deleteInventoryItem(id);
    toast.success("Item deleted");
    refresh();
  };

  const submitPurchase = async () => {
    const item = items.find(i => i.id === buyForm.itemId);
    if (!item) return toast.error("Select an item");
    const qty = Number(buyForm.quantity) || 0;
    if (qty <= 0) return toast.error("Quantity must be greater than 0");
    await savePurchase(business.id, {
      itemId: item.id, itemName: item.name, supplier: buyForm.supplier || item.supplier,
      quantity: qty, unitCost: Number(buyForm.unitCost) || 0, department: item.department,
      paymentMethod: buyForm.paymentMethod, note: buyForm.note,
    });
    toast.success(`Purchase recorded · ${item.name} +${qty} ${item.unit}`);
    setBuyDialog(false);
    setBuyForm({ itemId: "", supplier: "", quantity: "1", unitCost: "0", paymentMethod: "cash", note: "" });
    refresh();
  };

  const itemExport = () => ({
    title: `${business.name} · Inventory`,
    subtitle: `Department: ${deps.find(d => d.id === depFilter)?.label || "All"}`,
    headers: ["Item", "SKU", "Dept", "Qty", "Unit", "Cost", "Sell", "Stock Value", "Supplier"],
    rows: visibleItems.map(i => [i.name, i.sku || "-", i.department, i.quantity, i.unit,
      i.costPrice.toFixed(2), i.sellPrice.toFixed(2), (i.quantity * i.costPrice).toFixed(2), i.supplier || "-"]),
    fileName: `inventory-${business.name.replace(/\s+/g, "-").toLowerCase()}`,
    summary: [{ label: "Items", value: String(visibleItems.length) }, { label: "Stock Value", value: `$${stockValue.toFixed(2)}` }, { label: "Low Stock", value: String(lowStock.length) }],
  });

  const purchaseExport = () => ({
    title: `${business.name} · Purchases`,
    subtitle: `Department: ${deps.find(d => d.id === depFilter)?.label || "All"}`,
    headers: ["Date", "Item", "Dept", "Supplier", "Qty", "Unit Cost", "Total", "Paid By"],
    rows: visiblePurchases.map(p => [new Date(p.purchasedAt).toLocaleDateString(), p.itemName, p.department,
      p.supplier || "-", p.quantity, p.unitCost.toFixed(2), p.totalCost.toFixed(2), p.paymentMethod]),
    fileName: `purchases-${business.name.replace(/\s+/g, "-").toLowerCase()}`,
    summary: [{ label: "Purchases", value: String(visiblePurchases.length) }, { label: "Total Spent", value: `$${purchaseTotal.toFixed(2)}` }],
  });

  const stats = [
    { label: "Total Items", value: String(visibleItems.length), icon: Boxes, tone: "text-primary" },
    { label: "Stock Value", value: `$${stockValue.toFixed(2)}`, icon: DollarSign, tone: "text-accent" },
    { label: "Low Stock", value: String(lowStock.length), icon: AlertTriangle, tone: "text-destructive" },
    { label: "Purchases", value: `$${purchaseTotal.toFixed(2)}`, icon: ShoppingCart, tone: "text-primary" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05, duration: 0.4 }}
            className="bg-card border border-border rounded-xl p-5 shadow-card-custom">
            <s.icon className={`w-5 h-5 mb-2 ${s.tone}`} />
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-display font-bold mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search items…" value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Select value={depFilter} onValueChange={setDepFilter}>
          <SelectTrigger className="w-52"><SelectValue /></SelectTrigger>
          <SelectContent>
            {deps.map(d => <SelectItem key={d.id} value={d.id}>{d.icon} {d.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Button variant="outline" onClick={() => setBuyDialog(true)}><ShoppingCart className="w-4 h-4 mr-2" /> New Purchase</Button>
        <Button variant="hero" onClick={openNew}><Plus className="w-4 h-4 mr-2" /> Add Item</Button>
      </div>

      <Tabs defaultValue="items">
        <TabsList>
          <TabsTrigger value="items"><Package className="w-4 h-4 mr-1.5" /> Items</TabsTrigger>
          <TabsTrigger value="purchases"><ShoppingCart className="w-4 h-4 mr-1.5" /> Purchases</TabsTrigger>
        </TabsList>

        <TabsContent value="items" className="mt-4 space-y-3">
          <ExportBar onPdf={() => exportToPdf(itemExport())} onExcel={() => exportToExcel(itemExport())} />
          <div className="bg-card border border-border rounded-xl shadow-card-custom overflow-hidden">
            {visibleItems.length === 0 ? (
              <Empty icon={Package} text="No inventory items yet" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Item</TableHead><TableHead>Dept</TableHead><TableHead>Stock</TableHead>
                    <TableHead>Cost</TableHead><TableHead>Sell</TableHead><TableHead>Value</TableHead>
                    <TableHead>Supplier</TableHead><TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleItems.map(i => (
                    <TableRow key={i.id}>
                      <TableCell>
                        <p className="font-medium">{i.name}</p>
                        <p className="text-[11px] text-muted-foreground">{i.sku || i.category}</p>
                      </TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] capitalize">{i.department}</Badge></TableCell>
                      <TableCell>
                        <span className={`font-bold ${i.quantity <= i.reorderLevel ? "text-destructive" : "text-foreground"}`}>
                          {i.quantity} {i.unit}
                        </span>
                        {i.quantity <= i.reorderLevel && <p className="text-[10px] text-destructive">Reorder ≤ {i.reorderLevel}</p>}
                      </TableCell>
                      <TableCell>${i.costPrice.toFixed(2)}</TableCell>
                      <TableCell>${i.sellPrice.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-accent">${(i.quantity * i.costPrice).toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{i.supplier || "—"}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button size="icon" variant="ghost" onClick={() => openEdit(i)}><Pencil className="w-3.5 h-3.5" /></Button>
                          <Button size="icon" variant="ghost" onClick={() => removeItem(i.id, i.name)}><Trash2 className="w-3.5 h-3.5 text-destructive" /></Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </TabsContent>

        <TabsContent value="purchases" className="mt-4 space-y-3">
          <ExportBar onPdf={() => exportToPdf(purchaseExport())} onExcel={() => exportToExcel(purchaseExport())} />
          <div className="bg-card border border-border rounded-xl shadow-card-custom overflow-hidden">
            {visiblePurchases.length === 0 ? (
              <Empty icon={ShoppingCart} text="No purchases recorded yet" />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead><TableHead>Item</TableHead><TableHead>Dept</TableHead>
                    <TableHead>Supplier</TableHead><TableHead>Qty</TableHead><TableHead>Unit</TableHead>
                    <TableHead>Total</TableHead><TableHead className="text-right">—</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visiblePurchases.map(p => (
                    <TableRow key={p.id}>
                      <TableCell className="text-xs">{new Date(p.purchasedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="font-medium">{p.itemName}</TableCell>
                      <TableCell><Badge variant="outline" className="text-[10px] capitalize">{p.department}</Badge></TableCell>
                      <TableCell className="text-xs">{p.supplier || "—"}</TableCell>
                      <TableCell>{p.quantity}</TableCell>
                      <TableCell>${p.unitCost.toFixed(2)}</TableCell>
                      <TableCell className="font-bold text-accent">${p.totalCost.toFixed(2)}</TableCell>
                      <TableCell className="text-right">
                        <Button size="icon" variant="ghost" onClick={async () => { await deletePurchase(p.id); refresh(); }}>
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

      {/* Item dialog */}
      <Dialog open={itemDialog} onOpenChange={setItemDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editId ? "Edit Item" : "New Inventory Item"}</DialogTitle>
            <DialogDescription>Stock items feed purchases and the accounting reports.</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Item Name" className="col-span-2">
              <Input validate="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Coffee Beans" />
            </Field>
            <Field label="SKU / Code"><Input value={form.sku} onChange={e => setForm({ ...form, sku: e.target.value })} placeholder="e.g. CB-001" /></Field>
            <Field label="Unit"><Input validate="text" value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} placeholder="kg, pcs, ltr" /></Field>
            <Field label="Category"><Input validate="text" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} /></Field>
            <Field label="Department">
              <Select value={form.department} onValueChange={v => setForm({ ...form, department: v as Department })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {deps.filter(d => d.id !== "all").map(d => <SelectItem key={d.id} value={d.id}>{d.icon} {d.label}</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Quantity"><Input type="number" value={form.quantity} onChange={e => setForm({ ...form, quantity: e.target.value })} /></Field>
            <Field label="Reorder Level"><Input type="number" value={form.reorderLevel} onChange={e => setForm({ ...form, reorderLevel: e.target.value })} /></Field>
            <Field label="Cost Price ($)"><Input type="number" value={form.costPrice} onChange={e => setForm({ ...form, costPrice: e.target.value })} /></Field>
            <Field label="Sell Price ($)"><Input type="number" value={form.sellPrice} onChange={e => setForm({ ...form, sellPrice: e.target.value })} /></Field>
            <Field label="Supplier" className="col-span-2"><Input value={form.supplier} onChange={e => setForm({ ...form, supplier: e.target.value })} /></Field>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setItemDialog(false)}>Cancel</Button>
            <Button variant="hero" onClick={saveItem}>{editId ? "Save Changes" : "Add Item"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Purchase dialog */}
      <Dialog open={buyDialog} onOpenChange={setBuyDialog}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>🛒 Record Purchase</DialogTitle>
            <DialogDescription>Stock increases automatically and the cost is posted to accounting.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Field label="Inventory Item">
              <Select value={buyForm.itemId} onValueChange={v => {
                const it = items.find(i => i.id === v);
                setBuyForm({ ...buyForm, itemId: v, unitCost: it ? String(it.costPrice) : buyForm.unitCost, supplier: it?.supplier || buyForm.supplier });
              }}>
                <SelectTrigger><SelectValue placeholder="Select item" /></SelectTrigger>
                <SelectContent>
                  {items.map(i => <SelectItem key={i.id} value={i.id}>{i.name} ({i.quantity} {i.unit})</SelectItem>)}
                </SelectContent>
              </Select>
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Quantity"><Input type="number" value={buyForm.quantity} onChange={e => setBuyForm({ ...buyForm, quantity: e.target.value })} /></Field>
              <Field label="Unit Cost ($)"><Input type="number" value={buyForm.unitCost} onChange={e => setBuyForm({ ...buyForm, unitCost: e.target.value })} /></Field>
              <Field label="Supplier"><Input value={buyForm.supplier} onChange={e => setBuyForm({ ...buyForm, supplier: e.target.value })} /></Field>
              <Field label="Paid By">
                <Select value={buyForm.paymentMethod} onValueChange={v => setBuyForm({ ...buyForm, paymentMethod: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">💵 Cash</SelectItem>
                    <SelectItem value="card">💳 Card</SelectItem>
                    <SelectItem value="mobile">📱 Mobile Money</SelectItem>
                    <SelectItem value="credit">🧾 Credit</SelectItem>
                  </SelectContent>
                </Select>
              </Field>
            </div>
            <Field label="Note"><Textarea value={buyForm.note} onChange={e => setBuyForm({ ...buyForm, note: e.target.value })} rows={2} /></Field>
            <div className="bg-muted/40 rounded-lg p-3 flex justify-between text-sm">
              <span className="font-medium">Total Cost</span>
              <span className="font-display font-bold text-accent">
                ${((Number(buyForm.quantity) || 0) * (Number(buyForm.unitCost) || 0)).toFixed(2)}
              </span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBuyDialog(false)}>Cancel</Button>
            <Button variant="hero" onClick={submitPurchase}>Save Purchase</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export const ExportBar = ({ onPdf, onExcel }: { onPdf: () => void; onExcel: () => void }) => (
  <div className="flex justify-end gap-2">
    <Button variant="outline" size="sm" onClick={onPdf}><FileDown className="w-3.5 h-3.5 mr-1.5" /> PDF</Button>
    <Button variant="outline" size="sm" onClick={onExcel}><SheetIcon className="w-3.5 h-3.5 mr-1.5" /> Excel</Button>
  </div>
);

const Field = ({ label, children, className = "" }: { label: string; children: React.ReactNode; className?: string }) => (
  <div className={className}>
    <label className="text-xs font-medium text-muted-foreground mb-1 block">{label}</label>
    {children}
  </div>
);

const Empty = ({ icon: Icon, text }: { icon: any; text: string }) => (
  <div className="py-14 text-center text-muted-foreground">
    <Icon className="w-10 h-10 mx-auto mb-3 opacity-20" />
    <p className="text-sm">{text}</p>
  </div>
);

export default InventoryTab;
