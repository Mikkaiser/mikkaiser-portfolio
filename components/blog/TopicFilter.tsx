import { topicKey } from "@/lib/posts";

/**
 * Topic tags that filter the post cards with no JavaScript: each tag is a radio
 * button, and a generated :has() rule hides the cards of every other topic.
 * Cards carry data-topic; the filter and the cards share the .blog-index parent.
 */
export function TopicFilter({ topics }: { topics: string[] }) {
  const rules = topics
    .map((t) => topicKey(t))
    .map((k) => `.blog-index:has(.topics input[value="${k}"]:checked) .postcards > li:not([data-topic="${k}"]){display:none}`)
    .join("");
  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: rules }} />
      <fieldset className="topics">
        <legend className="sr-only">Filter posts by topic</legend>
        <label className="tag">
          <input type="radio" name="topic" value="all" defaultChecked />
          All
        </label>
        {topics.map((t) => (
          <label key={t} className="tag">
            <input type="radio" name="topic" value={topicKey(t)} />
            {t}
          </label>
        ))}
      </fieldset>
    </>
  );
}
