#!/usr/bin/env python3
"""
Scraping completo di [www.ronchiverdi.it](https://www.ronchiverdi.it)
----------------------------------------
Cosa fa:
  1. Cerca la sitemap (sitemap.xml / wp-sitemap.xml / sitemap_index.xml)
  2. Se non la trova, fa crawling BFS dei link interni partendo dalla home
  3. Per ogni pagina estrae: URL, title, meta description, H1-H3,
     testo principale, immagini, link interni ed esterni
  4. Salva:
     - scrape_output/pages/<slug>.md   (un file Markdown per pagina)
     - scrape_output/inventario.csv    (elenco completo URL + metadati)
     - scrape_output/sito_completo.md  (tutto il contenuto in un unico file,
                                        pronto da incollare in Claude)

Requisiti:
  pip install requests beautifulsoup4 lxml

Uso:
  python3 scrape_ronchiverdi.py
"""

from __future__ import annotations

import csv
import re
import time
import xml.etree.ElementTree as ET
from collections import deque
from pathlib import Path
from urllib.parse import urljoin, urlparse, urldefrag

import requests
from bs4 import BeautifulSoup

BASE = "https://www.ronchiverdi.it"
DOMAIN = "ronchiverdi.it"
OUT = Path("scrape_output")
PAGES_DIR = OUT / "pages"
HEADERS = {
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
                  "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36"
}
DELAY = 0.8          # secondi tra le richieste (gentilezza verso il server)
MAX_PAGES = 300      # limite di sicurezza
TIMEOUT = 20

SKIP_EXT = re.compile(r"\.(jpg|jpeg|png|gif|webp|svg|pdf|zip|mp4|mov|css|js|ico|woff2?)($|\?)", re.I)
SKIP_PATH = re.compile(r"/(wp-admin|wp-login|wp-json|feed|tag/|author/|\?s=)", re.I)


def norm(url: str) -> str:
    url, _ = urldefrag(url)
    return url.rstrip("/") or BASE


def is_internal(url: str) -> bool:
    host = urlparse(url).netloc.lower()
    return host.endswith(DOMAIN)


def fetch(url: str) -> requests.Response | None:
    try:
        r = requests.get(url, headers=HEADERS, timeout=TIMEOUT)
        if r.status_code == 200:
            return r
        print(f"  [!] {r.status_code} → {url}")
    except requests.RequestException as e:
        print(f"  [!] errore {url}: {e}")
    return None


def urls_from_sitemap() -> list[str]:
    """Prova le sitemap standard (anche indice di sitemap annidate)."""
    candidates = [
        f"{BASE}/sitemap.xml",
        f"{BASE}/sitemap_index.xml",
        f"{BASE}/wp-sitemap.xml",
        f"{BASE}/page-sitemap.xml",
    ]
    found: list[str] = []
    seen_maps: set[str] = set()
    queue = deque(candidates)

    while queue:
        sm = queue.popleft()
        if sm in seen_maps:
            continue
        seen_maps.add(sm)
        r = fetch(sm)
        if not r or "xml" not in r.headers.get("content-type", ""):
            continue
        try:
            root = ET.fromstring(r.content)
        except ET.ParseError:
            continue
        ns = {"s": "http://www.sitemaps.org/schemas/sitemap/0.9"}
        # indice di sitemap → accoda le sotto-sitemap
        for loc in root.findall(".//s:sitemap/s:loc", ns):
            queue.append(loc.text.strip())
        # sitemap di URL
        for loc in root.findall(".//s:url/s:loc", ns):
            u = norm(loc.text.strip())
            if is_internal(u) and not SKIP_EXT.search(u):
                found.append(u)
        print(f"  sitemap letta: {sm} ({len(found)} URL cumulative)")
    return list(dict.fromkeys(found))


def extract(url: str, html: str) -> dict:
    soup = BeautifulSoup(html, "lxml")

    title = soup.title.get_text(strip=True) if soup.title else ""
    md = soup.find("meta", attrs={"name": "description"})
    meta_desc = md["content"].strip() if md and md.get("content") else ""

    # rimuovi rumore
    for tag in soup(["script", "style", "noscript", "iframe", "svg"]):
        tag.decompose()
    for sel in ["nav", "header", "footer", ".cookie", "#cookie"]:
        for t in soup.select(sel):
            t.decompose()

    headings = []
    for h in soup.find_all(["h1", "h2", "h3"]):
        txt = h.get_text(" ", strip=True)
        if txt:
            headings.append(f"{h.name.upper()}: {txt}")

    main = soup.find("main") or soup.find("article") or soup.body or soup
    blocks = []
    for el in main.find_all(["h1", "h2", "h3", "h4", "p", "li", "blockquote"]):
        txt = el.get_text(" ", strip=True)
        if not txt or len(txt) < 3:
            continue
        prefix = {"h1": "# ", "h2": "## ", "h3": "### ", "h4": "#### ",
                  "li": "- ", "blockquote": "> "}.get(el.name, "")
        blocks.append(prefix + txt)
    # dedup consecutivi
    text_md, prev = [], None
    for b in blocks:
        if b != prev:
            text_md.append(b)
        prev = b

    images = []
    for img in main.find_all("img"):
        src = img.get("src") or img.get("data-src") or ""
        if src:
            images.append({"src": urljoin(url, src), "alt": img.get("alt", "")})

    internal_links, external_links = set(), set()
    for a in soup.find_all("a", href=True):
        href = norm(urljoin(url, a["href"]))
        if not href.startswith("http"):
            continue
        (internal_links if is_internal(href) else external_links).add(href)

    return {
        "url": url,
        "title": title,
        "meta_description": meta_desc,
        "headings": headings,
        "content_md": "\n\n".join(text_md),
        "images": images,
        "internal_links": sorted(internal_links),
        "external_links": sorted(external_links),
    }


def slugify(url: str) -> str:
    path = urlparse(url).path.strip("/") or "home"
    return re.sub(r"[^a-zA-Z0-9_-]+", "_", path)[:80]


def main():
    PAGES_DIR.mkdir(parents=True, exist_ok=True)

    print("1) Ricerca sitemap…")
    urls = urls_from_sitemap()
    crawl_mode = not urls
    if crawl_mode:
        print("   Nessuna sitemap → crawling BFS dalla home.")
        urls = [BASE]

    visited: set[str] = set()
    queue = deque(norm(u) for u in urls)
    results: list[dict] = []

    print("2) Download pagine…")
    while queue and len(visited) < MAX_PAGES:
        url = queue.popleft()
        if url in visited or SKIP_EXT.search(url) or SKIP_PATH.search(url):
            continue
        visited.add(url)
        print(f"  [{len(visited):>3}] {url}")
        r = fetch(url)
        time.sleep(DELAY)
        if not r or "text/html" not in r.headers.get("content-type", ""):
            continue
        data = extract(url, r.text)
        results.append(data)
        if crawl_mode:
            for link in data["internal_links"]:
                if link not in visited:
                    queue.append(link)

    print(f"3) Salvataggio ({len(results)} pagine)…")

    # CSV inventario
    with open(OUT / "inventario.csv", "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(["url", "title", "meta_description", "n_headings",
                    "n_immagini", "caratteri_testo"])
        for d in results:
            w.writerow([d["url"], d["title"], d["meta_description"],
                        len(d["headings"]), len(d["images"]),
                        len(d["content_md"])])

    # Un .md per pagina + file unico
    full = ["# Scraping completo — [www.ronchiverdi.it\n](https://www.ronchiverdi.it\n)"]
    for d in results:
        page_md = [
            f"# {d['title'] or d['url']}",
            f"**URL:** {d['url']}",
            f"**Meta description:** {d['meta_description'] or '—'}",
            "",
            "## Struttura headings",
            *([f"- {h}" for h in d["headings"]] or ["- (nessuno)"]),
            "",
            "## Contenuto",
            d["content_md"] or "(vuoto)",
            "",
            "## Immagini",
            *([f"- {i['src']}  (alt: {i['alt']})" for i in d["images"]] or ["- (nessuna)"]),
            "",
            "## Link esterni",
            *([f"- {l}" for l in d["external_links"]] or ["- (nessuno)"]),
        ]
        md = "\n".join(page_md)
        (PAGES_DIR / f"{slugify(d['url'])}.md").write_text(md, encoding="utf-8")
        full.append("\n\n---\n\n" + md)

    (OUT / "sito_completo.md").write_text("\n".join(full), encoding="utf-8")

    print("\nFatto!")
    print(f"  • {OUT/'inventario.csv'}  — elenco di tutte le URL")
    print(f"  • {PAGES_DIR}/            — un Markdown per pagina")
    print(f"  • {OUT/'sito_completo.md'} — tutto in un unico file")


if __name__ == "__main__":
    main()
