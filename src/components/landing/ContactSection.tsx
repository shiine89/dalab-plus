import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Phone, Mail, MapPin, Send, ArrowRight } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n";
import { Link } from "react-router-dom";

const ContactSection = () => {
  const { t } = useI18n();
  const [form, setForm] = useState({ name: "", email: "", message: "" });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success(t.messageSent);
    setForm({ name: "", email: "", message: "" });
  };

  return (
    <>
      {/* CTA Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="bg-hero rounded-3xl p-12 md:p-16 text-center relative overflow-hidden"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1], opacity: [0.1, 0.2, 0.1] }}
              transition={{ duration: 6, repeat: Infinity }}
              className="absolute top-0 right-0 w-96 h-96 rounded-full bg-accent/10 blur-3xl"
            />
            <h2 className="text-3xl md:text-5xl font-display font-extrabold text-primary-foreground mb-4 relative z-10 tracking-tight">
              {t.ctaTitle}
            </h2>
            <p className="text-primary-foreground/60 text-lg mb-8 relative z-10">{t.ctaDesc}</p>
            <Link to="/login" className="relative z-10">
              <Button variant="hero" size="xl" className="group">
                {t.getStartedNow}
                <ArrowRight className="ml-1 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-28 bg-background">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-16"
          >
            <span className="text-sm font-semibold text-accent uppercase tracking-widest">{t.contactTag}</span>
            <h2 className="text-3xl md:text-5xl font-display font-extrabold mt-3 mb-4 tracking-tight">
              {t.contactTitle1}<span className="text-gradient-gold">{t.contactTitle2}</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto text-lg">{t.contactDesc}</p>
          </motion.div>

          <div className="grid lg:grid-cols-2 gap-12 max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-8"
            >
              {[
                { icon: Phone, label: t.phone, value: "+252 090 6448087, +252 090 5816269" },
                { icon: Mail, label: t.email, value: "info@dalabplus.com" },
                { icon: MapPin, label: t.location, value: "Garoowe, Somalia" },
              ].map((c, i) => (
                <motion.div
                  key={c.label}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-start gap-4 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-gold-gradient group-hover:scale-110 transition-all duration-300">
                    <c.icon className="w-5 h-5 text-accent group-hover:text-accent-foreground transition-colors" />
                  </div>
                  <div>
                    <p className="font-display font-semibold text-sm">{c.label}</p>
                    <p className="text-muted-foreground text-sm">{c.value}</p>
                  </div>
                </motion.div>
              ))}
            </motion.div>

            <motion.form
              onSubmit={handleSubmit}
              initial={{ opacity: 0, x: 30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="space-y-4"
            >
              <Input validate="text" placeholder={t.yourName} value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required className="h-12" />
              <Input type="email" placeholder={t.yourEmail} value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required className="h-12" />
              <Textarea placeholder={t.yourMessage} value={form.message} onChange={e => setForm({ ...form, message: e.target.value })} required rows={5} />
              <Button variant="hero" size="lg" type="submit" className="w-full group">
                <Send className="mr-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                {t.sendMessage}
              </Button>
            </motion.form>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactSection;
