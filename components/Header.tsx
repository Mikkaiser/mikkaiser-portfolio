import Image from "next/image";
import Link from "next/link";
import { getPosts } from "@/lib/posts";
import { Spark } from "./icons";
import { MobileMenu } from "./MobileMenu";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ current }: { current?: "blog" }) {
  // The Blog link appears once there is a published post to read.
  const hasPosts = getPosts().length > 0;
  const links = [
    { href: "/#work", label: "Work" },
    { href: "/#experience", label: "Experience" },
    { href: "/#ask", label: "Ask about me", spark: true },
    { href: "/#contact", label: "Contact" },
    { href: "/#offline", label: "Offline" },
    ...(hasPosts ? [{ href: "/blog", label: "Blog", current: current === "blog" }] : []),
  ];
  return (
    <header className="header">
      <div className="wrap header__in">
        <Link href="/#top" className="header__brand">
          <Image src="/assets/portrait.jpg" alt="" width={32} height={32} className="header__avatar photo" priority />
          <span className="header__name">Mikael Ribeiro</span>
        </Link>
        <nav className="nav" aria-label="Primary">
          {links.map((l) => (
            <Link key={l.href} className="navlink" href={l.href} aria-current={l.current ? "page" : undefined}>
              {l.spark ? <Spark size={13} className="spark" /> : null}
              {l.label}
            </Link>
          ))}
        </nav>
        <div className="header__actions">
          <ThemeToggle />
          <a href="mailto:mikkaiser.ribeiro@gmail.com" className="btn btn--primary btn--sm header__cta">Get in touch</a>
          <MobileMenu>
            <nav className="wrap" aria-label="Primary, mobile">
              <ul className="mnav__list">
                {links.map((l) => (
                  <li key={l.href}>
                    <Link className="mnav__link" href={l.href} aria-current={l.current ? "page" : undefined}>
                      {l.spark ? <Spark size={15} className="spark" /> : null}
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
              <a href="mailto:mikkaiser.ribeiro@gmail.com" className="btn btn--primary mnav__cta">Get in touch</a>
            </nav>
          </MobileMenu>
        </div>
      </div>
    </header>
  );
}
