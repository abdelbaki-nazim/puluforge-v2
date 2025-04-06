"use client";

import React, { JSX, useEffect, useRef, useState } from "react";
import { Button } from "@progress/kendo-react-buttons";
import { Typography } from "@progress/kendo-react-common";
import styles from "./LandingPage.module.css";
import FeatureComparisonCard from "./components/comparisoncard/FeatureComparisonCard";
import Image from "next/image";
import { useRouter } from "next/navigation";

const PuluforgeLandingPage = () => {
  return (
    <div className={styles.landingContainer}>
      <header className={`${styles.header} ${styles.fadeIn}`}>
        <div className={styles.logoContainer}>
          <div className={styles.poweredBy}>
            <span>Built with</span>
            <img
              src="/icons/aws.svg"
              alt="AWS Logo"
              className={styles.partnerLogoAws}
            />
            <img
              src="/icons/pulumi.svg"
              alt="Pulumi Logo"
              className={styles.pulumiLogo}
            />
          </div>
        </div>
      </header>

      <Hero />

      <FeaturesSection />

      <ExtraTextSection />
    </div>
  );
};

export default PuluforgeLandingPage;

interface Star {
  x: number;
  y: number;
  radius: number;
  vx: number;
  vy: number;
}

const Hero = (): JSX.Element => {
  const router = useRouter();

  useEffect(() => {
    const canvas = document.querySelector(
      `.${styles.starCanvas}`
    ) as HTMLCanvasElement;
    const ctx = canvas.getContext("2d") as CanvasRenderingContext2D;
    let stars: Star[] = [];

    const createStar = (): Star => {
      return {
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        radius: Math.random() * 2 + 1,
        vx: Math.random() * 0.5 - 0.25,
        vy: Math.random() * 0.5 - 0.25,
      };
    };

    const drawStars = (): void => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
        ctx.fill();
      });
    };

    const updateStars = (): void => {
      stars.forEach((star) => {
        star.x += star.vx;
        star.y += star.vy;

        if (star.x < 0 || star.x > canvas.width) star.vx *= -1;
        if (star.y < 0 || star.y > canvas.height) star.vy *= -1;
      });
    };

    const animate = (): void => {
      updateStars();
      drawStars();
      requestAnimationFrame(animate);
    };

    const init = (): void => {
      const hero = document.querySelector(`.${styles.hero}`) as HTMLElement;
      canvas.width = hero.clientWidth;
      canvas.height = hero.clientHeight;
      stars = Array.from({ length: 80 }, createStar);
      animate();
    };

    init();

    const handleResize = (): void => {
      const hero = document.querySelector(`.${styles.hero}`) as HTMLElement;
      canvas.width = hero.clientWidth;
      canvas.height = hero.clientHeight;
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  return (
    <section className={styles.hero}>
      <canvas className={styles.starCanvas} />
      <div className={styles.heroContent}>
        <Typography.h1 className={`${styles.heroTitle} ${styles.fadeIn}`}>
          Revolutionize Your Cloud Management with Puluforge
        </Typography.h1>
        <Typography.p
          className={`${styles.heroSubtitle} ${styles.fadeInDelayed}`}
        >
          Streamline your workflows, enhance security, and boost productivity
          with our intuitive self-service portal.
        </Typography.p>
        <Button
          themeColor="primary"
          size="large"
          onClick={() => router.push("/dashboard")}
          className={`${styles.heroButton} ${styles.bounceIn}`}
        >
          Get Started
        </Button>
      </div>
    </section>
  );
};

const featureData = [
  {
    id: 1,
    title: "Effortless Onboarding",
    description:
      "Streamline your onboarding process with our intuitive self-service portal, enabling rapid deployment with minimal configuration.",
    image: "/features/effortless.png",
  },
  {
    id: 2,
    title: "Automated Deployments",
    description:
      "Optimize your development pipeline with integrated CI/CD tools, facilitating seamless application deployment and integration.",
    image: "/features/auto.png",
  },
  {
    id: 3,
    title: "Advanced Security",
    description:
      "Safeguard your infrastructure with automated credential management and robust isolation protocols, ensuring comprehensive asset protection.",
    image: "/features/security.png",
  },
];

const FeaturesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (sectionRef.current) {
            observer.unobserve(sectionRef.current);
          }
        }
      },
      { threshold: 0.6 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => {
      if (sectionRef.current) {
        observer.unobserve(sectionRef.current);
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className={styles.features}>
      <Typography.h2
        className={`${styles.sectionTitle} ${isVisible ? styles.fadeIn : ""}`}
      >
        Why Puluforge?
      </Typography.h2>
      <div className={styles.featureCards}>
        {featureData.map((feature, index) => (
          <div
            key={feature.id}
            className={`${styles.featureCard} ${
              isVisible ? styles.slideInLeft : ""
            }`}
            style={{ animationDelay: `${index * 0.2}s` }}
          >
            <Image
              src={feature.image}
              alt={feature.title}
              width={200}
              height={200}
              className={styles.featureImage}
            />
            <Typography.h3>{feature.title}</Typography.h3>
            <Typography.p>{feature.description}</Typography.p>
          </div>
        ))}
      </div>
    </section>
  );
};

const ExtraTextSection = () => {
  return (
    <section className={`${styles.extraText} ${styles.fadeIn}`}>
      <Typography.h2 className={styles.sectionTitle}>
        A New Era in Cloud Management
      </Typography.h2>
      <Typography.p className={styles.extraParagraph}>
        In the rapidly evolving landscape of cloud computing, managing
        infrastructure efficiently while maintaining security and ease of use is
        paramount. Puluforge is engineered to meet these demands, offering a
        transformative platform that simplifies cloud management. By automating
        routine tasks, enforcing security best practices, and providing an
        intuitive interface, Puluforge empowers your team to innovate without
        the burden of operational overhead.
      </Typography.p>

      <section className={styles.comparisonSection}>
        <FeatureComparisonCard />
      </section>
    </section>
  );
};
