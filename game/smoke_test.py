#!/usr/bin/env python3
"""Logic smoke test: pulse solids, sigil pickup, switch gate, win — no pathfinding."""

from __future__ import annotations

import os
import sys

import pygame

sys.path.insert(0, os.path.dirname(__file__))
from main import SWITCH_HOLD, Game  # noqa: E402


def main() -> None:
    os.environ.setdefault("SDL_AUDIODRIVER", "dummy")
    os.environ.setdefault("SDL_VIDEODRIVER", "x11")

    g = Game()

    # Pulse gates flip solidity across halves
    g.time = 0.1 * 2.4  # bright
    assert g.pulse_bright()
    assert g.world.pulse_gates[0].solid(g.pulse_t()) is False
    assert g.world.pulse_gates[1].solid(g.pulse_t()) is True
    g.time = 0.7 * 2.4  # dim
    assert not g.pulse_bright()
    assert g.world.pulse_gates[0].solid(g.pulse_t()) is True
    assert g.world.pulse_gates[1].solid(g.pulse_t()) is False

    # Collect all sigils by standing on them
    for s in g.world.sigils:
        g.player.x = s.body.x
        g.player.y = s.body.y
        g.handle_interactions()
        assert s.taken, "sigil should be taken"
    assert all(s.taken for s in g.world.sigils)

    # Delayed gate opens on switch
    sw = g.world.switches[0]
    gate = g.world.delayed_gates[0]
    assert gate.solid(g.time)
    g.player.x, g.player.y = sw.body.x, sw.body.y
    g.handle_interactions()
    assert not gate.solid(g.time)
    g.time += SWITCH_HOLD + 0.1
    assert gate.solid(g.time)

    # Win at exit with all sigils
    g.time = 10.0
    # re-open nothing needed
    for s in g.world.sigils:
        s.taken = True
    er = g.world.exit_portal
    g.player.x, g.player.y = er.x, er.y
    g.handle_interactions()
    assert g.won, "should win on exit with all sigils"

    # Draw a proof frame
    out = sys.argv[1] if len(sys.argv) > 1 else "/tmp"
    os.makedirs(out, exist_ok=True)
    g.draw_world(g.camera())
    g.draw_ui()
    pygame.display.flip()
    path = os.path.join(out, "nabiz-win.png")
    pygame.image.save(g.screen, path)
    pygame.quit()
    print("SMOKE OK", path)


if __name__ == "__main__":
    main()
