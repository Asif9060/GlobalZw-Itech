"use client";

import { useEffect, useRef } from "react";
import { animateCount, gsap, READY_EVENT, ScrollTrigger } from "@/lib/gsap";
import { useSmoothScroll } from "@/components/SmoothScrollProvider";

/* ===== Core values data ===== */
const CORE_VALUES = [
  {
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 3v9l6 3" />
      </>
    ),
    title: "Innovation for intelligent Cities",
    desc: "We pioneer intelligent traffic systems to build smarter, safer urban environments.",
  },
  {
    icon: (
      <>
        <path d="M12 2L4 7v5c0 5 3.5 9.7 8 11 4.5-1.3 8-6 8-11V7l-8-5z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
    title: "Sustainability by Design",
    desc: "We integrate solar energy solutions to create a foundation of clean, sustainable power.",
  },
  {
    icon: (
      <>
        <path d="M14.7 6.3a4 4 0 00-5.4 5.4L3 18v3h3l6.3-6.3a4 4 0 005.4-5.4l-2.4 2.4-2.3-2.3 2.4-2.4z" />
      </>
    ),
    title: "Engineering Excellence",
    desc: "We deliver reliable and innovative electrical infrastructure through precision engineering.",
  },
];

/* ===== Why GlobalZwItech points ===== */
const WHY_POINTS = [
  {
    num: "01",
    title: "Complete Solutions",
    body: "Our solutions are all built in-house to address current problems using the available resources and technology. We offer support from concept to maintenance for all system designs installed by us; we eliminate fragmentation with single-point accountability.",
  },
  {
    num: "02",
    title: "Innovation & R&D",
    body: "We have managed to strike an R&D deal, partnering with leading tech firms to deploy sustainable and intelligent traffic signals in Zimbabwe that are secure and preserve life through advanced analytics in energy and traffic systems.",
  },
  {
    num: "03",
    title: "Proven Results",
    body: "We have successfully delivered services to municipal, utility, and private clients in Zimbabwe and abroad. Our proven expertise ensures seamless, efficient, and eco-friendly outcomes from project start to finish. We consistently meet and exceed the highest standards of excellence.",
  },
];

export default function About() {
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const cameraIntroRef = useRef<(() => void) | null>(null);
  const aboutBodyRef = useRef<HTMLDivElement>(null);
  const missionRef = useRef<HTMLDivElement>(null);
  const valuesRef = useRef<HTMLDivElement>(null);
  const reasonsRef = useRef<HTMLDivElement>(null);
  const { scrollTo } = useSmoothScroll();

  /* ---- Three.js background for about page ---- */
  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs) return;

    let cancelled = false;
    let dispose: (() => void) | undefined;

    (async () => {
      const THREE = await import("three");
      if (cancelled) return;

      const renderer = new THREE.WebGLRenderer({
        canvas: cvs,
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.8));

      const scene = new THREE.Scene();
      scene.fog = new THREE.Fog(0x04060c, 20, 80);
      const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 300);
      camera.position.set(0, 5, 28);

      const resizeScene = () => {
        const parent = cvs.parentElement;
        if (!parent) return;
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", resizeScene);
      resizeScene();

      /* lights */
      scene.add(new THREE.HemisphereLight(0x334066, 0x0a0a12, 0.55));
      const sunLight = new THREE.DirectionalLight(0xffb45e, 1.6);
      sunLight.position.set(6, 8, -22);
      scene.add(sunLight);
      const fillLight = new THREE.DirectionalLight(0x2244aa, 0.35);
      fillLight.position.set(-10, 8, 10);
      scene.add(fillLight);

      /* glowing sun sphere + sprite halo */
      const sunCore = new THREE.Mesh(
        new THREE.SphereGeometry(3.4, 40, 40),
        new THREE.MeshBasicMaterial({ color: 0xffd166 }),
      );
      sunCore.position.set(5, 6.5, -46);
      scene.add(sunCore);

      const haloCv = document.createElement("canvas");
      haloCv.width = haloCv.height = 256;
      const hctx = haloCv.getContext("2d")!;
      const hgrad = hctx.createRadialGradient(128, 128, 10, 128, 128, 128);
      hgrad.addColorStop(0, "rgba(255,235,170,1)");
      hgrad.addColorStop(0.28, "rgba(255,183,3,.55)");
      hgrad.addColorStop(0.6, "rgba(251,133,0,.18)");
      hgrad.addColorStop(1, "rgba(251,133,0,0)");
      hctx.fillStyle = hgrad;
      hctx.fillRect(0, 0, 256, 256);
      const haloTex = new THREE.CanvasTexture(haloCv);
      const sunHalo = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: haloTex,
          transparent: true,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      sunHalo.scale.set(28, 28, 1);
      sunHalo.position.copy(sunCore.position);
      scene.add(sunHalo);

      /* ground */
      const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(400, 260),
        new THREE.MeshStandardMaterial({ color: 0x0a0f1c, roughness: 1 }),
      );
      ground.rotation.x = -Math.PI / 2;
      ground.position.y = -0.6;
      scene.add(ground);

      /* instanced solar panels */
      const panelGeo = new THREE.BoxGeometry(2.4, 0.1, 1.4);
      const panelMat = new THREE.MeshStandardMaterial({
        color: 0x16305e,
        metalness: 0.78,
        roughness: 0.28,
        emissive: 0x0a1834,
        emissiveIntensity: 0.5,
      });
      const rows = 9;
      const cols = 16;
      const panelCount = rows * cols;
      const panelMesh = new THREE.InstancedMesh(panelGeo, panelMat, panelCount);
      const mtx = new THREE.Object3D();
      let pi = 0;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const px = (c - cols / 2) * 3.4 + (r % 2) * 1.2 + (Math.random() - 0.5) * 0.4;
          const pz = 6 + r * 4.6 + (Math.random() - 0.5) * 0.6;
          mtx.position.set(px, 0.55 + r * 0.05, -pz + 20);
          mtx.rotation.set(-0.52, (Math.random() - 0.5) * 0.06, 0);
          mtx.updateMatrix();
          panelMesh.setMatrixAt(pi++, mtx.matrix);
        }
      }
      scene.add(panelMesh);

      /* drifting energy particles */
      const pCount = 260;
      const pGeo = new THREE.BufferGeometry();
      const pPos = new Float32Array(pCount * 3);
      for (let i = 0; i < pCount; i++) {
        pPos[i * 3] = (Math.random() - 0.5) * 90;
        pPos[i * 3 + 1] = Math.random() * 22;
        pPos[i * 3 + 2] = (Math.random() - 0.5) * 90;
      }
      pGeo.setAttribute("position", new THREE.BufferAttribute(pPos, 3));
      const particles = new THREE.Points(
        pGeo,
        new THREE.PointsMaterial({
          color: 0xffc94d,
          size: 0.14,
          transparent: true,
          opacity: 0.8,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        }),
      );
      scene.add(particles);

      /* mouse parallax */
      let mouseNX = 0;
      let mouseNY = 0;
      let camTargetX = 0;
      const onMouseMove = (event: MouseEvent) => {
        mouseNX = event.clientX / window.innerWidth - 0.5;
        mouseNY = event.clientY / window.innerHeight - 0.5;
      };
      window.addEventListener("mousemove", onMouseMove);

      let heroVisible = true;
      let scrollLift = 0;

      const visibilityTrigger = ScrollTrigger.create({
        trigger: "#about-hero",
        start: "top bottom",
        end: "bottom top",
        onToggle: (self) => {
          heroVisible = self.isActive;
        },
      });

      const liftTrigger = gsap.to(
        { v: 0 },
        {
          v: 1,
          ease: "none",
          scrollTrigger: {
            trigger: "#about-hero",
            start: "top top",
            end: "bottom top",
            scrub: true,
            onUpdate: (self) => {
              scrollLift = self.progress;
            },
          },
        },
      );

      const clock = new THREE.Clock();
      let rafId = 0;

      const renderScene = () => {
        rafId = requestAnimationFrame(renderScene);
        if (!heroVisible) return;

        const tSec = clock.getElapsedTime();
        camTargetX = mouseNX * 3.4;
        camera.position.x += (camTargetX - camera.position.x) * 0.045;
        camera.position.y +=
          (5 - mouseNY * 1.6 + scrollLift * 5 - camera.position.y) * 0.05;
        camera.position.z = 28 - scrollLift * 8;
        camera.lookAt(0, 3.5 - scrollLift * 2, -6);

        sunCore.scale.setScalar(1 + Math.sin(tSec * 1.4) * 0.045);
        (sunHalo.material as { opacity: number }).opacity =
          0.85 + Math.sin(tSec * 1.4) * 0.12;
        particles.rotation.y = tSec * 0.02;

        const posArr = pGeo.attributes.position.array as Float32Array;
        for (let i = 0; i < pCount; i++) {
          posArr[i * 3 + 1] += 0.012 + (i % 5) * 0.004;
          if (posArr[i * 3 + 1] > 22) posArr[i * 3 + 1] = 0;
        }
        pGeo.attributes.position.needsUpdate = true;

        renderer.render(scene, camera);
      };
      renderScene();

      /* intro camera dolly */
      cameraIntroRef.current = () => {
        camera.position.z = 65;
        camera.position.y = 14;
        gsap.to(camera.position, {
          z: 28,
          y: 5,
          duration: 3.2,
          ease: "power3.out",
        });
      };

      dispose = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", resizeScene);
        window.removeEventListener("mousemove", onMouseMove);
        visibilityTrigger.kill();
        liftTrigger.scrollTrigger?.kill();
        liftTrigger.kill();
        cameraIntroRef.current = null;
        haloTex.dispose();
        panelGeo.dispose();
        panelMat.dispose();
        pGeo.dispose();
        ground.geometry.dispose();
        (ground.material as { dispose: () => void }).dispose();
        sunCore.geometry.dispose();
        (sunCore.material as { dispose: () => void }).dispose();
        renderer.dispose();
      };
    })();

    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  /* ---- Intro animation fires once preloader reveals ---- */
  useEffect(() => {
    const onReady = () => {
      cameraIntroRef.current?.();

      const hero = heroRef.current;
      if (!hero) return;

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from("#aboutHeroTag", { y: 30, opacity: 0, duration: 0.8 }, 0.1)
        .to("#aboutHeroSub", { opacity: 1, y: 0, duration: 0.9 }, 0.8)
        .from("#aboutHeroSub", { y: 30, duration: 0.9 }, 0.8)
        .to("#aboutHeroBtns", { opacity: 1, duration: 0.8 }, 1)
        .from(
          "#aboutHeroBtns .btn-primary, #aboutHeroBtns .btn-ghost",
          { y: 26, opacity: 0, duration: 0.7, stagger: 0.12 },
          1,
        )
        .to("#aboutHeroStats", { opacity: 1, duration: 0.8 }, 1.1)
        .from(".ahstat", { x: 60, opacity: 0, duration: 0.8, stagger: 0.14 }, 1.15);

      hero.querySelectorAll<HTMLElement>(".k").forEach((el) => animateCount(el, 0.3));
    };

    window.addEventListener(READY_EVENT, onReady);
    return () => window.removeEventListener(READY_EVENT, onReady);
  }, []);

  /* ---- ScrollTrigger for content sections ---- */
  useEffect(() => {
    const ctx = gsap.context(() => {
      /* About body fade-in */
      gsap.to(aboutBodyRef.current, {
        opacity: 1,
        y: 0,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: aboutBodyRef.current, start: "top 85%", once: true },
      });

      /* Mission block */
      gsap.to(missionRef.current, {
        opacity: 1,
        x: 0,
        duration: 1.1,
        ease: "power3.out",
        scrollTrigger: { trigger: missionRef.current, start: "top 85%", once: true },
      });

      /* Values grid stagger */
      if (valuesRef.current) {
        const items = valuesRef.current.querySelectorAll(".value-card");
        items.forEach((card, i) => {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay: i * 0.15,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 88%", once: true },
          });
        });
      }

      /* Why section stagger */
      if (reasonsRef.current) {
        const cards = reasonsRef.current.querySelectorAll(".reason-card");
        cards.forEach((card, i) => {
          gsap.to(card, {
            opacity: 1,
            y: 0,
            duration: 0.9,
            delay: i * 0.2,
            ease: "power3.out",
            scrollTrigger: { trigger: card, start: "top 88%", once: true },
          });
        });
      }

      /* Counter badges */
      gsap.utils.toArray<HTMLElement>("[data-count]:not(#heroStats [data-count])").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top 88%",
          once: true,
          onEnter: () => animateCount(el),
        });
      });
    });

    const onReady = () => ScrollTrigger.refresh();
    window.addEventListener(READY_EVENT, onReady);
    const refreshOnLoad = () => setTimeout(() => ScrollTrigger.refresh(), 300);
    if (document.readyState === "complete") refreshOnLoad();
    else window.addEventListener("load", refreshOnLoad);

    return () => {
      ctx.revert();
      window.removeEventListener(READY_EVENT, onReady);
      window.removeEventListener("load", refreshOnLoad);
    };
  }, []);

  return (

    <div className="about-page">
      {/* ---- Hero/WebGL section ---- */}
      <div id="about-hero" ref={heroRef} className="about-hero">
        <canvas id="aboutCanvas" ref={canvasRef} className="about-canvas" />
        <div className="about-hero-overlay">
          <div className="about-hero-content">
            <div className="rv">
              <span className="eyebrow">Who we are</span>
            </div>
          </div>
        </div>
      </div>
    <section id="about" className="sec-pad">
      <div
        className="glow-orb"
        style={{
          width: 480,
          height: 480,
          background: "rgba(255,183,3,.09)",
          top: -100,
          right: -140,
        }}
      ></div>
    <div className="about-wrap">
        <div className="about-sticky rv-l">
          <div className="about-visual">
            <svg viewBox="0 0 400 460" preserveAspectRatio="xMidYMid slice">
              <defs>
                <linearGradient id="skyA" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#131b33" />
                  <stop offset="1" stopColor="#3a2312" />
                </linearGradient>
                <linearGradient id="panelA" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#1f3a6e" />
                  <stop offset="1" stopColor="#0e1c3a" />
                </linearGradient>
                <radialGradient id="sunA">
                  <stop offset="0" stopColor="#fff3c4" />
                  <stop offset=".5" stopColor="#ffb703" />
                  <stop offset="1" stopColor="rgba(251,133,0,0)" />
                </radialGradient>
              </defs>
              <rect width="400" height="460" fill="url(#skyA)" />
              <circle cx="300" cy="110" r="90" fill="url(#sunA)" opacity=".85">
                <animate
                  attributeName="cy"
                  values="115;100;115"
                  dur="7s"
                  repeatCount="indefinite"
                />
              </circle>
              <circle cx="300" cy="110" r="34" fill="#ffd166">
                <animate
                  attributeName="r"
                  values="34;38;34"
                  dur="3.4s"
                  repeatCount="indefinite"
                />
              </circle>
              <path d="M0 300 Q90 250 170 295 T400 270 V460 H0 Z" fill="#1c1608" />
              <path d="M0 340 Q120 300 240 340 T400 325 V460 H0 Z" fill="#0b0803" />
              <g id="aboutPanels">
                {/* PANELS_SMALL and PANELS_LARGE and BEAMS kept for visual */}
                {/* We'll define the arrays above */}
              </g>
              <g
                stroke="#ffb703"
                strokeWidth="1.4"
                opacity=".55"
                strokeDasharray="5 6"
              >
                {/* BEAMS map */}
              </g>
            </svg>
          </div>
          <div className="badge-float bf1">
            <div className="k" data-count="15" data-suffix="+">
              0
            </div>
            <h1 className="about-hero-title mask-title">
              <span className="lm"><i>GlobalZwItech</i></span>
              <span className="lm"><i>Energy &amp; Engineering</i></span>
              <span className="lm"><i>Excellence</i></span>
            </h1>
            <p className="about-hero-sub" id="aboutHeroSub">
              An energy and engineering company with core expertise in advanced solar system
              modeling, design, electrical systems, and smart signals.
            </p>
            <div className="btns" id="aboutHeroBtns">
              <a href="#about-section1" data-scroll className="btn-primary">
                Discover More
              </a>
              <a href="#why-section" data-scroll className="btn-ghost">
                Why Choose Us
              </a>
            </div>

            <div className="about-hero-stats" id="aboutHeroStats">
              <div className="ahstat">
                <div className="k" data-count="15" data-suffix="+">0</div>
                <div className="l">Years Experience</div>
              </div>
              <div className="ahstat">
                <div className="k" data-count="90" data-suffix="+">0</div>
                <div className="l">Countries Served</div>
              </div>
              <div className="ahstat">
                <div className="k" data-count="3" data-suffix=" MW">0</div>
                <div className="l">Max Solar Capacity</div>
              </div>
            </div>
          </div>
        </div>
        <div className="about-body">
          <div className="rv">
            <span className="eyebrow">Who we are</span>
          </div>
          <h2 className="mask-title">About Us</h2>
          {/* Section GlobalZwItech */}
          <section className="about-section">
            <h3>GlobalZwItech</h3>
            <p className="subsection">
              1.1 GlobalZwItech An energy and engineering company with core expertise in advanced solar system modeling, design, electrical systems, and smart signals. We offer turnkey solutions in consultation, design, engineering, supply, installation, and EPC projects. We have extensive experience in the design and installation of solar systems ranging from 10 to 3 MW, Feasibility studies for Grid-Interactive and Mini-Grid systems, and the design and installation of modern traffic signal systems.
            </p>
            <p className="subsection">
              1.2 Core Values • Innovation for intelligent Cities: We pioneer intelligent traffic systems to build smarter, safer urban environments. • Sustainability by Design: We integrate solar energy solutions to create a foundation of clean, sustainable power. • Engineering Excellence: We deliver reliable and innovative electrical infrastructure through precision engineering.
            </p>
            <p className="subsection">
              1.3 Mission Statement We engineer integrated solutions that power progress by building safer, smarter cities through intelligent traffic systems, enabling sustainable communities with solar energy, and ensuring reliability with electrical infrastructure.
            </p>
          </section>
          {/* Section Why GlobalZwItech */}
          <section className="about-section">
            <h3>Why GlobalZwItech</h3>
            <p className="subsection">
              1.4 Complete Solutions: Our solutions are all built in-house to address current problems using the available resources and technology. We offer support from concept to maintenance for all system designs installed by us; we eliminate fragmentation with single-point accountability.
            </p>
            <p className="subsection">
              Innovation: We have managed to strike an R & D deal, partnering with leading tech firms to deploy sustainable and intelligent traffic signals in Zimbabwe that are secure and preserve life through advanced analytics in energy and traffic systems.
            </p>
            <p className="subsection">
              2. Proven Results: We have successfully delivered services to municipal, utility, and private clients in Zimbabwe and abroad. Our proven expertise ensures seamless, efficient, and eco-friendly outcomes from project start to finish. We consistently meet and exceed the highest standards of excellence.
            </p>
          </section>
        </div>
      </div>
    </section>

      {/* ---- Section 1: GlobalZwItech ---- */}
      <section id="about-section1" className="about-section sec-pad">
        <div
          className="glow-orb"
          style={{ width: 480, height: 480, background: "rgba(255,183,3,.09)", top: -100, right: -140 }}
        />
        <div className="about-main-wrap">
          {/* Left: description + mission */}
          <div className="about-left-col">
            <div className="rv">
              <span className="eyebrow">1.1 GlobalZwItech</span>
            </div>
            <h2 className="mask-title">
              <span className="lm"><i>An Energy &amp; Engineering</i></span>
              <span className="lm"><i>Company</i></span>
            </h2>
            <p className="about-body-text rv" ref={aboutBodyRef}>
              An energy and engineering company with core expertise in advanced solar system
              modeling, design, electrical systems, and smart signals. We offer turnkey solutions
              in consultation, design, engineering, supply, installation, and EPC projects. We
              have extensive experience in the design and installation of solar systems ranging
              from 10 to 3 MW, Feasibility studies for Grid-Interactive and Mini-Grid systems,
              and the design and installation of modern traffic signal systems.
            </p>

            {/* Mission */}
            <div className="mission-block" ref={missionRef}>
              <div className="rv-l">
                <span className="eyebrow">1.3 Mission Statement</span>
              </div>
              <blockquote className="mission-quote">
                We engineer integrated solutions that power progress by building safer, smarter
                cities through intelligent traffic systems, enabling sustainable communities with
                solar energy, and ensuring reliability with electrical infrastructure.
              </blockquote>
            </div>
          </div>

          {/* Right: core values */}
          <div className="about-right-col">
            <div className="rv-r">
              <span className="eyebrow">1.2 Core Values</span>
            </div>
            <h3 className="about-subtitle">
              <span className="lm"><i>What Drives Us</i></span>
            </h3>
            <div className="values-grid" ref={valuesRef}>
              {CORE_VALUES.map((v, i) => (
                <div key={i} className="value-card rv-l">
                  <div className="value-icon">{v.icon}</div>
                  <h4>{v.title}</h4>
                  <p>{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ---- Section 2: Why GlobalZwItech ---- */}
      <section id="why-section" className="why-section sec-pad">
        <div
          className="glow-orb"
          style={{ width: 520, height: 520, background: "rgba(251,133,0,.08)", bottom: -160, left: -160 }}
        />
        <div className="why-wrap">
          <div className="rv">
            <span className="eyebrow">1.4 Why GlobalZwItech</span>
          </div>
          <h2 className="mask-title">
            <span className="lm"><i>Why Choose</i></span>
            <span className="lm"><i>GlobalZwItech?</i></span>
          </h2>
          <p className="sec-sub rv">
            Complete solutions, proven innovation, and results you can trust — from concept to
            maintenance and beyond.
          </p>
          <div className="reasons-grid" ref={reasonsRef}>
            {WHY_POINTS.map((r, i) => (
              <div key={i} className="reason-card rv">
                <span className="reason-num">{r.num}</span>
                <h4>{r.title}</h4>
                <p>{r.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Back-to-top */}
      <button
        id="toTop"
        aria-label="Back to top"
        onClick={() => scrollTo(0, { duration: 1.6 })}
      >
        ↑
      </button>
    </div>
  );
}
