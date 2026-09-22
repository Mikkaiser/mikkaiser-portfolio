import { ContactForm } from "./ContactForm";
import { GitHub, LinkedIn, Mail } from "./icons";

export function Contact() {
  return (
    <section id="contact" className="section section--last section--lazy" aria-labelledby="ct-h">
      <div className="section-head" data-anim>
        <h2 id="ct-h">Contact</h2>
        <span className="eyebrow eyebrow--micro">Abu Dhabi · GMT+4</span>
      </div>
      <div className="ctgrid" data-anim>
        <div>
          <h3 className="display contact__h3">Always up for a conversation.</h3>
          <p className="lead contact__p">Architecture, backend, front ends, cloud, competition training, or anything running on .NET that probably should not be.</p>
          <div className="contact__ctas">
            <a href="mailto:mikkaiser.ribeiro@gmail.com" className="btn btn--primary"><Mail />mikkaiser.ribeiro@gmail.com</a>
            <a className="btn btn--ghost" href="https://www.linkedin.com/in/mikael-ribeiro/" target="_blank" rel="noopener"><LinkedIn />LinkedIn ↗</a>
            <a className="btn btn--ghost" href="https://github.com/Mikkaiser" target="_blank" rel="noopener"><GitHub />GitHub ↗</a>
          </div>
          <p className="contact__note">Replies within two days (will give my best!).</p>
        </div>
        <ContactForm />
      </div>
    </section>
  );
}
