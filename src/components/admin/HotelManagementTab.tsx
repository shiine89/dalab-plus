import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
  Plus, Pencil, Trash2, Search, BedDouble, CalendarCheck, Users,
  DoorOpen, DoorClosed, Wrench, Eye, X, UserPlus, LogIn, LogOut,
  Calendar, Hotel, Star, TrendingUp,
} from "lucide-react";
import {
  HotelRoom, HotelBooking,
  getHotelRooms, saveHotelRoom, updateHotelRoom, deleteHotelRoom,
  getHotelBookings, saveHotelBooking, updateHotelBooking, deleteHotelBooking,
  generateId, calcRunningTotal,
} from "@/lib/store";
import { toast } from "sonner";

const roomTypes = [
  { value: "single", label: "Single", icon: "🛏️", defaultPrice: 35 },
  { value: "double", label: "Double", icon: "🛏️🛏️", defaultPrice: 55 },
  { value: "suite", label: "Suite", icon: "🏨", defaultPrice: 120 },
  { value: "deluxe", label: "Deluxe", icon: "✨", defaultPrice: 90 },
  { value: "family", label: "Family", icon: "👨‍👩‍👧‍👦", defaultPrice: 75 },
];

const amenitiesList = ["WiFi", "AC", "TV", "Mini Bar", "Balcony", "Sea View", "Room Service", "Safe", "Bathtub", "Kitchen"];

interface HotelManagementTabProps {
  businessId: string;
  initialView?: string;
}

const HotelManagementTab = ({ businessId, initialView = "overview" }: HotelManagementTabProps) => {
  const [view, setView] = useState(initialView);
  const [rooms, setRooms] = useState<HotelRoom[]>([]);
  const [bookings, setBookings] = useState<HotelBooking[]>([]);
  const [search, setSearch] = useState("");
  const [roomDialog, setRoomDialog] = useState(false);
  const [bookingDialog, setBookingDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<HotelRoom | null>(null);
  const [editingBooking, setEditingBooking] = useState<HotelBooking | null>(null);
  const [viewBooking, setViewBooking] = useState<HotelBooking | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ type: string; id: string; name: string } | null>(null);
  const [roomForm, setRoomForm] = useState({
    roomNumber: "", type: "single" as HotelRoom["type"], floor: "1",
    pricePerNight: "35", maxGuests: "2", amenities: [] as string[], image: "🛏️",
  });
  const [bookingForm, setBookingForm] = useState({
    roomId: "", guestName: "", guestPhone: "", guestEmail: "",
    guestNationality: "", idNumber: "", checkIn: "", checkOut: "",
    specialRequests: "",
  });

  useEffect(() => { refresh(); }, [businessId]);
  useEffect(() => { setView(initialView); }, [initialView]);

  const refresh = async () => {
    setRooms(await getHotelRooms(businessId));
    setBookings(await getHotelBookings(businessId));
  };

  // Stats
  const availableRooms = rooms.filter(r => r.status === "available").length;
  const occupiedRooms = rooms.filter(r => r.status === "occupied").length;
  const activeBookings = bookings.filter(b => b.status === "confirmed" || b.status === "checked-in").length;
  const todayCheckIns = bookings.filter(b => b.checkIn === new Date().toISOString().slice(0, 10) && b.status === "confirmed").length;
  const todayCheckOuts = bookings.filter(b => b.checkOut === new Date().toISOString().slice(0, 10) && b.status === "checked-in").length;
  const totalRevenue = bookings.filter(b => b.status !== "cancelled").reduce((s, b) => s + b.totalPrice, 0);

  // Room CRUD
  const openRoomDialog = (room?: HotelRoom) => {
    if (room) {
      setEditingRoom(room);
      setRoomForm({
        roomNumber: room.roomNumber, type: room.type, floor: String(room.floor),
        pricePerNight: String(room.pricePerNight), maxGuests: String(room.maxGuests),
        amenities: room.amenities, image: room.image,
      });
    } else {
      setEditingRoom(null);
      setRoomForm({ roomNumber: "", type: "single", floor: "1", pricePerNight: "35", maxGuests: "2", amenities: [], image: "🛏️" });
    }
    setRoomDialog(true);
  };

  const saveRoomForm = () => {
    if (!roomForm.roomNumber.trim()) { toast.error("Room number required"); return; }
    if (editingRoom) {
      updateHotelRoom(editingRoom.id, {
        roomNumber: roomForm.roomNumber, type: roomForm.type, floor: Number(roomForm.floor),
        pricePerNight: Number(roomForm.pricePerNight), maxGuests: Number(roomForm.maxGuests),
        amenities: roomForm.amenities, image: roomForm.image,
      });
      toast.success("Room updated");
    } else {
      saveHotelRoom({
        id: generateId("room"), businessId, roomNumber: roomForm.roomNumber, type: roomForm.type,
        floor: Number(roomForm.floor), pricePerNight: Number(roomForm.pricePerNight),
        status: "available", amenities: roomForm.amenities, image: roomForm.image,
        maxGuests: Number(roomForm.maxGuests),
      });
      toast.success("Room created");
    }
    setRoomDialog(false); refresh();
  };

  // Booking CRUD
  const openBookingDialog = (booking?: HotelBooking) => {
    if (booking) {
      setEditingBooking(booking);
      setBookingForm({
        roomId: booking.roomId, guestName: booking.guestName, guestPhone: booking.guestPhone,
        guestEmail: booking.guestEmail, guestNationality: booking.guestNationality,
        idNumber: booking.idNumber, checkIn: booking.checkIn, checkOut: booking.checkOut,
        specialRequests: booking.specialRequests,
      });
    } else {
      setEditingBooking(null);
      const today = new Date().toISOString().slice(0, 10);
      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      setBookingForm({
        roomId: rooms.find(r => r.status === "available")?.id || "",
        guestName: "", guestPhone: "", guestEmail: "", guestNationality: "",
        idNumber: "", checkIn: today, checkOut: tomorrow, specialRequests: "",
      });
    }
    setBookingDialog(true);
  };

  const calcNights = (checkIn: string, checkOut: string) => {
    const diff = new Date(checkOut).getTime() - new Date(checkIn).getTime();
    return Math.max(1, Math.ceil(diff / 86400000));
  };

  const saveBookingForm = () => {
    if (!bookingForm.roomId || !bookingForm.guestName || !bookingForm.checkIn || !bookingForm.checkOut) {
      toast.error("Please fill required fields"); return;
    }
    const room = rooms.find(r => r.id === bookingForm.roomId);
    if (!room) return;
    const nights = calcNights(bookingForm.checkIn, bookingForm.checkOut);
    const totalPrice = nights * room.pricePerNight;

    if (editingBooking) {
      updateHotelBooking(editingBooking.id, {
        ...bookingForm, nights, totalPrice,
      });
      toast.success("Booking updated");
    } else {
      saveHotelBooking({
        id: generateId("book"), businessId, ...bookingForm,
        nights, totalPrice, status: "confirmed", createdAt: new Date().toISOString(),
      });
      updateHotelRoom(bookingForm.roomId, { status: "reserved" });
      toast.success("Booking created");
    }
    setBookingDialog(false); refresh();
  };

  const handleCheckIn = (booking: HotelBooking) => {
    updateHotelBooking(booking.id, { status: "checked-in", checkedInAt: new Date().toISOString() });
    updateHotelRoom(booking.roomId, { status: "occupied" });
    toast.success(`${booking.guestName} checked in ✅`);
    refresh();
  };

  const handleCheckOut = (booking: HotelBooking) => {
    // Calculate final total based on actual stay duration
    const room = rooms.find(r => r.id === booking.roomId);
    if (room && booking.checkedInAt) {
      const { elapsedNights, runningTotal } = calcRunningTotal(booking, room.pricePerNight);
      updateHotelBooking(booking.id, { 
        status: "checked-out", 
        nights: elapsedNights, 
        totalPrice: runningTotal 
      });
      toast.success(`${booking.guestName} checked out 👋 — ${elapsedNights} night(s), $${runningTotal.toFixed(2)}`);
    } else {
      updateHotelBooking(booking.id, { status: "checked-out" });
      toast.success(`${booking.guestName} checked out 👋`);
    }
    updateHotelRoom(booking.roomId, { status: "available" });
    refresh();
  };

  const handleCancelBooking = (booking: HotelBooking) => {
    updateHotelBooking(booking.id, { status: "cancelled" });
    const room = rooms.find(r => r.id === booking.roomId);
    if (room && (room.status === "reserved" || room.status === "occupied")) {
      updateHotelRoom(booking.roomId, { status: "available" });
    }
    toast.success("Booking cancelled");
    refresh();
  };

  const handleDeleteConfirm = () => {
    if (!deleteConfirm) return;
    if (deleteConfirm.type === "room") deleteHotelRoom(deleteConfirm.id);
    else deleteHotelBooking(deleteConfirm.id);
    toast.success(`${deleteConfirm.name} deleted`);
    setDeleteConfirm(null); refresh();
  };

  const getRoomInfo = (roomId: string) => rooms.find(r => r.id === roomId);

  const statusColors: Record<string, string> = {
    available: "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    occupied: "bg-red-500/15 text-red-600 border-red-500/30",
    reserved: "bg-amber-500/15 text-amber-600 border-amber-500/30",
    maintenance: "bg-slate-500/15 text-slate-600 border-slate-500/30",
    confirmed: "bg-blue-500/15 text-blue-600 border-blue-500/30",
    "checked-in": "bg-emerald-500/15 text-emerald-600 border-emerald-500/30",
    "checked-out": "bg-slate-500/15 text-slate-600 border-slate-500/30",
    cancelled: "bg-red-500/15 text-red-600 border-red-500/30",
  };

  const statusIcon = (status: string) => {
    switch (status) {
      case "available": return <DoorOpen className="w-4 h-4" />;
      case "occupied": return <DoorClosed className="w-4 h-4" />;
      case "reserved": return <CalendarCheck className="w-4 h-4" />;
      case "maintenance": return <Wrench className="w-4 h-4" />;
      default: return null;
    }
  };

  const filteredRooms = rooms.filter(r =>
    r.roomNumber.toLowerCase().includes(search.toLowerCase()) ||
    r.type.includes(search.toLowerCase())
  );

  const filteredBookings = bookings.filter(b =>
    b.guestName.toLowerCase().includes(search.toLowerCase()) ||
    b.guestPhone.includes(search)
  );

  const renderOverview = () => (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Rooms", value: rooms.length, icon: BedDouble, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Available", value: availableRooms, icon: DoorOpen, color: "text-emerald-500", bg: "bg-emerald-500/10" },
          { label: "Occupied", value: occupiedRooms, icon: DoorClosed, color: "text-red-500", bg: "bg-red-500/10" },
          { label: "Active Bookings", value: activeBookings, icon: CalendarCheck, color: "text-amber-500", bg: "bg-amber-500/10" },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card border border-border rounded-xl p-5 shadow-card-custom hover:shadow-gold transition-all duration-300 group cursor-default">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-2xl font-display font-bold text-foreground">{stat.value}</span>
            </div>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Today's Activity */}
      <div className="grid lg:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6 shadow-card-custom">
          <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <LogIn className="w-5 h-5 text-emerald-500" /> Today's Check-ins
            <Badge variant="secondary" className="ml-auto">{todayCheckIns}</Badge>
          </h3>
          {bookings.filter(b => b.checkIn === new Date().toISOString().slice(0, 10) && b.status === "confirmed").length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No check-ins today</p>
          ) : (
            <div className="space-y-2">
              {bookings.filter(b => b.checkIn === new Date().toISOString().slice(0, 10) && b.status === "confirmed").map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium text-sm">{b.guestName}</p>
                    <p className="text-xs text-muted-foreground">Room {getRoomInfo(b.roomId)?.roomNumber} • {b.nights} nights</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleCheckIn(b)} className="text-emerald-600 border-emerald-500/30 hover:bg-emerald-500/10">
                    <LogIn className="w-3.5 h-3.5 mr-1" /> Check In
                  </Button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6 shadow-card-custom">
          <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
            <LogOut className="w-5 h-5 text-amber-500" /> Today's Check-outs
            <Badge variant="secondary" className="ml-auto">{todayCheckOuts}</Badge>
          </h3>
          {bookings.filter(b => b.checkOut === new Date().toISOString().slice(0, 10) && b.status === "checked-in").length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">No check-outs today</p>
          ) : (
            <div className="space-y-2">
              {bookings.filter(b => b.checkOut === new Date().toISOString().slice(0, 10) && b.status === "checked-in").map(b => (
                <div key={b.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                  <div>
                    <p className="font-medium text-sm">{b.guestName}</p>
                    <p className="text-xs text-muted-foreground">Room {getRoomInfo(b.roomId)?.roomNumber} • ${b.totalPrice.toFixed(2)}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => handleCheckOut(b)} className="text-amber-600 border-amber-500/30 hover:bg-amber-500/10">
                    <LogOut className="w-3.5 h-3.5 mr-1" /> Check Out
                  </Button>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Revenue & Room Floor Map */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="bg-card border border-border rounded-xl p-6 shadow-card-custom">
        <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2">
          <Hotel className="w-5 h-5 text-accent" /> Room Status Overview
        </h3>
        <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
          {rooms.map((room, i) => (
            <motion.div key={room.id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.03 }}
              className={`relative p-3 rounded-xl border text-center cursor-default transition-all duration-300 hover:scale-105 hover:shadow-lg ${statusColors[room.status]}`}>
              <p className="text-lg mb-0.5">{roomTypes.find(t => t.value === room.type)?.icon || "🛏️"}</p>
              <p className="font-bold text-xs">{room.roomNumber}</p>
              <p className="text-[10px] opacity-70 capitalize">{room.type}</p>
              <div className="absolute top-1 right-1">
                {statusIcon(room.status)}
              </div>
            </motion.div>
          ))}
          {rooms.length === 0 && (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <BedDouble className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No rooms yet. Add rooms to get started.</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => setView("rooms")}>Add Rooms</Button>
            </div>
          )}
        </div>
        {rooms.length > 0 && (
          <div className="flex gap-4 mt-4 justify-center flex-wrap">
            {["available", "occupied", "reserved", "maintenance"].map(s => (
              <div key={s} className="flex items-center gap-1.5 text-xs">
                <div className={`w-3 h-3 rounded-full border ${statusColors[s]}`} />
                <span className="capitalize text-muted-foreground">{s} ({rooms.filter(r => r.status === s).length})</span>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );

  const renderRooms = () => (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search rooms..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
        </div>
        <Button onClick={() => openRoomDialog()} variant="hero"><Plus className="w-4 h-4 mr-1" /> Add Room</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredRooms.map((room, i) => (
          <motion.div key={room.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card border border-border rounded-xl overflow-hidden shadow-card-custom hover:shadow-gold transition-all duration-300 group">
            <div className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center text-2xl shrink-0 group-hover:scale-110 transition-transform duration-300">
                    {roomTypes.find(t => t.value === room.type)?.icon || "🛏️"}
                  </div>
                  <div>
                    <p className="font-display font-bold text-lg">Room {room.roomNumber}</p>
                    <p className="text-xs text-muted-foreground capitalize">{room.type} • Floor {room.floor}</p>
                  </div>
                </div>
                <Badge className={`${statusColors[room.status]} border text-[10px]`}>{room.status}</Badge>
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="font-bold text-accent text-lg">${room.pricePerNight}<span className="text-xs text-muted-foreground font-normal">/night</span></span>
                <span className="text-xs text-muted-foreground flex items-center gap-1"><Users className="w-3 h-3" /> {room.maxGuests} guests</span>
              </div>
              {room.amenities.length > 0 && (
                <div className="flex flex-wrap gap-1 mb-3">
                  {room.amenities.slice(0, 4).map(a => (
                    <span key={a} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{a}</span>
                  ))}
                  {room.amenities.length > 4 && <span className="text-[10px] text-muted-foreground">+{room.amenities.length - 4}</span>}
                </div>
              )}
              <div className="flex gap-1.5">
                <Select value={room.status} onValueChange={v => { updateHotelRoom(room.id, { status: v as HotelRoom["status"] }); refresh(); }}>
                  <SelectTrigger className="h-8 text-xs flex-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="available">Available</SelectItem>
                    <SelectItem value="occupied">Occupied</SelectItem>
                    <SelectItem value="reserved">Reserved</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openRoomDialog(room)}><Pencil className="w-3.5 h-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setDeleteConfirm({ type: "room", id: room.id, name: `Room ${room.roomNumber}` })}>
                  <Trash2 className="w-3.5 h-3.5 text-destructive" />
                </Button>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      {filteredRooms.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <BedDouble className="w-10 h-10 mx-auto mb-3 opacity-40" />
          <p>No rooms found</p>
        </div>
      )}
    </div>
  );

  const activeBookingsList = filteredBookings.filter(b => b.status === "confirmed" || b.status === "checked-in");
  const completedBookingsList = filteredBookings.filter(b => b.status === "checked-out" || b.status === "cancelled");

  const renderBookingTable = (list: HotelBooking[], emptyMsg: string) => (
    <div className="bg-card border border-border rounded-xl shadow-card-custom overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Guest</TableHead>
            <TableHead>Room</TableHead>
            <TableHead>Check-in</TableHead>
            <TableHead>Check-out</TableHead>
            <TableHead>Nights</TableHead>
            <TableHead>Total</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {list.length === 0 ? (
            <TableRow><TableCell colSpan={8} className="text-center text-muted-foreground py-8">{emptyMsg}</TableCell></TableRow>
          ) : list.map(b => {
            const room = getRoomInfo(b.roomId);
            const isCheckedIn = b.status === "checked-in" && room;
            const { elapsedNights, runningTotal } = isCheckedIn 
              ? calcRunningTotal(b, room!.pricePerNight)
              : { elapsedNights: b.nights, runningTotal: b.totalPrice };
            return (
              <TableRow key={b.id} className="hover:bg-muted/30 transition-colors">
                <TableCell>
                  <div><p className="font-medium text-sm">{b.guestName}</p><p className="text-xs text-muted-foreground">{b.guestPhone}</p></div>
                </TableCell>
                <TableCell><Badge variant="secondary">{room ? `Room ${room.roomNumber}` : "—"}</Badge></TableCell>
                <TableCell className="text-sm">{b.checkIn}</TableCell>
                <TableCell className="text-sm">{b.checkOut}</TableCell>
                <TableCell className="text-sm font-medium">
                  {isCheckedIn ? (
                    <span className="text-accent font-bold">{elapsedNights} <span className="text-xs text-muted-foreground font-normal">(running)</span></span>
                  ) : b.nights}
                </TableCell>
                <TableCell className="font-bold text-accent">
                  ${runningTotal.toFixed(2)}
                  {isCheckedIn && elapsedNights > b.nights && (
                    <span className="block text-[10px] text-destructive">+${(runningTotal - b.totalPrice).toFixed(2)} extra</span>
                  )}
                </TableCell>
                <TableCell><Badge className={`${statusColors[b.status]} border text-[10px]`}>{b.status}</Badge></TableCell>
                <TableCell className="text-right">
                  <div className="flex gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setViewBooking(b)}><Eye className="w-3.5 h-3.5" /></Button>
                    {b.status === "confirmed" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-600" onClick={() => handleCheckIn(b)} title="Check In"><LogIn className="w-3.5 h-3.5" /></Button>
                    )}
                    {b.status === "checked-in" && (
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-amber-600" onClick={() => handleCheckOut(b)} title="Check Out"><LogOut className="w-3.5 h-3.5" /></Button>
                    )}
                    {(b.status === "confirmed" || b.status === "checked-in") && (
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleCancelBooking(b)}><X className="w-3.5 h-3.5 text-destructive" /></Button>
                    )}
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openBookingDialog(b)}><Pencil className="w-3.5 h-3.5" /></Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );

  const renderBookings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search guests..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 w-56" />
        </div>
        <Button onClick={() => openBookingDialog()} variant="hero"><Plus className="w-4 h-4 mr-1" /> New Booking</Button>
      </div>

      {/* Active Bookings */}
      <div>
        <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
          <CalendarCheck className="w-5 h-5 text-emerald-500" /> Active Bookings
          <Badge variant="secondary" className="ml-1">{activeBookingsList.length}</Badge>
        </h3>
        {renderBookingTable(activeBookingsList, "No active bookings")}
      </div>

      {/* Completed & Cancelled */}
      <div>
        <h3 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
          <LogOut className="w-5 h-5 text-muted-foreground" /> Completed & Cancelled
          <Badge variant="secondary" className="ml-1">{completedBookingsList.length}</Badge>
        </h3>
        {renderBookingTable(completedBookingsList, "No completed or cancelled bookings")}
      </div>
    </div>
  );

  const renderGuests = () => {
    const uniqueGuests = bookings.reduce((acc, b) => {
      const key = b.guestPhone || b.guestName;
      if (!acc[key]) acc[key] = { name: b.guestName, phone: b.guestPhone, email: b.guestEmail, nationality: b.guestNationality, stays: 0, totalSpent: 0 };
      acc[key].stays++;
      acc[key].totalSpent += b.totalPrice;
      return acc;
    }, {} as Record<string, { name: string; phone: string; email: string; nationality: string; stays: number; totalSpent: number }>);

    const guestList = Object.values(uniqueGuests).sort((a, b) => b.stays - a.stays);

    return (
      <div>
        <h3 className="font-display font-bold text-lg mb-4 flex items-center gap-2"><Users className="w-5 h-5 text-accent" /> Guest Directory</h3>
        <div className="bg-card border border-border rounded-xl shadow-card-custom overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Guest</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Nationality</TableHead>
                <TableHead>Total Stays</TableHead>
                <TableHead>Total Spent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {guestList.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No guests yet</TableCell></TableRow>
              ) : guestList.map((g, i) => (
                <TableRow key={i} className="hover:bg-muted/30 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-xs font-bold text-accent">
                        {g.name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase()}
                      </div>
                      <div><p className="font-medium text-sm">{g.name}</p>{g.email && <p className="text-xs text-muted-foreground">{g.email}</p>}</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm">{g.phone}</TableCell>
                  <TableCell className="text-sm">{g.nationality || "—"}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-accent" />
                      <span className="font-medium text-sm">{g.stays}</span>
                    </div>
                  </TableCell>
                  <TableCell className="font-bold text-accent">${g.totalSpent.toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    );
  };

  return (
    <div>
      {view === "overview" && renderOverview()}
      {view === "rooms" && renderRooms()}
      {view === "bookings" && renderBookings()}
      {view === "guests" && renderGuests()}

      {/* Room Dialog */}
      <Dialog open={roomDialog} onOpenChange={setRoomDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingRoom ? "Edit Room" : "Add New Room"}</DialogTitle><DialogDescription>Enter room details</DialogDescription></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Room Number *</Label><Input value={roomForm.roomNumber} onChange={e => setRoomForm({ ...roomForm, roomNumber: e.target.value })} placeholder="101" /></div>
              <div><Label className="text-xs mb-1 block">Floor</Label><Input type="number" value={roomForm.floor} onChange={e => setRoomForm({ ...roomForm, floor: e.target.value })} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs mb-1 block">Room Type</Label>
                <Select value={roomForm.type} onValueChange={v => {
                  const rt = roomTypes.find(t => t.value === v);
                  setRoomForm({ ...roomForm, type: v as HotelRoom["type"], pricePerNight: String(rt?.defaultPrice || roomForm.pricePerNight) });
                }}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{roomTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.icon} {t.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div><Label className="text-xs mb-1 block">Max Guests</Label><Input type="number" value={roomForm.maxGuests} onChange={e => setRoomForm({ ...roomForm, maxGuests: e.target.value })} /></div>
            </div>
            <div>
              <Label className="text-xs mb-1 block">Price Per Night ($)</Label>
              <Input type="number" value={roomForm.pricePerNight} onChange={e => setRoomForm({ ...roomForm, pricePerNight: e.target.value })} />
            </div>
            <div>
              <Label className="text-xs mb-2 block">Amenities</Label>
              <div className="flex flex-wrap gap-2">
                {amenitiesList.map(a => (
                  <button key={a} type="button" onClick={() => {
                    const has = roomForm.amenities.includes(a);
                    setRoomForm({ ...roomForm, amenities: has ? roomForm.amenities.filter(x => x !== a) : [...roomForm.amenities, a] });
                  }} className={`text-xs px-3 py-1.5 rounded-full border transition-all duration-200 ${roomForm.amenities.includes(a) ? "bg-accent/15 text-accent border-accent/30" : "border-border text-muted-foreground hover:border-accent/50"}`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setRoomDialog(false)}>Cancel</Button>
            <Button onClick={saveRoomForm} variant="hero">Save Room</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Dialog */}
      <Dialog open={bookingDialog} onOpenChange={setBookingDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingBooking ? "Edit Booking" : "New Booking"}</DialogTitle><DialogDescription>Enter booking details</DialogDescription></DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-1">
            <div>
              <Label className="text-xs mb-1 block">Room *</Label>
              <Select value={bookingForm.roomId} onValueChange={v => setBookingForm({ ...bookingForm, roomId: v })}>
                <SelectTrigger><SelectValue placeholder="Select room..." /></SelectTrigger>
                <SelectContent>
                  {rooms.filter(r => r.status === "available" || r.id === editingBooking?.roomId).map(r => (
                    <SelectItem key={r.id} value={r.id}>Room {r.roomNumber} ({r.type}) - ${r.pricePerNight}/night</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Guest Name *</Label><Input validate="text" value={bookingForm.guestName} onChange={e => setBookingForm({ ...bookingForm, guestName: e.target.value })} placeholder="Full name" /></div>
              <div><Label className="text-xs mb-1 block">Phone *</Label><Input type="tel" inputMode="numeric" maxLength={12} value={bookingForm.guestPhone} onChange={e => setBookingForm({ ...bookingForm, guestPhone: e.target.value })} placeholder="252..." /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Email</Label><Input type="email" value={bookingForm.guestEmail} onChange={e => setBookingForm({ ...bookingForm, guestEmail: e.target.value })} /></div>
              <div><Label className="text-xs mb-1 block">Nationality</Label><Input validate="text" value={bookingForm.guestNationality} onChange={e => setBookingForm({ ...bookingForm, guestNationality: e.target.value })} /></div>
            </div>
            <div><Label className="text-xs mb-1 block">ID / Passport Number</Label><Input value={bookingForm.idNumber} onChange={e => setBookingForm({ ...bookingForm, idNumber: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label className="text-xs mb-1 block">Check-in Date *</Label><Input type="date" value={bookingForm.checkIn} onChange={e => setBookingForm({ ...bookingForm, checkIn: e.target.value })} /></div>
              <div><Label className="text-xs mb-1 block">Check-out Date *</Label><Input type="date" value={bookingForm.checkOut} onChange={e => setBookingForm({ ...bookingForm, checkOut: e.target.value })} /></div>
            </div>
            {bookingForm.roomId && bookingForm.checkIn && bookingForm.checkOut && (() => {
              const room = rooms.find(r => r.id === bookingForm.roomId);
              if (!room) return null;
              const nights = calcNights(bookingForm.checkIn, bookingForm.checkOut);
              return (
                <div className="bg-accent/10 rounded-lg p-3 text-sm">
                  <p className="text-muted-foreground">{nights} night{nights > 1 ? "s" : ""} × ${room.pricePerNight}/night</p>
                  <p className="font-bold text-accent text-lg mt-1">Total: ${(nights * room.pricePerNight).toFixed(2)}</p>
                </div>
              );
            })()}
            <div><Label className="text-xs mb-1 block">Special Requests</Label><Textarea value={bookingForm.specialRequests} onChange={e => setBookingForm({ ...bookingForm, specialRequests: e.target.value })} rows={2} /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingDialog(false)}>Cancel</Button>
            <Button onClick={saveBookingForm} variant="hero">Save Booking</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Booking Detail View */}
      <Dialog open={!!viewBooking} onOpenChange={() => setViewBooking(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Booking Details</DialogTitle><DialogDescription>Booking #{viewBooking?.id.slice(0, 12)}</DialogDescription></DialogHeader>
          {viewBooking && (() => {
            const room = getRoomInfo(viewBooking.roomId);
            return (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><p className="text-xs text-muted-foreground">Guest</p><p className="font-medium">{viewBooking.guestName}</p></div>
                  <div><p className="text-xs text-muted-foreground">Phone</p><p className="font-medium">{viewBooking.guestPhone}</p></div>
                  <div><p className="text-xs text-muted-foreground">Email</p><p className="font-medium">{viewBooking.guestEmail || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Nationality</p><p className="font-medium">{viewBooking.guestNationality || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">ID/Passport</p><p className="font-medium">{viewBooking.idNumber || "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Room</p><p className="font-medium">{room ? `Room ${room.roomNumber} (${room.type})` : "—"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Check-in</p><p className="font-medium">{viewBooking.checkIn}</p></div>
                  <div><p className="text-xs text-muted-foreground">Check-out</p><p className="font-medium">{viewBooking.checkOut}</p></div>
                  <div><p className="text-xs text-muted-foreground">Nights</p><p className="font-medium">{viewBooking.nights}</p></div>
                  <div><p className="text-xs text-muted-foreground">Total</p><p className="font-bold text-accent text-lg">${viewBooking.totalPrice.toFixed(2)}</p></div>
                </div>
                <div><p className="text-xs text-muted-foreground">Status</p><Badge className={`${statusColors[viewBooking.status]} border mt-1`}>{viewBooking.status}</Badge></div>
                {viewBooking.specialRequests && <div><p className="text-xs text-muted-foreground">Special Requests</p><p className="text-sm mt-1">{viewBooking.specialRequests}</p></div>}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog open={!!deleteConfirm} onOpenChange={() => setDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Delete {deleteConfirm?.name}?</DialogTitle><DialogDescription>This action cannot be undone.</DialogDescription></DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDeleteConfirm}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HotelManagementTab;
