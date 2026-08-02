import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Save, Upload, Eye, Image, Type, FileText, Palette,
  Building2, Star, Quote, Shield, Zap, Heart, Award,
} from "lucide-react";
import { Business, updateBusiness } from "@/lib/store";
import { toast } from "sonner";

interface HomePageEditorTabProps {
  businesses: Business[];
  onUpdated: () => void;
}

const sectionsList = [
  { id: "hero", label: "Hero Section", icon: Image },
  { id: "services", label: "Services", icon: Star },
  { id: "testimonial", label: "Testimonial", icon: Quote },
  { id: "about", label: "About Us", icon: FileText },
  { id: "whyChoose", label: "Why Choose Us", icon: Shield },
  { id: "footer", label: "Footer", icon: Palette },
];

const HomePageEditorTab = ({ businesses, onUpdated }: HomePageEditorTabProps) => {
  const [selectedBizId, setSelectedBizId] = useState<string>("");
  const [activeSection, setActiveSection] = useState("hero");
  const [homePageData, setHomePageData] = useState<Record<string, any>>({});

  const selectedBiz = businesses.find(b => b.id === selectedBizId);

  const handleSelectBusiness = (bizId: string) => {
    setSelectedBizId(bizId);
    const biz = businesses.find(b => b.id === bizId);
    if (biz) {
      // Load existing home page customizations or defaults
      const existing = (biz as any).homePageConfig || {};
      setHomePageData({
        heroTitle: existing.heroTitle || "",
        heroSubtitle: existing.heroSubtitle || "",
        heroTagline: existing.heroTagline || "",
        heroImage: existing.heroImage || "",
        aboutTitle: existing.aboutTitle || "",
        aboutText: existing.aboutText || biz.description || "",
        testimonialName: existing.testimonialName || "",
        testimonialTitle: existing.testimonialTitle || "",
        testimonialText: existing.testimonialText || "",
        testimonialImage: existing.testimonialImage || "",
        whyTitle: existing.whyTitle || "",
        whySubtitle: existing.whySubtitle || "",
        footerText: existing.footerText || "",
      });
    }
  };

  const updateField = (key: string, value: string) => {
    setHomePageData(prev => ({ ...prev, [key]: value }));
  };

  const handleImageUpload = (key: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 3 * 1024 * 1024) { toast.error("Image must be under 3MB"); return; }
    const reader = new FileReader();
    reader.onloadend = () => updateField(key, reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    if (!selectedBizId) return;
    try {
      await updateBusiness(selectedBizId, { homePageConfig: homePageData } as any);
      // Update localStorage if this is the active business
      try {
        const active = localStorage.getItem("dp_active_business");
        if (active) {
          const activeBiz = JSON.parse(active);
          if (activeBiz.id === selectedBizId) {
            localStorage.setItem("dp_active_business", JSON.stringify({ ...activeBiz, homePageConfig: homePageData }));
          }
        }
      } catch {}
      toast.success("Home page updated! ✅");
      onUpdated();
    } catch {
      toast.error("Failed to save changes");
    }
  };

  const handlePreview = () => {
    if (!selectedBiz) return;
    // Save to localStorage temporarily for preview
    const stored = localStorage.getItem("dp_active_business");
    const current = stored ? JSON.parse(stored) : null;
    localStorage.setItem("dp_active_business", JSON.stringify({ ...selectedBiz, homePageConfig: homePageData }));
    window.open("/business-home", "_blank");
    // Restore original if different business
    if (current && current.id !== selectedBizId) {
      setTimeout(() => localStorage.setItem("dp_active_business", JSON.stringify(current)), 500);
    }
  };

  const renderSection = () => {
    if (!selectedBiz) return null;

    switch (activeSection) {
      case "hero":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hero Tagline</Label>
              <Input value={homePageData.heroTagline || ""} onChange={e => updateField("heroTagline", e.target.value)} placeholder={`e.g. Premium ${selectedBiz.type} Experience`} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hero Title</Label>
              <Input value={homePageData.heroTitle || ""} onChange={e => updateField("heroTitle", e.target.value)} placeholder="Your Daily Coffee Haven" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hero Subtitle</Label>
              <Textarea value={homePageData.heroSubtitle || ""} onChange={e => updateField("heroSubtitle", e.target.value)} placeholder="Experience the perfect blend..." rows={3} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Hero Image</Label>
              <div className="flex items-center gap-3">
                {homePageData.heroImage && (
                  <img src={homePageData.heroImage} alt="Hero" className="w-24 h-16 rounded-lg object-cover border border-border" />
                )}
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border hover:border-accent/50 cursor-pointer transition-colors bg-muted/30">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload Image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload("heroImage")} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        );

      case "about":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">About Title</Label>
              <Input value={homePageData.aboutTitle || ""} onChange={e => updateField("aboutTitle", e.target.value)} placeholder={`Welcome to ${selectedBiz.name}`} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">About Text</Label>
              <Textarea value={homePageData.aboutText || ""} onChange={e => updateField("aboutText", e.target.value)} placeholder="Tell your story..." rows={5} />
            </div>
          </div>
        );

      case "testimonial":
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Customer Name</Label>
                <Input validate="text" value={homePageData.testimonialName || ""} onChange={e => updateField("testimonialName", e.target.value)} placeholder="Sarah Jenkins" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Customer Title</Label>
                <Input value={homePageData.testimonialTitle || ""} onChange={e => updateField("testimonialTitle", e.target.value)} placeholder="Loyal Member since 2022" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Testimonial Text</Label>
              <Textarea value={homePageData.testimonialText || ""} onChange={e => updateField("testimonialText", e.target.value)} placeholder="The ambiance is unmatched..." rows={4} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Testimonial Image</Label>
              <div className="flex items-center gap-3">
                {homePageData.testimonialImage && (
                  <img src={homePageData.testimonialImage} alt="Testimonial" className="w-24 h-16 rounded-lg object-cover border border-border" />
                )}
                <label className="flex items-center gap-2 px-4 py-2 rounded-lg border border-dashed border-border hover:border-accent/50 cursor-pointer transition-colors bg-muted/30">
                  <Upload className="w-4 h-4 text-muted-foreground" />
                  <span className="text-xs text-muted-foreground">Upload Image</span>
                  <input type="file" accept="image/*" onChange={handleImageUpload("testimonialImage")} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        );

      case "whyChoose":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Section Title</Label>
              <Input value={homePageData.whyTitle || ""} onChange={e => updateField("whyTitle", e.target.value)} placeholder="Why Choose Us" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Section Subtitle</Label>
              <Textarea value={homePageData.whySubtitle || ""} onChange={e => updateField("whySubtitle", e.target.value)} placeholder="We go above and beyond..." rows={3} />
            </div>
          </div>
        );

      case "footer":
        return (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label className="text-xs text-muted-foreground">Footer Description</Label>
              <Textarea value={homePageData.footerText || ""} onChange={e => updateField("footerText", e.target.value)} placeholder="Custom footer text..." rows={3} />
            </div>
          </div>
        );

      case "services":
        return (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">
              Services are managed in the business creation/edit modal under "Home Page Services" section.
            </p>
            <Button variant="outline" size="sm" className="gap-1.5 text-xs">
              <Building2 className="w-3.5 h-3.5" /> Edit in Business Settings
            </Button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Business Selector */}
      <div className="flex items-center gap-4">
        <div className="flex-1 max-w-sm space-y-1.5">
          <Label className="text-xs text-muted-foreground font-semibold">Select Business to Edit</Label>
          <Select value={selectedBizId} onValueChange={handleSelectBusiness}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a business..." />
            </SelectTrigger>
            <SelectContent>
              {businesses.map(b => (
                <SelectItem key={b.id} value={b.id}>
                  <span className="flex items-center gap-2">
                    {b.type === "restaurant" ? "🍽️" : b.type === "hotel" ? "🏨" : "☕"} {b.name}
                  </span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {selectedBiz && (
          <div className="flex items-center gap-2 pt-5">
            <Button variant="outline" size="sm" onClick={handlePreview} className="gap-1.5 text-xs">
              <Eye className="w-3.5 h-3.5" /> Preview
            </Button>
            <Button variant="hero" size="sm" onClick={handleSave} className="gap-1.5 text-xs">
              <Save className="w-3.5 h-3.5" /> Save Changes
            </Button>
          </div>
        )}
      </div>

      {selectedBiz ? (
        <div className="grid grid-cols-12 gap-6">
          {/* Section Nav */}
          <div className="col-span-3">
            <div className="space-y-1">
              {sectionsList.map(section => {
                const isActive = activeSection === section.id;
                return (
                  <motion.button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    whileHover={{ x: 2 }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-accent/15 text-accent"
                        : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                  >
                    <section.icon className={`w-4 h-4 ${isActive ? "text-accent" : ""}`} />
                    {section.label}
                  </motion.button>
                );
              })}
            </div>
          </div>

          {/* Editor Panel */}
          <div className="col-span-9">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-card border border-border rounded-xl p-6"
            >
              <div className="flex items-center gap-2 mb-5">
                {(() => {
                  const s = sectionsList.find(s => s.id === activeSection);
                  return s ? <s.icon className="w-4.5 h-4.5 text-accent" /> : null;
                })()}
                <h3 className="font-display font-bold text-foreground">
                  {sectionsList.find(s => s.id === activeSection)?.label}
                </h3>
                <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full ml-auto">
                  {selectedBiz.name}
                </span>
              </div>
              {renderSection()}
            </motion.div>
          </div>
        </div>
      ) : (
        <div className="text-center py-20 text-muted-foreground">
          <Building2 className="w-12 h-12 mx-auto mb-4 text-muted-foreground/30" />
          <p className="text-sm font-medium">Select a business to edit its home page</p>
          <p className="text-xs mt-1">You can customize hero images, text, testimonials, and more</p>
        </div>
      )}
    </div>
  );
};

export default HomePageEditorTab;
