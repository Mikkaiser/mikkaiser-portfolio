import Image from "next/image";
import { BrandLogo } from "./BrandLogo";
import { Icon, type IconSlug, type Tint } from "./Icon";

type Item = { label: string; slug?: IconSlug; tint?: Tint; local?: "aws" | "azure" };

const ITEMS: Item[] = [
  { label: ".NET", slug: "dotnet", tint: "dotnet" },
  { label: "Node.js", slug: "nodedotjs" },
  { label: "NestJS", slug: "nestjs" },
  { label: "Angular", slug: "angular", tint: "mono" },
  { label: "React", slug: "react" },
  { label: "Next.js", slug: "nextdotjs", tint: "mono" },
  { label: "TypeScript", slug: "typescript" },
  { label: "Docker", slug: "docker" },
  { label: "Kubernetes", slug: "kubernetes" },
  { label: "AWS", local: "aws" },
  { label: "Azure", local: "azure" },
  { label: "GitHub", slug: "github", tint: "mono" },
  { label: "GitLab", slug: "gitlab" },
  { label: "Redis", slug: "redis" },
  { label: "GraphQL", slug: "graphql" },
  { label: "Grafana", slug: "grafana" },
  { label: "Prometheus", slug: "prometheus" },
  { label: "Jest", slug: "jest", tint: "jest" },
  { label: "SASS", slug: "sass" },
];

function Group() {
  return (
    <span className="marquee__group">
      {ITEMS.map((it) => (
        <span className="marquee__item" key={it.label}>
          {it.local === "aws" && <BrandLogo name="aws" alt="" width={608} height={364} sizes="40px" style={{ height: 22 }} />}
          {it.local === "azure" && <Image src="/assets/logo-azure.png" alt="" width={22} height={22} />}
          {it.slug && <Icon slug={it.slug} tint={it.tint} />}
          <span>{it.label}</span>
        </span>
      ))}
    </span>
  );
}

/* The track is duplicated so the translateX(-50%) loop is seamless. */
export function Marquee() {
  return (
    <div aria-hidden="true" className="marquee">
      <div className="marquee__track">
        <Group />
        <Group />
      </div>
    </div>
  );
}
