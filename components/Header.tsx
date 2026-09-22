import Image from "next/image";
import { Spark } from "./icons";
import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="header">
      <div className="wrap header__in">
        <a href="#top" className="header__brand">
          <Image src="/assets/portrait.jpg" alt="" width={32} height={32} className="header__avatar photo" priority />
          <span className="header__name">Mikael Ribeiro</span>
        </a>
        <nav className="nav" aria-label="Primary">
          <a className="navlink" href="#work">Work</a>
          <a className="navlink" href="#experience">Experience</a>
          <a className="navlink" href="#ask"><Spark size={13} className="spark" />Ask about me</a>
          <a className="navlink" href="#contact">Contact</a>
          <a className="navlink" href="#offline">Offline</a>
        </nav>
        <div className="header__actions">
          <ThemeToggle />
          <a href="mailto:mikkaiser.ribeiro@gmail.com" className="btn btn--primary btn--sm">Get in touch</a>
        </div>
      </div>
    </header>
  );
}
