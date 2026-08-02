import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Heart, Gift, Users, TrendingUp, Star, Trash2, Pencil, Award, ShoppingBag, Trophy, Minus, Settings } from "lucide-react";
import { toast } from "sonner";
import { generateId, getOrders, Order, getLoyaltyLevels, saveLoyaltyLevels, LoyaltyLevelConfig } from "@/lib/store";
import { Textarea } from "@/components/ui/textarea";

interface LoyaltyMember {
  id: string;
  businessId: string;
  name: string;
  phone: string;
  points: number;
  visits: number;
  joinedAt: string;
}

interface LoyaltyReward {
  id: string;
  businessId: string;
  name: string;
  description: string;
  pointsCost: number;
  icon: string;
  active: boolean;
}

const LEVEL_COLORS = [
  "bg-amber-700/15 text-amber-700 border-amber-700/30",
  "bg-slate-400/15 text-slate-500 border-slate-400/30",
  "bg-yellow-500/15 text-yellow-600 border-yellow-500/30",
  "bg-purple-500/15 text-purple-600 border-purple-500/30",
];

const getLevel = (points: number, levels: LoyaltyLevelConfig[]) => levels.find(l => points >= l.min && points <= l.max) || levels[0];

// Members storage
const getLoyaltyMembers = (businessId: string): LoyaltyMember[] => {
  const all: LoyaltyMember[] = JSON.parse(localStorage.getItem("dp_loyalty_members") || "[]");
  return all.filter(m => m.businessId === businessId);
};
const saveLoyaltyMember = (member: LoyaltyMember) => {
  const all: LoyaltyMember[] = JSON.parse(localStorage.getItem("dp_loyalty_members") || "[]");
  all.push(member);
  localStorage.setItem("dp_loyalty_members", JSON.stringify(all));
};
const deleteLoyaltyMember = (id: string) => {
  const all: LoyaltyMember[] = JSON.parse(localStorage.getItem("dp_loyalty_members") || "[]");
  localStorage.setItem("dp_loyalty_members", JSON.stringify(all.filter(m => m.id !== id)));
};
const updateLoyaltyMember = (id: string, updates: Partial<LoyaltyMember>) => {
  const all: LoyaltyMember[] = JSON.parse(localStorage.getItem("dp_loyalty_members") || "[]");
  localStorage.setItem("dp_loyalty_members", JSON.stringify(all.map(m => m.id === id ? { ...m, ...updates } : m)));
};

// Rewards storage
const getLoyaltyRewards = (businessId: string): LoyaltyReward[] => {
  const all: LoyaltyReward[] = JSON.parse(localStorage.getItem("dp_loyalty_rewards") || "[]");
  return all.filter(r => r.businessId === businessId);
};
const saveLoyaltyReward = (reward: LoyaltyReward) => {
  const all: LoyaltyReward[] = JSON.parse(localStorage.getItem("dp_loyalty_rewards") || "[]");
  all.push(reward);
  localStorage.setItem("dp_loyalty_rewards", JSON.stringify(all));
};
const updateLoyaltyReward = (id: string, updates: Partial<LoyaltyReward>) => {
  const all: LoyaltyReward[] = JSON.parse(localStorage.getItem("dp_loyalty_rewards") || "[]");
  localStorage.setItem("dp_loyalty_rewards", JSON.stringify(all.map(r => r.id === id ? { ...r, ...updates } : r)));
};
const deleteLoyaltyReward = (id: string) => {
  const all: LoyaltyReward[] = JSON.parse(localStorage.getItem("dp_loyalty_rewards") || "[]");
  localStorage.setItem("dp_loyalty_rewards", JSON.stringify(all.filter(r => r.id !== id)));
};

const REWARD_ICONS = ["🎁", "☕", "🍽️", "🎂", "🧁", "🍕", "🥤", "🎉", "⭐", "💰", "🏷️", "🎊"];

interface LoyaltyTabProps {
  businessId: string;
}

const LoyaltyTab = ({ businessId }: LoyaltyTabProps) => {
  const [members, setMembers] = useState<LoyaltyMember[]>([]);
  const [rewards, setRewards] = useState<LoyaltyReward[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [levels, setLevels] = useState<LoyaltyLevelConfig[]>([]);
  const [showDialog, setShowDialog] = useState(false);
  const [editing, setEditing] = useState<LoyaltyMember | null>(null);
  const [form, setForm] = useState({ name: "", phone: "", points: "0" });
  const [viewMember, setViewMember] = useState<LoyaltyMember | null>(null);
  const [pointsDialog, setPointsDialog] = useState<{ member: LoyaltyMember; action: "add" | "subtract" } | null>(null);
  const [pointsAmount, setPointsAmount] = useState("");
  const [pointsReason, setPointsReason] = useState("");
  
  // Rewards dialog
  const [rewardDialog, setRewardDialog] = useState(false);
  const [editingReward, setEditingReward] = useState<LoyaltyReward | null>(null);
  const [rewardForm, setRewardForm] = useState({ name: "", description: "", pointsCost: "", icon: "🎁" });

  // Level editing
  const [levelDialog, setLevelDialog] = useState(false);
  const [editLevels, setEditLevels] = useState<LoyaltyLevelConfig[]>([]);

  useEffect(() => { refresh(); }, [businessId]);
  const refresh = async () => {
    setMembers(getLoyaltyMembers(businessId));
    setRewards(getLoyaltyRewards(businessId));
    setOrders(await getOrders(businessId));
    setLevels(await getLoyaltyLevels(businessId));
  };

  const getMemberOrders = (memberName: string, memberPhone: string) => {
    return orders.filter(o => {
      const cn = (o as any).customerName || "";
      const cp = (o as any).customerPhone || "";
      return cn.toLowerCase() === memberName.toLowerCase() || cp === memberPhone;
    });
  };

  // Member CRUD
  const openDialog = (member?: LoyaltyMember) => {
    if (member) {
      setEditing(member);
      setForm({ name: member.name, phone: member.phone, points: String(member.points) });
    } else {
      setEditing(null);
      setForm({ name: "", phone: "", points: "0" });
    }
    setShowDialog(true);
  };

  const handleSave = () => {
    if (!form.name.trim()) return;
    if (editing) {
      updateLoyaltyMember(editing.id, { name: form.name, phone: form.phone, points: Number(form.points) });
      toast.success("Member updated");
    } else {
      saveLoyaltyMember({
        id: generateId("loy"), businessId, name: form.name, phone: form.phone,
        points: Number(form.points), visits: 1, joinedAt: new Date().toISOString(),
      });
      toast.success("Member added");
    }
    setShowDialog(false);
    refresh();
  };

  const handleDelete = (id: string) => {
    if (!confirm("Delete this member?")) return;
    deleteLoyaltyMember(id);
    toast.success("Member removed");
    refresh();
  };

  // Points management
  const handlePointsAction = () => {
    if (!pointsDialog || !pointsAmount) return;
    const amount = Number(pointsAmount);
    const current = pointsDialog.member.points;
    const newPoints = pointsDialog.action === "add" ? current + amount : Math.max(0, current - amount);
    updateLoyaltyMember(pointsDialog.member.id, { points: newPoints });
    toast.success(`${pointsDialog.action === "add" ? "Added" : "Subtracted"} ${amount} points ${pointsReason ? `(${pointsReason})` : ""}`);
    setPointsDialog(null);
    setPointsAmount("");
    setPointsReason("");
    refresh();
  };

  // Reward CRUD
  const openRewardDialog = (reward?: LoyaltyReward) => {
    if (reward) {
      setEditingReward(reward);
      setRewardForm({ name: reward.name, description: reward.description, pointsCost: String(reward.pointsCost), icon: reward.icon });
    } else {
      setEditingReward(null);
      setRewardForm({ name: "", description: "", pointsCost: "", icon: "🎁" });
    }
    setRewardDialog(true);
  };

  const handleSaveReward = () => {
    if (!rewardForm.name.trim() || !rewardForm.pointsCost) return;
    if (editingReward) {
      updateLoyaltyReward(editingReward.id, {
        name: rewardForm.name, description: rewardForm.description,
        pointsCost: Number(rewardForm.pointsCost), icon: rewardForm.icon,
      });
      toast.success("Reward updated");
    } else {
      saveLoyaltyReward({
        id: generateId("rwd"), businessId, name: rewardForm.name,
        description: rewardForm.description, pointsCost: Number(rewardForm.pointsCost),
        icon: rewardForm.icon, active: true,
      });
      toast.success("Reward created");
    }
    setRewardDialog(false);
    refresh();
  };

  const handleDeleteReward = (id: string) => {
    if (!confirm("Delete this reward?")) return;
    deleteLoyaltyReward(id);
    toast.success("Reward deleted");
    refresh();
  };

  const totalPoints = members.reduce((s, m) => s + m.points, 0);
  const levelCounts = levels.map((l, i) => ({
    ...l, color: l.color || LEVEL_COLORS[i] || LEVEL_COLORS[0], count: members.filter(m => getLevel(m.points, levels).name === l.name).length,
  }));

  const stats = [
    { label: "Total Members", value: members.length, icon: Users, color: "text-accent", bg: "bg-accent/10" },
    { label: "Total Points", value: totalPoints, icon: Star, color: "text-accent", bg: "bg-accent/10" },
    { label: "Rewards", value: rewards.length, icon: Gift, color: "text-accent", bg: "bg-accent/10" },
    { label: "This Month", value: members.filter(m => new Date(m.joinedAt).getMonth() === new Date().getMonth()).length, icon: TrendingUp, color: "text-accent", bg: "bg-accent/10" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground">Loyalty Program</h1>
          <p className="text-sm text-muted-foreground">Manage members, points & rewards</p>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4 shadow-card-custom">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
              <div className={`w-8 h-8 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`w-4 h-4 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-display font-bold">{s.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Level Distribution */}
      <div className="grid sm:grid-cols-4 gap-3">
        {levelCounts.map((l, i) => (
          <motion.div key={l.name} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.08 }}
            className={`rounded-xl border p-4 text-center ${l.color}`}>
            <p className="text-2xl mb-1">{l.icon}</p>
            <p className="font-display font-bold text-sm">{l.name}</p>
            <p className="text-xs opacity-70">{l.min}–{l.max === Infinity ? "∞" : l.max} pts</p>
            <p className="font-bold text-lg mt-1">{l.count}</p>
            <p className="text-[10px] opacity-60">members</p>
          </motion.div>
        ))}
      </div>

      <Tabs defaultValue="members" className="space-y-4">
        <TabsList>
          <TabsTrigger value="members">Members</TabsTrigger>
          <TabsTrigger value="rewards">Rewards</TabsTrigger>
          <TabsTrigger value="levels">
            <Settings className="w-3.5 h-3.5 mr-1" /> Level Settings
          </TabsTrigger>
        </TabsList>

        {/* Members Tab */}
        <TabsContent value="members">
          <div className="flex justify-end mb-4">
            <Button onClick={() => openDialog()} variant="hero">
              <Plus className="w-4 h-4 mr-1" /> Add Member
            </Button>
          </div>
          <div className="bg-card border border-border rounded-xl shadow-card-custom overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Level</TableHead>
                  <TableHead>Points</TableHead>
                  <TableHead>Orders</TableHead>
                  <TableHead>Spent</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground py-12">
                      <Heart className="w-10 h-10 mx-auto mb-2 opacity-20" />
                      <p>No loyalty members yet</p>
                    </TableCell>
                  </TableRow>
                ) : members.map(m => {
                  const level = getLevel(m.points, levels);
                  const memberOrders = getMemberOrders(m.name, m.phone);
                  const totalSpent = memberOrders.reduce((s, o) => s + o.total, 0);
                  const nextLevel = levels.find(l => l.min > m.points);
                  const progress = nextLevel ? ((m.points - level.min) / (nextLevel.min - level.min)) * 100 : 100;

                  return (
                    <TableRow key={m.id} className="hover:bg-muted/30 transition-colors">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="font-medium">{m.name}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">{m.phone}</TableCell>
                      <TableCell>
                        <Badge className={`${level.color} border text-[10px]`}>
                          {level.icon} {level.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <span className="font-bold">{m.points}</span>
                          <div className="w-16 h-1.5 bg-muted rounded-full mt-1 overflow-hidden">
                            <div className="h-full bg-accent rounded-full transition-all" style={{ width: `${Math.min(progress, 100)}%` }} />
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <ShoppingBag className="w-3 h-3 text-muted-foreground" />
                          <span className="font-medium">{memberOrders.length}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold text-accent">${totalSpent.toFixed(2)}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">{new Date(m.joinedAt).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Add Points"
                          onClick={() => { setPointsDialog({ member: m, action: "add" }); setPointsAmount(""); setPointsReason(""); }}>
                          <Plus className="w-4 h-4 text-emerald-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" title="Subtract Points"
                          onClick={() => { setPointsDialog({ member: m, action: "subtract" }); setPointsAmount(""); setPointsReason(""); }}>
                          <Minus className="w-4 h-4 text-amber-600" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setViewMember(m)}>
                          <Award className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openDialog(m)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDelete(m.id)}>
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </TabsContent>

        {/* Rewards Tab */}
        <TabsContent value="rewards">
          <div className="flex justify-end mb-4">
            <Button onClick={() => openRewardDialog()} variant="hero">
              <Plus className="w-4 h-4 mr-1" /> Add Reward
            </Button>
          </div>
          {rewards.length === 0 ? (
            <div className="bg-card border border-border rounded-xl p-12 text-center shadow-card-custom">
              <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20 text-muted-foreground" />
              <p className="text-muted-foreground">No rewards created yet</p>
              <p className="text-xs text-muted-foreground mt-1">Create rewards that members can redeem with their points</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {rewards.map((r, i) => (
                <motion.div key={r.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className="bg-card border border-border rounded-xl p-5 shadow-card-custom hover:shadow-gold transition-all duration-300 group">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform">
                        {r.icon}
                      </div>
                      <div>
                        <p className="font-display font-bold">{r.name}</p>
                        <p className="text-xs text-muted-foreground line-clamp-2">{r.description}</p>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <Badge className="bg-accent/10 text-accent border-accent/20">
                      <Star className="w-3 h-3 mr-1" /> {r.pointsCost} points
                    </Badge>
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openRewardDialog(r)}>
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleDeleteReward(r.id)}>
                        <Trash2 className="w-3.5 h-3.5 text-destructive" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Level Settings Tab */}
        <TabsContent value="levels">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Configure loyalty level thresholds and rewards for each tier</p>
              <Button variant="hero" size="sm" onClick={() => { setEditLevels([...levels]); setLevelDialog(true); }}>
                <Pencil className="w-4 h-4 mr-1" /> Edit Levels
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {levels.map((l, i) => (
                <motion.div key={l.name} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
                  className={`rounded-xl border p-5 ${l.color || LEVEL_COLORS[i]}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-3xl">{l.icon}</span>
                    <div>
                      <p className="font-display font-bold text-lg">{l.name}</p>
                      <p className="text-xs opacity-70">{l.min} – {l.max >= 99999 ? "∞" : l.max} points</p>
                    </div>
                  </div>
                  <div className="bg-background/30 rounded-lg p-3">
                    <p className="text-xs font-semibold mb-1">🎁 Reward:</p>
                    <p className="text-sm">{l.reward}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* Add/Edit Member Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Member" : "New Loyalty Member"}</DialogTitle>
            <DialogDescription>Enter member details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div><label className="text-sm font-medium mb-1 block">Name</label><Input validate="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div><label className="text-sm font-medium mb-1 block">Phone</label><Input type="tel" inputMode="numeric" maxLength={10} value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
            <div><label className="text-sm font-medium mb-1 block">Points</label><Input type="number" value={form.points} onChange={e => setForm(f => ({ ...f, points: e.target.value }))} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="hero">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Points Add/Subtract Dialog */}
      <Dialog open={!!pointsDialog} onOpenChange={() => setPointsDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {pointsDialog?.action === "add" ? "➕ Add Points" : "➖ Subtract Points"} — {pointsDialog?.member.name}
            </DialogTitle>
            <DialogDescription>
              Current balance: {pointsDialog?.member.points} points
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Points Amount</label>
              <Input type="number" min="1" value={pointsAmount} onChange={e => setPointsAmount(e.target.value)} placeholder="e.g. 50" />
            </div>
            <div>
              <label className="text-sm font-medium mb-1 block">Reason (optional)</label>
              <Input value={pointsReason} onChange={e => setPointsReason(e.target.value)} placeholder="e.g. Birthday bonus, Reward redeemed" />
            </div>
            {pointsAmount && (
              <div className="bg-accent/10 rounded-lg p-3 text-sm">
                <p className="text-muted-foreground">New balance:</p>
                <p className="font-bold text-accent text-lg">
                  {pointsDialog?.action === "add"
                    ? (pointsDialog?.member.points || 0) + Number(pointsAmount)
                    : Math.max(0, (pointsDialog?.member.points || 0) - Number(pointsAmount))
                  } points
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPointsDialog(null)}>Cancel</Button>
            <Button onClick={handlePointsAction} variant="hero" disabled={!pointsAmount || Number(pointsAmount) <= 0}>
              {pointsDialog?.action === "add" ? "Add" : "Subtract"} Points
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Add/Edit Reward Dialog */}
      <Dialog open={rewardDialog} onOpenChange={setRewardDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingReward ? "Edit Reward" : "New Reward"}</DialogTitle>
            <DialogDescription>Create rewards members can redeem</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Icon</label>
              <div className="flex flex-wrap gap-2">
                {REWARD_ICONS.map(ic => (
                  <button key={ic} type="button" onClick={() => setRewardForm(f => ({ ...f, icon: ic }))}
                    className={`w-10 h-10 rounded-lg text-xl flex items-center justify-center border transition-all ${rewardForm.icon === ic ? "border-accent bg-accent/10 scale-110" : "border-border hover:border-accent/50"}`}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Reward Name *</label>
              <Input value={rewardForm.name} onChange={e => setRewardForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Free Coffee" /></div>
            <div><label className="text-sm font-medium mb-1 block">Description</label>
              <Textarea value={rewardForm.description} onChange={e => setRewardForm(f => ({ ...f, description: e.target.value }))} placeholder="e.g. Get a free coffee of your choice" rows={2} /></div>
            <div><label className="text-sm font-medium mb-1 block">Points Cost *</label>
              <Input type="number" value={rewardForm.pointsCost} onChange={e => setRewardForm(f => ({ ...f, pointsCost: e.target.value }))} placeholder="e.g. 100" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRewardDialog(false)}>Cancel</Button>
            <Button onClick={handleSaveReward} variant="hero">Save Reward</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Member Detail Dialog */}
      <Dialog open={!!viewMember} onOpenChange={() => setViewMember(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Member Profile</DialogTitle>
            <DialogDescription>{viewMember?.name}'s loyalty details</DialogDescription>
          </DialogHeader>
          {viewMember && (() => {
            const level = getLevel(viewMember.points, levels);
            const memberOrders = getMemberOrders(viewMember.name, viewMember.phone);
            const totalSpent = memberOrders.reduce((s, o) => s + o.total, 0);
            const nextLevel = levels.find(l => l.min > viewMember.points);
            const progress = nextLevel ? ((viewMember.points - level.min) / (nextLevel.min - level.min)) * 100 : 100;

            return (
              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center text-2xl font-bold text-accent">
                    {viewMember.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg">{viewMember.name}</p>
                    <Badge className={`${level.color} border`}>{level.icon} {level.name}</Badge>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-xl p-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span>{level.icon} {level.name}</span>
                    <span>{nextLevel ? `${nextLevel.icon} ${nextLevel.name}` : "MAX"}</span>
                  </div>
                  <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                    <div className="h-full bg-accent rounded-full transition-all duration-500" style={{ width: `${Math.min(progress, 100)}%` }} />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 text-center">
                    {nextLevel ? `${nextLevel.min - viewMember.points} points to ${nextLevel.name}` : "Maximum level reached! 🎉"}
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-card border border-border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Points</p>
                    <p className="font-bold text-lg">{viewMember.points}</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Orders</p>
                    <p className="font-bold text-lg">{memberOrders.length}</p>
                  </div>
                  <div className="bg-card border border-border rounded-lg p-3 text-center">
                    <p className="text-xs text-muted-foreground">Spent</p>
                    <p className="font-bold text-lg text-accent">${totalSpent.toFixed(2)}</p>
                  </div>
                </div>

                {/* Available rewards */}
                {rewards.length > 0 && (
                  <div>
                    <p className="font-medium text-sm mb-2">Available Rewards</p>
                    <div className="space-y-2">
                      {rewards.filter(r => r.active).map(r => (
                        <div key={r.id} className={`flex items-center justify-between p-2 rounded-lg text-sm ${viewMember.points >= r.pointsCost ? "bg-accent/5 border border-accent/20" : "bg-muted/30"}`}>
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{r.icon}</span>
                            <div>
                              <p className="font-medium text-sm">{r.name}</p>
                              <p className="text-xs text-muted-foreground">{r.pointsCost} pts</p>
                            </div>
                          </div>
                          {viewMember.points >= r.pointsCost ? (
                            <Badge className="bg-accent/10 text-accent border-accent/20 text-[10px]">Can Redeem</Badge>
                          ) : (
                            <span className="text-xs text-muted-foreground">{r.pointsCost - viewMember.points} more pts needed</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {memberOrders.length > 0 && (
                  <div>
                    <p className="font-medium text-sm mb-2">Recent Orders</p>
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {memberOrders.slice(-5).reverse().map(o => (
                        <div key={o.id} className="flex items-center justify-between p-2 rounded-lg bg-muted/30 text-sm">
                          <div>
                            <p className="text-xs text-muted-foreground">{new Date(o.createdAt).toLocaleDateString()}</p>
                            <p className="text-xs">{o.items.map(i => `${i.quantity}x ${i.name}`).join(", ")}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-accent">${o.total.toFixed(2)}</p>
                            <Badge variant="secondary" className="text-[9px]">{o.status}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Level Edit Dialog */}
      <Dialog open={levelDialog} onOpenChange={setLevelDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>⚙️ Edit Loyalty Levels</DialogTitle>
            <DialogDescription>Set thresholds and rewards for each tier</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            {editLevels.map((l, i) => (
              <div key={i} className="border border-border rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{l.icon}</span>
                  <Input value={l.name} onChange={e => {
                    const upd = [...editLevels];
                    upd[i] = { ...upd[i], name: e.target.value };
                    setEditLevels(upd);
                  }} className="h-9 font-bold" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium mb-1 block">Min Points</label>
                    <Input type="number" value={l.min} onChange={e => {
                      const upd = [...editLevels];
                      upd[i] = { ...upd[i], min: Number(e.target.value) };
                      setEditLevels(upd);
                    }} className="h-9" />
                  </div>
                  <div>
                    <label className="text-xs font-medium mb-1 block">Max Points</label>
                    <Input type="number" value={l.max >= 99999 ? "" : l.max} placeholder="∞" onChange={e => {
                      const upd = [...editLevels];
                      upd[i] = { ...upd[i], max: e.target.value ? Number(e.target.value) : 99999 };
                      setEditLevels(upd);
                    }} className="h-9" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">Icon</label>
                  <div className="flex gap-2">
                    {["🥉", "🥈", "🥇", "💎", "👑", "🏆", "⭐", "🎖️"].map(ic => (
                      <button key={ic} onClick={() => {
                        const upd = [...editLevels];
                        upd[i] = { ...upd[i], icon: ic };
                        setEditLevels(upd);
                      }} className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all ${l.icon === ic ? "border-accent bg-accent/10" : "border-border"}`}>
                        {ic}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium mb-1 block">🎁 Reward (what customer gets at this level)</label>
                  <Input value={l.reward} onChange={e => {
                    const upd = [...editLevels];
                    upd[i] = { ...upd[i], reward: e.target.value };
                    setEditLevels(upd);
                  }} placeholder="e.g. 10% discount + free drink" className="h-9" />
                </div>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLevelDialog(false)}>Cancel</Button>
            <Button variant="hero" onClick={() => {
              saveLoyaltyLevels(businessId, editLevels);
              toast.success("Loyalty levels updated!");
              setLevelDialog(false);
              refresh();
            }}>Save Levels</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LoyaltyTab;
