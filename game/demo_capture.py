#!/usr/bin/env python3
"""Headless-friendly capture: run a few scripted seconds and save PNGs."""

from __future__ import annotations

import os
import sys

import pygame

# Ensure we can import main from same dir
sys.path.insert(0, os.path.dirname(__file__))
from main import Game, SCREEN_H, SCREEN_W  # noqa: E402


def main() -> None:
    out_dir = sys.argv[1] if len(sys.argv) > 1 else "."
    os.makedirs(out_dir, exist_ok=True)

    os.environ.setdefault("SDL_AUDIODRIVER", "dummy")

    g = Game()
    shots = []

    # Scripted tour: walk toward pulse gates, then south, then east
    script = [
        # (duration_sec, keys held)
        (0.3, set()),
        (1.4, {pygame.K_w}),
        (0.2, set()),
        (1.8, {pygame.K_d}),
        (0.8, {pygame.K_w, pygame.K_d}),
        (1.2, {pygame.K_d}),
        (1.0, {pygame.K_s}),
        (1.5, {pygame.K_a}),
        (1.0, {pygame.K_s}),
        (1.5, {pygame.K_d}),
        (0.5, set()),
    ]

    class FakeKeys:
        def __init__(self) -> None:
            self.held: set[int] = set()

        def __getitem__(self, key: int) -> bool:
            return key in self.held

    fake = FakeKeys()
    original = pygame.key.get_pressed

    def patched() -> FakeKeys:
        return fake

    pygame.key.get_pressed = patched  # type: ignore[assignment]

    t = 0.0
    frame = 0
    dt = 1 / 60
    capture_at = {0.4, 2.0, 4.5, 7.5, 9.5}
    captured: set[float] = set()

    for duration, keys in script:
        fake.held = keys
        end = t + duration
        while t < end:
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    break
            g.update(dt)
            g.draw_world(g.camera())
            g.draw_ui()
            pygame.display.flip()
            t += dt
            frame += 1
            for mark in capture_at:
                if mark not in captured and t >= mark:
                    path = os.path.join(out_dir, f"nabiz-frame-{len(captured)+1:02d}.png")
                    pygame.image.save(g.screen, path)
                    shots.append(path)
                    captured.add(mark)

    # Final overview shot from a forced camera-friendly position
    path = os.path.join(out_dir, "nabiz-hub.png")
    pygame.image.save(g.screen, path)
    shots.append(path)

    pygame.key.get_pressed = original
    pygame.quit()
    print("Wrote:")
    for s in shots:
        print(s)


if __name__ == "__main__":
    main()
