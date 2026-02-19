import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Award, GraduationCap, Stethoscope, Star, BookOpen, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/hooks/useLanguage";

const getDentists = (t: (key: string) => string) => [
  {
    id: "dr-lung",
    firstName: "Dr.",
    lastName: "Lung",
    fullName: "Dr. Lung",
    title: t("lang.ro") === "Română" ? "Medic Stomatolog Principal" : "Chief Dental Physician",
    specialization: t("lang.ro") === "Română" ? "Stomatologie Generală, Radiologie Dentară" : "General Dentistry, Dental Radiology",
    experience: 20,
    color: "#3B82F6",
    education: [
      "Universitatea de Medicină și Farmacie 'Iuliu Hațieganu' Cluj-Napoca",
      "Specializare în Radiologie Dentară - Viena, Austria",
      "Doctorat în Stomatologie Preventivă"
    ],
    certifications: [
      "Certificare Internațională în Implantologie",
      "Membru al Asociației Române de Stomatologie",
      "Membru al Academiei Europene de Estetică Dentară"
    ],
    expertise: [
      t("lang.ro") === "Română" ? "Radiologie dentară digitală 3D" : "3D digital dental radiology",
      t("lang.ro") === "Română" ? "Implantologie orală" : "Oral implantology",
      t("lang.ro") === "Română" ? "Chirurgie orală complexă" : "Complex oral surgery",
      t("lang.ro") === "Română" ? "Estetică dentară avansată" : "Advanced dental aesthetics",
      t("lang.ro") === "Română" ? "Tratamente endodontice microscopice" : "Microscopic endodontic treatments"
    ],
    achievements: [
      t("lang.ro") === "Română" 
        ? "Peste 10,000 de implanturi dentare realizate cu succes"
        : "Over 10,000 dental implants successfully performed",
      t("lang.ro") === "Română" ? "Peste 20 de ani de experiență clinică" : "Over 20 years of clinical experience",
      t("lang.ro") === "Română" ? "Fondatorul Clinicii Dr. Lung (2004)" : "Founder of Dr. Lung Clinic (2004)",
      t("lang.ro") === "Română" 
        ? "Speaker la conferințe internaționale de stomatologie"
        : "Speaker at international dentistry conferences"
    ],
    languages: ["Română", "English", "Deutsch"],
    availability: t("lang.ro") === "Română" ? "Luni - Vineri" : "Mon - Fri",
    rating: 4.9,
    reviews: 328
  },
  {
    id: "dr-ionescu",
    firstName: "Andrei",
    lastName: "Ionescu",
    fullName: "Dr. Andrei Ionescu",
    title: t("lang.ro") === "Română" 
      ? "Medic Specialist Chirurgie Orală și Implantologie"
      : "Specialist in Oral Surgery and Implantology",
    specialization: t("lang.ro") === "Română" ? "Chirurgie Orală, Implantologie" : "Oral Surgery, Implantology",
    experience: 12,
    color: "#10B981",
    education: [
      "Universitatea de Medicină și Farmacie 'Carol Davila' București",
      "Rezidențiat în Chirurgie Orală și Maxilo-facială",
      "Master în Implantologie Orală - Germania"
    ],
    certifications: [
      "Certificare ITI (International Team for Implantology)",
      "Certificare în Chirurgie Plastică Gingivală",
      "Membru al Societății Române de Implantologie"
    ],
    expertise: [
      t("lang.ro") === "Română" ? "Implanturi dentare immediate" : "Immediate dental implants",
      t("lang.ro") === "Română" ? "Chirurgie orală complexă" : "Complex oral surgery",
      t("lang.ro") === "Română" ? "Ridicare de sinus" : "Sinus lift",
      t("lang.ro") === "Română" ? "Grefe osoase" : "Bone grafts",
      t("lang.ro") === "Română" ? "Extracții chirurgicale" : "Surgical extractions"
    ],
    achievements: [
      t("lang.ro") === "Română" 
        ? "Peste 5,000 de implanturi realizate"
        : "Over 5,000 implants performed",
      t("lang.ro") === "Română" ? "Rata de succes a implanturilor: 98.5%" : "Implant success rate: 98.5%",
      t("lang.ro") === "Română" ? "12 ani de experiență exclusiv în chirurgie" : "12 years exclusively in surgery",
      t("lang.ro") === "Română" 
        ? "Formator în implantologie pentru medici rezidenți"
        : "Trainer in implantology for resident doctors"
    ],
    languages: ["Română", "English"],
    availability: t("lang.ro") === "Română" ? "Luni, Miercuri, Joi" : "Mon, Wed, Thu",
    rating: 4.8,
    reviews: 256
  },
  {
    id: "dr-popescu",
    firstName: "Maria",
    lastName: "Popescu",
    fullName: "Dr. Maria Popescu",
    title: t("lang.ro") === "Română" 
      ? "Medic Specialist Ortodonție și Estetică Dentară"
      : "Specialist in Orthodontics and Dental Aesthetics",
    specialization: t("lang.ro") === "Română" ? "Ortodonție, Estetică Dentară" : "Orthodontics, Dental Aesthetics",
    experience: 8,
    color: "#F59E0B",
    education: [
      "Universitatea de Medicină și Farmacie 'Iuliu Hațieganu' Cluj-Napoca",
      "Specializare în Ortodonție - Barcelona, Spania",
      "Cursuri avansate Invisalign și aparate invizibile"
    ],
    certifications: [
      "Certificare Invisalign Diamond Provider",
      "Membru al Asociației Mondiale de Ortodonție",
      "Certificare în Design de Zâmbet (Digital Smile Design)"
    ],
    expertise: [
      t("lang.ro") === "Română" ? "Aparate ortodontice invizibile (Invisalign)" : "Invisible orthodontic appliances (Invisalign)",
      t("lang.ro") === "Română" ? "Ortodonție pentru adulți și copii" : "Orthodontics for adults and children",
      t("lang.ro") === "Română" ? "Fațete dentare estetice" : "Aesthetic dental veneers",
      t("lang.ro") === "Română" ? "Albire profesională" : "Professional whitening",
      t("lang.ro") === "Română" ? "Design de zâmbet digital" : "Digital smile design"
    ],
    achievements: [
      t("lang.ro") === "Română" 
        ? "Peste 500 de cazuri Invisalign finalizate"
        : "Over 500 completed Invisalign cases",
      t("lang.ro") === "Română" ? "Transformări complete de zâmbet" : "Complete smile transformations",
      t("lang.ro") === "Română" ? "8 ani de specializare în estetică" : "8 years specializing in aesthetics",
      t("lang.ro") === "Română" 
        ? "Colaborări cu clinici din Spania și Italia"
        : "Collaborations with clinics from Spain and Italy"
    ],
    languages: ["Română", "English", "Español"],
    availability: t("lang.ro") === "Română" ? "Marți, Miercuri, Vineri" : "Tue, Wed, Fri",
    rating: 4.9,
    reviews: 189
  },
  {
    id: "dr-marinescu",
    firstName: "Cristian",
    lastName: "Marinescu",
    fullName: "Dr. Cristian Marinescu",
    title: t("lang.ro") === "Română" 
      ? "Medic Specialist Endodonție și Stomatologie Conservative"
      : "Specialist in Endodontics and Conservative Dentistry",
    specialization: t("lang.ro") === "Română" ? "Endodonție, Stomatologie Conservative" : "Endodontics, Conservative Dentistry",
    experience: 15,
    color: "#8B5CF6",
    education: [
      "Universitatea de Medicină și Farmacie 'Victor Babeș' Timișoara",
      "Specializare în Endodonție Microscopică - Amsterdam",
      "Doctorat în Tratamente Endodontice Complexe"
    ],
    certifications: [
      "Certificare Europeană în Endodonție (ESE)",
      "Membru al Societății Europene de Endodonție",
      "Certificare în Utilizarea Microscopului Dentar"
    ],
    expertise: [
      t("lang.ro") === "Română" ? "Tratamente de canal microscopice" : "Microscopic root canal treatments",
      t("lang.ro") === "Română" ? "Reintervenții endodontice (re-endo)" : "Endodontic retreatments (re-endo)",
      t("lang.ro") === "Română" ? "Plombe estetice compozite" : "Composite aesthetic fillings",
      t("lang.ro") === "Română" ? "Inlay-uri și Onlay-uri" : "Inlays and Onlays",
      t("lang.ro") === "Română" ? "Tratamente pentru hipersensibilitate dentară" : "Treatments for tooth hypersensitivity"
    ],
    achievements: [
      t("lang.ro") === "Română" 
        ? "Rata de succes a tratamentelor endodontice: 96%"
        : "Endodontic treatment success rate: 96%",
      t("lang.ro") === "Română" ? "Salvarea a peste 2,000 de dinți compromiși" : "Saved over 2,000 compromised teeth",
      t("lang.ro") === "Română" ? "15 ani dedicat conservării dentare" : "15 years dedicated to dental conservation",
      t("lang.ro") === "Română" 
        ? "Tehnologie microscopă de ultimă generație"
        : "State-of-the-art microscopy technology"
    ],
    languages: ["Română", "English", "Nederlands"],
    availability: t("lang.ro") === "Română" ? "Luni - Joi" : "Mon - Thu",
    rating: 4.8,
    reviews: 312
  },
  {
    id: "dr-stancu",
    firstName: "Elena",
    lastName: "Stancu",
    fullName: "Dr. Elena Stancu",
    title: t("lang.ro") === "Română" 
      ? "Medic Specialist Pedodonție și Stomatologie pentru Copii"
      : "Specialist in Pedodontics and Children's Dentistry",
    specialization: t("lang.ro") === "Română" ? "Pedodonție, Stomatologie Pediatrică" : "Pedodontics, Pediatric Dentistry",
    experience: 10,
    color: "#EC4899",
    education: [
      "Universitatea de Medicină și Farmacie 'Iuliu Hațieganu' Cluj-Napoca",
      "Specializare în Stomatologie Pediatrică - Viena",
      "Cursuri în Comportament și Managementul Copilului"
    ],
    certifications: [
      "Certificare în Stomatologie Pediatrică (IAPD)",
      "Specialist în Managementul Anxietății la Copii",
      "Membru al Asociației Internaționale de Pedodonție"
    ],
    expertise: [
      t("lang.ro") === "Română" ? "Stomatologie pediatrică preventivă" : "Preventive pediatric dentistry",
      t("lang.ro") === "Română" ? "Tratamente pentru copii anxioși" : "Treatments for anxious children",
      t("lang.ro") === "Română" ? "Sigilări și fluorizări" : "Sealants and fluoridation",
      t("lang.ro") === "Română" ? "Ortodonție interceptivă" : "Interceptive orthodontics",
      t("lang.ro") === "Română" ? "Educație pentru sănătate orală" : "Oral health education"
    ],
    achievements: [
      t("lang.ro") === "Română" 
        ? "Peste 3,000 de copii tratați cu succes"
        : "Over 3,000 children successfully treated",
      t("lang.ro") === "Română" ? "Crearea unui mediu prietenos pentru copii" : "Created a child-friendly environment",
      t("lang.ro") === "Română" 
        ? "10 ani dedicați exclusiv stomatologiei pediatric"
        : "10 years dedicated exclusively to pediatric dentistry",
      t("lang.ro") === "Română" 
        ? "Colaborări cu școli pentru programe de prevenție"
        : "Collaborations with schools for prevention programs"
    ],
    languages: ["Română", "English"],
    availability: t("lang.ro") === "Română" ? "Marți - Sâmbătă" : "Tue - Sat",
    rating: 5.0,
    reviews: 178
  },
  {
    id: "dr-radu",
    firstName: "Mihai",
    lastName: "Radu",
    fullName: "Dr. Mihai Radu",
    title: t("lang.ro") === "Română" 
      ? "Medic Specialist Parodontologie și Stomatologie Generală"
      : "Specialist in Periodontology and General Dentistry",
    specialization: t("lang.ro") === "Română" ? "Parodontologie, Stomatologie Generală" : "Periodontology, General Dentistry",
    experience: 14,
    color: "#14B8A6",
    education: [
      "Universitatea de Medicină și Farmacie 'Iuliu Hațieganu' Cluj-Napoca",
      "Specializare în Parodontologie - Paris, Franța",
      "Master în Sănătate Orală și Sisteme Imunitare"
    ],
    certifications: [
      "Certificare Europeană în Parodontologie (EFP)",
      "Membru al Societății Americane de Parodontologie",
      "Specialist în Terapii Laser în Parodontologie"
    ],
    expertise: [
      t("lang.ro") === "Română" ? "Tratamentul bolilor parodontale" : "Treatment of periodontal diseases",
      t("lang.ro") === "Română" ? "Chirurgie parodontală regenerativă" : "Regenerative periodontal surgery",
      t("lang.ro") === "Română" ? "Gingivoplastie estetică" : "Aesthetic gingivoplasty",
      t("lang.ro") === "Română" ? "Tratamentul afecțiunilor mucoasei" : "Treatment of mucosal conditions",
      t("lang.ro") === "Română" ? "Terapie laser în parodontologie" : "Laser therapy in periodontology"
    ],
    achievements: [
      t("lang.ro") === "Română" 
        ? "Salvarea a peste 1,500 de cazuri parodontale complexe"
        : "Saved over 1,500 complex periodontal cases",
      t("lang.ro") === "Română" ? "Implementarea terapiei laser în clinică" : "Implemented laser therapy in the clinic",
      t("lang.ro") === "Română" ? "14 ani de experiență în tratamentul gingival" : "14 years of experience in gum treatment",
      t("lang.ro") === "Română" ? "Prevenția pierderii dinților la pacienți cu risc" : "Prevention of tooth loss in at-risk patients"
    ],
    languages: ["Română", "English", "Français"],
    availability: t("lang.ro") === "Română" ? "Luni, Marți, Joi, Vineri" : "Mon, Tue, Thu, Fri",
    rating: 4.7,
    reviews: 234
  }
];

export default function TeamPage() {
  const { t } = useLanguage();
  const dentists = getDentists(t);

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1 bg-gray-50">
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-600 to-blue-800 py-16 md:py-24">
          <div className="container text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              {t("team.title")}
            </h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              {t("team.subtitle")}
            </p>
            <div className="flex flex-wrap justify-center gap-8 mt-10">
              <div className="text-center text-white">
                <p className="text-4xl font-bold">6</p>
                <p className="text-white/80">{t("team.doctors")}</p>
              </div>
              <div className="text-center text-white">
                <p className="text-4xl font-bold">80+</p>
                <p className="text-white/80">{t("team.experience")}</p>
              </div>
              <div className="text-center text-white">
                <p className="text-4xl font-bold">15,000+</p>
                <p className="text-white/80">{t("team.patients")}</p>
              </div>
            </div>
          </div>
        </section>

        {/* Team Grid */}
        <section className="py-16">
          <div className="container">
            <div className="grid gap-8 lg:gap-12">
              {dentists.map((dentist, index) => (
                <Card key={dentist.id} className="overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`grid md:grid-cols-12 gap-0 ${index % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                      {/* Image Column */}
                      <div className="md:col-span-4 bg-gray-100 relative">
                        <div 
                          className="h-64 md:h-full min-h-[300px] flex items-center justify-center"
                          style={{ backgroundColor: `${dentist.color}15` }}
                        >
                          <div 
                            className="w-40 h-40 rounded-full flex items-center justify-center text-white text-5xl font-bold shadow-lg"
                            style={{ backgroundColor: dentist.color }}
                          >
                            {dentist.firstName === "Dr." ? "L" : dentist.firstName[0]}{dentist.lastName[0]}
                          </div>
                        </div>
                        <div className="absolute top-4 left-4">
                          <Badge 
                            className="text-white"
                            style={{ backgroundColor: dentist.color }}
                          >
                            {dentist.experience} {t("team.experienceYears")}
                          </Badge>
                        </div>
                      </div>

                      {/* Content Column */}
                      <div className="md:col-span-8 p-6 md:p-8">
                        {/* Header */}
                        <div className="mb-6">
                          <h2 className="text-2xl md:text-3xl font-bold text-gray-900">
                            {dentist.fullName}
                          </h2>
                          <p className="text-lg text-gray-600 mt-1">{dentist.title}</p>
                          
                          <div className="flex flex-wrap items-center gap-4 mt-3">
                            <div className="flex items-center gap-1">
                              <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                              <span className="font-semibold">{dentist.rating}</span>
                              <span className="text-gray-500">({dentist.reviews} {t("team.reviews")})</span>
                            </div>
                          </div>
                        </div>

                        {/* Specializations */}
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">
                            {t("team.specialization")}
                          </h3>
                          <div className="flex flex-wrap gap-2">
                            {dentist.specialization.split(", ").map((spec) => (
                              <Badge key={spec} variant="secondary">
                                {spec}
                              </Badge>
                            ))}
                          </div>
                        </div>

                        {/* Education */}
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <GraduationCap className="h-4 w-4" />
                            {t("team.education")}
                          </h3>
                          <ul className="space-y-1">
                            {dentist.education.map((edu, i) => (
                              <li key={i} className="text-gray-700 text-sm">• {edu}</li>
                            ))}
                          </ul>
                        </div>

                        {/* Expertise */}
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Stethoscope className="h-4 w-4" />
                            {t("team.expertise")}
                          </h3>
                          <div className="grid sm:grid-cols-2 gap-2">
                            {dentist.expertise.map((exp, i) => (
                              <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-blue-500 mt-1">▸</span>
                                {exp}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Achievements */}
                        <div className="mb-6">
                          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Award className="h-4 w-4" />
                            {t("team.achievements")}
                          </h3>
                          <ul className="space-y-2">
                            {dentist.achievements.map((ach, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                                <span className="text-green-500 mt-0.5">✓</span>
                                {ach}
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Certifications & Languages */}
                        <div className="grid sm:grid-cols-2 gap-6 pt-4 border-t">
                          <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <BookOpen className="h-4 w-4" />
                              {t("team.certifications")}
                            </h3>
                            <ul className="space-y-1">
                              {dentist.certifications.slice(0, 2).map((cert, i) => (
                                <li key={i} className="text-xs text-gray-600">• {cert}</li>
                              ))}
                            </ul>
                          </div>
                          <div>
                            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-2">
                              <Users className="h-4 w-4" />
                              {t("team.languages")}
                            </h3>
                            <div className="flex flex-wrap gap-2">
                              {dentist.languages.map((lang) => {
                                const langKey = lang === "Română" ? "ro" : 
                                               lang === "English" ? "en" :
                                               lang === "Deutsch" ? "de" :
                                               lang === "Español" ? "es" :
                                               lang === "Français" ? "fr" :
                                               lang === "Nederlands" ? "nl" : "en";
                                return (
                                  <Badge key={lang} variant="outline" className="text-xs">
                                    {t(`team.languages.${langKey}`)}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section className="py-16 bg-blue-600">
          <div className="container text-center">
            <h2 className="text-3xl font-bold text-white mb-4">
              {t("booking.title")}
            </h2>
            <p className="text-white/90 text-lg max-w-2xl mx-auto mb-8">
              {t("booking.description")}
            </p>
            <a 
              href="/rezervare"
              className="inline-flex items-center justify-center px-8 py-4 bg-white text-blue-600 font-semibold rounded-lg hover:bg-white/90 transition-colors"
            >
              {t("team.bookNow")}
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
