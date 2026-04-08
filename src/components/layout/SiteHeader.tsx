import { A } from "@solidjs/router";

export function SiteHeader() {
  return (
    <header class="site-header">
      <div class="brand-block">
        <A class="brand-title" href="/">
          Thinking In Sats
        </A>
        <p class="brand-subtitle">
          Learn everyday prices through satoshis first.
        </p>
      </div>

      <nav aria-label="Primary" class="site-nav">
        <A activeClass="nav-link--active" class="nav-link" href="/">
          Line
        </A>
        <A
          activeClass="nav-link--active"
          class="nav-link"
          href="/quiz"
        >
          Quiz
        </A>
      </nav>
    </header>
  );
}
