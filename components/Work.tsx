import Image from "next/image";
import { BrandLogo } from "./BrandLogo";
import { CHIPS, Chips, type ChipSpec } from "./Chip";

type Card = {
  id: string;
  logo: { name: string; alt: string; width: number; height: number; display: number };
  when: string;
  title: string;
  blurb: string;
  chips: ChipSpec[];
  link?: { href: string; label: string };
  preview: { src: string; width: number; height: number; alt: string };
};

const CARDS: Card[] = [
  {
    id: "autege",
    logo: { name: "autege", alt: "Autege", width: 776, height: 160, display: 20 },
    when: "2026 ↗",
    title: "Workshop Management System",
    blurb: "Service workshops in Brazil and the UAE, from job cards to invoicing. A public site and an internal operations app.",
    chips: [CHIPS.dotnet, CHIPS.next, CHIPS.docker],
    link: { href: "https://autege.com", label: "autege.com ↗" },
    preview: { src: "/assets/prev-autege.webp", width: 718, height: 400, alt: "Screenshot of autege.com" },
  },
  {
    id: "senaiplay",
    logo: { name: "senaiplay", alt: "SENAI Play", width: 160, height: 160, display: 26 },
    when: "2022 ↗",
    title: "SENAI Play",
    blurb: "The national learning platform, 780,000 active users across Brazil. My largest audience by two orders of magnitude.",
    chips: [CHIPS.nest, CHIPS.graphql, CHIPS.angular],
    link: { href: "https://play.senai.br/", label: "play.senai.br ↗" },
    preview: { src: "/assets/prev-senaiplay.webp", width: 718, height: 401, alt: "Screenshot of play.senai.br" },
  },
  {
    id: "techknowledge",
    logo: { name: "techknowledge", alt: "TechKnowledge", width: 160, height: 160, display: 26 },
    when: "2026 ↗",
    title: "TechKnowledge",
    blurb: "A blog I write with my friend Leticia Dias, to share what we learn about technology. Backend architecture, enterprise development, and the parts of the job that do not fit in a commit message.",
    chips: [CHIPS.next, CHIPS.ts],
    link: { href: "https://techknowledge.blog", label: "techknowledge.blog ↗" },
    preview: { src: "/assets/prev-techknowledge.webp", width: 718, height: 401, alt: "Screenshot of techknowledge.blog" },
  },
  {
    id: "planner",
    logo: { name: "trainingplanner", alt: "Training Planner", width: 542, height: 160, display: 23 },
    when: "2025 ↗",
    title: "Training Planner",
    blurb: "Planning and tracking for competition training programmes, on the full .NET stack.",
    chips: [CHIPS.dotnet, CHIPS.ts],
    link: { href: "https://training-planner.mikkaiser.com", label: "training-planner ↗" },
    preview: { src: "/assets/prev-planner.webp", width: 718, height: 402, alt: "Screenshot of the Training Planner" },
  },
  {
    id: "emiratesskills",
    logo: { name: "emiratesskills", alt: "ACTVET EmiratesSkills", width: 615, height: 160, display: 24 },
    when: "Internal",
    title: "EmiratesSkills Competition System",
    blurb: "Runs the national skills competition end to end, plus the public site that fronts it.",
    chips: [CHIPS.dotnet, CHIPS.next],
    preview: { src: "/assets/prev-emiratesskills.webp", width: 718, height: 401, alt: "Screenshot of the EmiratesSkills competition system" },
  },
  {
    id: "sotreqlink",
    logo: { name: "sotreq", alt: "Sotreq", width: 263, height: 160, display: 24 },
    when: "2023",
    title: "SotreqLink",
    blurb: "Field service for roughly 5,000 technicians, with an Android and iOS app in their hands. Fifteen microservices on Docker and Kubernetes, watched by Grafana, Loki and Prometheus.",
    chips: [CHIPS.k8s, CHIPS.redis, CHIPS.grafana],
    preview: { src: "/assets/prev-sotreqlink.webp", width: 718, height: 437, alt: "Screenshot of SotreqLink" },
  },
];

export function Work() {
  return (
    <section id="work" className="section section--lazy" aria-labelledby="work-h">
      <div className="section-head" data-anim>
        <h2 id="work-h">Selected work</h2>
        <span className="eyebrow">Six of many · All in production</span>
      </div>
      <div className="cards">
        {CARDS.map((c) => (
          <article className="card" data-anim key={c.id}>
            <div className="card__prev">
              <span className="card__peek">Hover</span>
              <Image src={c.preview.src} alt={c.preview.alt} width={c.preview.width} height={c.preview.height} sizes="(max-width: 700px) 100vw, 380px" />
            </div>
            <div className="card__body">
              <div className="card__top">
                <span className="card__logo">
                  <BrandLogo name={c.logo.name} alt={c.logo.alt} width={c.logo.width} height={c.logo.height} style={{ height: c.logo.display }} />
                </span>
                <span className="mono-meta">{c.when}</span>
              </div>
              <h3 className="h3">{c.title}</h3>
              <p className="small">{c.blurb}</p>
              <Chips chips={c.chips} />
              {c.link && (
                <a href={c.link.href} target="_blank" rel="noopener" className="card__link">{c.link.label}</a>
              )}
            </div>
          </article>
        ))}
      </div>
      <p className="small work__note" data-anim>
        A sample, not the list. Six years of work adds up to a lot more: internal tools, competition platforms, WordPress sites, mobile apps, packages and libraries. The rest lives in{" "}
        <a href="#experience" className="u">experience</a> and on{" "}
        <a href="https://github.com/Mikkaiser" target="_blank" rel="noopener" className="u">GitHub ↗</a>.
      </p>
    </section>
  );
}
