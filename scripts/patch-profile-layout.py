from pathlib import Path

root = Path(__file__).resolve().parents[1]
page = root / "apps" / "web" / "app" / "profile" / "page.tsx"
snippet_path = Path(__file__).resolve().parent / "profile-layout-snippet.txt"

text = page.read_text(encoding="utf-8")
snippet = snippet_path.read_text(encoding="utf-8").replace("__TAG__", "div")

marker = '      <motion.div className="max-w-5xl mx-auto px-4 py-8">'
if marker not in text:
    marker = '      <div className="max-w-5xl mx-auto px-4 py-8">'

start = text.index(marker)
end = text.index("      <BottomNav", start)
page.write_text(text[:start] + snippet + text[end:], encoding="utf-8")
print("patched", page)
