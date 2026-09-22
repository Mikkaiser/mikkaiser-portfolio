"use client";

import Image from "next/image";
import { useTheme } from "./ThemeProvider";

type Props = { name: string; alt: string; height: number; width: number; sizes?: string; className?: string; style?: React.CSSProperties };

/** Brand wordmark with a dark and a light variant under /assets/logo-<name>-<theme>.png. */
export function BrandLogo({ name, alt, height, width, sizes = "140px", className, style }: Props) {
  const { theme } = useTheme();
  return (
    <Image
      src={`/assets/logo-${name}-${theme}.png`}
      alt={alt}
      width={width}
      height={height}
      sizes={sizes}
      className={className}
      style={{ height, width: "auto", ...style }}
    />
  );
}
