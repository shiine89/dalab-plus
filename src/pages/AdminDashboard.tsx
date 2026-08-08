import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Plus, Pencil, Trash2, Search, QrCode, Download, Bell, HelpCircle,
  Upload, ImageIcon, Printer, ExternalLink, Copy, X, MessageSquare, Check, XCircle, Volume2, Receipt, Minus, Lock,
  LayoutDashboard, UtensilsCrossed, Package, Grid3X3, ClipboardList, History, UserCog, Users, Heart, Wallet, Settings, ArrowLeft,
} from "lucide-react";
import {
  Business, Category, MenuItem, TableItem, Order,
  getCategories, saveCategory, updateCategory, deleteCategory,
  getMenuItems, saveMenuItem, updateMenuItem, deleteMenuItem,
  getTables, saveTable, updateTable, deleteTable,
  getOrders, updateOrder, saveOrder, generateId,
  getStaff, StaffMember,
} from "@/lib/store";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";
import { Textarea } from "@/components/ui/textarea";
import jsPDF from "jspdf";
import { autoTable } from "jspdf-autotable";
import { format } from "date-fns";

import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminStatsCards from "@/components/admin/AdminStatsCards";
import AdminRevenueChart from "@/components/admin/AdminRevenueChart";
import PopularItems from "@/components/admin/PopularItems";
import AdminSettings from "@/components/admin/AdminSettings";
import LoyaltyTab from "@/components/admin/LoyaltyTab";
import ReportsTab from "@/components/admin/ReportsTab";
import StaffTab from "@/components/admin/StaffTab";
import CustomersTab from "@/components/admin/CustomersTab";
import HotelManagementTab from "@/components/admin/HotelManagementTab";
import HotelReportTab from "@/components/admin/HotelReportTab";
import OrderHistoryTab from "@/components/admin/OrderHistoryTab";
import MenuManagementTab from "@/components/admin/MenuManagementTab";
import ReceiptSettings from "@/components/admin/ReceiptSettings";
import BusinessHomeTab from "@/components/admin/BusinessHomeTab";
import { printReceipt } from "@/lib/printReceipt";
import { useI18n } from "@/lib/i18n";

const emojiOptions = ["🍛","🍔","🐟","🥗","🍵","🥤","🫓","🍝","🍰","🍦","🦞","🥭","☕","🍕","🥩","🍗","🌮","🍣","🧁","🥚","🍳","🥐","🧀","🍱"];

// Admin Order component
const AdminOrderTab = ({ business, categories, menuItems, tables, onOrderPlaced }: {
  business: Business; categories: Category[]; menuItems: MenuItem[]; tables: TableItem[]; onOrderPlaced: () => void;
}) => {
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<{ id: string; name: string; price: number; quantity: number; image: string }[]>([]);
  const [selectedTable, setSelectedTable] = useState("");

  const isImageUrl = (img: string) => img.startsWith("data:") || img.startsWith("http");
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1, image: item.image }];
    });
  };
  const updateQty = (id: string, delta: number) => {
    setCart(prev => prev.map(c => c.id === id ? { ...c, quantity: Math.max(0, c.quantity + delta) } : c).filter(c => c.quantity > 0));
  };
  const cartTotal = cart.reduce((s, c) => s + c.price * c.quantity, 0);
  const filteredMenu = menuItems.filter(m => m.available)
    .filter(m => selectedCat === "all" || m.categoryId === selectedCat)
    .filter(m => m.name.toLowerCase().includes(search.toLowerCase()));

  const placeOrder = async () => {
    if (cart.length === 0) return;
    const order: Order = {
      id: generateId("ord"), businessId: business.id,
      tableId: selectedTable || "Admin", items: cart, total: cartTotal,
      status: "pending", createdAt: new Date().toISOString(),
      orderedBy: "admin",
    } as any;
    (order as any).customerName = "Admin Order";
    await saveOrder(order);
    toast.success("Admin order placed ✓");
    setCart([]); setSelectedTable("");
    onOrderPlaced();
  };

  return (
    <div className="grid lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search menu..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          <Button variant={selectedCat === "all" ? "default" : "outline"} size="sm" onClick={() => setSelectedCat("all")}>All</Button>
          {categories.map(c => (
            <Button key={c.id} variant={selectedCat === c.id ? "default" : "outline"} size="sm" onClick={() => setSelectedCat(c.id)} className="whitespace-nowrap">
              {isImageUrl(c.icon) ? "📁" : c.icon} {c.name}
            </Button>
          ))}
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredMenu.map(item => (
            <motion.div key={item.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              onClick={() => addToCart(item)}
              className="bg-card border border-border rounded-xl p-4 cursor-pointer hover:shadow-gold transition-all">
              <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-2xl mb-2 mx-auto overflow-hidden">
                {isImageUrl(item.image) ? <img src={item.image} alt="" className="w-full h-full object-cover" /> : item.image}
              </div>
              <p className="font-medium text-sm text-center">{item.name}</p>
              <p className="text-accent font-bold text-center">${item.price.toFixed(2)}</p>
            </motion.div>
          ))}
        </div>
      </div>
      <div className="lg:col-span-2">
        <div className="bg-card border border-border rounded-xl shadow-card-custom sticky top-8">
          <div className="px-5 py-4 border-b border-border">
            <h3 className="font-display font-bold">🛒 Admin Order</h3>
          </div>
          <div className="p-5 space-y-4">
            <div>
              <label className="text-xs font-medium mb-1 block">Table</label>
              <Select value={selectedTable} onValueChange={setSelectedTable}>
                <SelectTrigger className="h-9 text-sm"><SelectValue placeholder="Select table" /></SelectTrigger>
                <SelectContent>
                  {tables.map(t => <SelectItem key={t.id} value={String(t.number)}>Table #{t.number}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {cart.length === 0 ? (
              <p className="text-center py-8 text-sm text-muted-foreground">Click menu items to add</p>
            ) : (
              <div className="space-y-2">
                {cart.map(c => (
                  <div key={c.id} className="flex items-center justify-between bg-muted/50 rounded-lg px-3 py-2">
                    <span className="text-sm font-medium truncate flex-1">{c.name}</span>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(c.id, -1)}><Minus className="w-3 h-3" /></Button>
                      <span className="w-6 text-center font-bold text-sm">{c.quantity}</span>
                      <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => updateQty(c.id, 1)}><Plus className="w-3 h-3" /></Button>
                    </div>
                    <p className="font-bold text-sm ml-3">${(c.price * c.quantity).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            )}
            {cart.length > 0 && (
              <div className="border-t border-border pt-4 space-y-3">
                <div className="flex justify-between font-display font-bold text-lg">
                  <span>Total</span><span className="text-accent">${cartTotal.toFixed(2)}</span>
                </div>
                <Button variant="hero" className="w-full" onClick={placeOrder}>
                  <Check className="w-4 h-4 mr-2" /> Place Admin Order
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Cashier Report component
const CashierReportTab = ({ businessId }: { businessId: string }) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  useEffect(() => {
    const load = async () => {
      const s = await getStaff(businessId);
      setStaff(s.filter(s => s.jobTitle.toLowerCase() === "cashier"));
      setAllOrders(await getOrders(businessId));
    };
    load();
  }, [businessId]);
  const todayOrders = allOrders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Cashier Performance Report</h2>
      
      {/* Overall stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Total Cashiers", value: staff.length },
          { label: "Today's Cashier Orders", value: todayOrders.filter(o => o.orderedBy?.startsWith("cashier")).length },
          { label: "Today's Cashier Revenue", value: `$${todayOrders.filter(o => o.orderedBy?.startsWith("cashier") && o.status === "paid").reduce((s, o) => s + o.total, 0).toFixed(2)}` },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4 shadow-card-custom">
            <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
            <p className="text-2xl font-display font-bold mt-1">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Per cashier breakdown */}
      <div className="space-y-4">
        {staff.length === 0 ? (
          <div className="bg-card border border-border rounded-xl p-12 text-center">
            <p className="text-muted-foreground">No cashiers registered yet. Add staff with "Cashier" job title.</p>
          </div>
        ) : staff.map((s, i) => {
          const cashierOrders = allOrders.filter(o => o.cashierId === s.id || o.orderedBy === `cashier:${s.name}`);
          const todayCashierOrders = cashierOrders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
          const paidOrders = cashierOrders.filter(o => o.status === "paid");
          const totalRevenue = paidOrders.reduce((sum, o) => sum + o.total, 0);
          const cashTotal = paidOrders.filter(o => o.paymentMethod === "cash").reduce((sum, o) => sum + o.total, 0);
          const cardTotal = paidOrders.filter(o => o.paymentMethod === "card").reduce((sum, o) => sum + o.total, 0);
          const mobileTotal = paidOrders.filter(o => o.paymentMethod === "mobile").reduce((sum, o) => sum + o.total, 0);

          return (
            <motion.div key={s.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
              className="bg-card border border-border rounded-xl p-5 shadow-card-custom">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-lg">
                  {s.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-display font-bold">{s.name}</p>
                  <p className="text-xs text-muted-foreground">{s.shifts} shift · {s.startTime}-{s.endTime}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Orders</p>
                  <p className="font-bold text-lg">{cashierOrders.length}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Total Revenue</p>
                  <p className="font-bold text-lg text-accent">${totalRevenue.toFixed(2)}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Today Orders</p>
                  <p className="font-bold text-lg">{todayCashierOrders.length}</p>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <p className="text-xs text-muted-foreground">Paid Orders</p>
                  <p className="font-bold text-lg">{paidOrders.length}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-4 text-xs text-muted-foreground">
                <span>💵 Cash: ${cashTotal.toFixed(2)}</span>
                <span>💳 Card: ${cardTotal.toFixed(2)}</span>
                <span>📱 Mobile: ${mobileTotal.toFixed(2)}</span>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { t, lang } = useI18n();
  const [business, setBusiness] = useState<Business | null>(null);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [collapsed, setCollapsed] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItemsState] = useState<MenuItem[]>([]);
  const [tables, setTables] = useState<TableItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [catDialog, setCatDialog] = useState(false);
  const [menuDialog, setMenuDialog] = useState(false);
  const [tableDialog, setTableDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [editingMenu, setEditingMenu] = useState<MenuItem | null>(null);
  const [editingTable, setEditingTable] = useState<TableItem | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);
  const [catForm, setCatForm] = useState({ name: "", icon: "🍛" });
  const [menuForm, setMenuForm] = useState({ name: "", description: "", price: "", categoryId: "", image: "🍛", available: true });
  const [tableForm, setTableForm] = useState({ number: "", seats: "4" });
  const [searchQuery, setSearchQuery] = useState("");
  const [notifications, setNotifications] = useState<{ id: string; text: string; time: string; read: boolean }[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [readNotificationIds, setReadNotificationIds] = useState<Set<string>>(() => {
    try {
      const stored = localStorage.getItem("dp_read_notifications");
      return stored ? new Set(JSON.parse(stored)) : new Set();
    } catch { return new Set(); }
  });
  const readNotificationIdsRef = useRef(readNotificationIds);
  useEffect(() => { readNotificationIdsRef.current = readNotificationIds; }, [readNotificationIds]);
  const [showHelp, setShowHelp] = useState(false);
  const [imageMode, setImageMode] = useState<"emoji" | "upload">("emoji");
  const [catImageMode, setCatImageMode] = useState<"emoji" | "upload">("emoji");
  const menuImageRef = useRef<HTMLInputElement>(null);
  const catImageRef = useRef<HTMLInputElement>(null);
  const [feedbackDialog, setFeedbackDialog] = useState<{ orderId: string; customerName: string } | null>(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [orderFilter, setOrderFilter] = useState("all");
  const prevOrderCountRef = useRef(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("dp_active_business");
    if (stored) setBusiness(JSON.parse(stored));
    else navigate("/login");
  }, [navigate]);

  useEffect(() => {
    if (business) {
      refreshData();
      const interval = setInterval(refreshData, 5000);
      return () => clearInterval(interval);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [business?.id]);

  const [hasNewNotification, setHasNewNotification] = useState(false);
  const [flashOrder, setFlashOrder] = useState(false);
  const prevFeedbackCountRef = useRef(0);

  // Play order notification sound - melodic chime
  const playOrderSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.12);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.12);
        gain.gain.linearRampToValueAtTime(0.25, ctx.currentTime + i * 0.12 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.12 + 0.4);
        osc.start(ctx.currentTime + i * 0.12);
        osc.stop(ctx.currentTime + i * 0.12 + 0.4);
      });
    } catch (e) { /* silently fail */ }
  };

  // Play feedback notification sound - gentle bell
  const playFeedbackSound = () => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      const notes = [880, 1108.73, 880]; // A5, C#6, A5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = "triangle";
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.15);
        gain.gain.setValueAtTime(0, ctx.currentTime + i * 0.15);
        gain.gain.linearRampToValueAtTime(0.2, ctx.currentTime + i * 0.15 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.15 + 0.35);
        osc.start(ctx.currentTime + i * 0.15);
        osc.stop(ctx.currentTime + i * 0.15 + 0.35);
      });
    } catch (e) { /* silently fail */ }
  };

  const refreshData = async () => {
    if (!business) return;
    setCategories(await getCategories(business.id));
    setMenuItemsState(await getMenuItems(business.id));
    setTables(await getTables(business.id));
    const currentOrders = await getOrders(business.id);
    
    // Check for new orders and play sound
    if (prevOrderCountRef.current > 0 && currentOrders.length > prevOrderCountRef.current) {
      const newCount = currentOrders.length - prevOrderCountRef.current;
      playOrderSound();
      setHasNewNotification(true);
      setFlashOrder(true);
      setTimeout(() => setFlashOrder(false), 3000);
      toast.success(lang === "so" ? `🔔 ${newCount} dalab cusub ayaa soo galay!` : `🔔 ${newCount} new order(s) received!`, { duration: 5000 });
    }
    prevOrderCountRef.current = currentOrders.length;

    // Check for new customer feedback/messages
    const allMessages = JSON.parse(localStorage.getItem("dp_order_messages") || "[]");
    const customerMessages = allMessages.filter((msg: any) => msg.businessId === business.id && msg.from === "customer");
    if (prevFeedbackCountRef.current > 0 && customerMessages.length > prevFeedbackCountRef.current) {
      playFeedbackSound();
      setHasNewNotification(true);
      toast.info(lang === "so" ? "💬 Macmiil cusub ayaa fariin ku soo diray!" : "💬 New customer message received!", { duration: 5000 });
    }
    prevFeedbackCountRef.current = customerMessages.length;
    
    setOrders(currentOrders);
    const stored = localStorage.getItem("dp_active_business");
    if (stored) setBusiness(JSON.parse(stored));
    // Build notifications from recent orders
    const recent = currentOrders.filter(o => {
      const diff = Date.now() - new Date(o.createdAt).getTime();
      return diff < 24 * 60 * 60 * 1000;
    });
    setNotifications(recent.slice(-10).reverse().map(o => ({
      id: o.id,
      text: `${(o as any).customerName || "Guest"} - ${o.status} ($${o.total.toFixed(2)})`,
      time: new Date(o.createdAt).toLocaleTimeString(),
      read: readNotificationIdsRef.current.has(o.id),
    })));
  };

  if (!business) return null;

  const todayOrders = orders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
  const todayRevenue = todayOrders.reduce((s, o) => s + o.total, 0);
  const activeTables = tables.filter(t => t.status === "occupied").length;
  const loyaltyCount = JSON.parse(localStorage.getItem("dp_loyalty_members") || "[]").filter((m: any) => m.businessId === business.id).length;

  const isImageUrl = (img: string) => img.startsWith("data:") || img.startsWith("http");

  // Category CRUD
  const openCatDialog = (cat?: Category) => {
    if (cat) {
      setEditingCat(cat);
      setCatForm({ name: cat.name, icon: cat.icon });
      setCatImageMode(isImageUrl(cat.icon) ? "upload" : "emoji");
    } else {
      setEditingCat(null);
      setCatForm({ name: "", icon: "🍛" });
      setCatImageMode("emoji");
    }
    setCatDialog(true);
  };
  const saveCatForm = async () => {
    if (!catForm.name.trim()) return;
    if (editingCat) { await updateCategory(editingCat.id, { name: catForm.name, icon: catForm.icon }); toast.success("Category updated"); }
    else { await saveCategory({ id: generateId("cat"), businessId: business.id, name: catForm.name, icon: catForm.icon, order: categories.length }); toast.success("Category created"); }
    setCatDialog(false); await refreshData();
  };

  const handleCatImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setCatForm({ ...catForm, icon: reader.result as string });
    reader.readAsDataURL(file);
  };

  // Menu CRUD
  const openMenuDialog = (item?: MenuItem) => {
    if (item) {
      setEditingMenu(item);
      setMenuForm({ name: item.name, description: item.description, price: String(item.price), categoryId: item.categoryId, image: item.image, available: item.available });
      setImageMode(isImageUrl(item.image) ? "upload" : "emoji");
    } else {
      setEditingMenu(null);
      setMenuForm({ name: "", description: "", price: "", categoryId: categories[0]?.id || "", image: "🍛", available: true });
      setImageMode("emoji");
    }
    setMenuDialog(true);
  };
  const saveMenuForm = async () => {
    if (!menuForm.name.trim() || !menuForm.price) return;
    if (editingMenu) { await updateMenuItem(editingMenu.id, { name: menuForm.name, description: menuForm.description, price: Number(menuForm.price), categoryId: menuForm.categoryId, image: menuForm.image, available: menuForm.available }); toast.success("Menu item updated"); }
    else { await saveMenuItem({ id: generateId("item"), businessId: business.id, categoryId: menuForm.categoryId, name: menuForm.name, description: menuForm.description, price: Number(menuForm.price), image: menuForm.image, rating: 0, available: menuForm.available }); toast.success("Menu item created"); }
    setMenuDialog(false); await refreshData();
  };

  const handleMenuImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error("Max 2MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => setMenuForm({ ...menuForm, image: reader.result as string });
    reader.readAsDataURL(file);
  };

  // Table CRUD
  const openTableDialog = (t?: TableItem) => {
    if (t) { setEditingTable(t); setTableForm({ number: String(t.number), seats: String(t.seats) }); }
    else { setEditingTable(null); setTableForm({ number: String(tables.length + 1), seats: "4" }); }
    setTableDialog(true);
  };
  const saveTableForm = async () => {
    if (!tableForm.number) return;
    if (editingTable) { await updateTable(editingTable.id, { number: Number(tableForm.number), seats: Number(tableForm.seats) }); toast.success("Table updated"); }
    else { await saveTable({ id: generateId("tbl"), businessId: business.id, number: Number(tableForm.number), seats: Number(tableForm.seats), status: "available" }); toast.success("Table created"); }
    setTableDialog(false); await refreshData();
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "category") await deleteCategory(deleteConfirm.id);
    else if (deleteConfirm.type === "menu") await deleteMenuItem(deleteConfirm.id);
    else if (deleteConfirm.type === "table") await deleteTable(deleteConfirm.id);
    toast.success(`${deleteConfirm.name} deleted`);
    setDeleteConfirm(null); await refreshData();
  };

  const getCategoryName = (id: string) => categories.find(c => c.id === id)?.name || "—";
  const filteredMenuItems = menuItems.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.description.toLowerCase().includes(searchQuery.toLowerCase()));

  // Export data as PDF
  const handleExportPDF = () => {
    const doc = new jsPDF();
    let yPos = 15;
    if (business.logo && business.logo.startsWith("data:")) {
      try { doc.addImage(business.logo, "PNG", 14, yPos, 20, 20); } catch {}
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(business.name, 40, yPos + 10);
      yPos = 42;
    } else {
      doc.setFontSize(18);
      doc.setFont("helvetica", "bold");
      doc.text(business.name, 14, yPos + 5);
      yPos = 28;
    }
    doc.setFontSize(14);
    doc.text("Business Report", 14, yPos);
    yPos += 6;
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated: ${new Date().toLocaleString()}`, 14, yPos);
    yPos += 5;
    doc.text(`Total Orders: ${orders.length} | Revenue: $${orders.reduce((s, o) => s + o.total, 0).toFixed(2)} | Menu Items: ${menuItems.length} | Tables: ${tables.length}`, 14, yPos);
    yPos += 8;

    const headers = ["Order ID", "Customer", "Items", "Total", "Status", "Date"];
    const rows = orders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(o => {
      const parts = (o.orderedBy || "").split(":");
      const custName = parts.length >= 2 ? parts[1] : (o as any).customerName || "Guest";
      return [
        o.id.slice(0, 12),
        custName,
        o.items.map(i => `${i.quantity}x ${i.name}`).join(", ").slice(0, 30),
        `$${o.total.toFixed(2)}`,
        o.status || "pending",
        new Date(o.createdAt).toLocaleDateString(),
      ];
    });

    autoTable(doc, {
      startY: yPos,
      head: [headers],
      body: rows,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [41, 128, 85], textColor: 255 },
      alternateRowStyles: { fillColor: [245, 245, 245] },
    });

    doc.save(`${business.name.replace(/\s+/g, "_")}_Report_${new Date().toISOString().slice(0, 10)}.pdf`);
    toast.success("PDF exported ✓");
  };

  // Export data as CSV
  const handleExportCSV = () => {
    const headers = ["Order ID", "Customer", "Items", "Total", "Status", "Date"];
    const rows = orders.map(o => {
      const parts = (o.orderedBy || "").split(":");
      const custName = parts.length >= 2 ? parts[1] : "Guest";
      return [
        o.id,
        custName,
        `"${o.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}"`,
        o.total.toFixed(2),
        o.status || "pending",
        new Date(o.createdAt).toLocaleString(),
      ];
    });
    const csv = [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${business.name.replace(/\s+/g, "_")}_Orders_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported ✓");
  };

  // Export data as JSON
  const handleExport = () => {
    const data = {
      business: business.name,
      exportedAt: new Date().toISOString(),
      orders: orders.length,
      totalRevenue: orders.reduce((s, o) => s + o.total, 0),
      menuItems: menuItems.length,
      categories: categories.length,
      tables: tables.length,
      orderDetails: orders,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${business.name.replace(/\s+/g, "_")}_export_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exported ✓");
  };

  // Print QR
  const handlePrintQR = (tableNum: number) => {
    const url = `${window.location.origin}/register?table=${tableNum}&business=${business.id}&name=${encodeURIComponent(business.name)}`;
    const printWindow = window.open("", "_blank", "width=400,height=500");
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html><head><title>QR - Table #${tableNum}</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 40px; }
        h1 { font-size: 24px; margin-bottom: 5px; }
        h2 { font-size: 18px; color: #666; margin-bottom: 20px; }
        .qr-container { display: inline-block; padding: 20px; border: 3px solid #000; border-radius: 12px; }
        p { font-size: 12px; color: #999; margin-top: 15px; word-break: break-all; }
        .scan-text { font-size: 14px; color: #333; margin-top: 10px; font-weight: bold; }
      </style></head>
      <body>
        <h1>${business.name}</h1>
        <h2>Table #${tableNum}</h2>
        <div class="qr-container">
          <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}" width="200" height="200" />
        </div>
        <p class="scan-text">📱 Scan to order</p>
        <p>${url}</p>
        <script>window.onload = () => { window.print(); }</script>
      </body></html>
    `);
    printWindow.document.close();
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <div className="space-y-6">
            <AdminStatsCards
              todayRevenue={todayRevenue}
              totalOrders={orders.length}
              activeTables={activeTables}
              totalTables={tables.length}
              loyaltySignups={loyaltyCount}
            />
            <div className="grid lg:grid-cols-5 gap-5">
              <div className="lg:col-span-3">
                <AdminRevenueChart orders={orders} />
              </div>
              <div className="lg:col-span-2">
                <PopularItems menuItems={menuItems} orders={orders} onViewAll={() => setActiveTab("menu")} />
              </div>
            </div>
          </div>
        );

      case "home":
        return <BusinessHomeTab business={business} />;

      case "admin-order":
        return <AdminOrderTab business={business} categories={categories} menuItems={menuItems} tables={tables} onOrderPlaced={refreshData} />;

      case "menu":
        return <MenuManagementTab businessId={business.id} onDataChange={refreshData} />;

      case "categories":
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-xl font-display font-bold">Categories</h2><p className="text-sm text-muted-foreground">{categories.length} categories</p></div>
              <Button onClick={() => openCatDialog()} variant="hero"><Plus className="w-4 h-4 mr-1" /> Add Category</Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat, i) => (
                <motion.div key={cat.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-xl p-5 shadow-card-custom hover:shadow-gold transition-shadow">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden shrink-0">
                      {isImageUrl(cat.icon) ? (
                        <img src={cat.icon} alt={cat.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-3xl">{cat.icon}</span>
                      )}
                    </div>
                    <div className="flex-1"><p className="font-display font-bold">{cat.name}</p><p className="text-xs text-muted-foreground">{menuItems.filter(m => m.categoryId === cat.id).length} items</p></div>
                  </div>
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openCatDialog(cat)}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setDeleteConfirm({ type: "category", id: cat.id, name: cat.name })}><Trash2 className="w-4 h-4 text-destructive" /></Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "tables":
        return (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div><h2 className="text-xl font-display font-bold">Tables</h2><p className="text-sm text-muted-foreground">{tables.length} tables</p></div>
              <Button onClick={() => openTableDialog()} variant="hero"><Plus className="w-4 h-4 mr-1" /> New Table</Button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tables.map((t, i) => (
                <motion.div key={t.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.04 }}
                  className="bg-card border border-border rounded-xl p-5 shadow-card-custom hover:shadow-gold transition-all text-center">
                  <p className="text-3xl mb-2">🪑</p>
                  <p className="font-display font-bold">Table #{t.number}</p>
                  <p className="text-xs text-muted-foreground">{t.seats} seats</p>
                  <div className="mt-2">
                    <Select value={t.status} onValueChange={async (v) => { await updateTable(t.id, { status: v as TableItem["status"] }); await refreshData(); }}>
                      <SelectTrigger className="h-7 text-xs mx-auto w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="available">Available</SelectItem>
                        <SelectItem value="occupied">Occupied</SelectItem>
                        <SelectItem value="reserved">Reserved</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex gap-1 justify-center mt-3">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openTableDialog(t)}><Pencil className="w-3 h-3" /></Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setDeleteConfirm({ type: "table", id: t.id, name: `Table #${t.number}` })}><Trash2 className="w-3 h-3 text-destructive" /></Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        );

      case "orders": {
        const sendFeedback = () => {
          if (!feedbackDialog || !feedbackMessage.trim()) return;
          const allMessages = JSON.parse(localStorage.getItem("dp_order_messages") || "[]");
          allMessages.push({
            id: `msg-${Date.now()}`,
            orderId: feedbackDialog.orderId,
            businessId: business.id,
            from: "admin",
            message: feedbackMessage.trim(),
            createdAt: new Date().toISOString(),
          });
          localStorage.setItem("dp_order_messages", JSON.stringify(allMessages));
          toast.success(lang === "so" ? `Fariin loo diray ${feedbackDialog.customerName}` : `Message sent to ${feedbackDialog.customerName}`);
          setFeedbackMessage("");
          setFeedbackDialog(null);
        };

        const filteredOrders = orderFilter === "all" ? orders : orders.filter(o => o.status === orderFilter);
        const pendingCount = orders.filter(o => o.status === "pending").length;
        const preparingCount = orders.filter(o => o.status === "preparing").length;
        const readyCount = orders.filter(o => o.status === "ready").length;

        return (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h2 className="text-xl font-display font-bold">Orders</h2><p className="text-sm text-muted-foreground">{orders.length} orders total</p></div>
              <div className="flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-muted-foreground" />
                <span className="text-xs text-muted-foreground">Sound notifications active</span>
              </div>
            </div>

            {/* Status filter chips */}
            <div className="flex gap-2 flex-wrap">
              {[
                { key: "all", label: lang === "so" ? "Dhammaan" : "All", count: orders.length },
                { key: "pending", label: `⏳ ${lang === "so" ? "Sugaya" : "Pending"}`, count: pendingCount },
                { key: "preparing", label: `👨‍🍳 ${lang === "so" ? "Diyaarinaya" : "Preparing"}`, count: preparingCount },
                { key: "ready", label: `✅ ${lang === "so" ? "Diyaar" : "Ready"}`, count: readyCount },
                { key: "delivered", label: `📦 ${lang === "so" ? "La Geeyay" : "Delivered"}`, count: orders.filter(o => o.status === "delivered").length },
                { key: "cancelled", label: `❌ ${lang === "so" ? "La Joojiyay" : "Cancelled"}`, count: orders.filter(o => o.status === "cancelled").length },
              ].map(f => (
                <Button
                  key={f.key}
                  variant={orderFilter === f.key ? "default" : "outline"}
                  size="sm"
                  className="text-xs gap-1.5"
                  onClick={() => setOrderFilter(f.key)}
                >
                  {f.label}
                  {f.count > 0 && <Badge variant="secondary" className="text-[10px] px-1.5 py-0">{f.count}</Badge>}
                </Button>
              ))}
            </div>

            {/* Orders Cards */}
            <div className="space-y-4">
              {filteredOrders.length === 0 ? (
                <div className="bg-card border border-border rounded-xl p-12 text-center">
                  <p className="text-muted-foreground">{t.wtNoOrders || "No orders found"}</p>
                </div>
              ) : filteredOrders.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((o, i) => (
                <motion.div
                  key={o.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className={`bg-card border rounded-xl p-5 shadow-card-custom transition-all duration-300 hover:shadow-gold ${
                    flashOrder && i === 0 ? "border-accent shadow-[0_0_15px_rgba(234,179,8,0.5)] animate-pulse" :
                    o.status === "pending" ? "border-secondary/50" :
                    o.status === "preparing" ? "border-accent/50" :
                    o.status === "ready" ? "border-green-500/50" :
                    "border-border"
                  }`}
                >
                  {/* Header */}
                   <div className="flex items-start justify-between mb-4">
                      {(() => {
                        const parts = (o.orderedBy || "").split(":");
                        const custName = parts.length >= 2 ? parts[1] : (o as any).customerName || "Guest";
                        const custPhone = parts.length >= 3 ? parts[2] : (o as any).customerPhone || "";
                        return (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold">
                              {custName.charAt(0).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-display font-bold text-sm">{custName}</p>
                              <p className="text-xs text-muted-foreground">{custPhone || "—"} · Table #{o.tableId}</p>
                            </div>
                          </div>
                        );
                      })()}
                    <div className="text-right">
                      <Badge variant="secondary" className={`text-xs ${
                        o.status === "pending" ? "bg-secondary/20 text-secondary-foreground" :
                        o.status === "preparing" ? "bg-accent/20 text-accent" :
                        o.status === "ready" ? "bg-green-500/20 text-green-700" :
                        o.status === "delivered" ? "bg-muted text-muted-foreground" :
                        "bg-destructive/15 text-destructive"
                      }`}>
                        {o.status === "pending" ? `⏳ ${t.wtPending?.replace("⏳ ", "") || "Pending"}` :
                         o.status === "preparing" ? `👨‍🍳 ${t.wtPreparing?.replace("👨‍🍳 ", "") || "Preparing"}` :
                         o.status === "ready" ? `✅ ${t.wtReady?.replace("✅ ", "") || "Ready"}` :
                         o.status === "delivered" ? `📦 ${t.wtDelivered?.replace("📦 ", "") || "Delivered"}` :
                         `❌ ${t.wtCancelledCount || "Cancelled"}`}
                      </Badge>
                      <p className="text-[10px] text-muted-foreground mt-1">{new Date(o.createdAt).toLocaleTimeString()}</p>
                      <p className="text-[10px] text-muted-foreground font-mono">{o.id.slice(0, 12)}</p>
                    </div>
                  </div>

                  {/* Items */}
                  <div className="bg-muted/50 rounded-lg p-3 mb-4">
                    <div className="space-y-1.5">
                      {o.items.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm">
                          <span className="text-foreground">{item.quantity}× {item.name}</span>
                          <span className="text-muted-foreground">${(item.price * item.quantity).toFixed(2)}</span>
                        </div>
                      ))}
                    </div>
                     <div className="border-t border-border mt-2 pt-2 flex justify-between">
                       <span className="font-semibold text-sm">{t.wtTotal || "Total"}</span>
                      <span className="font-display font-bold text-accent">${o.total.toFixed(2)}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2 flex-wrap">
                    {o.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          variant="hero"
                          className="gap-1.5 text-xs"
                          onClick={async () => { await updateOrder(o.id, { status: "preparing" }); toast.success(t.csAccept ? `${t.csAccept} ✓` : "Accepted ✓"); await refreshData(); }}
                        >
                          <Check className="w-3.5 h-3.5" /> {t.csAccept || "Accept"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1.5 text-xs"
                          onClick={async () => { await updateOrder(o.id, { status: "cancelled" }); toast.info(t.csReject || "Rejected"); await refreshData(); }}
                        >
                          <XCircle className="w-3.5 h-3.5" /> {t.csReject || "Reject"}
                        </Button>
                      </>
                    )}
                    {o.status === "preparing" && (
                      <Button
                        size="sm"
                        className="gap-1.5 text-xs bg-green-600 hover:bg-green-700 text-white"
                        onClick={async () => { await updateOrder(o.id, { status: "ready" }); toast.success(t.csReadyBtn ? `${t.csReadyBtn} ✓` : "Ready ✓"); await refreshData(); }}
                      >
                        <Check className="w-3.5 h-3.5" /> {t.csReadyBtn || "Ready"}
                      </Button>
                    )}
                    {o.status === "ready" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={async () => { await updateOrder(o.id, { status: "delivered" }); toast.success(t.csServed ? `${t.csServed} ✓` : "Served ✓"); await refreshData(); }}
                      >
                        <Check className="w-3.5 h-3.5" /> {t.csServed || "Served"}
                      </Button>
                    )}
                    {o.status !== "cancelled" && o.status !== "delivered" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="gap-1.5 text-xs"
                        onClick={() => { const parts = (o.orderedBy || "").split(":"); setFeedbackDialog({ orderId: o.id, customerName: parts.length >= 2 ? parts[1] : "Guest" }); }}
                      >
                        <MessageSquare className="w-3.5 h-3.5" /> {t.wtSendMsg || "Send Message"}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 text-xs"
                      onClick={() => printReceipt({ order: o, business, servedBy: "Staff" })}
                    >
                      <Receipt className="w-3.5 h-3.5" /> Receipt
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Feedback Dialog */}
            <Dialog open={!!feedbackDialog} onOpenChange={() => { setFeedbackDialog(null); setFeedbackMessage(""); }}>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>{t.wtSendMsg || "Send Message"} {feedbackDialog?.customerName}</DialogTitle>
                  <DialogDescription>{t.wtWriteMsg || "Write your message"} #{feedbackDialog?.orderId.slice(0, 10)}</DialogDescription>
                </DialogHeader>
                <div className="space-y-3">
                  <div className="flex gap-2 flex-wrap">
                    {(lang === "so" 
                      ? ["Dalabkaaga waa la diyaarinayaa ☕", "Dalabkaaga diyaar ayuu yahay! ✅", "Fadlan sug daqiiqado yar ⏳", "Mahadsanid dalabkaaga! 🙏"]
                      : ["Your order is being prepared ☕", "Your order is ready! ✅", "Please wait a few minutes ⏳", "Thank you for your order! 🙏"]
                    ).map(q => (
                      <Button key={q} variant="outline" size="sm" className="text-xs" onClick={() => setFeedbackMessage(q)}>{q}</Button>
                    ))}
                  </div>
                  <Textarea
                    placeholder={lang === "so" ? "Qor fariintaada halkan..." : "Write your message here..."}
                    value={feedbackMessage}
                    onChange={e => setFeedbackMessage(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => { setFeedbackDialog(null); setFeedbackMessage(""); }}>{t.wtCancel || "Cancel"}</Button>
                  <Button variant="hero" onClick={sendFeedback} disabled={!feedbackMessage.trim()}>
                    <MessageSquare className="w-4 h-4 mr-1.5" /> {lang === "so" ? "U Dir" : "Send"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        );
      }

      case "order-history":
        return <OrderHistoryTab businessId={business.id} />;

      case "qr":
        return (
          <div>
            <div className="mb-6"><h2 className="text-xl font-display font-bold">QR Codes</h2><p className="text-sm text-muted-foreground">Generate scannable & printable QR codes for each table</p></div>
            {tables.length === 0 ? (
              <div className="bg-card border border-border rounded-xl p-8 text-center shadow-card-custom">
                <p className="text-muted-foreground mb-3">Create tables first!</p>
                <Button onClick={() => setActiveTab("tables")} variant="outline">Go to Tables</Button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {tables.map(t => {
                  const url = `${window.location.origin}/register?table=${t.number}&business=${business.id}&name=${encodeURIComponent(business.name)}`;
                  return (
                    <div key={t.id} className="bg-card border border-border rounded-xl p-6 shadow-card-custom text-center hover:shadow-gold transition-shadow">
                      <div className="mb-3 flex justify-center">
                        <div className="bg-white p-3 rounded-xl inline-block">
                          <QRCodeSVG
                            value={url}
                            size={160}
                            level="H"
                            includeMargin={false}
                            bgColor="#FFFFFF"
                            fgColor="#000000"
                          />
                        </div>
                      </div>
                      <p className="font-display font-bold text-lg">Table #{t.number}</p>
                      <p className="text-xs text-muted-foreground mt-1">{t.seats} seats</p>
                      <div className="flex gap-2 mt-4 justify-center">
                        <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(url); toast.success("Link copied!"); }}>
                          <Copy className="w-3.5 h-3.5 mr-1" /> Copy
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => handlePrintQR(t.number)}>
                          <Printer className="w-3.5 h-3.5 mr-1" /> Print
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => window.open(url, "_blank")}>
                          <ExternalLink className="w-3.5 h-3.5 mr-1" /> Test
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );

      case "payment-methods": {
        const paidOrders = orders.filter(o => o.status === "paid");
        const cashTotal = paidOrders.filter(o => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0);
        const cardTotal = paidOrders.filter(o => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0);
        const mobileTotal = paidOrders.filter(o => o.paymentMethod === "mobile").reduce((s, o) => s + o.total, 0);
        const totalRevAll = cashTotal + cardTotal + mobileTotal;
        const todayPaid = paidOrders.filter(o => new Date(o.createdAt).toDateString() === new Date().toDateString());
        const todayCash = todayPaid.filter(o => o.paymentMethod === "cash").reduce((s, o) => s + o.total, 0);
        const todayCard = todayPaid.filter(o => o.paymentMethod === "card").reduce((s, o) => s + o.total, 0);
        const todayMobile = todayPaid.filter(o => o.paymentMethod === "mobile").reduce((s, o) => s + o.total, 0);

        return (
          <div className="space-y-6">
            {/* Total Revenue Stats */}
            <div className="grid sm:grid-cols-4 gap-4">
              {[
                { label: "Total Revenue", value: `$${totalRevAll.toFixed(2)}`, icon: "💰", desc: `${paidOrders.length} orders` },
                { label: "Cash Revenue", value: `$${cashTotal.toFixed(2)}`, icon: "💵", desc: `${paidOrders.filter(o => o.paymentMethod === "cash").length} payments` },
                { label: "Card Revenue", value: `$${cardTotal.toFixed(2)}`, icon: "💳", desc: `${paidOrders.filter(o => o.paymentMethod === "card").length} payments` },
                { label: "Mobile Revenue", value: `$${mobileTotal.toFixed(2)}`, icon: "📱", desc: `${paidOrders.filter(o => o.paymentMethod === "mobile").length} payments` },
              ].map((s, i) => (
                <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-5 shadow-card-custom">
                  <span className="text-2xl block mb-2">{s.icon}</span>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="text-2xl font-display font-bold mt-1">{s.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{s.desc}</p>
                </motion.div>
              ))}
            </div>

            {/* Revenue Breakdown Chart */}
            <div className="grid lg:grid-cols-2 gap-6">
              <div className="bg-card border border-border rounded-xl p-6 shadow-card-custom">
                <h3 className="font-display font-bold mb-4">Revenue Breakdown (All Time)</h3>
                <div className="space-y-4">
                  {[
                    { label: "Cash", total: cashTotal, color: "bg-green-500", pct: totalRevAll ? (cashTotal / totalRevAll * 100) : 0 },
                    { label: "Card", total: cardTotal, color: "bg-blue-500", pct: totalRevAll ? (cardTotal / totalRevAll * 100) : 0 },
                    { label: "Mobile Money", total: mobileTotal, color: "bg-purple-500", pct: totalRevAll ? (mobileTotal / totalRevAll * 100) : 0 },
                  ].map(p => (
                    <div key={p.label}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="font-medium">{p.label}</span>
                        <span className="text-muted-foreground">${p.total.toFixed(2)} ({p.pct.toFixed(1)}%)</span>
                      </div>
                      <div className="w-full h-3 rounded-full bg-muted overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${p.pct}%` }}
                          transition={{ duration: 0.8, delay: 0.2 }}
                          className={`h-full rounded-full ${p.color}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-card border border-border rounded-xl p-6 shadow-card-custom">
                <h3 className="font-display font-bold mb-4">Today's Payment Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: "Cash", value: todayCash, icon: "💵", count: todayPaid.filter(o => o.paymentMethod === "cash").length },
                    { label: "Card", value: todayCard, icon: "💳", count: todayPaid.filter(o => o.paymentMethod === "card").length },
                    { label: "Mobile Money", value: todayMobile, icon: "📱", count: todayPaid.filter(o => o.paymentMethod === "mobile").length },
                  ].map(p => (
                    <div key={p.label} className="flex items-center justify-between bg-muted/50 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{p.icon}</span>
                        <div>
                          <p className="font-medium text-sm">{p.label}</p>
                          <p className="text-xs text-muted-foreground">{p.count} transactions today</p>
                        </div>
                      </div>
                      <p className="font-display font-bold text-accent text-lg">${p.value.toFixed(2)}</p>
                    </div>
                  ))}
                  <div className="border-t border-border pt-3 flex justify-between">
                    <span className="font-display font-bold">Today's Total</span>
                    <span className="font-display font-bold text-accent text-lg">${(todayCash + todayCard + todayMobile).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent paid orders */}
            <div className="bg-card border border-border rounded-xl shadow-card-custom overflow-hidden">
              <div className="px-5 py-4 border-b border-border">
                <h3 className="font-display font-bold">Recent Payments</h3>
              </div>
              {paidOrders.length === 0 ? (
                <div className="py-12 text-center text-muted-foreground">
                  <p className="text-sm">{lang === "so" ? "Wali lacag lama qaatin" : "No payments collected yet"}</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Cashier</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paidOrders.slice(-20).reverse().map(o => (
                      <TableRow key={o.id}>
                        <TableCell className="font-medium">{(o as any).customerName || "Guest"}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-[10px]">
                            {o.paymentMethod === "cash" ? "💵 Cash" : o.paymentMethod === "card" ? "💳 Card" : "📱 Mobile"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-bold text-accent">${o.total.toFixed(2)}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">{new Date(o.paidAt || o.createdAt).toLocaleString()}</TableCell>
                        <TableCell className="text-xs">{o.orderedBy || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        );
      }

      case "loyalty":
        return <LoyaltyTab businessId={business.id} />;

      case "reports":
      case "reports-sales":
      case "reports-items":
      case "reports-categories":
      case "reports-waiters": {
        const viewMap: Record<string, string> = { "reports-sales": "sales", "reports-items": "items", "reports-categories": "categories", "reports-waiters": "waiters" };
        return <ReportsTab orders={orders} menuItems={menuItems} categories={categories} businessId={business.id} initialView={viewMap[activeTab] || "sales"} />;
      }

      case "reports-cashiers":
        return <CashierReportTab businessId={business.id} />;

      case "staff":
        return <StaffTab businessId={business.id} />;

      case "customers":
        return <CustomersTab businessId={business.id} />;

      case "hotel-overview":
      case "hotel-rooms":
      case "hotel-bookings":
      case "hotel-guests": {
        const hotelViewMap: Record<string, string> = { "hotel-overview": "overview", "hotel-rooms": "rooms", "hotel-bookings": "bookings", "hotel-guests": "guests" };
        return <HotelManagementTab businessId={business.id} initialView={hotelViewMap[activeTab] || "overview"} />;
      }

      case "hotel-report-overview":
      case "hotel-report-sales":
      case "hotel-report-occupancy":
      case "hotel-report-guests": {
        const hotelReportViewMap: Record<string, string> = {
          "hotel-report-overview": "overview",
          "hotel-report-sales": "sales",
          "hotel-report-occupancy": "occupancy",
          "hotel-report-guests": "guests",
        };
        return <HotelReportTab businessId={business.id} initialView={hotelReportViewMap[activeTab] || "overview"} />;
      }

      case "settings":
        return <AdminSettings business={business} onUpdate={refreshData} />;

      case "receipt-settings": {
        const perms = business.permissions || { canManageReceipts: true };
        if (!perms.canManageReceipts) {
          return (
            <div className="bg-card border border-border rounded-xl p-12 text-center shadow-card-custom">
              <Lock className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
              <p className="font-display font-bold text-lg">Receipt Settings Disabled</p>
              <p className="text-sm text-muted-foreground mt-1">SuperAdmin has disabled this feature for your business</p>
            </div>
          );
        }
        return <ReceiptSettings business={business} />;
      }

      default:
        return null;
    }
  };

  const tabTitles: Record<string, string> = {
    dashboard: t.adDashboard,
    home: t.adBusinessHome,
    menu: t.adMenu,
    "admin-order": t.adPlaceOrder,
    categories: t.adCategoryReport,
    tables: t.adTables,
    orders: t.adOrders,
    "order-history": t.adOrderHistory,
    qr: t.adQrCodes,
    "payment-methods": t.adPaymentMethods,
    staff: t.adStaff,
    customers: t.adCustomers,
    loyalty: t.adLoyalty,
    reports: t.adReports,
    "reports-sales": t.adSalesReport,
    "reports-items": t.adItemReport,
    "reports-categories": t.adCategoryReport,
    "reports-waiters": t.adWaiterReport,
    "reports-cashiers": t.adCashierReport,
    "hotel-overview": t.adOverview,
    "hotel-rooms": t.adRooms,
    "hotel-bookings": t.adBookings,
    "hotel-guests": t.adGuests,
    "hotel-report-overview": t.adHotelReports,
    "hotel-report-sales": t.adHotelSales,
    "hotel-report-occupancy": t.adOccupancy,
    "hotel-report-guests": t.adGuestAnalytics,
    settings: t.adSettings,
    "receipt-settings": t.adReceiptSettings,
  };

  return (
    <div className="min-h-screen bg-background flex">
      <AdminSidebar
        business={business}
        activeTab={activeTab}
        setActiveTab={(t) => { setActiveTab(t); setSearchQuery(""); }}
        collapsed={collapsed}
        setCollapsed={setCollapsed}
      />

      <main className={`flex-1 transition-all duration-300 ${collapsed ? "ml-[72px]" : "ml-[240px]"}`}>
        <header className="border-b border-border bg-card/80 backdrop-blur-xl px-8 py-5 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.1, x: -2 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => navigate("/business-home")}
              className="w-9 h-9 rounded-xl bg-muted/80 hover:bg-accent/15 flex items-center justify-center text-muted-foreground hover:text-accent transition-all duration-300 border border-border/50 hover:border-accent/20 shadow-sm hover:shadow-accent/10"
              title="Back to Business Home"
            >
              <ArrowLeft className="w-4 h-4" />
            </motion.button>
            <motion.div 
              key={activeTab}
              initial={{ scale: 0.5, rotate: -180, opacity: 0 }}
              animate={{ scale: 1, rotate: 0, opacity: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 15 }}
              className="w-12 h-12 rounded-2xl bg-gradient-to-br from-accent/25 via-accent/15 to-accent/5 flex items-center justify-center shadow-lg shadow-accent/10 border border-accent/10"
            >
              {(() => {
                const iconMap: Record<string, any> = {
                  dashboard: LayoutDashboard, home: LayoutDashboard, menu: UtensilsCrossed, "admin-order": Package,
                  tables: Grid3X3, qr: QrCode, orders: ClipboardList, "order-history": History,
                  staff: UserCog, customers: Users, loyalty: Heart, "payment-methods": Wallet,
                  settings: Settings, "receipt-settings": Receipt, reports: LayoutDashboard,
                  hotel: LayoutDashboard,
                };
                const TabIcon = Object.entries(iconMap).find(([k]) => activeTab.startsWith(k))?.[1] || LayoutDashboard;
                return <TabIcon className="w-5.5 h-5.5 text-accent" />;
              })()}
            </motion.div>
            <div>
              <motion.h1 
                key={activeTab + "-title"}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="font-display font-bold text-2xl text-foreground"
              >
                {tabTitles[activeTab] || t.adDashboard}
              </motion.h1>
              <motion.p 
                key={activeTab + "-sub"}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1, duration: 0.3 }}
                className="text-sm text-muted-foreground mt-0.5"
              >
                {activeTab === "dashboard" ? t.adWelcomeBack : `${t.adManageYour} ${activeTab}`}
              </motion.p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "dashboard" && (
              <>
                <Button variant="hero" size="sm" onClick={handleExportPDF} className="group">
                  <Download className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-y-0.5" /> PDF
                </Button>
                <Button variant="outline" size="sm" onClick={handleExportCSV} className="group hover:border-accent/30 hover:bg-accent/5 transition-all duration-300">
                  <Download className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-y-0.5" /> CSV
                </Button>
                <Button variant="outline" size="sm" onClick={handleExport} className="group hover:border-accent/30 hover:bg-accent/5 transition-all duration-300">
                  <Download className="w-4 h-4 mr-1.5 transition-transform group-hover:-translate-y-0.5" /> JSON
                </Button>
                <Button variant="hero" size="sm" onClick={() => setActiveTab("orders")} className="group">
                  <Plus className="w-4 h-4 mr-1.5 transition-transform group-hover:rotate-90 duration-300" /> {t.adNewOrder}
                </Button>
              </>
            )}
            <div className="relative">
              <button
                onClick={() => {
                  setShowNotifications(!showNotifications);
                  setShowHelp(false);
                  setHasNewNotification(false);
                  const newReadIds = new Set(readNotificationIds);
                  notifications.forEach(n => newReadIds.add(n.id));
                  setReadNotificationIds(newReadIds);
                  localStorage.setItem("dp_read_notifications", JSON.stringify([...newReadIds]));
                  setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                }}
                className={`w-10 h-10 rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-accent hover:from-accent/15 hover:to-accent/5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 hover:scale-110 transition-all duration-300 relative ${hasNewNotification ? "animate-bounce" : ""}`}
              >
                <Bell className={`w-4.5 h-4.5 transition-transform duration-300 ${hasNewNotification ? "text-accent" : ""}`} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className={`absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold ring-2 ring-card ${hasNewNotification ? "animate-pulse" : ""}`}>
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-11 w-72 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                  <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                    <p className="font-semibold text-sm">{t.adNotifications}</p>
                    <button onClick={() => setShowNotifications(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                  <div className="max-h-64 overflow-y-auto">
                    {notifications.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-6">{t.adNoNotifications}</p>
                    ) : notifications.map(n => (
                      <div key={n.id} className={`px-4 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors cursor-pointer ${!n.read ? "bg-accent/5 border-l-2 border-l-accent" : ""}`}
                        onClick={() => {
                          const newReadIds = new Set(readNotificationIds);
                          newReadIds.add(n.id);
                          setReadNotificationIds(newReadIds);
                          localStorage.setItem("dp_read_notifications", JSON.stringify([...newReadIds]));
                          setNotifications(prev => prev.map(nn => nn.id === n.id ? { ...nn, read: true } : nn));
                          setActiveTab("orders");
                          setShowNotifications(false);
                        }}
                      >
                        <div className="flex items-center gap-2">
                          {!n.read && <span className="w-2 h-2 rounded-full bg-accent shrink-0" />}
                          <p className="text-xs text-foreground">{n.text}</p>
                        </div>
                        <p className="text-[10px] text-muted-foreground mt-1">{n.time}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="relative">
              <button
                onClick={() => { setShowHelp(!showHelp); setShowNotifications(false); }}
                className="w-10 h-10 rounded-xl bg-gradient-to-br from-muted to-muted/50 border border-border/50 flex items-center justify-center text-muted-foreground hover:text-accent hover:from-accent/15 hover:to-accent/5 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/10 hover:scale-110 transition-all duration-300"
              >
                <HelpCircle className="w-4.5 h-4.5" />
              </button>
              {showHelp && (
                <div className="absolute right-0 top-11 w-64 bg-card border border-border rounded-xl shadow-lg z-50 p-4">
                  <div className="flex items-center justify-between mb-3">
                    <p className="font-semibold text-sm">Help</p>
                    <button onClick={() => setShowHelp(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                  </div>
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <p>📋 <strong>Menu</strong> — Add/edit items & categories</p>
                    <p>🪑 <strong>Tables</strong> — Manage seating</p>
                    <p>📦 <strong>Orders</strong> — Track & update orders</p>
                    <p>📱 <strong>QR Codes</strong> — Print for each table</p>
                    <p>⭐ <strong>Loyalty</strong> — Manage rewards</p>
                    <p>📊 <strong>Reports</strong> — View analytics</p>
                    <p>⚙️ <strong>Settings</strong> — Business config</p>
                  </div>
                </div>
              )}
            </div>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent/20 to-accent/5 border border-accent/10 flex items-center justify-center overflow-hidden shadow-sm">
              {business.logo ? (
                <img src={business.logo} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xs font-bold text-accent">
                  {business.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </header>

        <div className="p-8">
          {renderContent()}
        </div>
      </main>

      {/* Category Dialog */}
      <Dialog open={catDialog} onOpenChange={setCatDialog}>
        <DialogContent><DialogHeader><DialogTitle>{editingCat ? "Edit Category" : "New Category"}</DialogTitle><DialogDescription>Enter category details</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium mb-1 block">Name</label><Input value={catForm.name} onChange={e => setCatForm({ ...catForm, name: e.target.value })} placeholder="e.g. Breakfast" /></div>
            <div>
              <label className="text-sm font-medium mb-2 block">Image</label>
              <div className="flex gap-2 mb-3">
                <Button type="button" variant={catImageMode === "emoji" ? "default" : "outline"} size="sm" onClick={() => setCatImageMode("emoji")}>Emoji</Button>
                <Button type="button" variant={catImageMode === "upload" ? "default" : "outline"} size="sm" onClick={() => setCatImageMode("upload")}>
                  <Upload className="w-3.5 h-3.5 mr-1" /> Upload
                </Button>
              </div>
              {catImageMode === "emoji" ? (
                <div className="flex flex-wrap gap-2">{emojiOptions.map(e => (<button key={e} type="button" onClick={() => setCatForm({ ...catForm, icon: e })} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border transition-all ${catForm.icon === e ? "border-accent bg-accent/10 shadow-gold" : "border-border hover:border-accent/50"}`}>{e}</button>))}</div>
              ) : (
                <div>
                  <input ref={catImageRef} type="file" accept="image/*" className="hidden" onChange={handleCatImageUpload} />
                  {isImageUrl(catForm.icon) ? (
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden border border-border">
                      <img src={catForm.icon} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setCatForm({ ...catForm, icon: "🍛" }); setCatImageMode("emoji"); }} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => catImageRef.current?.click()} className="w-24 h-24 rounded-xl border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-1 transition-colors">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Upload</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setCatDialog(false)}>Cancel</Button><Button onClick={saveCatForm} variant="hero">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Menu Item Dialog */}
      <Dialog open={menuDialog} onOpenChange={setMenuDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] flex flex-col"><DialogHeader className="shrink-0"><DialogTitle>{editingMenu ? "Edit Menu Item" : "New Menu Item"}</DialogTitle><DialogDescription>Enter item details</DialogDescription></DialogHeader>
          <div className="space-y-4 overflow-y-auto flex-1 pr-1">
            <div><label className="text-sm font-medium mb-1 block">Name</label><Input value={menuForm.name} onChange={e => setMenuForm({ ...menuForm, name: e.target.value })} placeholder="e.g. Chicken Burger" /></div>
            <div><label className="text-sm font-medium mb-1 block">Description</label><Input value={menuForm.description} onChange={e => setMenuForm({ ...menuForm, description: e.target.value })} placeholder="Short description" /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">Price ($)</label><Input type="number" value={menuForm.price} onChange={e => setMenuForm({ ...menuForm, price: e.target.value })} /></div>
              <div><label className="text-sm font-medium mb-1 block">Category</label>
                <Select value={menuForm.categoryId} onValueChange={v => setMenuForm({ ...menuForm, categoryId: v })}>
                  <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                  <SelectContent>{categories.map(c => <SelectItem key={c.id} value={c.id}>{isImageUrl(c.icon) ? "📁" : c.icon} {c.name}</SelectItem>)}</SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm font-medium">Available</label>
              <Switch checked={menuForm.available} onCheckedChange={v => setMenuForm({ ...menuForm, available: v })} />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Image</label>
              <div className="flex gap-2 mb-3">
                <Button type="button" variant={imageMode === "emoji" ? "default" : "outline"} size="sm" onClick={() => setImageMode("emoji")}>Emoji</Button>
                <Button type="button" variant={imageMode === "upload" ? "default" : "outline"} size="sm" onClick={() => setImageMode("upload")}>
                  <Upload className="w-3.5 h-3.5 mr-1" /> Upload Photo
                </Button>
              </div>
              {imageMode === "emoji" ? (
                <div className="flex flex-wrap gap-2">{emojiOptions.map(e => (<button key={e} type="button" onClick={() => setMenuForm({ ...menuForm, image: e })} className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border transition-all ${menuForm.image === e ? "border-accent bg-accent/10 shadow-gold" : "border-border hover:border-accent/50"}`}>{e}</button>))}</div>
              ) : (
                <div>
                  <input ref={menuImageRef} type="file" accept="image/*" className="hidden" onChange={handleMenuImageUpload} />
                  {isImageUrl(menuForm.image) ? (
                    <div className="relative w-32 h-24 rounded-xl overflow-hidden border border-border">
                      <img src={menuForm.image} alt="" className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setMenuForm({ ...menuForm, image: "🍛" }); setImageMode("emoji"); }} className="absolute top-1 right-1 w-6 h-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center"><X className="w-3 h-3" /></button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => menuImageRef.current?.click()} className="w-32 h-24 rounded-xl border-2 border-dashed border-border hover:border-accent flex flex-col items-center justify-center gap-1 transition-colors">
                      <ImageIcon className="w-6 h-6 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">Upload image</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
          <DialogFooter className="shrink-0 border-t border-border pt-4 mt-2"><Button variant="outline" onClick={() => setMenuDialog(false)}>Cancel</Button><Button onClick={saveMenuForm} variant="hero">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Table Dialog */}
      <Dialog open={tableDialog} onOpenChange={setTableDialog}>
        <DialogContent><DialogHeader><DialogTitle>{editingTable ? "Edit Table" : "New Table"}</DialogTitle><DialogDescription>Enter table details</DialogDescription></DialogHeader>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm font-medium mb-1 block">Table Number</label><Input type="number" value={tableForm.number} onChange={e => setTableForm({ ...tableForm, number: e.target.value })} /></div>
            <div><label className="text-sm font-medium mb-1 block">Seats</label><Input type="number" value={tableForm.seats} onChange={e => setTableForm({ ...tableForm, seats: e.target.value })} /></div>
          </div>
          <DialogFooter><Button variant="outline" onClick={() => setTableDialog(false)}>Cancel</Button><Button onClick={saveTableForm} variant="hero">Save</Button></DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent><DialogHeader><DialogTitle>Are you sure?</DialogTitle><DialogDescription>"{deleteConfirm?.name}" will be permanently deleted.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="destructive" onClick={confirmDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminDashboard;
