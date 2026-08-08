// Inventory, Purchases & Accounting store for DALABplus+
import { supabase } from "@/integrations/supabase/client";

const db = supabase as any;

export type Department = "general" | "restaurant" | "cafe" | "hotel";

export interface InventoryItem {
  id: string;
  businessId: string;
  name: string;
  sku: string;
  unit: string;
  category: string;
  department: Department;
  quantity: number;
  reorderLevel: number;
  costPrice: number;
  sellPrice: number;
  supplier: string;
  createdAt: string;
}

export interface Purchase {
  id: string;
  businessId: string;
  itemId: string | null;
  itemName: string;
  supplier: string;
  quantity: number;
  unitCost: number;
  totalCost: number;
  department: Department;
  paymentMethod: string;
  note: string;
  purchasedAt: string;
}

export interface Expense {
  id: string;
  businessId: string;
  title: string;
  category: string;
  department: Department;
  amount: number;
  note: string;
  spentAt: string;
}

const mapItem = (r: any): InventoryItem => ({
  id: r.id,
  businessId: r.business_id,
  name: r.name,
  sku: r.sku || "",
  unit: r.unit || "pcs",
  category: r.category || "general",
  department: (r.department || "general") as Department,
  quantity: Number(r.quantity) || 0,
  reorderLevel: Number(r.reorder_level) || 0,
  costPrice: Number(r.cost_price) || 0,
  sellPrice: Number(r.sell_price) || 0,
  supplier: r.supplier || "",
  createdAt: r.created_at,
});

const mapPurchase = (r: any): Purchase => ({
  id: r.id,
  businessId: r.business_id,
  itemId: r.item_id,
  itemName: r.item_name || "",
  supplier: r.supplier || "",
  quantity: Number(r.quantity) || 0,
  unitCost: Number(r.unit_cost) || 0,
  totalCost: Number(r.total_cost) || 0,
  department: (r.department || "general") as Department,
  paymentMethod: r.payment_method || "cash",
  note: r.note || "",
  purchasedAt: r.purchased_at,
});

const mapExpense = (r: any): Expense => ({
  id: r.id,
  businessId: r.business_id,
  title: r.title,
  category: r.category || "general",
  department: (r.department || "general") as Department,
  amount: Number(r.amount) || 0,
  note: r.note || "",
  spentAt: r.spent_at,
});

/* ---------------- Inventory items ---------------- */

export const getInventoryItems = async (businessId: string): Promise<InventoryItem[]> => {
  const { data, error } = await db.from("inventory_items").select("*").eq("business_id", businessId).order("created_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(mapItem);
};

export const saveInventoryItem = async (businessId: string, item: Partial<InventoryItem>): Promise<void> => {
  const { error } = await db.from("inventory_items").insert({
    business_id: businessId,
    name: item.name,
    sku: item.sku || "",
    unit: item.unit || "pcs",
    category: item.category || "general",
    department: item.department || "general",
    quantity: item.quantity ?? 0,
    reorder_level: item.reorderLevel ?? 0,
    cost_price: item.costPrice ?? 0,
    sell_price: item.sellPrice ?? 0,
    supplier: item.supplier || "",
  });
  if (error) console.error(error);
};

export const updateInventoryItem = async (id: string, updates: Partial<InventoryItem>): Promise<void> => {
  const m: any = {};
  if (updates.name !== undefined) m.name = updates.name;
  if (updates.sku !== undefined) m.sku = updates.sku;
  if (updates.unit !== undefined) m.unit = updates.unit;
  if (updates.category !== undefined) m.category = updates.category;
  if (updates.department !== undefined) m.department = updates.department;
  if (updates.quantity !== undefined) m.quantity = updates.quantity;
  if (updates.reorderLevel !== undefined) m.reorder_level = updates.reorderLevel;
  if (updates.costPrice !== undefined) m.cost_price = updates.costPrice;
  if (updates.sellPrice !== undefined) m.sell_price = updates.sellPrice;
  if (updates.supplier !== undefined) m.supplier = updates.supplier;
  const { error } = await db.from("inventory_items").update(m).eq("id", id);
  if (error) console.error(error);
};

export const deleteInventoryItem = async (id: string): Promise<void> => {
  const { error } = await db.from("inventory_items").delete().eq("id", id);
  if (error) console.error(error);
};

/* ---------------- Purchases ---------------- */

export const getPurchases = async (businessId: string): Promise<Purchase[]> => {
  const { data, error } = await db.from("purchases").select("*").eq("business_id", businessId).order("purchased_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(mapPurchase);
};

/** Records a purchase and increases the linked inventory item stock. */
export const savePurchase = async (businessId: string, p: Partial<Purchase>): Promise<void> => {
  const qty = Number(p.quantity) || 0;
  const unitCost = Number(p.unitCost) || 0;
  const { error } = await db.from("purchases").insert({
    business_id: businessId,
    item_id: p.itemId || null,
    item_name: p.itemName || "",
    supplier: p.supplier || "",
    quantity: qty,
    unit_cost: unitCost,
    total_cost: qty * unitCost,
    department: p.department || "general",
    payment_method: p.paymentMethod || "cash",
    note: p.note || "",
    purchased_at: p.purchasedAt || new Date().toISOString(),
  });
  if (error) { console.error(error); return; }

  if (p.itemId) {
    const { data } = await db.from("inventory_items").select("quantity").eq("id", p.itemId).maybeSingle();
    const current = Number(data?.quantity) || 0;
    await db.from("inventory_items").update({ quantity: current + qty, cost_price: unitCost }).eq("id", p.itemId);
  }
};

export const deletePurchase = async (id: string): Promise<void> => {
  const { error } = await db.from("purchases").delete().eq("id", id);
  if (error) console.error(error);
};

/* ---------------- Expenses ---------------- */

export const getExpenses = async (businessId: string): Promise<Expense[]> => {
  const { data, error } = await db.from("expenses").select("*").eq("business_id", businessId).order("spent_at", { ascending: false });
  if (error) { console.error(error); return []; }
  return (data || []).map(mapExpense);
};

export const saveExpense = async (businessId: string, e: Partial<Expense>): Promise<void> => {
  const { error } = await db.from("expenses").insert({
    business_id: businessId,
    title: e.title,
    category: e.category || "general",
    department: e.department || "general",
    amount: Number(e.amount) || 0,
    note: e.note || "",
    spent_at: e.spentAt || new Date().toISOString(),
  });
  if (error) console.error(error);
};

export const deleteExpense = async (id: string): Promise<void> => {
  const { error } = await db.from("expenses").delete().eq("id", id);
  if (error) console.error(error);
};

/** Departments available for a given business type. */
export const departmentsFor = (type: string): { id: Department | "all"; label: string; icon: string }[] => {
  if (type === "hotel") return [
    { id: "all", label: "All Departments", icon: "🏢" },
    { id: "hotel", label: "Hotel", icon: "🏨" },
    { id: "restaurant", label: "Restaurant", icon: "🍽️" },
    { id: "general", label: "General", icon: "📦" },
  ];
  if (type === "cafe") return [
    { id: "all", label: "All Departments", icon: "🏢" },
    { id: "cafe", label: "Coffee Shop", icon: "☕" },
    { id: "general", label: "General", icon: "📦" },
  ];
  return [
    { id: "all", label: "All Departments", icon: "🏢" },
    { id: "restaurant", label: "Restaurant", icon: "🍽️" },
    { id: "general", label: "General", icon: "📦" },
  ];
};

export const defaultDepartment = (type: string): Department =>
  type === "hotel" ? "hotel" : type === "cafe" ? "cafe" : "restaurant";
