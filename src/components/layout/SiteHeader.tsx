import * as DropdownMenu from "@kobalte/core/dropdown-menu";
import { A, useLocation } from "@solidjs/router";

import { MysticGradientText } from "../mystic/MysticVisual";

export function SiteHeader() {
  const location = useLocation();
  const isActiveRoute = (path: string) => location.pathname === path;
  const menuItemClass = (path: string) =>
    isActiveRoute(path)
      ? "site-menu-item site-menu-item--active"
      : "site-menu-item";
  const maybeAriaCurrent = (path: string) =>
    isActiveRoute(path) ? "page" : undefined;

  return (
    <header class="site-header" data-lightning-gesture-region="header">
      <div class="brand-block">
        <A class="brand-title" href="/">
          <MysticGradientText>Thinking In Sats</MysticGradientText>
        </A>
        <p class="brand-subtitle">
          Learn everyday prices through satoshis first.
        </p>
      </div>

      <DropdownMenu.Root gutter={10} placement="bottom-end">
        <DropdownMenu.Trigger class="site-menu-trigger">
          <span aria-hidden="true" class="site-menu-trigger__icon">
            <span />
            <span />
            <span />
          </span>
          <span>Menu</span>
        </DropdownMenu.Trigger>
        <DropdownMenu.Portal>
          <DropdownMenu.Content class="site-menu-content">
            <DropdownMenu.Item
              activeClass=""
              aria-current={maybeAriaCurrent("/")}
              as={A}
              class={menuItemClass("/")}
              end
              href="/#timeline"
              inactiveClass=""
            >
              Line
            </DropdownMenu.Item>
            <DropdownMenu.Item
              activeClass=""
              aria-current={maybeAriaCurrent("/quiz")}
              as={A}
              class={menuItemClass("/quiz")}
              href="/quiz"
              inactiveClass=""
            >
              Quiz
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu.Portal>
      </DropdownMenu.Root>
    </header>
  );
}
