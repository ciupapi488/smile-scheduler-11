import { useState } from "react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/useLanguage";
import { ZoomIn, X, ChevronLeft, ChevronRight } from "lucide-react";

interface GalleryItem {
  id: string;
  category: string;
  titleRo: string;
  titleEn: string;
  descriptionRo: string;
  descriptionEn: string;
  beforeImage: string;
  afterImage: string;
}

const GALLERY_ITEMS: GalleryItem[] = [
  {
    id: "1",
    category: "whitening",
    titleRo: "Albire Profesională",
    titleEn: "Professional Whitening",
    descriptionRo: "Rezultat după 2 ședințe de albire în cabinet",
    descriptionEn: "Result after 2 in-office whitening sessions",
    beforeImage: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&h=400&fit=crop"
  },
  {
    id: "2",
    category: "veneers",
    titleRo: "Fațete Dentare",
    titleEn: "Dental Veneers",
    descriptionRo: "Transformare completă cu 8 fațete de porțelan",
    descriptionEn: "Complete transformation with 8 porcelain veneers",
    beforeImage: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&h=400&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop"
  },
  {
    id: "3",
    category: "implants",
    titleRo: "Implant Dentar",
    titleEn: "Dental Implant",
    descriptionRo: "Înlocuire dinte lipsă cu implant și coroană ceramică",
    descriptionEn: "Missing tooth replacement with implant and ceramic crown",
    beforeImage: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&h=400&fit=crop"
  },
  {
    id: "4",
    category: "orthodontics",
    titleRo: "Ortodonție Invisalign",
    titleEn: "Invisalign Orthodontics",
    descriptionRo: "Corecție aliniere după 12 luni de tratament",
    descriptionEn: "Alignment correction after 12 months of treatment",
    beforeImage: "https://images.unsplash.com/photo-1609840114035-3c981b782dfe?w=600&h=400&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1598256989800-fe5f95da9787?w=600&h=400&fit=crop"
  },
  {
    id: "5",
    category: "fillings",
    titleRo: "Plombe Estetice",
    titleEn: "Aesthetic Fillings",
    descriptionRo: "Înlocuire plombe vechi cu compozit modern",
    descriptionEn: "Replacement of old fillings with modern composite",
    beforeImage: "https://images.unsplash.com/photo-1606811971618-4486d14f3f99?w=600&h=400&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1629909613654-28e377c37b09?w=600&h=400&fit=crop"
  },
  {
    id: "6",
    category: "crowns",
    titleRo: "Coroane Ceramice",
    titleEn: "Ceramic Crowns",
    descriptionRo: "Reabilitare completă cu coroane integral ceramice",
    descriptionEn: "Complete rehabilitation with all-ceramic crowns",
    beforeImage: "https://images.unsplash.com/photo-1588776814546-1ffcf47267a5?w=600&h=400&fit=crop",
    afterImage: "https://images.unsplash.com/photo-1606811841689-23dfddce3e95?w=600&h=400&fit=crop"
  }
];

const CATEGORIES = [
  { id: "all", labelRo: "Toate", labelEn: "All" },
  { id: "whitening", labelRo: "Albire", labelEn: "Whitening" },
  { id: "veneers", labelRo: "Fațete", labelEn: "Veneers" },
  { id: "implants", labelRo: "Implante", labelEn: "Implants" },
  { id: "orthodontics", labelRo: "Ortodonție", labelEn: "Orthodontics" },
  { id: "fillings", labelRo: "Plombe", labelEn: "Fillings" },
  { id: "crowns", labelRo: "Coroane", labelEn: "Crowns" }
];

export default function GalleryPage() {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);
  const [showBefore, setShowBefore] = useState(false);

  const filteredItems = selectedCategory === "all" 
    ? GALLERY_ITEMS 
    : GALLERY_ITEMS.filter(item => item.category === selectedCategory);

  const openLightbox = (item: GalleryItem) => {
    setSelectedItem(item);
    setShowBefore(false);
  };

  const navigateImage = (direction: "prev" | "next") => {
    if (!selectedItem) return;
    const currentIndex = filteredItems.findIndex(item => item.id === selectedItem.id);
    const newIndex = direction === "prev" 
      ? (currentIndex - 1 + filteredItems.length) % filteredItems.length
      : (currentIndex + 1) % filteredItems.length;
    setSelectedItem(filteredItems[newIndex]);
    setShowBefore(false);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {language === "ro" ? "Galerie Lucrări" : "Work Gallery"}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {language === "ro" 
                ? "Vedeți transformările reale ale pacienților noștri. Înainte și după tratament."
                : "See real transformations of our patients. Before and after treatment."}
            </p>
          </div>
        </section>

        {/* Gallery Section */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            {/* Category Tabs */}
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="w-full">
              <TabsList className="flex flex-wrap justify-center gap-2 mb-12 h-auto bg-transparent">
                {CATEGORIES.map((cat) => (
                  <TabsTrigger
                    key={cat.id}
                    value={cat.id}
                    className="px-4 py-2 rounded-full data-[state=active]:bg-blue-600 data-[state=active]:text-white border border-gray-200 bg-white hover:bg-gray-100 transition-colors"
                  >
                    {language === "ro" ? cat.labelRo : cat.labelEn}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value={selectedCategory} className="mt-0">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {filteredItems.map((item) => (
                    <div
                      key={item.id}
                      className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow cursor-pointer group"
                      onClick={() => openLightbox(item)}
                    >
                      {/* Before/After Images */}
                      <div className="relative h-64 overflow-hidden">
                        <div className="absolute inset-0 flex">
                          <div className="w-1/2 relative">
                            <img
                              src={item.beforeImage}
                              alt={`Before - ${language === "ro" ? item.titleRo : item.titleEn}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
                              {language === "ro" ? "ÎNAINTE" : "BEFORE"}
                            </div>
                          </div>
                          <div className="w-1/2 relative">
                            <img
                              src={item.afterImage}
                              alt={`After - ${language === "ro" ? item.titleRo : item.titleEn}`}
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-2 right-2 bg-green-600 text-white text-xs px-2 py-1 rounded">
                              {language === "ro" ? "DUPĂ" : "AFTER"}
                            </div>
                          </div>
                        </div>
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-blue-600/0 group-hover:bg-blue-600/20 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-10 h-10 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                      </div>

                      {/* Content */}
                      <div className="p-4">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {language === "ro" ? item.titleRo : item.titleEn}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {language === "ro" ? item.descriptionRo : item.descriptionEn}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                {filteredItems.length === 0 && (
                  <div className="text-center py-12">
                    <p className="text-gray-500">
                      {language === "ro" 
                        ? "Nu există lucrări în această categorie."
                        : "No works in this category."}
                    </p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                {language === "ro" 
                  ? "Rezultate care vorbesc de la sine"
                  : "Results that speak for themselves"}
              </h2>
              <p className="text-gray-600 mb-8">
                {language === "ro"
                  ? "Toate fotografiile prezentate sunt cazuri reale tratate în clinica noastră. Fiecare pacient este unic, iar rezultatele pot varia în funcție de condiția dentară inițială. Programați o consultație pentru a afla ce soluții sunt potrivite pentru dumneavoastră."
                  : "All photos shown are real cases treated in our clinic. Each patient is unique, and results may vary depending on the initial dental condition. Schedule a consultation to find out which solutions are right for you."}
              </p>
              <Button asChild size="lg">
                <a href="/rezervare">
                  {language === "ro" ? "Programează o Consultație" : "Schedule a Consultation"}
                </a>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Lightbox Dialog */}
      <Dialog open={!!selectedItem} onOpenChange={() => setSelectedItem(null)}>
        <DialogContent className="max-w-5xl w-full p-0 bg-black/95 border-none">
          {selectedItem && (
            <div className="relative">
              {/* Close Button */}
              <button
                onClick={() => setSelectedItem(null)}
                className="absolute top-4 right-4 z-50 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>

              {/* Navigation */}
              <button
                onClick={() => navigateImage("prev")}
                className="absolute left-4 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
              >
                <ChevronLeft className="w-8 h-8" />
              </button>
              <button
                onClick={() => navigateImage("next")}
                className="absolute right-4 top-1/2 -translate-y-1/2 z-50 text-white/80 hover:text-white bg-black/50 hover:bg-black/70 rounded-full p-2 transition-colors"
              >
                <ChevronRight className="w-8 h-8" />
              </button>

              {/* Image Container */}
              <div className="p-8">
                <div className="relative aspect-video rounded-lg overflow-hidden">
                  <img
                    src={showBefore ? selectedItem.beforeImage : selectedItem.afterImage}
                    alt={showBefore ? "Before" : "After"}
                    className="w-full h-full object-contain bg-gray-900"
                  />
                  {/* Before/After Toggle */}
                  <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex bg-black/70 rounded-full p-1">
                    <button
                      onClick={() => setShowBefore(true)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        showBefore ? "bg-white text-black" : "text-white hover:text-gray-300"
                      }`}
                    >
                      {language === "ro" ? "ÎNAINTE" : "BEFORE"}
                    </button>
                    <button
                      onClick={() => setShowBefore(false)}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                        !showBefore ? "bg-green-500 text-white" : "text-white hover:text-gray-300"
                      }`}
                    >
                      {language === "ro" ? "DUPĂ" : "AFTER"}
                    </button>
                  </div>
                </div>

                {/* Info */}
                <div className="mt-6 text-center text-white">
                  <h3 className="text-2xl font-semibold">
                    {language === "ro" ? selectedItem.titleRo : selectedItem.titleEn}
                  </h3>
                  <p className="text-gray-300 mt-2">
                    {language === "ro" ? selectedItem.descriptionRo : selectedItem.descriptionEn}
                  </p>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
