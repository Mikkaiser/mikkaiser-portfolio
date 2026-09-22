import {
  siAngular, siDocker, siDotnet, siGithub, siGitlab, siGrafana, siGraphql, siJest, siKubernetes, siNestjs,
  siNextdotjs, siNodedotjs, siPrometheus, siReact, siRedis, siSass, siTypescript, siWordpress,
} from "simple-icons";

/* Inline brand glyphs from simple-icons (CC0). Rendered server-side as SVG paths, so
   there are no icon requests and theme tints resolve through CSS variables. */
const ICONS = {
  dotnet: siDotnet, nodedotjs: siNodedotjs, nestjs: siNestjs, angular: siAngular, react: siReact,
  nextdotjs: siNextdotjs, typescript: siTypescript, docker: siDocker, kubernetes: siKubernetes,
  github: siGithub, gitlab: siGitlab, redis: siRedis, graphql: siGraphql, grafana: siGrafana,
  prometheus: siPrometheus, jest: siJest, sass: siSass, wordpress: siWordpress,
};
export type IconSlug = keyof typeof ICONS;
export type Tint = "dotnet" | "mono" | "jest";

type Props = { slug: IconSlug; tint?: Tint; size?: number; className?: string };

export function Icon({ slug, tint, size = 22, className }: Props) {
  const si = ICONS[slug];
  const fill = tint ? `var(--icon-${tint})` : `#${si.hex}`;
  return (
    <svg aria-hidden="true" width={size} height={size} viewBox="0 0 24 24" fill={fill} className={className} style={{ display: "block", flex: "none" }}>
      <path d={si.path} />
    </svg>
  );
}
