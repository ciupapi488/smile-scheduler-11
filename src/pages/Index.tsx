import { Smile, Shield, Clock, CalendarCheck, Stethoscope, MapPin, Phone, Mail, Award, Users, Clock3 } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { useLanguage } from "@/hooks/useLanguage";
import SymptomChecker from "@/components/ai/SymptomChecker";

export default function Index() {
  const { t, language } = useLanguage();

  const features = [
    {
      icon: Smile,
      title: t("features.gentle.title"),
      description: t("features.gentle.desc"),
    },
    {
      icon: Shield,
      title: t("features.expert.title"),
      description: t("features.expert.desc"),
    },
    {
      icon: Clock,
      title: t("features.flexible.title"),
      description: t("features.flexible.desc"),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 py-20 md:py-32">
          <div className="container relative z-10">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                {t("hero.title")}
              </h1>
              <p className="text-xl text-white/90 mt-4">
                {t("hero.subtitle")}
              </p>
              <p className="mt-6 text-lg text-white/80 md:text-xl">
                {t("hero.description")}
              </p>
              <Button
                asChild
                size="lg"
                className="mt-8 bg-white text-blue-600 hover:bg-white/90"
              >
                <Link to="/rezervare">
                  <CalendarCheck className="mr-2 h-5 w-5" />
                  {t("hero.cta")}
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-b bg-white py-16">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-center text-center"
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-blue-100">
                    <feature.icon className="h-7 w-7 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">{feature.title}</h3>
                  <p className="mt-2 text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Kids Section - Tooth Fairy */}
        <section className="py-16 bg-gradient-to-b from-pink-50 via-purple-50 to-blue-50">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <div className="bg-white rounded-3xl p-8 md:p-12 shadow-xl border-4 border-pink-200">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  <div className="flex-shrink-0">
                    <div className="w-32 h-32 bg-gradient-to-br from-pink-400 to-purple-500 rounded-full flex items-center justify-center text-6xl shadow-lg animate-pulse">
                      ✨
                    </div>
                  </div>
                  <div className="text-center md:text-left flex-1">
                    <h2 className="text-3xl md:text-4xl font-bold text-pink-600 mb-3">
                      {t("kids.title")}
                    </h2>
                    <p className="text-lg text-gray-600 mb-2">
                      {language === 'ro' 
                        ? "Povești interactive pentru cei mici"
                        : "Interactive stories for kids"}
                    </p>
                    <p className="text-gray-500 mb-6">
                      {language === 'ro'
                        ? "Ajută-ți copilul să învețe despre igiena dentară prin aventuri distractive cu Zâna Măseluță! Colectează autocolante, citește povești și pregătește-te pentru vizita la dentist fără teamă."
                        : "Help your child learn about dental hygiene through fun adventures with the Tooth Fairy! Collect stickers, read stories, and prepare for dentist visits without fear."}
                    </p>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-pink-100 text-pink-700 rounded-full text-sm">
                        📚 5+ {language === 'ro' ? 'povești' : 'stories'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                        🎨 {language === 'ro' ? 'Autocolante' : 'Stickers'}
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                        🛡️ {language === 'ro' ? 'Sigur pentru copii' : 'Safe for kids'}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <Button
                      asChild
                      size="lg"
                      className="bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white rounded-full px-8 shadow-lg"
                    >
                      <Link to="/zana-maseluta">
                        {language === 'ro' ? 'Descoperă ✨' : 'Discover ✨'}
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* AI Symptom Checker Section */}
        <section className="py-16 bg-gradient-to-b from-blue-50 to-white">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">
                  {t("ai.title") || "Asistent AI Dentar"}
                </h2>
                <p className="mt-4 text-gray-600">
                  {t("ai.subtitle") || "Descrieți simptomele și primiți îndrumare instant"}
                </p>
              </div>
              <SymptomChecker />
            </div>
          </div>
        </section>

        {/* Who Are We Section */}
        <section className="py-16 bg-white">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900">{t("about.title")}</h2>
                <div className="w-20 h-1 bg-blue-600 mx-auto mt-4"></div>
              </div>
              
              <div className="grid md:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <p className="text-gray-600 leading-relaxed">
                    {t("about.description1")}
                  </p>
                  <p className="text-gray-600 leading-relaxed">
                    {t("about.description2")}
                  </p>
                  
                  <div className="grid grid-cols-3 gap-4 pt-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Award className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-900">15+</p>
                      <p className="text-sm text-gray-600">{t("stats.years")}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-900">5000+</p>
                      <p className="text-sm text-gray-600">{t("stats.patients")}</p>
                    </div>
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <Clock3 className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                      <p className="text-2xl font-bold text-blue-900">24/7</p>
                      <p className="text-sm text-gray-600">{t("stats.support")}</p>
                    </div>
                  </div>
                </div>
                
                <div className="bg-gray-100 rounded-2xl p-8">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">{t("about.why")}</h3>
                  <ul className="space-y-4">
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <span className="text-gray-700">{t("about.equipment")}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <span className="text-gray-700">{t("about.training")}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <span className="text-gray-700">{t("about.sterilization")}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <span className="text-gray-700">{t("about.pricing")}</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <div className="w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-white text-sm">✓</span>
                      </div>
                      <span className="text-gray-700">{t("about.schedule")}</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Location Section with Map */}
        <section className="py-16 bg-gray-50">
          <div className="container">
            <div className="mx-auto max-w-5xl">
              <div className="text-center mb-12">
                <h2 className="text-3xl font-bold text-gray-900">{t("location.title")}</h2>
                <p className="mt-4 text-gray-600">{t("location.subtitle")}</p>
              </div>
              
              <div className="grid md:grid-cols-2 gap-8">
                {/* Contact Info */}
                <div className="bg-white rounded-2xl p-8 shadow-sm">
                  <h3 className="text-xl font-semibold text-gray-900 mb-6">{t("location.contact")}</h3>
                  
                  <div className="space-y-6">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{t("location.address")}</p>
                        <p className="text-gray-600">{t("location.street")}</p>
                        <p className="text-gray-600">{t("location.city")}</p>
                        <p className="text-gray-500 text-sm mt-1">{t("location.postal")}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{t("location.phone")}</p>
                        <p className="text-gray-600">{t("location.phoneNumber")}</p>
                        <p className="text-gray-500 text-sm">{t("location.phoneDesc")}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Mail className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{t("location.email")}</p>
                        <p className="text-gray-600">{t("location.emailAddress")}</p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-8 pt-6 border-t">
                    <p className="text-sm text-gray-500">
                      <strong>{t("location.hours")}</strong><br />
                      {t("lang.ro") === "Română" ? (
                        <>
                          {t("location.mon")} - {t("location.fri")}: 08:00 - 20:00<br />
                          {t("location.sat")}: 09:00 - 14:00<br />
                          {t("location.sun")}: {t("location.closed")} {t("location.emergency")}
                        </>
                      ) : (
                        <>
                          Mon - Fri: 08:00 - 20:00<br />
                          Sat: 09:00 - 14:00<br />
                          Sun: Closed (emergencies)
                        </>
                      )}
                    </p>
                  </div>
                </div>
                
                {/* Map */}
                <div className="bg-white rounded-2xl overflow-hidden shadow-sm h-full min-h-[400px]">
                  <iframe
                    src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2732.1234567890123!2d23.5887!3d46.7700!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x47490e1234567890%3A0x1234567890abcdef!2sStrada%20Caracal%2029%2C%20Cluj-Napoca%20400124!5e0!3m2!1sro!2sro!4v1234567890123!5m2!1sro!2sro"
                    width="100%"
                    height="100%"
                    style={{ border: 0, minHeight: '400px' }}
                    allowFullScreen
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    title="Location"
                  ></iframe>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Booking Section */}
        <section className="py-16 bg-white">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold text-gray-900">{t("booking.title")}</h2>
                <p className="mt-3 text-gray-600">
                  {t("booking.subtitle")}
                </p>
              </div>

              <div className="rounded-xl border bg-white p-8 text-center shadow-lg">
                <CalendarCheck className="mx-auto h-12 w-12 text-blue-600" />
                <h3 className="mt-4 text-xl font-semibold text-gray-900">
                  {t("booking.ready")}
                </h3>
                <p className="mt-2 text-gray-600">
                  {t("booking.description")}
                </p>
                <Button asChild className="mt-6" size="lg">
                  <Link to="/rezervare">
                    <CalendarCheck className="mr-2 h-5 w-5" />
                    {t("hero.cta")}
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Doctor Portal Section */}
        <section className="py-12 bg-blue-50 border-t">
          <div className="container">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center">
                  <Stethoscope className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{t("nav.doctorPortal")}</h3>
                </div>
              </div>
              <Button asChild variant="outline">
                <Link to="/dentist/login">
                  {t("nav.doctorPortal")}
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
