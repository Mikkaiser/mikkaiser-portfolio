import { topicKey } from "@/lib/posts";

/**
 * Topic tags that filter the post rows with no JavaScript: each tag is a radio
 * button, and a generated :has() rule hides the rows of every other topic.
 * Rows carry data-topic; the filter and the rows share the .blog-index parent.
 */
export function TopicFilter({ topics }: { topics: string[] }) {
  const rules = topics
    .map((t) => topicKey(t))
    .map((k) => `.blog-index:has(.topics input[value="${k}"]:checked) .prows > li:not([data-topic="${k}"]){display:none}`)
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
