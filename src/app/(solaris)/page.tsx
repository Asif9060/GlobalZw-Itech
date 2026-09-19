import About from "@/components/About";
import AdminModal from "@/components/AdminModal";
import BackToTop from "@/components/BackToTop";
import Calculator from "@/components/Calculator";
import Contact from "@/components/Contact";
import Cursor from "@/components/Cursor";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Preloader from "@/components/Preloader";
import Process from "@/components/Process";
import Projects from "@/components/Projects";
import ScrollAnimations from "@/components/ScrollAnimations";
import Services from "@/components/Services";
import SuccessVeil from "@/components/SuccessVeil";
import SunScene from "@/components/SunScene";
import Testimonials from "@/components/Testimonials";
import Toast from "@/components/Toast";
import Why from "@/components/Why";

export default function Home() {
  return (
    <>
      <Preloader />
      <Cursor />
      <Header />
      <Hero />
      <Marquee />
      <About />
      <Services />
      <SunScene />
      <Calculator />
      <Projects />
      <Why />
      <Process />
      <Testimonials />
      <Contact />
      <Footer />
      <AdminModal />
      <SuccessVeil />
      <Toast />
      <BackToTop />
      <ScrollAnimations />
    </>
  );
}
