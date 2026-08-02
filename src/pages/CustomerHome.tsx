import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  UtensilsCrossed, Hotel, Coffee, Phone, Mail, MapPin,
  Clock, ArrowRight, ArrowLeft, Star, Home, Menu as MenuIcon,
  PhoneCall, Globe, ChevronRight, Shield, Zap, Heart, Award,
  Users, Gift, Send, Crown, Quote, Truck, UserCheck, Utensils,
  BedDouble, CalendarCheck, Gem, Building2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { getBusinessById, Business, getDefaultServices, BusinessService, getCategories, getMenuItems, Category, MenuItem, seedDemoData } from "@/lib/store";
import { useI18n } from "@/lib/i18n";
import dalabLogo from "@/assets/dalabplus-logo.png";

import heroCafeInterior from "@/assets/hero-cafe-interior.jpg";
import heroRestaurantInterior from "@/assets/hero-restaurant-interior.jpg";
import heroHotelInterior from "@/assets/hero-hotel-interior.jpg";
import testimonialCafe from "@/assets/testimonial-cafe.jpg";
import testimonialRestaurant from "@/assets/testimonial-restaurant.jpg";
import testimonialHotel from "@/assets/testimonial-hotel.jpg";
import hotelRoomSuite from "@/assets/hotel-room-suite.jpg";

const heroImageMap: Record<string, string> = {
  cafe: heroCafeInterior,
  restaurant: heroRestaurantInterior,
  hotel: heroHotelInterior,
};
const testimonialImageMap: Record<string, string> = {
  cafe: testimonialCafe,
  restaurant: testimonialRestaurant,
  hotel: testimonialHotel,
};

import foodBariis from "@/assets/food-bariis-hilib.jpg";
import foodBaasto from "@/assets/food-baasto.jpg";
import foodCanjeero from "@/assets/food-canjeero.jpg";
import foodSuqaar from "@/assets/food-suqaar.jpg";
import foodShaah from "@/assets/food-shaah.jpg";
import foodJuice from "@/assets/food-juice.jpg";
import foodSambusa from "@/assets/food-sambusa.jpg";
import foodMishkaki from "@/assets/food-mishkaki.jpg";
import foodBurger from "@/assets/food-burger.jpg";
import foodLasagna from "@/assets/food-lasagna.jpg";
import foodKalluun from "@/assets/food-kalluun.jpg";
import foodHalwo from "@/assets/food-halwo.jpg";
import foodChicken from "@/assets/food-chicken.jpg";
import foodAvocado from "@/assets/food-avocado-juice.jpg";

const foodImageMap: Record<string, string> = {
  "🍛": foodBariis, "🍚": foodBariis, "🥘": foodSuqaar,
  "🍝": foodBaasto, "🫕": foodBaasto,
  "🫓": foodCanjeero, "🍳": foodCanjeero,
  "☕": foodShaah, "🍵": foodShaah,
  "🥭": foodJuice, "🫐": foodJuice,
  "🥑": foodAvocado,
  "🥟": foodSambusa,
  "🥩": foodMishkaki,
  "🍔": foodBurger,
  "🍗": foodChicken,
  "🐟": foodKalluun, "🦑": foodKalluun,
  "🍮": foodHalwo, "🍪": foodHalwo,
};

const typeThemes = {
  restaurant: {
    icon: UtensilsCrossed, emoji: "🍽️", label: "Restaurant",
    tagline: { en: "Your Daily Dining Experience", so: "Waayo-aragnimo Cuntadaada Maalinlaha" },
    highlight: { en: "Restaurant", so: "Maqaayadda" },
    subtitle: { en: "Experience the perfect blend of flavor and modern elegance. Our fresh ingredients and cozy corners are designed for your moments of joy.", so: "Ku raaxayso isku-darka dhadhanka iyo quruxda casriga ah." },
    aboutText: { en: "We are passionate about creating memorable dining experiences. Every dish is prepared with the freshest ingredients and served with love.", so: "Waxaan ku dadaalnaa inaan abuurno waayo-aragnimo cunto oo aan la illaawin." },
    services: [
      { icon: Utensils, title: { en: "Dine-In", so: "Ku cun Gudaha" }, desc: { en: "Artisan tables and ambient music for your comfort.", so: "Miisas xirfad leh iyo muusig jawi leh." } },
      { icon: Truck, title: { en: "Takeaway", so: "Qaadashada" }, desc: { en: "Quick service without compromising quality.", so: "Adeeg degdeg ah oo tayada dhimanayn." } },
      { icon: Send, title: { en: "Delivery", so: "Gaarsiinta" }, desc: { en: "We bring the experience to your doorstep.", so: "Waan kuu keenaa gurigaaga." } },
      { icon: Gift, title: { en: "Loyalty", so: "Daacadnimo" }, desc: { en: "Earn points for every sip and every bite.", so: "Dhibco ku kasbado dalbo kasta." } },
      { icon: Users, title: { en: "Group Dining", so: "Cunto Kooxeed" }, desc: { en: "Spacious areas for meetings and social gatherings.", so: "Meelo ballaaran kulan iyo xafladaha." } },
    ],
    testimonial: { name: "Sarah Jenkins", title: { en: "Loyal Member since 2022", so: "Xubin Daacad ah 2022-kii" }, text: { en: "The ambiance at DalabPlus+ is unmatched. It's my go-to spot for both deep work and meeting friends. The signature dishes are a masterpiece.", so: "Jawiga DalabPlus+ waa mid aan la barbar dhigi karin." } },
  },
  cafe: {
    icon: Coffee, emoji: "☕", label: "Cafeteria",
    tagline: { en: "Your Daily Coffee Haven", so: "Goobta Qahawadaada Maalinlaha" },
    highlight: { en: "Coffee", so: "Qahawo" },
    subtitle: { en: "Experience the perfect blend of warmth and modern elegance. Our artisan roasts and cozy corners are designed for your moments of pause.", so: "Ku raaxayso isku-darka diirannimada iyo quruxda casriga ah." },
    aboutText: { en: "Our café is more than just a coffee shop — it's a community hub where people come together over perfectly crafted beverages.", so: "Cafékeenu waa ka badan meel qahawo — waa goob bulsheed." },
    services: [
      { icon: Coffee, title: { en: "Dine-In", so: "Ku cun Gudaha" }, desc: { en: "Artisan tables and ambient music for your comfort.", so: "Miisas iyo muusig jawi leh." } },
      { icon: Truck, title: { en: "Takeaway", so: "Qaadashada" }, desc: { en: "Quick service without compromising quality.", so: "Adeeg degdeg ah." } },
      { icon: Send, title: { en: "Delivery", so: "Gaarsiinta" }, desc: { en: "We bring the café experience to your doorstep.", so: "Waan kuu keenaa gurigaaga." } },
      { icon: Gift, title: { en: "Loyalty", so: "Daacadnimo" }, desc: { en: "Earn points for every sip and every bite.", so: "Dhibco ku kasbado." } },
      { icon: Users, title: { en: "Group Dining", so: "Koox" }, desc: { en: "Spacious areas for meetings and social gatherings.", so: "Meelo ballaaran." } },
    ],
    testimonial: { name: "Sarah Jenkins", title: { en: "Loyal Member since 2022", so: "Xubin Daacad ah 2022-kii" }, text: { en: "The ambiance at DalabPlus+ is unmatched. It's my go-to spot for both deep work and meeting friends. The signature latte is a masterpiece.", so: "Jawiga DalabPlus+ waa mid aan la barbar dhigi karin. Qahawo macaan." } },
  },
  hotel: {
    icon: Hotel, emoji: "🏨", label: "Hotel",
    tagline: { en: "Your Luxury Stay Destination", so: "Goobta Hoyga Raaxada" },
    highlight: { en: "Hotel", so: "Hudheel" },
    subtitle: { en: "Experience world-class hospitality with premium amenities, elegant rooms, and exceptional service tailored for you.", so: "Ku soo dhawoow marti-gelinta heerka caalamiga ah." },
    aboutText: { en: "Our hotel combines elegant luxury with modern comfort. From spacious suites to world-class dining.", so: "Hudheelikeenu wuxuu isku daraa qurux iyo raaxo casri ah." },
    services: [
      { icon: BedDouble, title: { en: "Room Booking", so: "Qol Qabashada" }, desc: { en: "Premium rooms with stunning views.", so: "Qolal heer sare ah." } },
      { icon: CalendarCheck, title: { en: "Check-in/out", so: "Galitaan/Bixid" }, desc: { en: "Seamless check-in and check-out process.", so: "Nidaam sahlan." } },
      { icon: Gem, title: { en: "VIP Rooms", so: "Qolal VIP" }, desc: { en: "Exclusive luxury suites for special guests.", so: "Qolal raaxo leh marti gaar ah." } },
      { icon: Building2, title: { en: "Events", so: "Xafladaha" }, desc: { en: "Conference & event hosting facilities.", so: "Goobaha shirarka." } },
      { icon: Utensils, title: { en: "Restaurant", so: "Maqaayadda" }, desc: { en: "Fine dining within the hotel.", so: "Cunto fiican oo hotelka gudaha." } },
    ],
    testimonial: { name: "Sarah Johnson", title: { en: "VIP Guest since 2023", so: "Marti VIP 2023-kii" }, text: { en: "The luxury and service at this hotel is truly world-class. Every detail is perfect.", so: "Raaxada iyo adeegga hudheelan waa heerka caalamiga." } },
  },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

const CustomerHome = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const businessId = searchParams.get("business") || "";
  const tableId = searchParams.get("table") || "1";
  const { lang, setLang } = useI18n();
  const [business, setBusiness] = useState<Business | null>(null);
  const [scrolled, setScrolled] = useState(false);
  const [menuTab, setMenuTab] = useState("food");
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [dbMenuItems, setDbMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    const load = async () => {
      const b = await getBusinessById(businessId);
      if (b) setBusiness(b);
    };
    load();
  }, [businessId]);

  useEffect(() => {
    if (!business) return;
    const load = async () => {
      await seedDemoData(business.id);
      setDbCategories(await getCategories(business.id));
      setDbMenuItems((await getMenuItems(business.id)).filter(m => m.available));
    };
    load();
  }, [business?.id]);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (dbCategories.length > 0 && !dbCategories.find(c => c.id === menuTab)) {
      setMenuTab(dbCategories[0].id);
    }
  }, [dbCategories]);

  if (!business) return <div className="min-h-screen bg-background" />;

  const theme = typeThemes[business.type as keyof typeof typeThemes] || typeThemes.restaurant;
  const TypeIcon = theme.icon;
  const services: BusinessService[] = business.services?.length ? business.services : getDefaultServices(business.type);
  const l = (obj: { en: string; so: string }) => obj[lang] || obj.en;

  const contactInfo = [
    { icon: MapPin, label: l({ en: "Address", so: "Cinwaanka" }), value: [business.address, business.city, business.country].filter(Boolean).join(", ") },
    { icon: Phone, label: l({ en: "Phone", so: "Telefoon" }), value: [business.countryCode, business.phonePrefix, business.phone].filter(Boolean).join(" ") },
    { icon: Mail, label: "Email", value: business.email },
    { icon: Clock, label: l({ en: "Hours", so: "Saacadaha" }), value: l({ en: "Daily · 7:00 AM – 11:00 PM", so: "Maalin walba · 7:00 AM – 11:00 PM" }) },
  ].filter(c => c.value);

  const navItems = [
    { key: "about", label: l({ en: "About Us", so: "Naga Ogow" }) },
    { key: "why", label: l({ en: "Why Choose Us", so: "Maxaa Naloo Doortaa" }) },
    { key: "services", label: l({ en: "Services", so: "Adeegyada" }) },
    { key: "contact", label: l({ en: "Contact", so: "La xiriir" }) },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(`ch-${id}`)?.scrollIntoView({ behavior: "smooth" });
  };

  const menuTabs = dbCategories.length > 0
    ? dbCategories.slice(0, 4).map(cat => ({ key: cat.id, label: cat.name }))
    : [
        { key: "food", label: l({ en: "Food", so: "Cunto" }) },
        { key: "drinks", label: l({ en: "Drinks", so: "Cabbitaano" }) },
        { key: "teas", label: l({ en: "Teas & Coffee", so: "Shaah" }) },
      ];

  const currentMenuItems = dbMenuItems.filter(item => item.categoryId === menuTab).slice(0, 3);
  const isImageUrl = (img: string) => img && (img.startsWith("data:") || img.startsWith("http"));

  const goBack = () => navigate(-1);

  return (
    <div className="min-h-screen bg-[hsl(30,20%,97%)]">
      {/* ─── HEADER ─── */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? "bg-white/95 backdrop-blur-xl shadow-lg shadow-black/5 border-b border-border/50" : "bg-white/80 backdrop-blur-md"}`}>
        <div className="container mx-auto flex items-center justify-between h-16 px-4">
          <motion.div 
            className="flex items-center gap-2.5 group cursor-pointer"
            whileHover={{ scale: 1.02 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            {business.logo ? (
              <motion.img 
                src={business.logo} alt={business.name} 
                className="w-9 h-9 rounded-xl object-cover shadow-md shadow-accent/10 ring-2 ring-accent/10 group-hover:ring-accent/30 transition-all duration-300"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              />
            ) : (
              <motion.div 
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-accent/20 via-accent/10 to-accent/5 flex items-center justify-center shadow-md shadow-accent/10 border border-accent/10 group-hover:border-accent/30 transition-all duration-300"
                whileHover={{ rotate: [0, -5, 5, 0] }}
                transition={{ duration: 0.5 }}
              >
                <TypeIcon className="w-4.5 h-4.5 text-accent" />
              </motion.div>
            )}
            <span className="font-display font-bold text-foreground text-sm group-hover:text-accent transition-colors duration-300">{business.name}</span>
          </motion.div>

          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item, i) => (
              <motion.button
                key={item.key}
                onClick={() => scrollTo(item.key)}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative px-3.5 py-2 text-sm text-muted-foreground hover:text-accent font-medium transition-all duration-300 rounded-lg hover:bg-accent/5 group"
              >
                {item.label}
                <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-accent rounded-full group-hover:w-3/4 transition-all duration-300" />
              </motion.button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setLang(lang === "en" ? "so" : "en")}
              className="flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-accent hover:text-accent hover:bg-accent/5 hover:shadow-md hover:shadow-accent/10 transition-all duration-300"
            >
              <Globe className="w-3.5 h-3.5 transition-transform duration-300 hover:rotate-180" />
              {lang === "en" ? "SO" : "EN"}
            </motion.button>
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
              <Button
                size="sm"
                onClick={goBack}
                className="hidden sm:flex bg-foreground hover:bg-foreground/90 text-background gap-2 rounded-full font-semibold text-xs px-5 group shadow-lg shadow-foreground/10 hover:shadow-xl hover:shadow-foreground/20 transition-all duration-300"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-300 group-hover:-translate-x-1" />
                {l({ en: "Back", so: "Dib u noqo" })}
              </Button>
            </motion.div>
          </div>
        </div>
      </header>

      {/* ─── HERO SECTION ─── */}
      <section className="pt-24 pb-8 md:pt-28 md:pb-12">
        <div className="container mx-auto px-4">
          <div className="grid lg:grid-cols-2 gap-10 items-center">
            <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-accent/10 border border-accent/20 mb-6"
              >
                <span className="text-xs font-bold text-accent uppercase tracking-widest">
                  {l({ en: `Premium ${theme.label} Experience`, so: `Waayo-aragnimo ${theme.label} Heerka Sare` })}
                </span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="font-display font-extrabold text-4xl sm:text-5xl lg:text-[3.5rem] leading-[1.1] text-foreground mb-5"
              >
                {l(theme.tagline).replace(l(theme.highlight), "").trim()}{" "}
                <span className="text-accent italic">{l(theme.highlight)}</span>
                <br />{l({ en: "Haven", so: "Goobta" })}
              </motion.h1>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="text-muted-foreground text-base leading-relaxed max-w-md mb-8"
              >
                {business.description || l(theme.subtitle)}
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="flex flex-wrap gap-3"
              >
                <Button
                  onClick={() => navigate(`/menu?table=${tableId}&business=${businessId}`)}
                  className="bg-foreground hover:bg-foreground/90 text-background gap-2 rounded-full font-semibold px-6"
                >
                  {l({ en: "Explore Menu", so: "Eeg Menu-ka" })}
                  <ArrowRight className="w-4 h-4" />
                </Button>
                <Button
                  variant="outline"
                  onClick={() => scrollTo("about")}
                  className="rounded-full font-semibold px-6 border-border"
                >
                  {l({ en: "Our Story", so: "Sheekadeena" })}
                </Button>
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30, rotate: 2 }}
              animate={{ opacity: 1, y: 0, rotate: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="relative"
            >
              <div className="rounded-3xl overflow-hidden shadow-2xl">
                <img src={heroImageMap[business.type] || heroCafeInterior} alt={business.name} width={800} height={600} className="w-full h-auto object-cover" />
              </div>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -bottom-5 -right-2 md:right-4 bg-white rounded-2xl shadow-xl p-4 flex items-center gap-3"
              >
                <div className="w-12 h-12 rounded-xl overflow-hidden bg-accent/10 flex items-center justify-center">
                  {dbMenuItems.length > 0 && isImageUrl(dbMenuItems[0].image) ? (
                    <img src={dbMenuItems[0].image} alt="Featured" className="w-full h-full object-cover" />
                  ) : dbMenuItems.length > 0 && foodImageMap[dbMenuItems[0]?.image] ? (
                    <img src={foodImageMap[dbMenuItems[0].image]} alt="Featured" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-2xl">{dbMenuItems[0]?.image || "☕"}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs font-bold text-foreground">{l({ en: "Today's Special", so: "Maanta Gaar ah" })}</p>
                  <div className="flex items-center gap-1 mt-0.5">
                    {[1,2,3,4,5].map(i => <Star key={i} className="w-3 h-3 text-accent fill-accent" />)}
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── SERVICES ─── */}
      <section id="ch-services" className="py-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-12">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mb-2">
                {l({ en: "Tailored Experiences", so: "Waayo-aragnimo La Habeeyay" })}
              </h2>
              <p className="text-muted-foreground max-w-md">
                {l({ en: "From your morning ritual to grand celebrations, we provide the perfect setting and service.", so: "Subaxdaada ilaa xafladaha waaweyn, waxaan bixinaa jawi iyo adeeg fiican." })}
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {theme.services.map((service, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="bg-white rounded-2xl border border-border/50 p-5 hover:shadow-lg hover:border-accent/20 transition-all duration-300 group text-center"
              >
                <div className="w-12 h-12 rounded-2xl bg-accent/8 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/15 transition-colors">
                  <service.icon className="w-5 h-5 text-accent" />
                </div>
                <h4 className="font-display font-bold text-sm text-foreground mb-1.5">{l(service.title)}</h4>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{l(service.desc)}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CURATED MENU ─── */}
      <section id="ch-menu" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mb-4">
              {business.type === "hotel"
                ? l({ en: "Our Premium Rooms", so: "Qolalkeena" })
                : l({ en: "Curated Menu", so: "Menu-ga La Doorbiday" })}
            </h2>
            {business.type !== "hotel" && (
              <div className="flex items-center justify-center gap-1 bg-muted/50 rounded-full p-1 w-fit mx-auto">
                {menuTabs.map((tab) => (
                  <button
                    key={tab.key}
                    onClick={() => setMenuTab(tab.key)}
                    className={`px-5 py-2 rounded-full text-sm font-medium transition-all ${menuTab === tab.key
                      ? "bg-white text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            )}
          </motion.div>

          {business.type === "hotel" ? (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {[
                { name: l({ en: "The Executive Studio", so: "Qol Keli ah" }), price: "$149", desc: l({ en: "Perfect for the busy business traveler requiring quietness and modern amenities.", so: "Qol raaxo ah oo suuq-geynta." }) },
                { name: l({ en: "Superior Double", so: "Qol Labo" }), price: "$289", desc: l({ en: "Spacious comfort for longer stays. Features panoramic views and an oversized bath.", so: "Qol ballaaran oo leh muuqaal qurux." }) },
                { name: l({ en: "The Royal Penthouse", so: "Qol VIP" }), price: "$1,200", desc: l({ en: "Our crowning achievement. In tasteful elegance with coverage and fireplace on terrace.", so: "Qolkeena ugu sarreeya oo leh raaxo." }) },
              ].map((room, i) => (
                <motion.div
                  key={room.name}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i}
                  className="rounded-2xl bg-[hsl(30,20%,97%)] border border-border/50 overflow-hidden hover:shadow-lg transition-all group"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    <img src={hotelRoomSuite} alt={room.name} loading="lazy" width={640} height={480} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-5 text-center">
                    <h3 className="font-display font-bold text-lg text-foreground mb-1">{room.name}</h3>
                    <p className="text-xs text-muted-foreground mb-3">{room.desc}</p>
                    <p className="font-display font-extrabold text-2xl text-accent mb-4">{room.price}<span className="text-xs text-muted-foreground font-normal"> / {l({ en: "night", so: "habeennimo" })}</span></p>
                    <Button size="sm" variant="outline" className="rounded-full gap-1.5 w-full font-semibold border-foreground text-foreground hover:bg-foreground hover:text-background">
                      {l({ en: "Book Now", so: "Hadda Qabo" })} <ArrowRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {currentMenuItems.length > 0 ? currentMenuItems.map((item, i) => (
                <motion.div
                  key={item.id + menuTab}
                  initial="hidden" whileInView="visible" viewport={{ once: true }}
                  variants={fadeUp} custom={i}
                  className="bg-[hsl(30,20%,97%)] rounded-2xl border border-border/50 overflow-hidden hover:shadow-lg transition-all duration-300 group"
                >
                  <div className="aspect-[4/3] overflow-hidden bg-muted flex items-center justify-center">
                    {isImageUrl(item.image) ? (
                      <img src={item.image} alt={item.name} loading="lazy" width={640} height={512} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : foodImageMap[item.image] ? (
                      <img src={foodImageMap[item.image]} alt={item.name} loading="lazy" width={640} height={512} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    ) : (
                      <span className="text-6xl">{item.image || "🍽️"}</span>
                    )}
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h4 className="font-display font-bold text-foreground">{item.name}</h4>
                      <span className="font-display font-extrabold text-accent whitespace-nowrap">${item.price.toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mb-3">{item.description}</p>
                    <button className="text-xs text-accent font-semibold flex items-center gap-1 hover:underline">
                      {l({ en: "Customize", so: "Habee" })} <ChevronRight className="w-3 h-3" />
                    </button>
                  </div>
                </motion.div>
              )) : (
                <div className="col-span-full text-center py-12 text-muted-foreground">
                  <p className="text-sm">{l({ en: "No items in this category yet", so: "Wali cunno lama gelin qaybtan" })}</p>
                </div>
              )}
            </div>
          )}

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={4} className="text-center mt-10">
            <Button
              size="lg"
              onClick={() => navigate(`/menu?table=${tableId}&business=${businessId}`)}
              className="bg-foreground hover:bg-foreground/90 text-background rounded-full gap-2 font-bold px-8"
            >
              <MenuIcon className="w-4 h-4" />
              {business.type === "hotel"
                ? l({ en: "View All Rooms", so: "Eeg Qolalka" })
                : l({ en: "View Full Menu", so: "Eeg Menu-ka Oo Dhan" })}
              <ArrowRight className="w-4 h-4" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── TESTIMONIAL ─── */}
      <section className="py-0">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="rounded-3xl overflow-hidden bg-[hsl(25,30%,14%)] relative"
          >
            <div className="grid md:grid-cols-2 min-h-[400px]">
              <div className="p-10 md:p-14 flex flex-col justify-center relative z-10">
                <Quote className="w-10 h-10 text-accent/40 mb-6" />
                <p className="text-white text-xl md:text-2xl font-display font-semibold leading-relaxed mb-8 italic">
                  "{l(theme.testimonial.text)}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-accent/20 flex items-center justify-center text-lg font-bold text-accent">
                    {theme.testimonial.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-bold text-white text-sm">{theme.testimonial.name}</p>
                    <p className="text-white/50 text-xs">{l(theme.testimonial.title)}</p>
                  </div>
                </div>
              </div>
              <div className="hidden md:block">
                <img src={testimonialImageMap[business.type] || testimonialCafe} alt="Customer experience" loading="lazy" width={640} height={640} className="w-full h-full object-cover" />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── LOYALTY REWARDS BANNER ─── */}
      <section className="py-14">
        <div className="container mx-auto px-4">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="rounded-2xl bg-white border border-border/50 p-6 md:p-8 flex flex-col md:flex-row items-center justify-between gap-6"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0">
                <Crown className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h3 className="font-display font-bold text-lg text-foreground">
                  {l({ en: `Join ${business.name} Rewards`, so: `Ku biir Abaalmarin ${business.name}` })}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {l({ en: "Get a free drink on your first 100 points! Limited-time offer.", so: "Cabbitaan bilaash ah 100 dhibcood! Wakhti xaddidan." })}
                </p>
              </div>
            </div>
            <Button className="bg-foreground hover:bg-foreground/90 text-background rounded-full font-semibold px-6 gap-2 whitespace-nowrap">
              <Gift className="w-4 h-4" />
              {l({ en: "Claim My Reward", so: "Abaalmariintayda Qaado" })}
            </Button>
          </motion.div>
        </div>
      </section>

      {/* ─── ABOUT US ─── */}
      <section id="ch-about" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <span className="text-xs font-bold text-accent uppercase tracking-widest mb-3 block">
                {l({ en: "About Us", so: "Naga Ogow" })}
              </span>
              <h2 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mb-5 leading-tight">
                {l({ en: `Welcome to ${business.name}`, so: `Ku soo dhawoow ${business.name}` })}
              </h2>
              <p className="text-muted-foreground leading-relaxed mb-6">
                {business.description || l(theme.aboutText)}
              </p>
              <div className="flex items-center gap-3">
                <div className="flex -space-x-2">
                  {["👨‍🍳", "👩‍💼", "👨‍💻"].map((e, i) => (
                    <div key={i} className="w-10 h-10 rounded-full bg-accent/10 border-2 border-white flex items-center justify-center text-lg">{e}</div>
                  ))}
                </div>
                <div>
                  <p className="text-sm font-bold text-foreground">{l({ en: "Trusted by hundreds", so: "Boqolaal oo ku kalsoon" })}</p>
                  <p className="text-xs text-muted-foreground">{l({ en: "of happy customers", so: "macaamiil faraxsan" })}</p>
                </div>
              </div>
            </motion.div>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
              <div className="rounded-2xl overflow-hidden shadow-lg">
                <img src={heroImageMap[business.type] || heroCafeInterior} alt={business.name} loading="lazy" width={800} height={600} className="w-full h-auto object-cover" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── WHY CHOOSE US ─── */}
      <section id="ch-why" className="py-20">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mb-3">
              {l({ en: "Why Choose Us", so: "Maxaa Naloo Doortaa" })}
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto">
              {l({ en: "We go above and beyond to deliver an exceptional experience.", so: "Waxaan ka baxnaa sidii caadiga ahayd si aan uga bixino waayo-aragnimo." })}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-5xl mx-auto">
            {[
              { icon: Shield, title: l({ en: "Premium Quality", so: "Tayada Sare" }), desc: l({ en: "Only the best for our customers", so: "Kuwa ugu fiican macaamiisheena" }) },
              { icon: Zap, title: l({ en: "Fast & Efficient", so: "Degdeg & Waxtar" }), desc: l({ en: "Quick service with modern technology", so: "Adeeg degdeg ah" }) },
              { icon: Heart, title: l({ en: "Warm Atmosphere", so: "Jawi Diiran" }), desc: l({ en: "Designed for your comfort", so: "Loo nashqadeeyay raaxadaada" }) },
              { icon: Award, title: l({ en: "Loyalty Rewards", so: "Abaalmarin" }), desc: l({ en: "Earn points with every visit", so: "Dhibco ku kasbado" }) },
            ].map((item, i) => (
              <motion.div
                key={i}
                initial="hidden" whileInView="visible" viewport={{ once: true }}
                variants={fadeUp} custom={i}
                className="text-center p-6 rounded-2xl bg-white border border-border/50 hover:shadow-lg hover:border-accent/20 transition-all duration-300 group"
              >
                <div className="w-14 h-14 rounded-2xl bg-accent/8 flex items-center justify-center mx-auto mb-4 group-hover:bg-accent/15 transition-colors">
                  <item.icon className="w-6 h-6 text-accent" />
                </div>
                <h4 className="font-display font-bold text-foreground mb-2">{item.title}</h4>
                <p className="text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CONTACT ─── */}
      <section id="ch-contact" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mb-12">
            <h2 className="font-display font-extrabold text-3xl md:text-4xl text-foreground mb-3">
              {l({ en: "Visit Us Today", so: "Maanta Noo Kaalay" })}
            </h2>
          </motion.div>

          <div className="max-w-5xl grid md:grid-cols-2 gap-10">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="space-y-5">
              {contactInfo.map((info) => (
                <div key={info.label} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/8 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <info.icon className="w-4.5 h-4.5 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-0.5">{info.label}</p>
                    <p className="text-sm font-medium text-foreground">{info.value}</p>
                  </div>
                </div>
              ))}

              {business.paymentMethods && (
                <div className="pt-2">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold mb-2">{l({ en: "Accepted Payments", so: "Lacag-bixinta" })}</p>
                  <div className="flex flex-wrap gap-2">
                    {business.paymentMethods.cashEnabled && <span className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent font-semibold">💵 Cash</span>}
                    {business.paymentMethods.cardEnabled && <span className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent font-semibold">💳 Card</span>}
                    {business.paymentMethods.mobileEnabled && <span className="text-xs px-3 py-1.5 rounded-full bg-accent/10 text-accent font-semibold">📱 Mobile</span>}
                  </div>
                </div>
              )}
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} custom={2}>
              <div className="p-6 rounded-2xl bg-[hsl(30,20%,97%)] border border-border/50">
                <h3 className="font-display font-bold text-lg text-foreground mb-5">{l({ en: "Send Us a Message", so: "Fariin Noo Dir" })}</h3>
                <div className="space-y-3">
                  <Input validate="text" placeholder={l({ en: "Your Name", so: "Magacaaga" })} className="rounded-xl bg-white" />
                  <Input placeholder={l({ en: "Your Email", so: "Email-kaaga" })} type="email" className="rounded-xl bg-white" />
                  <Textarea placeholder={l({ en: "Your Message...", so: "Fariintaada..." })} className="rounded-xl bg-white min-h-[100px]" />
                  <Button className="w-full bg-foreground hover:bg-foreground/90 text-background rounded-xl font-bold gap-2">
                    <Send className="w-4 h-4" />
                    {l({ en: "Send Message", so: "Dir Fariinta" })}
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="bg-[hsl(30,20%,97%)] border-t border-border/50 pt-14 pb-6">
        <div className="container mx-auto px-4">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 mb-4">
                {business.logo ? (
                  <img src={business.logo} alt={business.name} className="w-9 h-9 rounded-xl object-cover" />
                ) : (
                  <div className="w-9 h-9 rounded-xl bg-accent/10 flex items-center justify-center">
                    <TypeIcon className="w-4 h-4 text-accent" />
                  </div>
                )}
                <span className="font-display font-bold text-foreground text-2xl">{business.name}</span>
              </div>
              <p className="text-base text-muted-foreground leading-relaxed">
                {(business.description || l(theme.aboutText)).slice(0, 120)}...
              </p>
            </div>

            <div>
              <h4 className="font-display font-bold text-foreground text-xl mb-4">{l({ en: "Company", so: "Shirkadda" })}</h4>
              <div className="space-y-2.5">
                {navItems.map((item) => (
                  <button key={item.key} onClick={() => scrollTo(item.key)} className="block text-base text-muted-foreground hover:text-accent transition-colors">
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <h4 className="font-display font-bold text-foreground text-xl mb-4">{l({ en: "Help", so: "Caawimo" })}</h4>
              <div className="space-y-2.5 text-base text-muted-foreground">
                <p>{l({ en: "Support Center", so: "Xarunta Taageerada" })}</p>
                <p>{l({ en: "Privacy Policy", so: "Siyaasadda" })}</p>
                <p>{l({ en: "Terms of Service", so: "Shuruudaha" })}</p>
              </div>
            </div>

            <div>
              <h4 className="font-display font-bold text-foreground text-xl mb-4">{l({ en: "Join the Newsletter", so: "Ku biir Warqadda" })}</h4>
              <div className="flex gap-2">
                <Input placeholder="email@address.com" className="rounded-full text-base bg-white h-11" />
                <Button size="icon" className="rounded-full bg-accent hover:bg-accent/90 text-accent-foreground h-9 w-9 flex-shrink-0">
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="mt-8 -mx-4 -mb-6 px-8 py-6 rounded-2xl bg-primary flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-lg font-semibold text-primary-foreground tracking-wide">
              © 2026 {business.name} · {l({ en: "All rights reserved", so: "Dhammaan xuquuqda way dhowran tahay" })}
            </p>
            <div className="flex items-center gap-3">
              <img src={dalabLogo} alt="DALABplus+" className="w-7 h-7 rounded" />
              <span className="text-lg font-semibold text-primary-foreground/80">
                Powered by <span className="text-accent font-extrabold text-xl">DALABplus+</span>
              </span>
            </div>
          </div>
        </div>
      </footer>

      {/* Mobile Bottom Nav */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-border/50 flex items-center justify-around py-2 px-2">
        {[
          { key: "home", label: l({ en: "Home", so: "Guriga" }), icon: Home },
          { key: "menu", label: "Menu", icon: MenuIcon },
          { key: "services", label: l({ en: "Services", so: "Adeeg" }), icon: Star },
          { key: "contact", label: l({ en: "Contact", so: "Xiriir" }), icon: PhoneCall },
          { key: "back", label: l({ en: "Back", so: "Dib" }), icon: ArrowLeft },
        ].map((item) => (
          <button
            key={item.key}
            onClick={() => item.key === "back" ? goBack() : item.key === "menu" ? navigate(`/menu?table=${tableId}&business=${businessId}`) : scrollTo(item.key === "home" ? "about" : item.key)}
            className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-muted-foreground hover:text-accent transition-colors"
          >
            <item.icon className="w-4 h-4" />
            {item.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default CustomerHome;
