import { glossaryHref, termIdFromHref } from "@/lib/course/glossary";

const FORBID_TAGS = ["script", "iframe", "frame", "object", "embed", "form", "input", "textarea", "select", "style", "link", "meta", "base"];

/** Sanitise decrypted lesson HTML. No scripts, frames, forms or event handlers. */
export async function sanitizeLesson(html: string): Promise<string> {
  const { default: DOMPurify } = await import("dompurify");
  const purify = DOMPurify(window);
  purify.addHook("afterSanitizeAttributes", (node) => {
    if (node.tagName === "A") {
      const href = node.getAttribute("href") ?? "";
      const termId = termIdFromHref(href);
      if (termId) {
        // "../glossary.html#api" does not exist on the site; point at the real glossary page.
        node.setAttribute("href", glossaryHref(termId));
        node.setAttribute("data-term", termId);
        return;
      }
      if (/^https?:\/\//i.test(href)) {
        node.setAttribute("target", "_blank");
        node.setAttribute("rel", "noopener noreferrer");
      }
    }
  });
  return purify.sanitize(html, {
    FORBID_TAGS,
    FORBID_ATTR: ["style", "srcdoc", "formaction"],
    ALLOW_DATA_ATTR: false,
    USE_PROFILES: { html: true },
  });
}
