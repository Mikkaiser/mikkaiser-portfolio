import { Clock } from "./Clock";

export function Footer() {
  return (
    <footer className="footer">
      <div className="wrap footer__in">
        <div className="foot">
          <div>
            <div aria-hidden="true" className="foot__glyph">&lt;/&gt;</div>
            <div className="display foot__brand">Mikkaiser</div>
            <p className="small foot__p">Full stack developer building enterprise systems from Abu Dhabi.</p>
            <a href="mailto:mikkaiser.ribeiro@gmail.com" className="btn btn--primary btn--sm" style={{ padding: "11px 18px" }}>Start a conversation</a>
          </div>
          <nav className="foot__col" aria-label="Footer, pages">
            <div className="foot__label">Pages</div>
            <a className="navlink" href="#work">Work</a>
            <a className="navlink" href="#experience">Experience</a>
            <a className="navlink" href="#awards">Achievements</a>
            <a className="navlink" href="#contact">Contact</a>
            <a className="navlink" href="#offline">Offline</a>
          </nav>
          <nav className="foot__col" aria-label="Footer, elsewhere">
            <div className="foot__label">Elsewhere</div>
            <a className="navlink" href="https://github.com/Mikkaiser" target="_blank" rel="noopener">GitHub ↗</a>
            <a className="navlink" href="https://www.linkedin.com/in/mikael-ribeiro/" target="_blank" rel="noopener">LinkedIn ↗</a>
            <a className="navlink" href="https://techknowledge.blog" target="_blank" rel="noopener">TechKnowledge ↗</a>
            <a className="navlink" href="mailto:mikkaiser.ribeiro@gmail.com">Email</a>
          </nav>
          <div className="foot__col">
            <div className="foot__label">Right now</div>
            <Clock />
            <div className="foot__tz">Abu Dhabi · UTC+4</div>
            <div className="foot__now">Building internal platforms at ACTVET and losing to my own memory game.</div>
          </div>
        </div>
        <div className="foot__bar">
          <span>Mikael Ribeiro Simoes · {new Date().getFullYear()}</span>
          <a className="navlink" href="#top">Back to top ↑</a>
        </div>
      </div>
    </footer>
  );
}
