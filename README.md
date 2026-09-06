# y7.ai

Static site for **y7.ai**, served by GitHub Pages from the `main` branch.

- Custom domain is pinned by the `CNAME` file — do not delete it.
- `.nojekyll` disables Jekyll processing; files are served as-is.

## DNS

Managed at Namecheap (FreeDNS, `freedns*.registrar-servers.com`). Apex points at
the GitHub Pages anycast addresses; `www` is a CNAME to `r-42-ai.github.io.`.

Two subdomains are separate GitHub Pages sites in their own repositories, each a
CNAME to `r-42-ai.github.io.`: `starstring.y7.ai` and `pony.y7.ai`.

Mail for this domain is Google Workspace. The `MX` (`smtp.google.com.`), the SPF
`TXT` (`v=spf1 include:_spf.google.com ~all`), `google._domainkey`, `_dmarc` and the
`google-site-verification` `TXT` are unrelated to the website and must be left alone.
