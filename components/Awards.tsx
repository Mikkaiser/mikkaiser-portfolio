import Image from "next/image";
import { BrandLogo } from "./BrandLogo";
import { Cref } from "./Popover";
import { Cap, FlagUAE, Medal, Mic, People } from "./icons";

// No section--lazy here: content-visibility brings paint containment with it,
// which clips the reference popovers at the section box.
export function Awards() {
  return (
    <section id="awards" className="section" aria-labelledby="aw-h">
      <div className="section-head" data-anim>
        <h2 id="aw-h">Awards and achievements</h2>
        <span className="eyebrow">Two golds · One stage</span>
      </div>
      <div className="awards__split">
        <div className="tiles">
          <article className="tile tile--gold" data-anim>
            <div className="tile__meta tile__meta--gold"><Medal />Nov 2021 · Continental</div>
            <h3 className="h3"><span className="gold">Gold</span>, WorldSkills Americas</h3>
            <p className="small">Software applications development, against all three Americas.</p>
            <Cref id="cref-americas" button="About the competition">
              <Image
                src="/assets/worldskills-training.jpg"
                alt="Mikael with his expert Leyla Santos, training for WorldSkills Americas"
                width={1000}
                height={750}
                className="ref__img"
                style={{ width: 124, height: 104, objectPosition: "28% 42%" }}
              />
              <span className="ref__p">
                <strong className="ref__title">WorldSkills Americas</strong> is the continental round of WorldSkills International, the largest professional education competition in the world. Competitors from across the Americas work through real industry tasks inside a fixed time box, judged against international standards.
              </span>
              <span className="ref__p">
                Press, translated from Portuguese: <em style={{ color: "var(--ink-soft)" }}>&ldquo;19-year-old from Alagoas is champion of international professional education tournament&rdquo;</em> &mdash;{" "}
                <a href="https://g1.globo.com/al/alagoas/arquivo/noticia/2021/11/27/estudante-de-alagoas-e-campeao-de-torneio-internacional-de-educacao-profissional.ghtml" target="_blank" rel="noopener" className="u">g1 Alagoas</a>, 27 November 2021. The gold came in Software Solutions for Business.
              </span>
              <a href="https://worldskillsamericas.org/que-hacemos/" target="_blank" rel="noopener" className="ref__link">worldskillsamericas.org ↗</a>
            </Cref>
          </article>

          <article className="tile tile--gold" data-anim>
            <div className="tile__meta tile__meta--gold"><Medal />Feb 2022 · National</div>
            <h3 className="h3"><span className="gold">Gold</span>, WorldSkills Brasil</h3>
            <p className="small">Software applications development, the national championship with SENAI.</p>
            <Cref id="cref-brazil" button="About the competition">
              <Image
                src="/assets/brasil-gold-duo.jpg"
                alt="Mikael and his expert celebrating the national gold with the Alagoas flag"
                width={1440}
                height={1440}
                className="ref__img"
                style={{ width: 104, height: 104, objectPosition: "50% 38%" }}
              />
              <span className="ref__p">
                <strong className="ref__title">WorldSkills Brasil</strong> is the national round run by SENAI, known as the Olimpíada do Conhecimento until 2023. State heats feed a national final, and the winner in each skill earns the right to represent Brazil internationally.
              </span>
              <span className="ref__p">
                The skill here was <strong className="strong">Software Applications Development</strong>. You receive a test project description, a deadline and all the technical specification, and in three hours must develop a fully functional software or app.
              </span>
              <a href="https://www.senai.portaldaindustria.com.br/worldskills" target="_blank" rel="noopener" className="ref__link">senai.portaldaindustria.com.br ↗</a>
            </Cref>
          </article>

          <article className="tile" data-anim>
            <div className="tile__meta" style={{ gap: 9 }}><FlagUAE />EmiratesSkills · Chief Expert</div>
            <h3 className="h3">Chief Expert for the UAE</h3>
            <p className="small">Software Applications Development. National lead for the training, across ATS schools, HCT, Khalifa University and others.</p>
            <Cref id="cref-es" button="About EmiratesSkills">
              <BrandLogo name="emiratesskills" alt="EmiratesSkills" width={615} height={160} className="ref__img" style={{ width: 110, height: 34, objectFit: "contain", objectPosition: "right center", border: 0 }} />
              <span className="ref__p">
                <strong className="ref__title">EmiratesSkills</strong> is the national skills competition of the United Arab Emirates, run by ACTVET. Winners earn the right to represent the UAE at WorldSkills.
              </span>
              <span className="ref__p">
                As <strong className="strong">Chief Expert</strong> for Software Applications Development I own the test project, the marking scheme and the judging for the skill.
              </span>
              <a href="https://emiratesskills.mikkaiser.com" target="_blank" rel="noopener" className="ref__link">emiratesskills.mikkaiser.com ↗</a>
            </Cref>
          </article>

          <article className="tile" data-anim>
            <div className="tile__meta"><Mic />Apr 2023 · Speaker</div>
            <h3 className="h3">On stage for 350+ developers</h3>
            <p className="small">&ldquo;Frontend, backend or full stack? Which path to follow&rdquo;, at the Rocketseat Meetup in Maceió, the largest in its history.</p>
            <Cref id="cref-rocketseat" button="About the event">
              <Image
                src="/assets/rocketseat-meetup-crowd.jpg"
                alt="Full auditorium at the Rocketseat Meetup in Maceió, Mikael on stage"
                width={800}
                height={1000}
                className="ref__img"
                style={{ width: 96, height: 120, objectPosition: "50% 45%" }}
              />
              <span className="ref__p">
                <strong className="ref__title">Rocketseat</strong> is one of the largest technology education ecosystems in Latin America, focused on training and specialising software developers. In 2023 it ran a monthly meetup series across Brazil with <strong className="strong">Space Squad</strong>, its invite-only community of people recognised for their impact on the tech community.
              </span>
              <span className="ref__p">
                The Maceió edition, April 2023, drew more than 350 people and was, in Rocketseat&apos;s words, the biggest meetup in its history. My talk covered the frontend and backend roadmaps for developers of all levels. Talks were also streamed live.
              </span>
              <span className="ref__links">
                <a href="https://br.linkedin.com/posts/rocketseat_meetup-tecnologia-sucesso-activity-7059564603151724544-AxFz" target="_blank" rel="noopener" className="ref__link">Rocketseat post ↗</a>
                <a href="https://www.youtube.com/watch?v=PtHFaiXTVVE" target="_blank" rel="noopener" className="ref__link">Recording ↗</a>
                <a href="https://lp.rocketseat.com.br/space-squad" target="_blank" rel="noopener" className="ref__link">Space Squad ↗</a>
              </span>
            </Cref>
          </article>

          <article className="tile" data-anim>
            <div className="tile__meta"><People />2019 · Nationwide</div>
            <h3 className="h3">780,000 people use something I built</h3>
            <p className="small">SENAI Play, the national learning platform, live across Brazil.</p>
          </article>

          <article className="tile" data-anim>
            <div className="tile__meta"><Cap />Since 2023 · Mentor</div>
            <h3 className="h3">More than 500 people trained</h3>
            <p className="small">Students and professionals, from first loops to production architecture. Taught in English, still losing the fight with Arabic.</p>
          </article>
        </div>

        <div className="photocol">
          <figure className="photofig" data-anim>
            <div className="photobox">
              <Image src="/assets/brasil-gold-flag.jpg" alt="Mikael with the WorldSkills Brasil gold medal, holding the Alagoas flag" width={1440} height={1440} sizes="(max-width: 760px) 50vw, 300px" style={{ objectPosition: "50% 30%" }} />
            </div>
            <figcaption className="figcap">National gold, Alagoas flag, February 2022.</figcaption>
          </figure>
          <figure className="photofig" data-anim>
            <div className="photobox">
              <Image src="/assets/rocketseat-meetup-stage.jpg" alt="Mikael Ribeiro speaking on stage at the Rocketseat Meetup in Maceió" width={800} height={1000} sizes="(max-width: 760px) 50vw, 300px" style={{ objectPosition: "50% 40%" }} />
            </div>
            <figcaption className="figcap">Rocketseat Meetup, Maceió, April 2023. 350+ in the room.</figcaption>
          </figure>
        </div>
      </div>
    </section>
  );
}
