import Image from "next/image";
import { GameButton } from "./GameButton";
import { GitHub, LinkedIn } from "./icons";

export function Hero() {
  return (
    <section className="section hero" aria-labelledby="hero-h">
      <div className="split">
        <div>
          <h1 id="hero-h" className="display hero__h1" data-hero style={{ animationDelay: ".12s" }}>
            <span aria-hidden="true" className="hero__glyph">&lt;/&gt;</span>
            Hi, my name is Mikael, but you can call me{" "}
            <span className="refwrap">
              <span className="refname" tabIndex={0} role="button" aria-describedby="ref-mikkaiser">Mikkaiser</span>
              <span className="ref" id="ref-mikkaiser" role="note">
                <span className="ref__label">Reference</span>
                <Image
                  src="/assets/mordekaiser.png"
                  alt="Mordekaiser, the League of Legends champion"
                  width={96}
                  height={112}
                  sizes="96px"
                  loading="lazy"
                  fetchPriority="low"
                  className="ref__img"
                  style={{ width: 96, height: 112, objectPosition: "56% 34%" }}
                />
                <span className="ref__p">
                  <strong className="ref__title">Mordekaiser</strong> is a necromantic warlord and champion in League of Legends, known for controlling souls and dominating both the living and the dead.
                </span>
                <span className="ref__p">
                  I swapped <strong className="strong">Morde</strong> for <strong className="strong">Mik</strong>. I have used <strong className="strong">Mikkaiser</strong> as my nickname in games, forums and anywhere else ever since. For some reason nobody else thinks of it, so it&apos;s always available ;)
                </span>
              </span>
            </span>
            !
          </h1>
          <p className="lead hero__lead" data-hero style={{ animationDelay: ".2s" }}>
            Six years across .NET, Node and the front ends on top of them. I build the internal platforms a government training authority runs on, end to end, and I train the people who inherit them.
          </p>
          <p className="body hero__body" data-hero style={{ animationDelay: ".26s" }}>
            Brazilian, based in Abu Dhabi. Two golds in software applications development, one platform with 780,000 users running code written by me, and a preference for software that stays simple as it grows.
          </p>
          <div className="hero__ctas" data-hero style={{ animationDelay: ".32s" }}>
            <GameButton />
            <a href="#work" className="btn btn--primary">See the work ↓</a>
            <a className="btn btn--ghost" href="https://github.com/Mikkaiser" target="_blank" rel="noopener"><GitHub />GitHub ↗</a>
            <a className="btn btn--ghost" href="https://www.linkedin.com/in/mikael-ribeiro/" target="_blank" rel="noopener"><LinkedIn />LinkedIn ↗</a>
          </div>
        </div>

        <figure className="portrait" data-hero style={{ animationDelay: ".14s" }}>
          <div className="portrait__frame">
            <Image
              src="/assets/rocketseat-meetup-mic.jpg"
              alt="Mikael Ribeiro Simoes speaking on stage with a microphone"
              width={1280}
              height={853}
              // The 3:4 frame crops ~50% off this 3:2 source, so request roughly double the
              // displayed width or the visible part ends up upscaled.
              sizes="(max-width: 760px) 840px, 640px"
              quality={90}
              priority
              className="portrait__img photo"
            />
          </div>
          <figcaption className="portrait__cap">
            <span className="portrait__role"><span className="dot" />Software Developer at ACTVET</span>
            <span className="portrait__loc">Abu Dhabi, UAE · UTC+4</span>
            <span className="portrait__hint">Hover me to see in colour</span>
          </figcaption>
          <a className="btn btn--ghost" href="/assets/Mikael_Ribeiro_CV.pdf" download="Mikael_Ribeiro_CV.pdf">
            <span aria-hidden="true">↓</span>Download CV<span className="kbd">PDF</span>
          </a>
        </figure>
      </div>

      <div className="stats" data-hero style={{ animationDelay: ".4s" }}>
        <div className="stat"><div className="stat__n">6+</div><div className="stat__l">Years of software<br />development</div></div>
        <div className="stat"><div className="stat__n">780K</div><div className="stat__l">Users on SENAI Play,<br />my largest platform</div></div>
        <div className="stat"><div className="stat__n">500+</div><div className="stat__l">People trained to write<br />production-grade software</div></div>
        <div className="stat"><div className="stat__n stat__n--gold">2</div><div className="stat__l">Gold medals in software development competitions</div></div>
      </div>
    </section>
  );
}
