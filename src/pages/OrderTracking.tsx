import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Clock, ChefHat, Truck, CheckCircle, Home, Star, Trophy, Gift, ArrowRight, Package, MessageSquare, ShoppingBag, Sparkles, Store, Hourglass } from "lucide-react";
import { getBusinessById, getOrders, Order } from "@/lib/store";
import { useI18n } from "@/lib/i18n";

const statusSteps = [
  { key: "pending", label_so: "La sugayo", label_en: "Waiting", sublabel_so: "Order-kaaga la helay", sublabel_en: "Your order was received", emoji: "⏳" },
  { key: "accepted", label_so: "La aqbalay", label_en: "Accepted", sublabel_so: "Admin/Cashier wuu aqbalay", sublabel_en: "Admin/Cashier accepted", emoji: "✅" },
  { key: "preparing", label_so: "La kariyaa", label_en: "Preparing", sublabel_so: "Kitchen-ka ku jira", sublabel_en: "Being prepared in kitchen", emoji: "👨‍🍳" },
  { key: "ready", label_so: "Diyaar", label_en: "Ready", sublabel_so: "Cuntadaadu way diyaar tahay", sublabel_en: "Your food is ready", emoji: "📦" },
  { key: "on_the_way", label_so: "Socda", label_en: "On the way", sublabel_so: "Waiter-ku wuu keenayaa", sublabel_en: "Waiter is bringing it", emoji: "🚀" },
  { key: "delivered", label_so: "La keenay", label_en: "Delivered", sublabel_so: "Cunto wanaagsan!", sublabel_en: "Enjoy your meal!", emoji: "🎉" },
];

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { lang } = useI18n();
  const [order, setOrder] = useState<any>(null);
  const [customer, setCustomer] = useState<any>(null);
  const [showReward, setShowReward] = useState(false);
  const [deliveredAck, setDeliveredAck] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    setDeliveredAck(localStorage.getItem(`dp_delivered_ack_${orderId}`) === "1");
  }, [orderId]);

  useEffect(() => {
    const stored = localStorage.getItem("dp_customer");
    if (stored) {
      const c = JSON.parse(stored);
      setCustomer(c);
      if (c.points >= 100 && c.level === "Silver") setShowReward(true);
    }
  }, []);

  // Poll order from database
  useEffect(() => {
    if (!orderId) return;
    const loadOrder = async () => {
      // Try to find order by looking at all businesses customer has ordered from
      const stored = localStorage.getItem("dp_customer");
      if (!stored) return;
      const c = JSON.parse(stored);
      const businessId = c.businessId || new URLSearchParams(window.location.search).get("business") || "";
      if (businessId) {
        const orders = await getOrders(businessId);
        const found = orders.find(o => o.id === orderId);
        if (found) setOrder(found);
      }
    };
    loadOrder();
    const interval = setInterval(loadOrder, 3000);
    return () => clearInterval(interval);
  }, [orderId]);

  const getCurrentStep = (status: string) => {
    const idx = statusSteps.findIndex(s => s.key === status);
    return idx >= 0 ? idx : 0;
  };

  const getLevelInfo = (level: string) => {
    switch (level) {
      case "Silver": return { next: "Gold", needed: 300, reward: lang === "so" ? "Cabbitaan bilaash ah! 🥤" : "Free drink! 🥤" };
      case "Gold": return { next: "Platinum", needed: 600, reward: lang === "so" ? "Cunto bilaash ah! 🍽️" : "Free meal! 🍽️" };
      case "Platinum": return { next: null, needed: 0, reward: "10% Discount! 💎" };
      default: return { next: "Silver", needed: 100, reward: "" };
    }
  };

  const [businessData, setBusinessData] = useState<any>(null);
  useEffect(() => { if (order) getBusinessById(order.businessId).then(b => setBusinessData(b || null)); }, [order?.businessId]);

  if (!order) return (
    <div className="min-h-screen bg-hero flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
          className="w-12 h-12 border-2 border-accent/30 border-t-accent rounded-full mx-auto mb-4"
        />
        <p className="text-primary-foreground/50 text-sm">{lang === "so" ? "Dalabka la soo dejinayaa..." : "Loading order..."}</p>
      </motion.div>
    </div>
  );
  const branding = (() => { try { return JSON.parse(localStorage.getItem("dp_customer_branding") || "{}"); } catch { return {}; } })();
  const businessName = businessData?.name || branding.businessName || customer?.businessName || "DALABplus+";
  const businessLogo = businessData?.logo || branding.businessLogo || customer?.businessLogo || "";
  const isImageUrl = (img: string) => img.startsWith("data:") || img.startsWith("http");
  const currentStep = getCurrentStep(order.status);
  const isAccepted = currentStep >= 1;
  const levelInfo = customer ? getLevelInfo(customer.level) : null;
  const earnedPoints = Math.floor(order.total);

  // Bilingual labels
  const l = (so: string, en: string) => lang === "so" ? so : en;

  return (
    <div className="min-h-screen bg-hero relative overflow-hidden">
      <div className="absolute top-1/4 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[300px] h-[300px] rounded-full bg-accent/3 blur-[100px] pointer-events-none" />

      <header className="glass border-b border-border/10 px-4 py-3 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ scale: 1.08 }}
            className="w-10 h-10 rounded-xl overflow-hidden shadow-gold flex items-center justify-center bg-gold-gradient"
          >
            {businessLogo && isImageUrl(businessLogo) ? (
              <img src={businessLogo} alt={businessName} className="w-full h-full object-cover" />
            ) : (
              <Store className="w-5 h-5 text-accent-foreground" />
            )}
          </motion.div>
          <div>
            <p className="font-display font-bold text-primary-foreground text-sm">{businessName}</p>
            <p className="text-[10px] text-primary-foreground/35 font-mono">{orderId?.slice(0, 12)}</p>
          </div>
        </div>
        <Button variant="ghost" size="sm" onClick={() => {
          const stored = localStorage.getItem("dp_customer");
          if (stored) {
            const c = JSON.parse(stored);
            navigate(`/menu?table=${c.tableId || "1"}&business=${order.businessId}`);
          } else {
            navigate("/");
          }
        }} className="text-primary-foreground/40 hover:text-primary-foreground/70">
          <Home className="w-4 h-4" />
        </Button>
      </header>

      <div className="container mx-auto px-4 py-6 max-w-md space-y-5 relative z-10">
        {!isAccepted && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="glass rounded-2xl p-6 text-center border border-accent/20"
          >
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-16 h-16 rounded-2xl bg-accent/15 mx-auto mb-4 flex items-center justify-center"
            >
              <Hourglass className="w-8 h-8 text-accent" />
            </motion.div>
            <h3 className="font-display font-bold text-primary-foreground text-lg mb-1">
              {l("Order-kaaga la diray ✨", "Your order has been sent ✨")}
            </h3>
            <p className="text-xs text-primary-foreground/40">
              {l("Admin/Cashier-ku wuu eegayaa order-kaaga. Fadlan sug...", "Admin/Cashier is reviewing your order. Please wait...")}
            </p>
            <motion.div
              className="flex gap-1 mt-4 max-w-[200px] mx-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  className="h-1.5 flex-1 rounded-full bg-accent/20"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: i * 0.3 }}
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {isAccepted && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="glass rounded-2xl p-5 text-center relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-accent/5 rounded-2xl" />
            <div className="relative">
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
              >
                <div className="w-14 h-14 rounded-2xl bg-gold-gradient mx-auto mb-3 flex items-center justify-center shadow-gold">
                  <Star className="w-7 h-7 text-accent-foreground" />
                </div>
              </motion.div>
              <motion.p
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5, type: "spring" }}
                className="font-display font-bold text-accent text-2xl"
              >
                +{earnedPoints}
              </motion.p>
              <p className="text-[11px] text-primary-foreground/45 mt-1">
                {l("Dhibcaha aad ka heshay dalabkan", "Points earned from this order")}
              </p>
            </div>
          </motion.div>
        )}

        {isAccepted && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass rounded-2xl p-6"
          >
            <h3 className="font-display font-bold text-primary-foreground text-sm mb-5 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" /> {l("Xaalada Order-ka", "Order Status")}
            </h3>
            <div className="space-y-0">
              {statusSteps.slice(1).map((step, i) => {
                const actualIndex = i + 1;
                const isActive = actualIndex <= currentStep;
                const isCurrent = actualIndex === currentStep;
                const isPast = actualIndex < currentStep;
                return (
                  <motion.div
                    key={step.key}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex gap-4"
                  >
                    <div className="flex flex-col items-center">
                      <motion.div
                        animate={isCurrent ? {
                          scale: [1, 1.15, 1],
                          boxShadow: ["0 0 0 0 hsl(45 100% 50% / 0.2)", "0 0 0 8px hsl(45 100% 50% / 0)", "0 0 0 0 hsl(45 100% 50% / 0.2)"],
                        } : {}}
                        transition={isCurrent ? { duration: 2, repeat: Infinity } : {}}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-500 ${
                          isCurrent
                            ? "bg-gold-gradient shadow-gold"
                            : isPast
                            ? "bg-accent/20 border border-accent/30"
                            : "bg-primary/15 border border-primary/20"
                        }`}
                      >
                        {isPast ? (
                          <CheckCircle className="w-5 h-5 text-accent" />
                        ) : (
                          <span className={`text-lg ${!isActive ? "opacity-30" : ""}`}>{step.emoji}</span>
                        )}
                      </motion.div>
                      {i < statusSteps.length - 2 && (
                        <motion.div
                          className={`w-0.5 h-10 transition-all duration-700 ${isActive ? "bg-accent/30" : "bg-primary/15"}`}
                          initial={{ scaleY: 0 }}
                          animate={{ scaleY: 1 }}
                          transition={{ delay: 0.4 + i * 0.1 }}
                        />
                      )}
                    </div>
                    <div className="pb-8 pt-1">
                      <p className={`text-sm font-semibold transition-colors duration-300 ${
                        isCurrent ? "text-accent" : isPast ? "text-primary-foreground/80" : "text-primary-foreground/25"
                      }`}>
                        {lang === "so" ? step.label_so : step.label_en}
                      </p>
                      <p className={`text-[11px] mt-0.5 transition-colors duration-300 ${
                        isCurrent ? "text-primary-foreground/50" : "text-primary-foreground/20"
                      }`}>
                        {lang === "so" ? step.sublabel_so : step.sublabel_en}
                      </p>
                      {isCurrent && (
                        <motion.div
                          initial={{ opacity: 0, width: 0 }}
                          animate={{ opacity: 1, width: 40 }}
                          className="h-0.5 bg-accent/40 rounded-full mt-2"
                        />
                      )}
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Order Items */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass rounded-2xl p-5"
        >
          <h3 className="font-display font-bold text-primary-foreground text-sm mb-4 flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-accent" /> {l("Waxaad dalbatay", "Your Order")}
          </h3>
          <div className="space-y-3">
            {order.items.map((item: any, i: number) => (
              <motion.div
                key={item.id || i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + i * 0.06 }}
                className="flex items-center justify-between py-2 group"
              >
                <div className="flex items-center gap-3">
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 5 }}
                    className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center text-lg"
                  >
                    {item.image || "🍽️"}
                  </motion.div>
                  <div>
                    <span className="text-xs font-medium text-primary-foreground">{item.name}</span>
                    <span className="text-[10px] text-primary-foreground/30 ml-1.5">× {item.quantity}</span>
                  </div>
                </div>
                <span className="text-xs font-bold text-accent">${(item.price * item.quantity).toFixed(2)}</span>
              </motion.div>
            ))}
            <div className="border-t border-border/15 pt-3 mt-3 flex items-center justify-between">
              <span className="text-sm font-display font-bold text-primary-foreground">{l("Wadarta", "Total")}</span>
              <motion.span
                className="text-base font-display font-bold text-accent"
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.8, type: "spring" }}
              >
                ${order.total.toFixed(2)}
              </motion.span>
            </div>
          </div>
        </motion.div>

        {/* Loyalty Progress */}
        {customer && levelInfo && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="glass rounded-2xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <Trophy className="w-4 h-4 text-accent" />
              <span className="font-display font-bold text-primary-foreground text-sm">{customer.level} Level</span>
            </div>
            {levelInfo.next && (
              <>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-xs text-primary-foreground/40">{customer.level} <ArrowRight className="w-3 h-3 inline text-accent/40" /> {levelInfo.next}</span>
                  <span className="text-xs text-accent font-bold">{customer.points} / {levelInfo.needed}</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-primary/15 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((customer.points / levelInfo.needed) * 100, 100)}%` }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="h-full rounded-full bg-gold-gradient"
                  />
                </div>
                <p className="text-[10px] text-primary-foreground/30 mt-2">
                  {levelInfo.needed - customer.points > 0 
                    ? l(
                        `${levelInfo.needed - customer.points} dhibcood ayaad u baahan tahay ${levelInfo.next}!`,
                        `${levelInfo.needed - customer.points} more points to reach ${levelInfo.next}!`
                      )
                    : levelInfo.reward}
                </p>
              </>
            )}
            {!levelInfo.next && <p className="text-xs text-accent">{levelInfo.reward}</p>}
          </motion.div>
        )}

        {/* Reward Celebration */}
        <AnimatePresence>
          {showReward && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="glass rounded-2xl p-6 text-center border border-accent/30 relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gold-gradient opacity-5" />
              <Gift className="w-10 h-10 text-accent mx-auto mb-3" />
              <h3 className="font-display font-bold text-primary-foreground text-lg mb-1">🎉 {l("Hambalyo!", "Congratulations!")}</h3>
              <p className="text-xs text-primary-foreground/50 mb-4">
                {l("Waxaad gaartay Silver Level! Cabbitaan bilaash ah ayaad ku heshay!", "You reached Silver Level! You earned a free drink!")}
              </p>
              <Button
                variant="hero"
                size="sm"
                onClick={() => setShowReward(false)}
                className="gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" /> {l("Mahadsanid!", "Thank you!")}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Back to Menu */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="text-center pb-6"
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              const stored = localStorage.getItem("dp_customer");
              if (stored) {
                const c = JSON.parse(stored);
                navigate(`/menu?table=${c.tableId || "1"}&business=${order.businessId}`);
              }
            }}
            className="text-primary-foreground/30 hover:text-accent gap-1.5 text-xs"
          >
            <ArrowRight className="w-3 h-3 rotate-180" /> {l("Dib ugu noqo Menu-ga", "Back to Menu")}
          </Button>
          <p className="text-[10px] text-primary-foreground/15 mt-4">
            Powered by <span className="text-accent/30 font-bold">DALABplus+</span>
          </p>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderTracking;
