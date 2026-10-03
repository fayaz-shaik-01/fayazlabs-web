#!/usr/bin/env python3
"""
Convert test-automation-knowledge-base MD files to MDX for fayazlabs.com.
Reads from the Obsidian vault, writes MDX to the website content directory.
Does NOT modify the source MD files.
"""
import os
import re
import json
import sys
from pathlib import Path
from datetime import date

KB_DIR = Path("/Users/sfayaz/Documents/Personal/prep/SDET Learn/test-automation-knowledge-base")
OUT_DIR = Path("/Users/sfayaz/Documents/Personal/prep/fayazlabs/fayazlabs-web/content/learning/tracks/sdet-engineering")

# Map KB directory paths to module slugs and output directories
DIR_TO_MODULE = {
    "01-programming-foundations/java": ("java", "java"),
    "01-programming-foundations/dsa": ("dsa", "dsa"),
    "01-programming-foundations/typescript": ("typescript", "typescript"),
    "01-programming-foundations/software-engineering": ("software-engineering", "software-engineering"),
    "02-testing-foundations": ("testing-foundations", "testing-foundations"),
    "03-framework-engineering": ("framework-engineering", "framework-engineering"),
    "04-api-automation": ("api-automation", "api-automation"),
    "04-api-automation/rest-assured-java": ("api-automation", "api-automation"),
    "04-api-automation/playwright-api-testing": ("api-automation", "api-automation"),
    "05-web-automation": ("web-automation", "web-automation"),
    "05-web-automation/selenium-java": ("web-automation", "web-automation"),
    "05-web-automation/playwright-typescript": ("web-automation", "web-automation"),
    "06-mobile-automation": ("mobile-automation", "mobile-automation"),
    "06-mobile-automation/appium-java": ("mobile-automation", "mobile-automation"),
    "06-mobile-automation/mobilewright": ("mobile-automation", "mobile-automation"),
    "07-test-data-and-integration": ("test-data-and-integration", "test-data-and-integration"),
    "08-ci-cd-and-infrastructure": ("ci-cd-and-infrastructure", "ci-cd-and-infrastructure"),
    "09-advanced-quality-engineering": ("advanced-quality-engineering", "advanced-quality-engineering"),
    "09-advanced-quality-engineering/performance-testing": ("advanced-quality-engineering", "advanced-quality-engineering"),
    "09-advanced-quality-engineering/security-testing": ("advanced-quality-engineering", "advanced-quality-engineering"),
    "09-advanced-quality-engineering/accessibility-testing": ("advanced-quality-engineering", "advanced-quality-engineering"),
    "09-advanced-quality-engineering/contract-testing": ("advanced-quality-engineering", "advanced-quality-engineering"),
    "09-advanced-quality-engineering/mutation-testing": ("advanced-quality-engineering", "advanced-quality-engineering"),
    "09-advanced-quality-engineering/visual-regression-testing": ("advanced-quality-engineering", "advanced-quality-engineering"),
    "10-ai-assisted-testing": ("ai-assisted-testing", "ai-assisted-testing"),
    "11-staynest-lab": ("staynest-lab", "staynest-lab"),
    "12-projects": ("projects", "projects"),
    "13-interview-preparation": ("interview-preparation", "interview-preparation"),
    "13-interview-preparation/java-and-dsa": ("interview-preparation", "interview-preparation"),
    "13-interview-preparation/testing-fundamentals": ("interview-preparation", "interview-preparation"),
    "13-interview-preparation/framework-design": ("interview-preparation", "interview-preparation"),
    "13-interview-preparation/selenium-and-playwright": ("interview-preparation", "interview-preparation"),
    "13-interview-preparation/api-automation": ("interview-preparation", "interview-preparation"),
    "13-interview-preparation/mobile-automation": ("interview-preparation", "interview-preparation"),
    "13-interview-preparation/ci-cd-and-docker": ("interview-preparation", "interview-preparation"),
    "13-interview-preparation/coding-exercises": ("interview-preparation", "interview-preparation"),
    "13-interview-preparation/debugging-scenarios": ("interview-preparation", "interview-preparation"),
}

# Files to skip
SKIP_FILES = {"README.md", "CONTRIBUTING.md", "CHANGELOG.md", "Home.md", "_index.md"}

# Difficulty by module
MODULE_DIFFICULTY = {
    "java": "beginner",
    "dsa": "intermediate",
    "typescript": "intermediate",
    "software-engineering": "intermediate",
    "testing-foundations": "intermediate",
    "framework-engineering": "intermediate",
    "api-automation": "intermediate",
    "web-automation": "intermediate",
    "mobile-automation": "intermediate",
    "test-data-and-integration": "intermediate",
    "ci-cd-and-infrastructure": "intermediate",
    "advanced-quality-engineering": "advanced",
    "ai-assisted-testing": "intermediate",
    "staynest-lab": "beginner",
    "projects": "intermediate",
    "interview-preparation": "intermediate",
}

# Tags by module
MODULE_TAGS = {
    "java": ["SDET", "Java", "Programming"],
    "dsa": ["SDET", "DSA", "Algorithms"],
    "typescript": ["SDET", "TypeScript", "Programming"],
    "software-engineering": ["SDET", "Software Engineering"],
    "testing-foundations": ["SDET", "Testing", "QA"],
    "framework-engineering": ["SDET", "Framework", "Architecture"],
    "api-automation": ["SDET", "API", "REST", "Testing"],
    "web-automation": ["SDET", "Web", "Selenium", "Playwright"],
    "mobile-automation": ["SDET", "Mobile", "Appium"],
    "test-data-and-integration": ["SDET", "Test Data", "Integration"],
    "ci-cd-and-infrastructure": ["SDET", "CI/CD", "Jenkins", "Docker"],
    "advanced-quality-engineering": ["SDET", "Quality Engineering", "Advanced"],
    "ai-assisted-testing": ["SDET", "AI", "Testing"],
    "staynest-lab": ["SDET", "StayNest", "Hands-on"],
    "projects": ["SDET", "Projects", "Portfolio"],
    "interview-preparation": ["SDET", "Interview", "Preparation"],
}


def strip_obsidian_frontmatter(content: str) -> str:
    """Remove existing YAML frontmatter."""
    if content.startswith("---"):
        end = content.find("---", 3)
        if end != -1:
            return content[end + 3:].lstrip("\n")
    return content


def escape_curly_braces(content: str) -> str:
    """Escape { and } outside of code blocks, math blocks, and JSX components.
    
    Also escapes bare HTML tags like <T>, <V>, <WebDriver> that MDX tries to parse as JSX.
    Also converts <details>/<summary> HTML to MDX-compatible patterns.
    """
    lines = content.split("\n")
    result = []
    in_code_block = False
    in_math_block = False

    for line in lines:
        # Track code fences — must check before anything else
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code_block = not in_code_block
            result.append(line)
            continue

        # Inside code blocks: never escape
        if in_code_block:
            result.append(line)
            continue

        # Track $$ math blocks
        if stripped == "$$":
            in_math_block = not in_math_block
            result.append(line)
            continue

        if in_math_block:
            result.append(line)
            continue

        # Convert <details>/<summary> to simple markdown
        if stripped.startswith("<details"):
            result.append("")
            continue
        if stripped.startswith("</details"):
            result.append("")
            continue
        if stripped.startswith("<summary"):
            # Extract text between tags
            text = re.sub(r'</?summary[^>]*>', '', stripped).strip()
            if text:
                result.append(f"**{text}**")
            continue
        if stripped.startswith("</summary"):
            continue

        # Skip lines that are proper JSX component tags (our custom components)
        if re.match(r'^</?(?:MentalModel|KeyTakeaways|AntiPattern|Warning|BestPractice|'
                    r'StayNestExample|InterviewTip|DebugScenario|ToolComparison|'
                    r'FormulaCard|DefinitionCard|ExamTip|EngineeringInsight|'
                    r'RealWorldExample|ExampleCard|DerivationStepper|DerivationStep|'
                    r'ComparisonTable|ConceptCheckpoint|TabGroup|MemoryTrick|'
                    r'Visualization)\b', stripped):
            result.append(line)
            continue

        # Angle brackets are handled in escape_angle_brackets() at file level

        # Escape curly braces outside inline math and inline code
        # Strategy: split line into segments that are "safe" (inline code, inline math) 
        # and "unsafe" (everything else)
        segments = re.split(r'(`[^`]+`|\$[^$]+\$)', line)
        processed = []
        for seg in segments:
            if (seg.startswith('`') and seg.endswith('`')) or \
               (seg.startswith('$') and seg.endswith('$')):
                # Inline code or inline math — keep as-is
                processed.append(seg)
            else:
                # Escape bare { and } using character-by-character approach
                # to avoid double-escaping (the escape {'{'} itself contains { })
                escaped_chars = []
                for ch in seg:
                    if ch == '{':
                        escaped_chars.append("{'{'}")
                    elif ch == '}':
                        escaped_chars.append("{'}'}")
                    else:
                        escaped_chars.append(ch)
                seg = "".join(escaped_chars)
                processed.append(seg)
        line = "".join(processed)

        result.append(line)

    return "\n".join(result)


def strip_wikilinks(content: str) -> str:
    """Convert [[wikilinks]] to plain text and [[link|display]] to display text."""
    # [[link|display]] -> display
    content = re.sub(r'\[\[([^|\]]+)\|([^\]]+)\]\]', r'\2', content)
    # [[link]] -> link (title-cased)
    content = re.sub(r'\[\[([^\]]+)\]\]', lambda m: m.group(1).replace("-", " ").title(), content)
    return content


def strip_obsidian_callouts(content: str) -> str:
    """Convert Obsidian callouts like > [!type] to MDX components."""
    lines = content.split("\n")
    result = []
    i = 0

    while i < len(lines):
        line = lines[i]

        # Detect Obsidian callout: > [!type] or > [!type]- title
        callout_match = re.match(r'^>\s*\[!([\w-]+)\][-+]?\s*(.*)', line)
        if callout_match:
            callout_type = callout_match.group(1).lower()
            callout_title = callout_match.group(2).strip()

            # Collect callout body (lines starting with >)
            body_lines = []
            i += 1
            while i < len(lines) and lines[i].startswith(">"):
                body_line = lines[i]
                # Strip the > prefix
                if body_line.startswith("> "):
                    body_lines.append(body_line[2:])
                elif body_line == ">":
                    body_lines.append("")
                else:
                    body_lines.append(body_line[1:])
                i += 1

            body = "\n".join(body_lines).strip()
            
            # If body contains code fences, don't wrap in JSX component
            # (MDX can't handle markdown code blocks inside JSX components)
            has_code = "```" in body
            
            if has_code:
                # Output as plain content with a styled header
                header_map = {
                    "mental-model": "Mental Model",
                    "key-takeaways": "Key Takeaways",
                    "anti-pattern": callout_title or "Anti-Pattern",
                    "warning": callout_title or "Warning",
                    "tip": "Best Practice",
                    "success": "Best Practice",
                    "staynest": callout_title or "StayNest Example",
                    "interview": "Interview Tip",
                }
                header = header_map.get(callout_type, callout_title or callout_type.title())
                result.append(f"> **{header}**")
                result.append(">")
                for bl in body_lines:
                    result.append(f"> {bl}" if bl else ">")
                result.append("")
                i += 1
                continue

            # Map callout types to MDX components
            if callout_type in ("mental-model",):
                result.append(f"<MentalModel>")
                result.append("")
                result.append(body)
                result.append("")
                result.append("</MentalModel>")
            elif callout_type in ("key-takeaways",):
                result.append(f"<KeyTakeaways>")
                result.append("")
                result.append(body)
                result.append("")
                result.append("</KeyTakeaways>")
            elif callout_type in ("anti-pattern",):
                title_attr = f' title="{callout_title}"' if callout_title and callout_title != "Common Mistakes" else ""
                result.append(f"<AntiPattern{title_attr}>")
                result.append("")
                result.append(body)
                result.append("")
                result.append("</AntiPattern>")
            elif callout_type in ("warning",):
                title_attr = f' title="{callout_title}"' if callout_title else ""
                result.append(f"<Warning{title_attr}>")
                result.append("")
                result.append(body)
                result.append("")
                result.append("</Warning>")
            elif callout_type in ("tip", "success"):
                result.append(f"<BestPractice>")
                result.append("")
                result.append(body)
                result.append("")
                result.append("</BestPractice>")
            elif callout_type in ("staynest",):
                title_attr = f' title="{callout_title}"' if callout_title else ""
                result.append(f"<StayNestExample{title_attr}>")
                result.append("")
                result.append(body)
                result.append("")
                result.append("</StayNestExample>")
            elif callout_type in ("flashcard",):
                # Skip flashcard callouts — they don't translate well to MDX
                result.append(body)
            elif callout_type in ("mastery",):
                result.append(body)
            elif callout_type in ("interview",):
                result.append(f"<InterviewTip>")
                result.append("")
                result.append(body)
                result.append("")
                result.append("</InterviewTip>")
            else:
                # Generic: keep as blockquote
                result.append(f"> **{callout_title or callout_type}**")
                for bl in body_lines:
                    result.append(f"> {bl}" if bl else ">")

            result.append("")
            continue

        result.append(line)
        i += 1

    return "\n".join(result)


def strip_html_comments(content: str) -> str:
    """Remove or convert HTML comments that break MDX parsing.
    
    Inside code blocks: leave as-is (they're part of code examples).
    Outside code blocks: convert <!-- --> to {/* */} or remove entirely.
    """
    lines = content.split("\n")
    result = []
    in_code = False
    
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code = not in_code
            result.append(line)
            continue
        
        if in_code:
            result.append(line)
            continue
        
        # Outside code blocks: handle HTML comments
        # Remove <!-- unverified --> entirely (including when inside blockquotes with > prefix)
        line = re.sub(r'^(>\s*)?<!--\s*unverified\s*-->\s*$', '', line)
        line = re.sub(r'<!--\s*unverified\s*-->\s*', '', line)
        # Remove <!--date--> patterns (used as placeholders)
        line = re.sub(r'<!--\s*date\s*-->', '', line)
        # Convert remaining HTML comments to MDX comments
        line = re.sub(r'<!--(.+?)-->', r'{/* \1 */}', line)
        
        result.append(line)
    
    return "\n".join(result)


def compute_lesson_slug(filepath: Path) -> str:
    """Derive lesson slug from filepath."""
    stem = filepath.stem  # e.g., "syntax-and-control-flow"
    # For files in subdirs like rest-assured-java/setup-and-first-tests.md
    # prefix with parent dir
    parent = filepath.parent.name
    kb_rel = str(filepath.relative_to(KB_DIR))

    # Check if this is a subdir file (e.g., rest-assured-java, selenium-java)
    subdirs = [
        "rest-assured-java", "playwright-api-testing",
        "selenium-java", "playwright-typescript",
        "appium-java", "mobilewright",
        "performance-testing", "security-testing", "accessibility-testing",
        "contract-testing", "mutation-testing", "visual-regression-testing",
        "java-and-dsa", "testing-fundamentals", "framework-design",
        "selenium-and-playwright", "api-automation", "mobile-automation",
        "ci-cd-and-docker", "coding-exercises", "debugging-scenarios",
    ]
    if parent in subdirs:
        return f"{parent}-{stem}"

    return stem


def extract_title(content: str) -> str:
    """Extract first H1 title from content."""
    match = re.search(r'^#\s+(.+)$', content, re.MULTILINE)
    if match:
        title = match.group(1).strip()
        title = title.replace('"', '\\"')
        return title
    return "Untitled"


def extract_description(content: str) -> str:
    """Extract first paragraph after the title as description."""
    # Find first non-empty, non-heading line after H1
    lines = content.split("\n")
    found_h1 = False
    for line in lines:
        if line.startswith("# "):
            found_h1 = True
            continue
        if found_h1 and line.strip() and not line.startswith("#") and not line.startswith(">") and not line.startswith("---"):
            desc = line.strip()
            # Strip markdown formatting from description
            desc = re.sub(r'\*\*([^*]+)\*\*', r'\1', desc)  # Bold
            desc = re.sub(r'\*([^*]+)\*', r'\1', desc)      # Italic
            desc = re.sub(r'`([^`]+)`', r'\1', desc)        # Inline code
            desc = re.sub(r'\[([^\]]+)\]\([^)]+\)', r'\1', desc)  # Links
            # Escape quotes for YAML
            desc = desc.replace('"', '\\"')
            # Truncate to 500 chars
            if len(desc) > 490:
                desc = desc[:487] + "..."
            return desc
    return "A comprehensive guide for SDET engineers."


def generate_frontmatter(filepath: Path, content: str, module_slug: str) -> str:
    """Generate TrackLesson YAML frontmatter."""
    lesson_slug = compute_lesson_slug(filepath)
    title = extract_title(content)
    description = extract_description(content)
    difficulty = MODULE_DIFFICULTY.get(module_slug, "intermediate")
    tags = MODULE_TAGS.get(module_slug, ["SDET"])
    line_count = len(content.split("\n"))
    est_minutes = max(30, line_count // 15)

    # Determine lesson type
    lesson_type = "learn"
    if "lab" in filepath.stem or "exercise" in filepath.stem or "practice" in filepath.stem:
        lesson_type = "lab"
    elif "contract" in filepath.stem or "requirements" in filepath.stem or "api-contract" in filepath.stem:
        lesson_type = "reference"

    fm = f"""---
title: "{title}"
description: "{description}"
summary: "SDET Engineering guide: {title}"
date: "{date.today().isoformat()}"
published: true
track: "sdet-engineering"
module: "{module_slug}"
lesson: "{lesson_slug}"
difficulty: "{difficulty}"
estimatedMinutes: {est_minutes}
prerequisites: []
tags: {json.dumps(tags)}
learningObjectives: []
concepts: []
relatedLessons: []
lessonType: "{lesson_type}"
order: 1
premium: false
status: "published"
canonicalPath: "/learning/sdet-engineering/{module_slug}/{lesson_slug}"
references: []
visualizations: []
knowledgeObjects: []
---"""
    return fm


def escape_angle_brackets(content: str) -> str:
    """Escape angle brackets that MDX would try to parse as JSX tags.
    
    Handles: <T>, <V>, <E>, <K, V>, <String>, <WebDriver>, <TestConfig>, etc.
    Preserves: our MDX components, standard HTML tags, and anything inside code blocks/inline code.
    """
    # Safe tags that should NOT be escaped
    SAFE_TAGS = {
        # Our MDX components
        'mentalmodel', 'keytakeaways', 'antipattern', 'warning', 'bestpractice',
        'staynestexample', 'interviewtip', 'debugscenario', 'toolcomparison',
        'formulacard', 'definitioncard', 'examtip', 'engineeringinsight',
        'realworldexample', 'examplecard', 'derivationstepper', 'derivationstep',
        'comparisontable', 'conceptcheckpoint', 'tabgroup', 'memorytrick',
        'visualization',
        # Standard HTML tags
        'div', 'span', 'p', 'a', 'br', 'hr', 'em', 'strong', 'code', 'pre',
        'ul', 'ol', 'li', 'table', 'tr', 'td', 'th', 'thead', 'tbody',
        'img', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'blockquote',
        'b', 'i', 'u', 's', 'sup', 'sub', 'small', 'mark',
        'section', 'nav', 'header', 'footer', 'main', 'aside', 'article',
        'figure', 'figcaption', 'caption', 'colgroup', 'col',
        'input', 'button', 'form', 'label', 'select', 'option', 'textarea',
        'video', 'audio', 'source', 'canvas', 'svg', 'path', 'circle', 'rect',
        'line', 'polyline', 'polygon', 'text', 'g', 'defs', 'use',
    }
    
    lines = content.split("\n")
    result = []
    in_code = False
    
    for line in lines:
        stripped = line.strip()
        if stripped.startswith("```"):
            in_code = not in_code
            result.append(line)
            continue
        
        if in_code:
            result.append(line)
            continue
        
        # Process line: split into inline code segments and non-code segments
        segments = re.split(r'(`[^`]+`)', line)
        processed = []
        for seg in segments:
            if seg.startswith('`') and seg.endswith('`'):
                processed.append(seg)
            else:
                # Escape angle bracket patterns that aren't safe tags
                def escape_tag(m):
                    full_match = m.group(0)
                    tag_content = m.group(1)
                    # Extract tag name (first word, strip /)
                    tag_name = tag_content.strip('/').split()[0] if tag_content.strip('/') else ''
                    if tag_name.lower() in SAFE_TAGS:
                        return full_match  # Keep safe tags
                    # Wrap in backtick to prevent JSX parsing
                    return '`' + full_match + '`'
                
                seg = re.sub(r'<(/?\w+(?:[^>]*?)?)>', escape_tag, seg)
                
                # Also escape < before digits/special chars: <4.5, <100, etc.
                seg = re.sub(r'<(\d)', r'&lt;\1', seg)
                # And standalone < not followed by a letter or / (comparison operators)
                seg = re.sub(r'<(?![a-zA-Z/`&!])', r'&lt;', seg)
                
                processed.append(seg)
        
        result.append("".join(processed))
    
    return "\n".join(result)


def convert_file(filepath: Path) -> tuple[str, str] | None:
    """Convert a single MD file to MDX. Returns (output_path, content) or None."""
    filename = filepath.name
    if filename in SKIP_FILES:
        return None

    # Determine module from path
    rel = str(filepath.relative_to(KB_DIR))
    dir_part = str(filepath.parent.relative_to(KB_DIR))

    if dir_part not in DIR_TO_MODULE:
        # Skip files not mapped (roadmap, templates, revision)
        return None

    module_slug, out_dir = DIR_TO_MODULE[dir_part]

    # Read source
    with open(filepath, "r") as f:
        content = f.read()

    # Step 1: Strip Obsidian frontmatter
    content = strip_obsidian_frontmatter(content)

    # Step 2: Strip wikilinks
    content = strip_wikilinks(content)

    # Step 3: Convert Obsidian callouts to MDX components
    content = strip_obsidian_callouts(content)

    # Step 3.5: Remove blockquoted code fences (> ```) that break MDX fence tracking
    # These come from callouts-with-code that were converted to blockquotes
    lines = content.split("\n")
    cleaned = []
    in_bq_code = False
    for line in lines:
        stripped = line.strip()
        if re.match(r'^>\s*```', stripped):
            cleaned.append(re.sub(r'^>\s*', '', line))
            in_bq_code = not in_bq_code
        elif in_bq_code and stripped.startswith(">"):
            cleaned.append(re.sub(r'^>\s?', '', line))
        else:
            if in_bq_code:
                in_bq_code = False
            cleaned.append(line)
    content = "\n".join(cleaned)

    # Step 4: Strip HTML comments (AFTER callout + fence cleanup)
    content = strip_html_comments(content)

    # Step 5: Escape curly braces (this must happen AFTER callout conversion)
    content = escape_curly_braces(content)

    # Step 5.5: Escape angle brackets that MDX would parse as JSX
    content = escape_angle_brackets(content)

    # Step 5.6: Convert .md links to .mdx links (for relative references)
    content = re.sub(r'\]\(\./([\w-]+)\.md\)', r'](./\1.mdx)', content)
    content = re.sub(r'\]\(([\w-]+)\.md\)', r'](\1.mdx)', content)

    # Step 6: Generate frontmatter
    frontmatter = generate_frontmatter(filepath, content, module_slug)

    # Step 7: Combine
    mdx_content = frontmatter + "\n\n" + content

    # Step 8: Determine output path
    lesson_slug = compute_lesson_slug(filepath)
    output_path = OUT_DIR / out_dir / f"{lesson_slug}.mdx"

    return str(output_path), mdx_content


def main():
    converted = 0
    skipped = 0
    errors = []

    # Find all MD files
    for md_file in sorted(KB_DIR.rglob("*.md")):
        # Skip template and root files
        if "templates" in str(md_file) or "00-roadmap" in str(md_file) or "14-revision" in str(md_file):
            skipped += 1
            continue

        result = convert_file(md_file)
        if result is None:
            skipped += 1
            continue

        output_path, mdx_content = result

        # Ensure output directory exists
        os.makedirs(os.path.dirname(output_path), exist_ok=True)

        # Write MDX file
        try:
            with open(output_path, "w") as f:
                f.write(mdx_content)
            converted += 1
            print(f"  Converted: {md_file.name} -> {os.path.basename(output_path)}")
        except Exception as e:
            errors.append((str(md_file), str(e)))
            print(f"  ERROR: {md_file.name}: {e}")

    print(f"\nDone: {converted} converted, {skipped} skipped, {len(errors)} errors")
    if errors:
        for path, err in errors:
            print(f"  Error: {path}: {err}")

    return 0 if not errors else 1


if __name__ == "__main__":
    sys.exit(main())
