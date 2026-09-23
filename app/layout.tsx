import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, JetBrains_Mono, Poppins, Roboto } from "next/font/google";
import { ThemeProvider, themeInitScript } from "@/components/ThemeProvider";
import "./tokens.css";
import "./globals.css";

const bricolage = Bricolage_Grotesque({
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
  variable: "--font-bricolage",
});
const roboto = Roboto({ subsets: ["latin"], weight: ["400", "700"], display: "swap", variable: "--font-roboto" });
// The medium weight drives button widths in the hero; as its own instance it gets its own preload
// and size-adjusted fallback, so the CTA row does not re-wrap when the font swaps in.
const robotoMedium = Roboto({ subsets: ["latin"], weight: "500", display: "swap", variable: "--font-roboto-medium" });
// Mono and Poppins are not on the LCP path: let them load after the body/display fonts.
const jetbrains = JetBrains_Mono({ subsets: ["latin"], weight: ["400", "600"], display: "swap", preload: false, variable: "--font-jetbrains" });
const poppins = Poppins({ subsets: ["latin"], weight: ["600"], display: "swap", preload: false, variable: "--font-poppins" });

const SITE = "https://mikkaiser.com";
const TITLE = "Mikael Ribeiro Simoes | Software Developer, Abu Dhabi";
const DESCRIPTION =
  "Full stack software developer in Abu Dhabi. Six years across .NET, Node, Angular and Next.js building enterprise platforms, one serving 780,000 users, and two gold medals in software applications development.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: TITLE,
  description: DESCRIPTION,
  authors: [{ name: "Mikael Ribeiro Simoes", url: SITE }],
  creator: "Mikael Ribeiro Simoes",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true, "max-image-preview": "large" },
  openGraph: {
    type: "profile",
    url: SITE,
    title: "Mikael Ribeiro Simoes (Mikkaiser) | Software Developer, Abu Dhabi",
    description:
      "Full stack and enterprise systems in .NET, Node and TypeScript. Platforms serving 780,000 users. Two golds in software applications development.",
    locale: "en_GB",
    siteName: "Mikkaiser",
    firstName: "Mikael",
    lastName: "Ribeiro Simoes",
    username: "mikkaiser",
    images: [{ url: "/assets/portrait.jpg", width: 666, height: 1000, alt: "Mikael Ribeiro Simoes" }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: "Backend and enterprise systems in .NET and Node. Platforms serving 780,000 users.",
    images: ["/assets/portrait.jpg"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0A0A0A" },
    { media: "(prefers-color-scheme: light)", color: "#FFFFFF" },
  ],
};

const personJsonLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Mikael Ribeiro Simoes",
  alternateName: "mikkaiser",
  jobTitle: "Senior Software Engineer",
  description:
    "Full stack software developer working across backend architecture, front end and enterprise systems, based in Abu Dhabi.",
  url: `${SITE}/`,
  image: `${SITE}/assets/portrait.jpg`,
  email: "mailto:mikkaiser.ribeiro@gmail.com",
  address: { "@type": "PostalAddress", addressLocality: "Abu Dhabi", addressCountry: "AE" },
  nationality: "Brazilian",
  worksFor: { "@type": "Organization", name: "ACTVET" },
  knowsLanguage: ["en", "pt"],
  knowsAbout: [
    "C#", ".NET", "ASP.NET Core", "Node.js", "NestJS", "Angular", "Next.js", "TypeScript", "SQL Server",
    "Oracle Database", "Redis", "Docker", "Kubernetes", "Microsoft Azure", "Grafana", "Microservices",
  ],
  sameAs: ["https://www.linkedin.com/in/mikael-ribeiro/", "https://github.com/Mikkaiser", "https://techknowledge.blog"],
  award: [
    "Gold medal, WorldSkills Americas 2021, Software Applications Development",
    "Gold medal, WorldSkills Brasil national championship 2022, Software Applications Development",
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bricolage.variable} ${roboto.variable} ${robotoMedium.variable} ${jetbrains.variable} ${poppins.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }} />
      </head>
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
