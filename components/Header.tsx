import Image from "next/image";
import Link from "next/link";
import { getPosts } from "@/lib/posts";
import { Spark } from "./icons";
import { ThemeToggle } from "./ThemeToggle";

export function Header({ current }: { current?: "blog" }) {
  // The Blog link appears once there is a published post to read.
  const hasPosts = getPosts().length > 0;
  return (
    <header className="header">
      <div className="wrap header__in">
        <Link href="/#top" className="header__brand">
          <Image src="/assets/portrait.jpg" alt="" width={32} height={32} className="header__avatar photo" priority />
          <span className="header__name">Mikael Ribeiro</span>
        </Link>
        <nav className="nav" aria-label="Primary">
          <Link className="navlink" href="/#work">Work</Link>
          <Link className="navlink" href="/#experience">Experience</Link>
          <Link className="navlink" href="/#ask"><Spark size={13} className="spark" />Ask about me</Link>
          <Link className="navlink" href="/#contact">Contact</Link>
          <Link className="navlink" href="/#offline">Offline</Link>
          {hasPosts ? <Link className="navlink" href="/blog" aria-current={current === "blog" ? "page" : undefined}>Blog</Link> : null}
        </nav>
        <div className="header__actions">
          <ThemeToggle />
          <a href="mailto:mikkaiser.ribeiro@gmail.com" className="btn btn--primary btn--sm">Get in touch</a>
        </div>
      </div>
    </header>
  );
}
