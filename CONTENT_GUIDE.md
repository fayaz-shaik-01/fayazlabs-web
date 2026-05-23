# Content Guide

How to create and publish blog posts, notebook entries, and project pages on fayazlabs.

## Directory Structure

```
content/
  blog/          # Long-form articles, tutorials, deep dives
  notebook/      # Short notes, working observations, TILs
  projects/      # Project showcase pages
```

Each file is an `.mdx` file (Markdown + JSX) with YAML frontmatter at the top.

---

## Frontmatter Reference

### Blog Post

```yaml
---
title: "Your Blog Post Title"
description: "A concise summary shown in cards and SEO meta tags."
date: "2025-06-15"
published: true          # false = draft, won't appear on site
featured: false          # true = pinned/highlighted on homepage
image: ""                # optional hero image path, e.g. "/images/blog/my-post.png"
tags: ["AI", "Python"]   # array of topic tags
category: "AI Engineering"  # single category string
---
```

**File path:** `content/blog/<slug>.mdx`
**URL on site:** `/blog/<slug>`

### Notebook Entry

```yaml
---
title: "Your Notebook Title"
description: "Brief description of the note."
date: "2025-06-15"
published: true
images: ["/images/notebook/my-note.svg"]  # optional, array of images
tags: ["Architecture", "Agents"]
---
```

**File path:** `content/notebook/<slug>.mdx`
**URL on site:** `/notebook/<slug>`

### Project Page

```yaml
---
title: "Project Name"
description: "What the project does in one or two sentences."
date: "2025-06-15"
published: true
featured: true             # featured projects get prominent placement
image: ""                  # optional hero/thumbnail image
tags: ["Backend", "Java"]  # topic tags
stack: ["Java", "Spring Boot", "Docker"]  # tech stack list
github: ""                 # GitHub repo URL (leave empty if private)
demo: ""                   # live demo URL (leave empty if none)
---
```

**File path:** `content/projects/<slug>.mdx`
**URL on site:** `/projects/<slug>`

---

## Writing Content (Body)

After the closing `---` of the frontmatter, write standard Markdown:

```mdx
## Section Heading

Paragraph text with **bold**, *italic*, `inline code`.

### Sub-heading

- Bullet list item
- Another item

1. Numbered list

> Blockquote

![Alt text](/images/blog/screenshot.png)
```

### Code blocks

Use fenced code blocks with a language identifier:

````mdx
```python
def hello():
    print("Hello, world!")
```
````

### Tips for good content

- **Use heading hierarchy** (`##` then `###` then `####`). The AI chunker splits on headings, so clear sections improve RAG retrieval quality.
- **Keep sections focused** — one topic per heading. This helps both readers and the AI understand your content.
- **Add code examples** when relevant. The parser preserves code blocks within their parent section.
- **Front-load key information** in each section. The first sentence often becomes the chunk's most important signal.

---

## Step-by-Step: Creating a New Blog Post

1. Create the file:
   ```
   content/blog/my-new-post.mdx
   ```

2. Add frontmatter (copy from the template above).

3. Write your content using Markdown.

4. Set `published: true` when ready (or `false` for drafts).

5. Commit and push to `main` or `develop`:
   ```bash
   git add content/blog/my-new-post.mdx
   git commit -m "Add blog post: my-new-post"
   git push
   ```

6. The GitHub Actions workflow (`ingest-content.yml`) automatically detects the new file and indexes it into the AI service's vector store.

---

## Step-by-Step: Creating a Notebook Entry

Same process, but place the file in `content/notebook/`:

```
content/notebook/my-observation.mdx
```

Use the notebook frontmatter template (no `category`, `featured`, `stack`, `github`, or `demo` fields).

---

## Step-by-Step: Creating a Project Page

Same process, but place the file in `content/projects/`:

```
content/projects/my-cool-project.mdx
```

Use the project frontmatter template. Fill in `stack`, and optionally `github`/`demo` URLs.

---

## How Ingestion Works

### Automatic (CI/CD)

When you push changes to `content/**` on `main` or `develop`, the GitHub Actions workflow:

1. Detects which `.mdx` files were added, modified, or deleted.
2. Sends raw file content to the AI service's `/ai/index/update` endpoint.
3. The AI service parses frontmatter, chunks content semantically, generates embeddings, and stores them with checksum-based deduplication.

Deleted files are automatically removed from the index.

### Manual (Local)

Use the `manage_content.py` script from the monorepo root:

```bash
# Incremental update — only re-indexes changed files (checksum-based)
python manage_content.py ingest

# Full rebuild — clears the index and re-indexes everything
python manage_content.py rebuild

# List what's currently indexed
python manage_content.py list
```

> **Note:** `manage_content.py` points to the production AI service by default. For local development, edit `AI_SERVICE_URL` to `http://localhost:8000`.

### Force Full Re-index via GitHub

Go to **Actions > Ingest Content to AI Service > Run workflow** and set `force_reingest` to `true`.

---

## Slug Rules

The slug is derived from the filename (without `.mdx`):

| File path                                | Slug                          |
|------------------------------------------|-------------------------------|
| `content/blog/agentic-ai-patterns.mdx`   | `blog/agentic-ai-patterns`    |
| `content/notebook/agent-orchestration-patterns.mdx` | `notebook/agent-orchestration-patterns` |
| `content/projects/ai-test-automation.mdx` | `projects/ai-test-automation` |

Use lowercase, hyphen-separated names. Avoid special characters.

---

## Adding Images

1. Place images in `public/images/<content-type>/`:
   ```
   public/images/blog/my-post-hero.png
   public/images/notebook/my-diagram.svg
   public/images/projects/my-project-screenshot.png
   ```

2. Reference them in frontmatter or body with absolute paths from root:
   ```yaml
   image: "/images/blog/my-post-hero.png"
   ```
   ```mdx
   ![Architecture diagram](/images/blog/my-architecture.png)
   ```

---

## Checklist Before Publishing

- [ ] Frontmatter is complete and valid YAML
- [ ] `published: true` is set
- [ ] `date` is in `YYYY-MM-DD` format
- [ ] Tags are relevant and consistent with existing tags
- [ ] Content has clear heading structure (`##`, `###`)
- [ ] Code blocks have language identifiers
- [ ] Images (if any) are placed in `public/images/`
- [ ] File is named with a descriptive, hyphenated slug
