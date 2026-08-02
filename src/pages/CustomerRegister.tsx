import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Phone, CheckCircle, UtensilsCrossed, Hotel, Coffee, Sparkles, Star, Shield, ArrowRight } from "lucide-react";
import { getBusinessById, Business, saveCustomer, getCustomers, generateId, getDefaultServices, BusinessService } from "@/lib/store";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/lib/i18n";

const typeConfig: Record<string, { icon: any; emoji: string; welcome_so: string; welcome_en: string }> = {
  restaurant: { icon: UtensilsCrossed, emoji: "🍽️", welcome_so: "Cuntada ugu fiican!", welcome_en: "The finest cuisine!" },
  hotel: { icon: Hotel, emoji: "🏨", welcome_so: "Soo dhawoow Hotel-keena!", welcome_en: "Welcome to our Hotel!" },
  cafe: { icon: Coffee, emoji: "☕", welcome_so: "Cabitaanka ugu macaansan!", welcome_en: "The finest beverages!" },
};

const floatingEmojis = ["🍛", "☕", "🥘", "🍗", "🥤", "🍰", "🫓", "🍝"];

const CustomerRegister = () => {
  const navigate = useNavigate();
  const { lang } = useI18n();
  const [searchParams] = useSearchParams();
  const tableId = searchParams.get("table") || "1";
  const businessId = searchParams.get("business") || "1001";
  const qrBusinessName = searchParams.get("name") || "";
  const qrBusinessLogo = searchParams.get("logo") || "";
  const [formData, setFormData] = useState({ name: "", phone: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [business, setBusiness] = useState<Business | null>(null);
  const [customerShortId, setCustomerShortId] = useState<string>("");
  const [focusedField, setFocusedField] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const b = await getBusinessById(businessId);
      if (b) setBusiness(b);
    };
    load();
  }, [businessId]);

  useEffect(() => {
    if (qrBusinessName || qrBusinessLogo) {
      localStorage.setItem("dp_customer_branding", JSON.stringify({ businessId, businessName: qrBusinessName || businessName, businessLogo: qrBusinessLogo || businessLogo }));
    }
    const stored = localStorage.getItem("dp_customer");
    if (stored) {
      const customer = JSON.parse(stored);
      // If same business, go to menu. If different business, re-register
      if (customer && customer.name && customer.businessId === businessId) {
        // Update table if different
        if (customer.tableId !== tableId) {
          customer.tableId = tableId;
          localStorage.setItem("dp_customer", JSON.stringify(customer));
        }
        navigate(`/menu?table=${tableId}&business=${businessId}`);
      } else if (customer && customer.name && customer.businessId !== businessId) {
        // Different business - need to register for this one
        localStorage.removeItem("dp_customer");
      }
    }
  }, [navigate, tableId, businessId]);

  const businessName = business?.name || qrBusinessName || "DALABplus+";
  const businessLogo = business?.logo || qrBusinessLogo || "";
  const businessType = business?.type || "restaurant";
  const config = typeConfig[businessType] || typeConfig.restaurant;
  const TypeIcon = config.icon;

  // Bilingual helpers
  const l = (so: string, en: string) => lang === "so" ? so : en;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setIsSubmitting(true);
    
    const existing = await getCustomers(businessId);
    const alreadyExists = existing.find(c => c.phone === formData.phone);
    
    let custId: string;
    let shortId: number | string = "";
    
    if (alreadyExists) {
      custId = alreadyExists.id;
      // Get short_id from database
      const { data } = await supabase.from("customers").select("short_id").eq("id", custId).maybeSingle();
      shortId = data?.short_id || custId.slice(0, 6);
    } else {
      custId = generateId("cust");
      await saveCustomer({
        id: custId, shortId: 0, businessId, name: formData.name, phone: formData.phone, email: "",
        totalOrders: 0, totalSpent: 0, loyaltyPoints: 0, registeredAt: new Date().toISOString(),
      });
      // Get the auto-generated short_id
      const { data } = await supabase.from("customers").select("short_id").eq("id", custId).maybeSingle();
      shortId = data?.short_id || custId.slice(0, 6);
    }
    
    setCustomerShortId(String(shortId));
    setShowSuccess(true);
    
    const customer = { 
      id: custId, ...formData, tableId, businessId, businessName, businessLogo, 
      points: alreadyExists ? (alreadyExists.loyaltyPoints || 0) : 0, 
      level: "Bronze", 
      totalOrders: alreadyExists ? (alreadyExists.totalOrders || 0) : 0, 
      totalSpent: alreadyExists ? (alreadyExists.totalSpent || 0) : 0, 
      shortId,
      registeredAt: new Date().toISOString() 
    };
    
    // Calculate level from points
    if (customer.points >= 600) customer.level = "Platinum";
    else if (customer.points >= 300) customer.level = "Gold";
    else if (customer.points >= 100) customer.level = "Silver";
    
    localStorage.setItem("dp_customer", JSON.stringify(customer));
    localStorage.setItem("dp_customer_branding", JSON.stringify({ businessId, businessName, businessLogo }));
    
    setTimeout(() => { navigate(`/menu?table=${tableId}&business=${businessId}`); }, 2200);
  };

  return (
    <div className="min-h-screen bg-hero relative overflow-hidden">
      {floatingEmojis.map((emoji, i) => (
        <motion.div
          key={i}
          className="absolute text-2xl opacity-10 pointer-events-none select-none"
          initial={{ x: `${10 + (i * 12) % 80}%`, y: "110%" }}
          animate={{ y: "-10%", rotate: [0, 360], opacity: [0.05, 0.15, 0.05] }}
          transition={{ duration: 12 + i * 2, repeat: Infinity, delay: i * 1.5, ease: "linear" }}
        >
          {emoji}
        </motion.div>
      ))}

      <div className="absolute top-20 -left-20 w-60 h-60 rounded-full bg-accent/10 blur-[100px] animate-float-slow" />
      <div className="absolute bottom-20 -right-20 w-80 h-80 rounded-full bg-accent/5 blur-[120px] animate-float-slow" style={{ animationDelay: "3s" }} />

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-8">
        {/* Success Overlay */}
        <AnimatePresence>
          {showSuccess && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-50 bg-hero flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="text-center"
              >
                <motion.div
                  className="w-24 h-24 rounded-full bg-gold-gradient mx-auto mb-6 flex items-center justify-center shadow-gold"
                  animate={{ boxShadow: ["0 0 30px hsl(45 100% 50% / 0.3)", "0 0 60px hsl(45 100% 50% / 0.5)", "0 0 30px hsl(45 100% 50% / 0.3)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <CheckCircle className="w-12 h-12 text-accent-foreground" />
                </motion.div>
                <motion.h2
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="font-display font-bold text-2xl text-primary-foreground mb-2"
                >
                  {l("Ku soo dhawoow! 🎉", "Welcome! 🎉")}
                </motion.h2>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="text-primary-foreground/60 text-sm"
                >
                  {formData.name}, {l("menu-ga ayaa kuu furmi doonaa...", "the menu is opening for you...")}
                </motion.p>
                {customerShortId && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-accent font-mono font-bold text-lg mt-2"
                  >
                    ID: #{customerShortId}
                  </motion.p>
                )}
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "100%" }}
                  transition={{ delay: 0.7, duration: 1.5 }}
                  className="h-1 bg-gold-gradient rounded-full mt-6 max-w-[200px] mx-auto"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Card */}
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          className="w-full max-w-md"
        >
          {/* Logo & Business Name */}
          <motion.div
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="text-center mb-8"
          >
            <div className="relative inline-block">
              {businessLogo ? (
                <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-accent/30 shadow-gold mx-auto">
                  <img src={businessLogo} alt={businessName} className="w-full h-full object-cover" />
                </div>
              ) : (
                <motion.div
                  className="w-20 h-20 rounded-2xl bg-accent/15 border-2 border-accent/30 flex items-center justify-center mx-auto"
                  animate={{ boxShadow: ["0 0 20px hsl(45 100% 50% / 0.15)", "0 0 40px hsl(45 100% 50% / 0.25)", "0 0 20px hsl(45 100% 50% / 0.15)"] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  <TypeIcon className="w-10 h-10 text-accent" />
                </motion.div>
              )}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring" }}
                className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-gold-gradient flex items-center justify-center shadow-gold"
              >
                <Sparkles className="w-3.5 h-3.5 text-accent-foreground" />
              </motion.div>
            </div>
            <motion.h1
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="font-display font-bold text-2xl text-primary-foreground mt-4"
            >
              {businessName}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.35 }}
              className="text-primary-foreground/50 text-sm mt-1"
            >
              {config.emoji} {lang === "so" ? config.welcome_so : config.welcome_en}
            </motion.p>
          </motion.div>

          {/* Services Tags */}
          {business && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-wrap items-center justify-center gap-2 mb-8"
            >
              {(business.services?.length ? business.services : getDefaultServices(business.type)).slice(0, 4).map((s, i) => (
                <motion.span
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.8, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: 0.5 + i * 0.08, type: "spring" }}
                  className="glass px-3 py-1.5 rounded-full text-[11px] text-primary-foreground/70 font-medium"
                >
                  {s.icon} {s.title}
                </motion.span>
              ))}
            </motion.div>
          )}

          {/* Registration Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="glass rounded-3xl p-7 border border-accent/10"
          >
            {/* Table Badge */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6 }}
              className="flex items-center justify-between mb-6"
            >
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-accent/15 flex items-center justify-center">
                  <span className="text-xs">📍</span>
                </div>
                <span className="text-xs font-medium text-primary-foreground/60">Table #{tableId}</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-accent/10 border border-accent/20">
                <Shield className="w-3 h-3 text-accent" />
                <span className="text-[10px] text-accent font-semibold">{l("Ammaan", "Secure")}</span>
              </div>
            </motion.div>

            {mode === "login" ? (
              <form onSubmit={handleIdLogin} className="space-y-5">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-2">
                  <Label className="text-primary-foreground/70 text-xs font-medium flex items-center gap-1.5">
                    <KeyRound className="w-3.5 h-3.5 text-accent" /> {l("ID Number-kaaga", "Your ID Number")}
                  </Label>
                  <Input
                    type="tel"
                    inputMode="numeric"
                    placeholder="e.g. 00101"
                    value={idInput}
                    onChange={e => { setIdInput(e.target.value.replace(/\D/g, "").slice(0, 8)); setLoginError(""); }}
                    className="bg-primary/30 border-primary/40 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-accent focus:ring-accent/20 rounded-xl h-12 text-sm font-mono tracking-widest text-center"
                    required
                  />
                  {loginError && <p className="text-[11px] text-destructive">{loginError}</p>}
                </motion.div>

                <Button type="submit" variant="hero" size="xl" className="w-full rounded-xl gap-2 text-sm" disabled={isSubmitting || !idInput}>
                  {isSubmitting ? l("Hubinaya...", "Checking...") : <>{l("Gal", "Continue")} <ArrowRight className="w-4 h-4" /></>}
                </Button>

                <button type="button" onClick={() => { setMode("register"); setLoginError(""); }} className="w-full text-[11px] text-primary-foreground/50 hover:text-accent transition-colors">
                  {l("Ma cusub tahay? Iska diiwaan geli", "New here? Register instead")}
                </button>
              </form>
            ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-2"
              >
                <Label className="text-primary-foreground/70 text-xs font-medium flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-accent" /> {l("Magacaaga", "Your Name")}
                </Label>
                <div className={`relative transition-all duration-300 ${focusedField === "name" ? "scale-[1.02]" : ""}`}>
                  <Input
                    placeholder="e.g. Ahmed Mohamed"
                    value={formData.name}
                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                    onFocus={() => setFocusedField("name")}
                    onBlur={() => setFocusedField(null)}
                    className="bg-primary/30 border-primary/40 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-accent focus:ring-accent/20 rounded-xl h-12 text-sm transition-all duration-300"
                    required
                  />
                  {focusedField === "name" && (
                    <motion.div
                      layoutId="field-glow"
                      className="absolute inset-0 rounded-xl border-2 border-accent/30 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </div>
              </motion.div>

              {/* Phone Field */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.8 }}
                className="space-y-2"
              >
                <Label className="text-primary-foreground/70 text-xs font-medium flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-accent" /> {l("Telefoon Number", "Phone Number")}
                </Label>
                <div className={`relative transition-all duration-300 ${focusedField === "phone" ? "scale-[1.02]" : ""}`}>
                  <Input
                    type="tel"
                    placeholder="e.g. +252 61 xxx xxxx"
                    value={formData.phone}
                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                    onFocus={() => setFocusedField("phone")}
                    onBlur={() => setFocusedField(null)}
                    className="bg-primary/30 border-primary/40 text-primary-foreground placeholder:text-primary-foreground/30 focus:border-accent focus:ring-accent/20 rounded-xl h-12 text-sm transition-all duration-300"
                    required
                  />
                  {focusedField === "phone" && (
                    <motion.div
                      layoutId="field-glow"
                      className="absolute inset-0 rounded-xl border-2 border-accent/30 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    />
                  )}
                </div>
              </motion.div>

              {/* Submit Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="space-y-3"
              >
                <Button
                  type="submit"
                  variant="hero"
                  size="xl"
                  className="w-full rounded-xl gap-2 text-sm"
                  disabled={isSubmitting || !formData.name || !formData.phone}
                >
                  {isSubmitting ? (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2">
                      <CheckCircle className="w-5 h-5" /> {l("Waad ku mahadsantahay!", "Thank you!")}
                    </motion.div>
                  ) : (
                    <>
                      {l("Iska Diiwaan Geli", "Register")} <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  size="lg"
                  onClick={() => { setMode("login"); setLoginError(""); }}
                  className="w-full rounded-xl gap-2 text-xs bg-primary/20 border-accent/30 text-primary-foreground hover:bg-accent/10 hover:text-accent"
                >
                  <KeyRound className="w-4 h-4" /> {l("Horey ayaan isu diiwaan geliyay — ID Number gali", "I already have an ID Number")}
                </Button>
              </motion.div>
            </form>
            )}


          {/* Footer info */}
          {business && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1 }}
              className="mt-6 text-center space-y-1"
            >
              <p className="text-[11px] text-primary-foreground/30">{business.address}, {business.city}</p>
              <p className="text-[11px] text-primary-foreground/30">{business.countryCode} {business.phonePrefix} {business.phone}</p>
              <p className="text-[10px] text-primary-foreground/20 mt-3">Powered by <span className="text-accent/40 font-semibold">DALABplus+</span></p>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
};

export default CustomerRegister;
