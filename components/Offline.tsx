import Image from "next/image";

const PHOTOS = [
  { src: "/assets/desert-selfie.jpg", w: 3392, h: 1908, alt: "Mikael in the dunes outside Abu Dhabi at sunset", pos: "60% 35%", cap: "Dunes, January 2025." },
  { src: "/assets/gym.jpg", w: 4000, h: 2252, alt: "Mikael resting on a loaded barbell between sets", pos: "50% 30%", cap: "Between sets, August 2026." },
  { src: "/assets/rocket-league.jpg", w: 1416, h: 797, alt: "Mikael pressing a controller to his forehead after a lost Rocket League match", pos: "55% 30%", cap: "Third Rocket League loss in a row. Happens often." },
  { src: "/assets/cat-young.jpg", w: 900, h: 1600, alt: "The same cat as a kitten, sitting on Mikael's shoulder", pos: "50% 40%", cap: "The cat, May 2024." },
  { src: "/assets/cat.jpg", w: 4000, h: 2252, alt: "An orange cat sitting on a bed", pos: "50% 42%", cap: "The same cat, September 2026." },
];

// The eyebrow counts subjects, not photos: two of the five images are the same
// cat. Both the count and the lead sentence are built from this one list, so
// adding a hobby cannot leave the heading claiming the wrong number again.
const SUBJECTS = ["the desert", "the gym", "a controller", "a cat waiting at home"];
const NUMBERS = ["No", "One", "Two", "Three", "Four", "Five", "Six", "Seven"];

const count = NUMBERS[SUBJECTS.length] ?? String(SUBJECTS.length);
const lead = `${SUBJECTS.slice(0, -1).join(", ")}, and ${SUBJECTS.at(-1)}.`;

export function Offline() {
  return (
    <section id="offline" className="section section--lazy" aria-labelledby="off-h">
      <div className="section-head" data-anim>
        <h2 id="off-h">Off the clock</h2>
        <span className="eyebrow">{count} things</span>
      </div>
      <p className="lead offline__lead" data-anim>{lead[0].toUpperCase() + lead.slice(1)}</p>
      <div className="gallery">
        {PHOTOS.map((p) => (
          <figure data-anim key={p.src}>
            <div className="frame">
              <Image src={p.src} alt={p.alt} width={p.w} height={p.h} sizes="(max-width: 620px) 120vw, 500px" style={{ objectPosition: p.pos }} />
            </div>
            <figcaption className="figcap">{p.cap}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
