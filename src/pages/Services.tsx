import { useState } from "react";
import { Link } from "react-router-dom";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  Clock, 
  CheckCircle, 
  Info, 
  Stethoscope, 
  Sparkles, 
  Shield,
  Zap,
  Smile,
  Syringe,
  CircleDot,
  ArrowRight,
  Calendar
} from "lucide-react";

interface Service {
  id: string;
  category: string;
  icon: React.ElementType;
  nameRo: string;
  nameEn: string;
  descriptionRo: string;
  descriptionEn: string;
  price: string;
  priceFrom?: boolean;
  duration: string;
  featuresRo: string[];
  featuresEn: string[];
  popular?: boolean;
}

const SERVICES: Service[] = [
  {
    id: "consultation",
    category: "general",
    icon: Stethoscope,
    nameRo: "Consultație Stomatologică",
    nameEn: "Dental Consultation",
    descriptionRo: "Evaluare completă a stării dentare, diagnostic și plan de tratament personalizat",
    descriptionEn: "Complete evaluation of dental condition, diagnosis and personalized treatment plan",
    price: "150 RON",
    duration: "30 min",
    featuresRo: [
      "Examinare vizuală completă",
      "Radiografie panoramică (la nevoie)",
      "Plan de tratament detaliat",
      "Estimare costuri"
    ],
    featuresEn: [
      "Complete visual examination",
      "Panoramic X-ray (if needed)",
      "Detailed treatment plan",
      "Cost estimation"
    ]
  },
  {
    id: "detartraj",
    category: "general",
    icon: Sparkles,
    nameRo: "Detartraj și Periaj",
    nameEn: "Teeth Cleaning",
    descriptionRo: "Îndepărtarea tartrului și plăcii bacteriene pentru sănătatea gingiilor",
    descriptionEn: "Removal of tartar and bacterial plaque for gum health",
    price: "200 RON",
    duration: "45 min",
    featuresRo: [
      "Detartraj cu ultrasunete",
      "Periaj profesional",
      "Airflow (la cerere)",
      "Sfaturi pentru igiena orală"
    ],
    featuresEn: [
      "Ultrasonic scaling",
      "Professional brushing",
      "Airflow (on request)",
      "Oral hygiene advice"
    ]
  },
  {
    id: "plomba",
    category: "general",
    icon: Shield,
    nameRo: "Plombă Estetică",
    nameEn: "Dental Filling",
    descriptionRo: "Restaurarea dinților afectați de carii cu materiale de înaltă calitate",
    descriptionEn: "Restoration of decayed teeth with high-quality materials",
    price: "250 RON",
    priceFrom: true,
    duration: "45 min",
    featuresRo: [
      "Anestezie locală",
      "Compozit de ultimă generație",
      "Culoare adaptată natural",
      "Garanație 2 ani"
    ],
    featuresEn: [
      "Local anesthesia",
      "Latest generation composite",
      "Natural color matching",
      "2-year warranty"
    ]
  },
  {
    id: "canal",
    category: "general",
    icon: CircleDot,
    nameRo: "Tratament Endodontic (Canal)",
    nameEn: "Root Canal Treatment",
    descriptionRo: "Tratament complet al infecțiilor pulpei dentare cu tehnologie modernă",
    descriptionEn: "Complete treatment of dental pulp infections with modern technology",
    price: "400 RON",
    priceFrom: true,
    duration: "60-90 min",
    featuresRo: [
      "Microscop endodontic",
      "Instrumente rotative",
      "Obturație de canal de precizie",
      "Rate de succes >95%"
    ],
    featuresEn: [
      "Endodontic microscope",
      "Rotary instruments",
      "Precision canal filling",
      "Success rate >95%"
    ]
  },
  {
    id: "extractie",
    category: "surgery",
    icon: Syringe,
    nameRo: "Extracție Dentară",
    nameEn: "Tooth Extraction",
    descriptionRo: "Extracții simple sau chirurgicale cu anestezie eficientă și recuperare rapidă",
    descriptionEn: "Simple or surgical extractions with effective anesthesia and quick recovery",
    price: "300 RON",
    priceFrom: true,
    duration: "30-60 min",
    featuresRo: [
      "Anestezie modernă",
      "Tehnică minim invazivă",
      "Instrucțiuni post-extracție",
      "Control gratuit de verificare"
    ],
    featuresEn: [
      "Modern anesthesia",
      "Minimally invasive technique",
      "Post-extraction instructions",
      "Free follow-up check"
    ]
  },
  {
    id: "implant",
    category: "surgery",
    icon: Zap,
    nameRo: "Implant Dentar",
    nameEn: "Dental Implant",
    descriptionRo: "Înlocuirea dinților lipsă cu implanturi de titan de ultimă generație",
    descriptionEn: "Replacement of missing teeth with latest generation titanium implants",
    price: "2.500 RON",
    priceFrom: true,
    duration: "60 min",
    featuresRo: [
      "Implant premium (Straumann/Neodent)",
      "Chirurgie ghidată digital",
      "Coroană ceramică inclusă",
      "Garanație 10 ani"
    ],
    featuresEn: [
      "Premium implant (Straumann/Neodent)",
      "Digital guided surgery",
      "Ceramic crown included",
      "10-year warranty"
    ],
    popular: true
  },
  {
    id: "albire",
    category: "aesthetic",
    icon: Sparkles,
    nameRo: "Albire Dentară",
    nameEn: "Teeth Whitening",
    descriptionRo: "Albire profesională în cabinet pentru un zâmbet radiant",
    descriptionEn: "Professional in-office whitening for a radiant smile",
    price: "800 RON",
    duration: "90 min",
    featuresRo: [
      "Sistem Zoom Philips",
      "Până la 8 nuanțe mai albe",
      "Kit mentenanță acasă inclus",
      "Rezultate imediate"
    ],
    featuresEn: [
      "Philips Zoom system",
      "Up to 8 shades whiter",
      "Home maintenance kit included",
      "Immediate results"
    ],
    popular: true
  },
  {
    id: "fatete",
    category: "aesthetic",
    icon: Smile,
    nameRo: "Fațete Dentare",
    nameEn: "Dental Veneers",
    descriptionRo: "Transformare estetică completă cu fațete de porțelan personalizate",
    descriptionEn: "Complete aesthetic transformation with custom porcelain veneers",
    price: "1.200 RON",
    priceFrom: true,
    duration: "2-3 ședințe",
    featuresRo: [
      "Design digital al zâmbetului",
      "Porțelan Emax de înaltă calitate",
      "Aspect natural garantat",
      "Garanație 5 ani"
    ],
    featuresEn: [
      "Digital smile design",
      "High-quality Emax porcelain",
      "Guaranteed natural look",
      "5-year warranty"
    ]
  },
  {
    id: "coroana",
    category: "aesthetic",
    icon: CircleDot,
    nameRo: "Coroană Dentară",
    nameEn: "Dental Crown",
    descriptionRo: "Coroane integral ceramice pentru restaurarea dinților deteriorați",
    descriptionEn: "All-ceramic crowns for restoring damaged teeth",
    price: "900 RON",
    priceFrom: true,
    duration: "2 ședințe",
    featuresRo: [
      "Zirconiu/Ceramică",
      "Scanare digitală",
      "Potrivire perfectă",
      "Garanație 5 ani"
    ],
    featuresEn: [
      "Zirconia/Ceramic",
      "Digital scanning",
      "Perfect fit",
      "5-year warranty"
    ]
  },
  {
    id: "invisalign",
    category: "orthodontics",
    icon: Smile,
    nameRo: "Ortodonție Invisalign",
    nameEn: "Invisalign Orthodontics",
    descriptionRo: "Aparate ortodontice invizibile pentru alinierea discretă a dinților",
    descriptionEn: "Invisible orthodontic appliances for discreet teeth alignment",
    price: "12.000 RON",
    priceFrom: true,
    duration: "6-18 luni",
    featuresRo: [
      "Alignere transparente",
      "Scanare 3D",
      "Vizualizare rezultat final",
      "Retainer inclus"
    ],
    featuresEn: [
      "Transparent aligners",
      "3D scanning",
      "Final result visualization",
      "Retainer included"
    ]
    },
  {
    id: "aparat",
    category: "orthodontics",
    icon: Zap,
    nameRo: "Aparat Dentar Fix",
    nameEn: "Fixed Braces",
    descriptionRo: "Aparate ortodontice clasice pentru corecții complexe",
    descriptionEn: "Classic orthodontic braces for complex corrections",
    price: "8.000 RON",
    priceFrom: true,
    duration: "12-24 luni",
    featuresRo: [
      "Brekuri ceramice/metalice",
      "Control lunar",
      "Plan tratament personalizat",
 "Retainer inclus"
    ],
    featuresEn: [
      "Ceramic/metal brackets",
      "Monthly check-ups",
      "Personalized treatment plan",
      "Retainer included"
    ]
  },
  {
    id: "urgenta",
    category: "emergency",
    icon: Syringe,
    nameRo: "Urgență Stomatologică",
    nameEn: "Dental Emergency",
    descriptionRo: "Tratament prompt pentru dureri acute, fracturi sau alte urgențe",
    descriptionEn: "Prompt treatment for acute pain, fractures or other emergencies",
    price: "300 RON",
    priceFrom: true,
    duration: "Variabil",
    featuresRo: [
      "Programare în aceeași zi",
      "Diagnostic rapid",
      "Tratament imediat",
 "Disponibil și weekend"
    ],
    featuresEn: [
      "Same-day appointment",
      "Quick diagnosis",
      "Immediate treatment",
      "Available on weekends"
    ]
  }
];

const CATEGORIES = [
  { id: "all", labelRo: "Toate Serviciile", labelEn: "All Services", icon: Stethoscope },
  { id: "general", labelRo: "Stomatologie Generală", labelEn: "General Dentistry", icon: Shield },
  { id: "surgery", labelRo: "Chirurgie", labelEn: "Surgery", icon: Syringe },
  { id: "aesthetic", labelRo: "Estetică Dentară", labelEn: "Dental Aesthetics", icon: Sparkles },
  { id: "orthodontics", labelRo: "Ortodonție", labelEn: "Orthodontics", icon: Smile },
  { id: "emergency", labelRo: "Urgențe", labelEn: "Emergency", icon: Zap }
];

export default function ServicesPage() {
  const { t, language } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedService, setSelectedService] = useState<Service | null>(null);

  const filteredServices = selectedCategory === "all"
    ? SERVICES
    : SERVICES.filter(s => s.category === selectedCategory);

  const isRo = language === "ro";

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-16 md:py-24">
          <div className="container mx-auto px-4 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {isRo ? "Servicii și Tarife" : "Services & Pricing"}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {isRo 
                ? "Oferim o gamă completă de servicii stomatologice cu preuri transparente și tratamente de calitate."
                : "We offer a complete range of dental services with transparent pricing and quality treatments."}
            </p>
          </div>
        </section>

        {/* Category Filter */}
        <section className="py-8 bg-white border-b sticky top-16 z-30">
          <div className="container mx-auto px-4">
            <div className="flex flex-wrap justify-center gap-2">
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                return (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedCategory(cat.id)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all ${
                      selectedCategory === cat.id
                        ? "bg-blue-600 text-white shadow-lg"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {isRo ? cat.labelRo : cat.labelEn}
                  </button>
                );
              })}
            </div>
          </div>
        </section>

        {/* Services Grid */}
        <section className="py-12 md:py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredServices.map((service) => {
                const Icon = service.icon;
                return (
                  <Card 
                    key={service.id} 
                    className={`group hover:shadow-xl transition-all duration-300 cursor-pointer border-2 ${
                      service.popular ? "border-blue-200 relative" : "border-transparent hover:border-blue-100"
                    }`}
                    onClick={() => setSelectedService(service)}
                  >
                    {service.popular && (
                      <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 hover:bg-blue-700">
                        {isRo ? "Popular" : "Popular"}
                      </Badge>
                    )}
                    <CardHeader className="pb-4">
                      <div className="flex items-start justify-between">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                          <Icon className="h-6 w-6 text-blue-600 group-hover:text-white transition-colors" />
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-blue-600">
                            {service.priceFrom && (isRo ? "de la " : "from ")}
                            {service.price}
                          </p>
                        </div>
                      </div>
                      <CardTitle className="text-xl mt-4">
                        {isRo ? service.nameRo : service.nameEn}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-gray-600 text-sm mb-4">
                        {isRo ? service.descriptionRo : service.descriptionEn}
                      </p>
                      
                      <div className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <Clock className="h-4 w-4" />
                        <span>{service.duration}</span>
                      </div>

                      <div className="space-y-2">
                        {(isRo ? service.featuresRo : service.featuresEn).slice(0, 3).map((feature, idx) => (
                          <div key={idx} className="flex items-center gap-2 text-sm">
                            <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                            <span className="text-gray-700">{feature}</span>
                          </div>
                        ))}
                      </div>

                      <Button 
                        variant="ghost" 
                        className="w-full mt-4 group-hover:bg-blue-50 group-hover:text-blue-600"
                      >
                        {isRo ? "Vezi detalii" : "View details"}
                        <ArrowRight className="h-4 w-4 ml-2" />
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredServices.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  {isRo ? "Nu există servicii în această categorie." : "No services in this category."}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 bg-blue-600">
          <div className="container mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {isRo ? "Pregătit să îți îmbunătățești zâmbetul?" : "Ready to improve your smile?"}
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {isRo 
                ? "Programează o consultație gratuită și află ce tratamente sunt potrivite pentru tine."
                : "Schedule a free consultation and find out which treatments are right for you."}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg" className="bg-white text-blue-600 hover:bg-white/90">
                <Link to="/rezervare" className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  {isRo ? "Programează-te Online" : "Book Online"}
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <a href="tel:0722123456" className="flex items-center gap-2">
                  {isRo ? "Sună Acum" : "Call Now"}
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Info Section */}
        <section className="py-12 bg-white">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto">
              <div className="flex items-start gap-4 p-6 bg-blue-50 rounded-xl">
                <Info className="h-6 w-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {isRo ? "Informații importante despre prețuri" : "Important pricing information"}
                  </h3>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• {isRo ? "Prețurile pot varia în funcție de complexitatea cazului" : "Prices may vary depending on case complexity"}</li>
                    <li>• {isRo ? "Oferim plata în rate fără dobândă pentru tratamente peste 2.000 RON" : "We offer interest-free installments for treatments over 2,000 RON"}</li>
                    <li>• {isRo ? "Consultația inițială include evaluare și plan de tratament" : "Initial consultation includes evaluation and treatment plan"}</li>
                    <li>• {isRo ? "Acceptăm carduri de sănătate și decontare CAS" : "We accept health cards and CAS reimbursement"}</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Service Detail Dialog */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {selectedService && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                    <selectedService.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl">
                      {isRo ? selectedService.nameRo : selectedService.nameEn}
                    </DialogTitle>
                    <DialogDescription>
                      {isRo ? selectedService.descriptionRo : selectedService.descriptionEn}
                    </DialogDescription>
                  </div>
                </div>
              </DialogHeader>

              <div className="space-y-6 mt-4">
                {/* Price and Duration */}
                <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-lg">
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-sm text-gray-500 mb-1">
                      {isRo ? "Preț" : "Price"}
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {selectedService.priceFrom && (isRo ? "de la " : "from ")}
                      {selectedService.price}
                    </p>
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <p className="text-sm text-gray-500 mb-1">
                      {isRo ? "Durată" : "Duration"}
                    </p>
                    <p className="text-2xl font-bold text-gray-900">
                      {selectedService.duration}
                    </p>
                  </div>
                </div>

                {/* Features */}
                <div>
                  <h4 className="font-semibold text-gray-900 mb-3">
                    {isRo ? "Ce include serviciul:" : "What's included:"}
                  </h4>
                  <ul className="space-y-2">
                    {(isRo ? selectedService.featuresRo : selectedService.featuresEn).map((feature, idx) => (
                      <li key={idx} className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                        <span className="text-gray-700">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* CTA */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t">
                  <Button asChild className="flex-1">
                    <Link to="/rezervare">
                      <Calendar className="h-4 w-4 mr-2" />
                      {isRo ? "Programează-te" : "Book Appointment"}
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="flex-1">
                    <a href="tel:0722123456">
                      {isRo ? "Sună pentru Info" : "Call for Info"}
                    </a>
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
}
