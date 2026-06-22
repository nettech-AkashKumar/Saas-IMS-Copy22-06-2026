import Navbar from "../component/Navbar";
import Hero from "../component/Hero";
import Features from "../component/Features";
import Modules from "../component/Modules";
import Pricing from "../component/Pricing";
import Contact from "../component/Contact";
import Footer from "../component/Footer";
import Stats from "../component/Stats";
import DashboardPreview from "../component/DashboardPreview";
import Comapnies from "../component/Comapnies";
import FAQ from "../component/FAQ";
import BlogSection from "../component/Blog";

const Home = () => {
  return (
    <>
      <Navbar />
      <main>
        <section id="hero">
          <Hero />
        </section>
        <section id="features">
          <DashboardPreview />
        </section>
        <section id="features">
          <Features />
        </section>
        <section id="companies">
          <Comapnies />
        </section>
        {/* <section id="modules"><Modules /></section> */}
        <section id="pricing">
          <Pricing />
        </section>
        <section id="FAQ">
          <FAQ />
        </section>
        {/* <section id="news"><BlogSection /></section> */}
        <section id="contact">
          <Contact />
        </section>
        {/* <section id="stats"><Stats /></section> */}
      </main>
      <Footer />
    </>
  );
};

export default Home;
