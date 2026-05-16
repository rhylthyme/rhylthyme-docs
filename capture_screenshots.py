#!/usr/bin/env python3
"""Capture screenshots of the Rhylthyme web app for documentation."""

import time
from pathlib import Path
from playwright.sync_api import sync_playwright

BASE_URL = "https://www.rhylthyme.com"
OUT_DIR = Path(__file__).parent / "docs" / "assets" / "screenshots" / "web"
OUT_DIR.mkdir(parents=True, exist_ok=True)

VIEWPORT = {"width": 1400, "height": 900}


def capture_all():
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page(viewport=VIEWPORT)

        # 1. Homepage / Welcome screen
        page.goto(BASE_URL, wait_until="networkidle")
        time.sleep(2)
        page.screenshot(path=str(OUT_DIR / "homepage.png"))
        print("Captured: homepage.png")

        # 2. Load Breakfast Schedule example
        page.click("text=Breakfast Schedule")
        page.wait_for_timeout(3000)
        page.screenshot(path=str(OUT_DIR / "timeline-view.png"))
        print("Captured: timeline-view.png")

        # 3. Click DAG view icon (first icon in view toggle bar)
        view_icons = page.locator(".view-toggle-bar button, .view-toggle-bar .view-btn")
        if view_icons.count() > 0:
            view_icons.first.click()
            page.wait_for_timeout(2000)
        page.screenshot(path=str(OUT_DIR / "dag-view.png"))
        print("Captured: dag-view.png")

        # 4. Click itinerary view icon
        if view_icons.count() > 3:
            view_icons.nth(3).click()
            page.wait_for_timeout(2000)
        page.screenshot(path=str(OUT_DIR / "itinerary-view.png"))
        print("Captured: itinerary-view.png")

        # 5. Click editor icon
        if view_icons.count() > 4:
            view_icons.nth(4).click()
            page.wait_for_timeout(2000)
        page.screenshot(path=str(OUT_DIR / "editor-view.png"))
        print("Captured: editor-view.png")

        # 6. Click resources view
        if view_icons.count() > 2:
            view_icons.nth(2).click()
            page.wait_for_timeout(2000)
        page.screenshot(path=str(OUT_DIR / "resources-view.png"))
        print("Captured: resources-view.png")

        # 7. Show just timeline (reset to single view)
        if view_icons.count() > 1:
            # Click all off first, then only timeline
            for i in range(view_icons.count()):
                btn = view_icons.nth(i)
                if "active" in (btn.get_attribute("class") or ""):
                    btn.click()
                    page.wait_for_timeout(300)
            view_icons.nth(1).click()
            page.wait_for_timeout(2000)

        # 8. Start execution to show progress bar
        start_btn = page.locator("#start-btn")
        if start_btn.count() > 0:
            start_btn.click()
            page.wait_for_timeout(3000)
            page.screenshot(path=str(OUT_DIR / "execution-running.png"))
            print("Captured: execution-running.png")
            # Stop
            stop_btn = page.locator("#stop-btn")
            if stop_btn.count() > 0:
                stop_btn.click()
                page.wait_for_timeout(500)

        # 9. Chat panel - click to focus
        chat_input = page.locator("input[placeholder*='Plan'], textarea[placeholder*='Plan'], input[placeholder*='plan'], textarea[placeholder*='plan']")
        if chat_input.count() == 0:
            chat_input = page.locator("#chat-input, .chat-input input, .chat-input textarea")
        page.screenshot(path=str(OUT_DIR / "chat-panel.png"))
        print("Captured: chat-panel.png")

        # 10. Settings panel
        settings_btn = page.locator("#settings-btn, text=Settings")
        if settings_btn.count() > 0:
            settings_btn.first.click()
            page.wait_for_timeout(1000)
            page.screenshot(path=str(OUT_DIR / "settings-panel.png"))
            print("Captured: settings-panel.png")

        # 11. Load Academy Awards for a different example
        page.click("text=Academy Awards")
        page.wait_for_timeout(3000)
        page.screenshot(path=str(OUT_DIR / "academy-awards.png"))
        print("Captured: academy-awards.png")

        # 12. Mobile view
        page.set_viewport_size({"width": 390, "height": 844})
        page.goto(BASE_URL, wait_until="networkidle")
        time.sleep(2)
        page.screenshot(path=str(OUT_DIR / "mobile-home.png"))
        print("Captured: mobile-home.png")

        # Load example in mobile
        page.click("text=Breakfast Schedule")
        page.wait_for_timeout(3000)
        page.screenshot(path=str(OUT_DIR / "mobile-timeline.png"))
        print("Captured: mobile-timeline.png")

        browser.close()
        print(f"\nAll screenshots saved to {OUT_DIR}")


if __name__ == "__main__":
    capture_all()
