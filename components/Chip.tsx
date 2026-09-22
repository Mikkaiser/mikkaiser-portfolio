import { Icon, type IconSlug, type Tint } from "./Icon";

export type ChipSpec = { label: string; tip: string; slug?: IconSlug; tint?: Tint };

/** Reusable chip definitions so the same technology carries the same tooltip everywhere. */
export const CHIPS = {
  dotnet: { label: ".NET", tip: "C#, ASP.NET Core Web API and Entity Framework Core", slug: "dotnet", tint: "dotnet" },
  next: { label: "Next.js", tip: "React front ends in TypeScript", slug: "nextdotjs", tint: "mono" },
  docker: { label: "Docker", tip: "Containerised builds and deployments", slug: "docker" },
  nest: { label: "NestJS", tip: "REST and GraphQL services on Node.js", slug: "nestjs" },
  graphql: { label: "GraphQL", tip: "Typed query layer over the platform content", slug: "graphql" },
  angular: { label: "Angular", tip: "TypeScript and SASS front end", slug: "angular", tint: "mono" },
  ts: { label: "TypeScript", tip: "Typed end to end, front and back", slug: "typescript" },
  k8s: { label: "Kubernetes", tip: "Orchestration for fifteen microservices", slug: "kubernetes" },
  redis: { label: "Redis", tip: "Caching that cut response times 20 to 30%", slug: "redis" },
  grafana: { label: "Grafana", tip: "Dashboards alongside Loki and Prometheus", slug: "grafana" },
  sqlserver: { label: "SQL Server", tip: "Relational store behind the internal platforms" },
  xunit: { label: "xUnit", tip: "Automated test suites that cut deployment issues by 30%" },
  azurePipelines: { label: "Azure Pipelines", tip: "CI/CD alongside GitHub Actions" },
  oracle: { label: "Oracle", tip: "Legacy schema behind the field service platform" },
  jest: { label: "Jest", tip: "Unit tests that cut production defects 25%", slug: "jest", tint: "jest" },
  wordpress: { label: "WordPress", tip: "Four projects delivered end to end", slug: "wordpress" },
  sass: { label: "SASS", tip: "Styling layer on the Angular front ends", slug: "sass" },
} satisfies Record<string, ChipSpec>;

export function Chip({ chip }: { chip: ChipSpec }) {
  return (
    <span className="chip" data-tip={chip.tip} tabIndex={0}>
      {chip.slug && <Icon slug={chip.slug} tint={chip.tint} size={15} />}
      <span>{chip.label}</span>
    </span>
  );
}

export function Chips({ chips }: { chips: ChipSpec[] }) {
  return (
    <div className="chips">
      {chips.map((c) => <Chip chip={c} key={c.label} />)}
    </div>
  );
}
