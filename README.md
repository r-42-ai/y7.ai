# y7.ai

Static site for **y7.ai**, served by GitHub Pages from the `main` branch.

- Custom domain is pinned by the `CNAME` file — do not delete it.
- `.nojekyll` disables Jekyll processing; files are served as-is.

## DNS

Managed at Namecheap (BasicDNS, `freedns*.registrar-servers.com`). Apex points at
the GitHub Pages anycast addresses; `www` is a CNAME to the apex.

Mail for this domain is Zoho EU — the `MX` and `v=spf1 include:zohomail.eu` records
are unrelated to the website and must be left alone.
