"use client";

import { useEffect, useRef } from "react";
import { animateCount, gsap, READY_EVENT, ScrollTrigger } from "@/lib/gsap";

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const liveKwRef = useRef<HTMLSpanElement>(null);
  const cameraIntroRef = useRef<(() => void) | null>(null);

  /* ---- live flickering kW ticker ---- */
  useEffect(() => {
    const id = setInterval(() => {
      if (liveKwRef.current) {
        liveKwRef.current.textContent = (44 + Math.random() * 9).toFixed(1);
      }
    }, 2400);
    return () => clearInterval(id);
  }, []);

  /* ---- hero intro (fires once the preloader reveals the site) ---- */
  useEffect(() => {
    const hero = heroRef.current;
    if (!hero) return;
    let played = false;

    const onReady = () => {
      if (played) return;
      played = true;
      cameraIntroRef.current?.();

      const tl = gsap.timeline({ defaults: { ease: "power4.out" } });
      tl.from("#heroTag", { y: 30, opacity: 0, duration: 0.8 }, 0.1)
        .to(".hw > span", { y: 0, duration: 1.15, stagger: 0.085 }, 0.2)
        .to("#heroSub", { opacity: 1, y: 0, duration: 0.9 }, 0.8)
        .from("#heroSub", { y: 30, duration: 0.9 }, 0.8)
        .to("#heroBtns", { opacity: 1, duration: 0.8 }, 1)
        .from(
          "#heroBtns .btn-primary, #heroBtns .btn-ghost",
          { y: 26, opacity: 0, duration: 0.7, stagger: 0.12 },
          1,
        )
        .to("#heroStats", { opacity: 1, duration: 0.8 }, 1.1)
        .from(".hstat", { x: 60, opacity: 0, duration: 0.8, stagger: 0.14 }, 1.15)
        .to("#scrollHint", { opacity: 1, duration: 0.8 }, 1.6);

      hero
        .querySelectorAll<HTMLElement>("#heroStats .k")
        .forEach((el) => animateCount(el, 2));
    };

    window.addEventListener(READY_EVENT, onReady);
    return () => window.removeEventListener(READY_EVENT, onReady);
  }, []);

  /* ---- three.js sunrise solar field ---- */
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
      scene.fog = new THREE.Fog(0x04060c, 30, 95);
      const camera = new THREE.PerspectiveCamera(52, 1, 0.1, 300);
      camera.position.set(0, 7, 34);

      const resizeHero = () => {
        const parent = cvs.parentElement;
        if (!parent) return;
        const w = parent.clientWidth;
        const h = parent.clientHeight;
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
      };
      window.addEventListener("resize", resizeHero);
      resizeHero();

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
      sunHalo.scale.set(30, 30, 1);
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
        trigger: "#hero",
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
            trigger: "#hero",
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

      const renderHero = () => {
        rafId = requestAnimationFrame(renderHero);
        if (!heroVisible) return;

        const tSec = clock.getElapsedTime();
        camTargetX = mouseNX * 3.4;
        camera.position.x += (camTargetX - camera.position.x) * 0.045;
        camera.position.y +=
          (7 - mouseNY * 1.6 + scrollLift * 7 - camera.position.y) * 0.05;
        camera.position.z = 34 - scrollLift * 8;
        camera.lookAt(0, 4.2 - scrollLift * 2, -6);

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
      renderHero();

      /* intro camera dolly, triggered after the preloader */
      cameraIntroRef.current = () => {
        camera.position.z = 70;
        camera.position.y = 16;
        gsap.to(camera.position, {
          z: 34,
          y: 7,
          duration: 3.2,
          ease: "power3.out",
        });
      };

      dispose = () => {
        cancelAnimationFrame(rafId);
        window.removeEventListener("resize", resizeHero);
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

  return (
    <section id="home">
      <div id="hero" ref={heroRef}>
        <canvas id="heroCanvas" ref={canvasRef}></canvas>
        <div className="hero-content">
          <div className="hero-tag" id="heroTag">
            <i></i> Now generating ·{" "}
            <span id="liveKW" ref={liveKwRef}>
              48.2
            </span>{" "}
            MW across our fleet
          </div>
          <h1 className="hero-title">
            <span className="hw">
              <span>Harness</span>
            </span>{" "}
            <span className="hw">
              <span>The</span>
            </span>{" "}
            <span className="hw">
              <span className="grad">Sun.</span>
            </span>
            <br />
            <span className="hw">
              <span>Power</span>
            </span>{" "}
            <span className="hw">
              <span>Your</span>
            </span>
            <br />
            <span className="hw">
              <span className="grad">Future.</span>
            </span>
          </h1>
          <p className="hero-sub" id="heroSub">
            End-to-end solar PV, energy storage &amp; EV charging solutions —
            engineered, installed and monitored by experts. <b>15+ years</b>,{" "}
            <b>6,200+ systems</b>, <b>90 countries</b> of clean, reliable
            energy.
          </p>
          <div className="btns" id="heroBtns">
            <a href="#contact" data-scroll className="btn-primary">
              Get Free Quote
            </a>
            <a href="#calculator" data-scroll className="btn-ghost">
              ☀ Calculate Savings
            </a>
          </div>
        </div>
        <div className="hero-stats" id="heroStats">
          <div className="hstat">
            <div className="k" data-count="6200" data-suffix="+">
              0
            </div>
            <div className="l">Systems Installed</div>
          </div>
          <div className="hstat">
            <div className="k" data-count="48" data-suffix=" MW">
              0
            </div>
            <div className="l">Clean Power Delivered</div>
          </div>
          <div className="hstat">
            <div className="k" data-count="99" data-suffix=".8%">
              0
            </div>
            <div className="l">Uptime Guarantee</div>
          </div>
        </div>
        <div className="scroll-hint" id="scrollHint">
          <div className="mouse"></div>Scroll to explore
        </div>
      </div>
    </section>
  );
}
