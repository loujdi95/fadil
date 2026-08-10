import Nav from "@/components/Nav";
import Hero from "@/components/Hero";
import Gallery from "@/components/Gallery";
import Reviews from "@/components/Reviews";
import Schedule from "@/components/Schedule";
import Booking from "@/components/Booking";
import Socials from "@/components/Socials";
import Footer from "@/components/Footer";
import ScrollReveal from "@/components/ScrollReveal";

export default function Home() {
  return (
    <>
      <ScrollReveal />
      <Nav />
      <main className="relative z-10">
        <Hero />
        <Gallery />
        <Reviews />
        <Schedule />
        <Booking />
        <Socials />
      </main>
      <Footer />
    </>
  );
}
