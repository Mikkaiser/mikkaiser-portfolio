import { CHIPS, Chips, type ChipSpec } from "./Chip";

type Row = { when: string; now?: boolean; title: string; org: string; blurb: string; chips: ChipSpec[] };

const ROWS: Row[] = [
  {
    when: "2023 → NOW", now: true, title: "Software Development Expert", org: "ACTVET, Abu Dhabi",
    blurb: "Internal platforms in .NET, ASP.NET Core, Next.js and SQL Server for 200+ users. I own the APIs and the pipelines, and the xUnit coverage that cut deployment issues by 30%.",
    chips: [CHIPS.dotnet, CHIPS.next, CHIPS.sqlserver, CHIPS.xunit, CHIPS.azurePipelines],
  },
  {
    when: "2023", title: "Full Stack Developer", org: "Radix, Rio de Janeiro",
    blurb: "Fifteen microservices and three enterprise platforms in production. Fifty incidents a month, 35% fewer repeats, 99.9% availability on Docker and Kubernetes.",
    chips: [CHIPS.dotnet, CHIPS.k8s, CHIPS.docker, CHIPS.oracle, CHIPS.redis, CHIPS.grafana],
  },
  {
    when: "2022", title: "Full Stack Developer", org: "SENAI Alagoas, Maceio",
    blurb: "Ten web and mobile applications for the Federation of Industries. REST and GraphQL in NestJS, Angular on the front, 25% fewer production defects.",
    chips: [CHIPS.nest, CHIPS.graphql, CHIPS.angular, CHIPS.ts, CHIPS.jest],
  },
  {
    when: "2021", title: "Web Developer", org: "SENAI Alagoas, Maceio",
    blurb: "Four WordPress projects end to end, then the move onto Angular and NestJS. Where it started.",
    chips: [CHIPS.wordpress, CHIPS.angular, CHIPS.nest, CHIPS.sass],
  },
];

export function Experience() {
  return (
    <section id="experience" className="section section--lazy" aria-labelledby="exp-h">
      <div className="section-head" data-anim>
        <h2 id="exp-h">Experience</h2>
        <span className="eyebrow">Since 2021</span>
      </div>
      <div className="xrows">
        {ROWS.map((r) => (
          <article className="xrow" data-anim key={r.when + r.org}>
            <div className={`xrow__when${r.now ? " xrow__when--now" : ""}`}>{r.when}</div>
            <div>
              <h3 className="xrow__title">{r.title}</h3>
              <div className="xrow__org">{r.org}</div>
              <p className="small xrow__p">{r.blurb}</p>
              <Chips chips={r.chips} />
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
