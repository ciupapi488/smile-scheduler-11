import { Smile, Shield, Clock, CalendarCheck } from "lucide-react";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

const features = [
  {
    icon: Smile,
    title: "Gentle Care",
    description: "Comfortable, anxiety-free dental experience",
  },
  {
    icon: Shield,
    title: "Expert Team",
    description: "Highly trained dental professionals",
  },
  {
    icon: Clock,
    title: "Flexible Hours",
    description: "Appointments that fit your schedule",
  },
];

const Index = () => {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative overflow-hidden gradient-hero py-20 md:py-32">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-50" />
          <div className="container relative z-10">
            <div className="mx-auto max-w-3xl text-center">
              <h1 className="animate-fade-in text-4xl font-bold tracking-tight text-white md:text-5xl lg:text-6xl">
                Professional Dental Care
              </h1>
              <p className="mt-6 animate-fade-in text-lg text-white/90 md:text-xl">
                Your smile deserves the best. Book your appointment today and experience 
                exceptional dental care with our expert team.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-8 animate-fade-in bg-white text-primary hover:bg-white/90"
              >
                <Link to="/rezervare">
                  <CalendarCheck className="mr-2 h-5 w-5" />
                  Book Your Appointment
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="border-b bg-card py-16">
          <div className="container">
            <div className="grid gap-8 md:grid-cols-3">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="flex flex-col items-center text-center animate-fade-in"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-accent">
                    <feature.icon className="h-7 w-7 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground">{feature.title}</h3>
                  <p className="mt-2 text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Booking Section */}
        <section className="py-16">
          <div className="container">
            <div className="mx-auto max-w-4xl">
              <div className="mb-10 text-center">
                <h2 className="text-3xl font-bold text-foreground">Book an Appointment</h2>
                <p className="mt-3 text-muted-foreground">
                  Quick and easy online appointment booking
                </p>
              </div>

              <div className="rounded-xl border bg-card p-8 text-center shadow-card">
                <CalendarCheck className="mx-auto h-12 w-12 text-primary" />
                <h3 className="mt-4 text-xl font-semibold text-foreground">
                  Ready to book your appointment?
                </h3>
                <p className="mt-2 text-muted-foreground">
                  Click the button below to fill out our simple booking form
                </p>
                <Button asChild className="mt-6" size="lg">
                  <Link to="/rezervare">
                    <CalendarCheck className="mr-2 h-5 w-5" />
                    Book Your Appointment
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
