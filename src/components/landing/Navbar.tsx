import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Menu, X, Globe } from "lucide-react";
import { useI18n } from "@/lib/i18n";
import { motion, AnimatePresence } from "framer-motion";
import dalabLogo from "@/assets/dalabplus-logo.png";

const Navbar = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { t, lang, setLang } = useI18n();

  const links = [
    { label: t.home, href: "#home" },
    { label: t.services, href: "#services" },
    { label: t.about, href: "#about" },
    { label: t.contact, href: "#contact" },
  ];

  return (
    <motion.nav
      initial={{ y: -80 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
      className="fixed top-0 left-0 right-0 z-50 glass bg-primary/95 backdrop-blur-xl border-b border-accent/20"
    >
      <div className="container mx-auto flex items-center justify-between h-16 px-4">
        <Link to="/" className="flex items-center gap-2 group">
          <img src={dalabLogo} alt="DALABplus+" className="w-9 h-9 rounded-lg group-hover:scale-110 transition-transform duration-300" />
          <span className="font-display font-bold text-lg text-accent">DALABplus+</span>
        </Link>

        <div className="hidden md:flex items-center gap-6">
          {links.map(l => (
            <a key={l.href} href={l.href} className="text-sm font-medium text-primary-foreground hover:text-accent transition-colors relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-accent after:transition-all after:duration-300 hover:after:w-full">
              {l.label}
            </a>
          ))}

          <button
            onClick={() => setLang(lang === "en" ? "so" : "en")}
            className="flex items-center gap-1 text-xs font-semibold text-primary-foreground hover:text-accent transition-colors px-2 py-1 rounded-full border border-primary-foreground/25 hover:border-accent"
          >
            <Globe className="w-3.5 h-3.5" />
            {lang === "en" ? "SO" : "EN"}
          </button>

          <Link to="/login">
            <Button variant="hero" size="default">{t.getStarted}</Button>
          </Link>
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button onClick={() => setLang(lang === "en" ? "so" : "en")} className="p-2 text-primary-foreground hover:text-accent transition-colors">
            <Globe className="w-4 h-4" />
          </button>
          <button className="text-primary-foreground hover:text-accent transition-colors" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className="md:hidden glass border-t border-border px-4 pb-4 space-y-3 overflow-hidden"
          >
            {links.map((l, i) => (
              <motion.a
                key={l.href}
                href={l.href}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="block text-sm font-medium text-muted-foreground hover:text-foreground py-2"
                onClick={() => setMobileOpen(false)}
              >
                {l.label}
              </motion.a>
            ))}
            <Link to="/login" onClick={() => setMobileOpen(false)}>
              <Button variant="hero" size="default" className="w-full">{t.getStarted}</Button>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.nav>
  );
};

export default Navbar;
