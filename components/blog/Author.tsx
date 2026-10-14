import Image from "next/image";
import Link from "next/link";

/**
 * The author, at both ends of a post: a byline under the lead and a short card
 * after the last paragraph. Both lead back to the home page, for readers who
 * land on a post from a shared link. The portrait is Acta's chrome tier: a
 * grayscale circle that takes its colour on hover, zoomed in on the face.
 */
function Portrait({ size }: { size: "sm" | "lg" }) {
  return (
    <span className={`author__photo author__photo--${size}`}>
      <Image src="/assets/portrait.jpg" alt="" width={666} height={1000} sizes={size === "sm" ? "140px" : "330px"} className="photo" />
    </span>
  );
}

export function AuthorByline() {
  return (
    <Link href="/" className="byline">
      <Portrait size="sm" />
      <span className="byline__text">
        <span className="byline__name">Mikael Ribeiro Simoes</span>
        <span className="byline__role">Software engineer and tech educator, Abu Dhabi</span>
      </span>
    </Link>
  );
}

export function AuthorCard() {
  return (
    <section className="author" aria-labelledby="author-name">
      <Portrait size="lg" />
      <div className="author__text">
        <p className="eyebrow">Written by</p>
        <h2 id="author-name" className="author__name">Mikael Ribeiro Simoes</h2>
        <p className="author__bio">
          I build internal platforms at ACTVET in Abu Dhabi and coach the UAE&rsquo;s software competitors for
          EmiratesSkills and WorldSkills. Before that I won gold at WorldSkills Americas, so now I get to be the one
          writing the hard tasks. Outside work: desert camping, the gym, and an orange cat who reviews my code by
          sitting on it.
        </p>
        <div className="author__links">
          <Link href="/" className="btn btn--primary">See my work</Link>
          <Link href="/#contact" className="btn btn--ghost">Get in touch</Link>
        </div>
      </div>
    </section>
  );
}
