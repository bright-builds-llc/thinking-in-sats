import { A } from "@solidjs/router";

export function SiteHeader() {
  return (
    <header class="site-header">
      <div class="site-header__brand">
        <A class="site-header__title" href="/">
          Thinking In Sats
        </A>
        <p class="site-header__tagline">
          Learn everyday prices through satoshis first.
        </p>
      </div>

      <nav aria-label="Primary" class="site-header__nav">
        <A activeClass="site-header__link--active" class="site-header__link" href="/">
          Line
        </A>
        <A
          activeClass="site-header__link--active"
          class="site-header__link"
          href="/quiz"
        >
          Quiz
        </A>
      </nav>
    </header>
  );
}
