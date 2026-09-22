import { Ask } from "@/components/Ask";
import { Awards } from "@/components/Awards";
import { BackToTop } from "@/components/BackToTop";
import { Contact } from "@/components/Contact";
import { Experience } from "@/components/Experience";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { Marquee } from "@/components/Marquee";
import { Offline } from "@/components/Offline";
import { Reveal } from "@/components/Reveal";
import { StackGame } from "@/components/StackGame";
import { Work } from "@/components/Work";

export default function Home() {
  return (
    <div id="top" className="top">
      <Header />
      <BackToTop />
      <main>
        <Hero />
        <Marquee />
        <Work />
        <Experience />
        <Awards />
        <Ask />
        <Offline />
        <Contact />
      </main>
      <Footer />
      <StackGame />
      <Reveal />
    </div>
  );
}
