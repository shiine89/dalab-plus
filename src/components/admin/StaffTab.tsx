import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Search, User, Shield, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { StaffMember, getStaff, saveStaff, updateStaff, deleteStaff, generateId, setCredentialPassword } from "@/lib/store";
import { toast } from "sonner";

const JOB_TITLES = ["Waiter", "Hotel Manager", "Hotel Manager", "Chef", "Cashier", "Manager", "Cleaner", "Security", "Other"];
const SHIFTS = ["Morning", "Afternoon", "Evening", "Night", "Full Day"];

interface StaffTabProps {
  businessId: string;
}

const StaffTab = ({ businessId }: StaffTabProps) => {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [dialog, setDialog] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<StaffMember | null>(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({
    name: "", phone: "", nationality: "", jobTitle: "Waiter", customJobTitle: "",
    shifts: "Morning", startTime: "08:00", endTime: "16:00", username: "", password: "",
  });

  useEffect(() => { refresh(); }, [businessId]);
  const refresh = () => { getStaff(businessId).then(setStaff); };

  const openDialog = (s?: StaffMember) => {
    if (s) {
      setEditing(s);
      setForm({
        name: s.name, phone: s.phone, nationality: s.nationality,
        jobTitle: JOB_TITLES.includes(s.jobTitle) ? s.jobTitle : "Other",
        customJobTitle: JOB_TITLES.includes(s.jobTitle) ? "" : s.jobTitle,
        shifts: s.shifts, startTime: s.startTime, endTime: s.endTime,
        username: s.username || "", password: "",
      });
    } else {
      setEditing(null);
      setForm({ name: "", phone: "", nationality: "", jobTitle: "Waiter", customJobTitle: "", shifts: "Morning", startTime: "08:00", endTime: "16:00", username: "", password: "" });
    }
    setDialog(true);
  };

  const isLoginRole = form.jobTitle === "Waiter" || form.jobTitle === "Hotel Manager" || form.jobTitle === "Cashier" || (form.jobTitle === "Other" && (form.customJobTitle.toLowerCase().includes("waiter") || form.customJobTitle.toLowerCase().includes("hotel manager") || form.customJobTitle.toLowerCase().includes("cashier")));

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) { toast.error("Name and phone required"); return; }
    const actualTitle = form.jobTitle === "Other" ? form.customJobTitle : form.jobTitle;
    if (!actualTitle.trim()) { toast.error("Job title required"); return; }

    const data: Partial<StaffMember> = {
      name: form.name, phone: form.phone, nationality: form.nationality,
      jobTitle: actualTitle, shifts: form.shifts,
      startTime: form.startTime, endTime: form.endTime,
      username: isLoginRole ? form.username : undefined,
    };

    if (editing) {
      await updateStaff(editing.id, data);
      // If login role and a new password was typed, store it server-side
      if (isLoginRole && form.password && form.password.length >= 4) {
        await setCredentialPassword(editing.id, form.password, "staff");
      }
      toast.success("Staff updated");
    } else {
      const newId = generateId("staff");
      const insertedId = await saveStaff({ ...data, id: newId, businessId, createdAt: new Date().toISOString() } as StaffMember);
      const finalId = insertedId || newId;
      if (isLoginRole && form.password && form.password.length >= 4) {
        await setCredentialPassword(finalId, form.password, "staff");
      }
      toast.success("Staff created");
    }
    setDialog(false);
    refresh();
  };

  const handleDelete = () => {
    if (!deleteConfirm) return;
    deleteStaff(deleteConfirm.id);
    toast.success("Staff deleted");
    setDeleteConfirm(null);
    refresh();
  };

  const filtered = staff.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.jobTitle.toLowerCase().includes(search.toLowerCase())
  );

  const waiters = staff.filter(s => s.jobTitle.toLowerCase().includes("waiter"));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-display font-bold text-foreground">Staff Management</h2>
          <p className="text-sm text-muted-foreground">{staff.length} staff members • {waiters.length} waiters</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-48" />
          </div>
          <Button onClick={() => openDialog()} variant="hero">
            <Plus className="w-4 h-4 mr-1" /> Add Staff
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[
          { label: "Total Staff", value: staff.length, icon: User, color: "text-accent" },
          { label: "Waiters", value: waiters.length, icon: Shield, color: "text-accent" },
          { label: "On Shift", value: staff.filter(s => s.shifts === "Morning" || s.shifts === "Full Day").length, icon: Clock, color: "text-accent" },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl p-4 shadow-card-custom hover:shadow-gold transition-all duration-300 group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">{s.label}</p>
                <p className="text-2xl font-display font-bold mt-1">{s.value}</p>
              </div>
              <div className="w-10 h-10 rounded-lg bg-accent/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <s.icon className={`w-5 h-5 ${s.color}`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-xl shadow-card-custom overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Job Title</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Shift</TableHead>
              <TableHead>Time</TableHead>
              <TableHead>Login</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <AnimatePresence>
              {filtered.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No staff found</TableCell></TableRow>
              ) : filtered.map((s, i) => (
                <motion.tr key={s.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="border-b border-border hover:bg-muted/50 transition-colors duration-200 group">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-sm group-hover:scale-110 transition-transform duration-300">
                        {s.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium text-sm">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.nationality}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell><Badge variant="secondary" className="group-hover:bg-accent/20 transition-colors">{s.jobTitle}</Badge></TableCell>
                  <TableCell className="text-sm">{s.phone}</TableCell>
                  <TableCell><Badge variant="outline">{s.shifts}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground">{s.startTime} - {s.endTime}</TableCell>
                  <TableCell>
                    {s.username ? (
                      <span className="text-xs font-mono bg-muted px-2 py-1 rounded">{s.username}</span>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right space-x-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-accent/10 hover:text-accent transition-all duration-200" onClick={() => openDialog(s)}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive transition-all duration-200" onClick={() => setDeleteConfirm(s)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </motion.tr>
              ))}
            </AnimatePresence>
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialog} onOpenChange={setDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Staff" : "New Staff Member"}</DialogTitle>
            <DialogDescription>Fill in the staff details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <div><label className="text-sm font-medium mb-1 block">Full Name *</label>
                <Input validate="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="e.g. Ahmed Ali" /></div>
              <div><label className="text-sm font-medium mb-1 block">Phone *</label>
                <Input value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="e.g. 0612345678" /></div>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Nationality</label>
              <Input value={form.nationality} onChange={e => setForm({ ...form, nationality: e.target.value })} placeholder="e.g. Somali" /></div>
            <div>
              <label className="text-sm font-medium mb-1 block">Job Title *</label>
              <Select value={form.jobTitle} onValueChange={v => setForm({ ...form, jobTitle: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {JOB_TITLES.map(j => <SelectItem key={j} value={j}>{j}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {form.jobTitle === "Other" && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                <label className="text-sm font-medium mb-1 block">Custom Job Title *</label>
                <Input value={form.customJobTitle} onChange={e => setForm({ ...form, customJobTitle: e.target.value })} placeholder="Enter job title" />
              </motion.div>
            )}
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-sm font-medium mb-1 block">Shift</label>
                <Select value={form.shifts} onValueChange={v => setForm({ ...form, shifts: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SHIFTS.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div><label className="text-sm font-medium mb-1 block">Start Time</label>
                <Input type="time" value={form.startTime} onChange={e => setForm({ ...form, startTime: e.target.value })} /></div>
              <div><label className="text-sm font-medium mb-1 block">End Time</label>
                <Input type="time" value={form.endTime} onChange={e => setForm({ ...form, endTime: e.target.value })} /></div>
            </div>

            {isLoginRole && (() => {
              // Get business name for username domain
              const activeBiz = localStorage.getItem("dp_active_business");
              const bizName = activeBiz ? JSON.parse(activeBiz).name : "business";
              const domain = `@${bizName.replace(/\s+/g, "").toLowerCase()}.com`;

              const usernamePrefix = form.username ? form.username.split("@")[0] : "";

              return (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-accent/5 border border-accent/20 space-y-3">
                  <p className="text-sm font-semibold text-accent flex items-center gap-2">
                    <Shield className="w-4 h-4" /> {form.jobTitle === "Hotel Manager" ? "Hotel Manager Login" : form.jobTitle === "Cashier" ? "Cashier Login" : "Waiter Login"} Credentials
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {form.jobTitle === "Hotel Manager" 
                      ? "This hotel manager will be able to log in and manage hotel operations only (sub-admin)."
                      : form.jobTitle === "Cashier"
                      ? "This cashier will be able to log in and manage orders, payments, receipts & POS."
                      : "This waiter will be able to log in and place orders for customers."}
                  </p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-sm font-medium mb-1 block">Username</label>
                      <div className="relative">
                        <Input
                          value={usernamePrefix}
                          onChange={e => {
                            const val = e.target.value.replace(/[^a-zA-Z0-9._-]/g, "").toLowerCase();
                            setForm({ ...form, username: val ? `${val}${domain}` : "" });
                          }}
                          placeholder={form.jobTitle === "Hotel Manager" ? "e.g. hotel.manager1" : form.jobTitle === "Cashier" ? "e.g. cashier.ali" : "e.g. waiter.ahmed"}
                        />
                        {usernamePrefix && (
                          <p className="text-[10px] text-muted-foreground mt-1 font-mono">{usernamePrefix}{domain}</p>
                        )}
                      </div>
                    </div>
                    <div><label className="text-sm font-medium mb-1 block">Password</label>
                      <Input type="text" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="e.g. pass1234" /></div>
                  </div>
                </motion.div>
              );
            })()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialog(false)}>Cancel</Button>
            <Button onClick={handleSave} variant="hero">Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete Staff</DialogTitle><DialogDescription>"{deleteConfirm?.name}" will be permanently removed.</DialogDescription></DialogHeader>
          <DialogFooter><Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button><Button variant="destructive" onClick={handleDelete}>Delete</Button></DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StaffTab;
