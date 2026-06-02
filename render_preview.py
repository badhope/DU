#!/usr/bin/env python3
"""将 README.md 渲染为 GitHub 风格的 HTML 预览页面。"""

import re
import sys
from pathlib import Path

import markdown


README_PATH = Path(__file__).parent / "README.md"
OUTPUT_PATH = Path(__file__).parent / "preview.html"

GITHUB_LIKE_CSS = """
* { box-sizing: border-box; }
body {
  margin: 0;
  background: #0d1117;
  color: #e6edf3;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Noto Sans",
               Helvetica, Arial, sans-serif, "Apple Color Emoji", "Segoe UI Emoji";
  line-height: 1.6;
  font-size: 16px;
}
.container { max-width: 1012px; margin: 0 auto; padding: 32px 16px; }
.markdown-body { color: #e6edf3; }
.markdown-body h1, .markdown-body h2, .markdown-body h3,
.markdown-body h4, .markdown-body h5, .markdown-body h6 {
  margin-top: 24px;
  margin-bottom: 16px;
  font-weight: 600;
  line-height: 1.25;
  color: #e6edf3;
  border-bottom: 1px solid #30363d;
  padding-bottom: 0.3em;
}
.markdown-body h1 { font-size: 2em; border-bottom: 1px solid #30363d; padding-bottom: 0.3em; }
.markdown-body h2 { font-size: 1.5em; border-bottom: 1px solid #30363d; padding-bottom: 0.3em; }
.markdown-body h3 { font-size: 1.25em; }
.markdown-body h4 { font-size: 1em; }
.markdown-body p { margin-top: 0; margin-bottom: 16px; }
.markdown-body a { color: #58a6ff; text-decoration: none; }
.markdown-body a:hover { text-decoration: underline; }
.markdown-body img { max-width: 100%; height: auto; background-color: transparent; }
.markdown-body code {
  padding: 0.2em 0.4em;
  margin: 0;
  font-size: 85%;
  background-color: rgba(110, 118, 129, 0.4);
  border-radius: 6px;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, monospace;
}
.markdown-body pre {
  padding: 16px;
  overflow: auto;
  font-size: 85%;
  line-height: 1.45;
  background-color: #161b22;
  border-radius: 6px;
}
.markdown-body pre code { background: transparent; padding: 0; }
.markdown-body table { border-spacing: 0; border-collapse: collapse; margin: 16px 0; display: block; width: max-content; max-width: 100%; overflow: auto; }
.markdown-body table th, .markdown-body table td {
  padding: 6px 13px;
  border: 1px solid #30363d;
}
.markdown-body table tr { background-color: #0d1117; border-top: 1px solid #30363d; }
.markdown-body table tr:nth-child(2n) { background-color: #161b22; }
.markdown-body table th { font-weight: 600; }
.markdown-body blockquote {
  margin: 0 0 16px 0;
  padding: 0 1em;
  color: #8b949e;
  border-left: 0.25em solid #30363d;
}
.markdown-body hr { height: 0.25em; margin: 24px 0; background-color: #30363d; border: 0; }
.markdown-body ul, .markdown-body ol { padding-left: 2em; margin-top: 0; margin-bottom: 16px; }
.markdown-body li + li { margin-top: 0.25em; }
.markdown-body details { margin: 16px 0; }
.markdown-body summary { cursor: pointer; }
.svg-banner, .svg-divider, .svg-effect {
  display: block;
  max-width: 100%;
  height: auto;
  margin: 16px auto;
  border-radius: 6px;
}
.svg-divider { max-height: 80px; }
.svg-banner { max-height: 300px; }
.quote-block { text-align: center; font-style: italic; color: #8b949e; }
.assets-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 12px;
  margin: 16px 0;
}
.assets-grid img {
  width: 100%;
  height: 100px;
  object-fit: cover;
  border-radius: 6px;
  background: #161b22;
  padding: 4px;
}
.assets-grid figcaption {
  text-align: center;
  font-size: 0.8em;
  color: #8b949e;
  margin-top: 4px;
  word-break: break-all;
}
.section-label {
  display: inline-block;
  padding: 2px 8px;
  font-size: 0.7em;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-transform: uppercase;
  background: rgba(88, 166, 255, 0.15);
  color: #58a6ff;
  border-radius: 999px;
  margin-bottom: 8px;
}
"""


def replace_svg_with_styled_img(html: str) -> str:
    """把所有 <img src='assets/...svg'> 加上样式 class，方便展示。"""
    html = re.sub(
        r'<img\s+([^>]*src="assets/banner/[^"]+\.svg"[^>]*)>',
        r'<img \1 class="svg-banner" loading="eager">',
        html,
    )
    html = re.sub(
        r'<img\s+([^>]*src="assets/dividers/[^"]+\.svg"[^>]*)>',
        r'<img \1 class="svg-divider" loading="eager">',
        html,
    )
    html = re.sub(
        r'<img\s+([^>]*src="assets/effects/[^"]+\.svg"[^>]*)>',
        r'<img \1 class="svg-effect" loading="eager">',
        html,
    )
    return html


def main() -> None:
    if not README_PATH.exists():
        print(f"❌ 找不到 {README_PATH}", file=sys.stderr)
        sys.exit(1)

    readme_text = README_PATH.read_text(encoding="utf-8")
    html_body = markdown.markdown(
        readme_text,
        extensions=["extra", "sane_lists", "tables", "fenced_code"],
    )
    html_body = replace_svg_with_styled_img(html_body)

    full_html = f"""<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>badhope / badhope — Profile Preview</title>
  <style>{GITHUB_LIKE_CSS}</style>
</head>
<body>
  <div class="container">
    <article class="markdown-body">
{html_body}
    </article>
  </div>
</body>
</html>
"""
    OUTPUT_PATH.write_text(full_html, encoding="utf-8")
    print(f"✅ 渲染完成: {OUTPUT_PATH}")
    print(f"   字节数: {OUTPUT_PATH.stat().st_size}")


if __name__ == "__main__":
    main()
