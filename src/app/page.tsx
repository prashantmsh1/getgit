import { Features } from "./_components/Features";
import { Footer } from "./_components/Footer";
import { Hero } from "./_components/Hero";
import { Navbar } from "./_components/Navbar";

export default function Home() {
  return (
    <div className="dark:bg-deep-space-blue-50 selection:bg-yale-blue-500/30 min-h-screen bg-white transition-colors">
      <Navbar />
      <main>
        <Hero />
        <Features />
      </main>
      <Footer />
    </div>
  );
}
