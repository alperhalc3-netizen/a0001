#!/usr/bin/env python3
"""Nabız — 2D open-map time+movement puzzle prototype."""

from __future__ import annotations

import math
import sys
from dataclasses import dataclass, field

import pygame


# --- Tuning -----------------------------------------------------------------
TILE = 40
SCREEN_W, SCREEN_H = 960, 540
FPS = 60
PLAYER_SPEED = 170.0
PLAYER_SIZE = 26
PULSE_PERIOD = 2.4  # seconds for a full open→closed cycle
SWITCH_HOLD = 2.8  # seconds gate stays open after switch

# Colors
COL_BG = (18, 22, 28)
COL_FLOOR = (36, 44, 56)
COL_WALL = (72, 84, 98)
COL_ACCENT = (90, 190, 170)
COL_DANGER = (210, 90, 90)
COL_PLAYER = (240, 220, 120)
COL_SIGIL = (120, 180, 255)
COL_EXIT_OFF = (60, 70, 80)
COL_EXIT_ON = (140, 230, 160)
COL_UI = (230, 235, 240)
COL_UI_DIM = (150, 160, 170)
COL_PULSE_BRIGHT = (255, 210, 90)
COL_PULSE_DIM = (70, 80, 90)
COL_SWITCH = (255, 160, 80)
COL_BRIDGE = (100, 140, 190)


@dataclass
class RectEntity:
    x: float
    y: float
    w: float
    h: float

    def rect(self) -> pygame.Rect:
        return pygame.Rect(int(self.x), int(self.y), int(self.w), int(self.h))


@dataclass
class Player(RectEntity):
    vx: float = 0.0
    vy: float = 0.0


@dataclass
class PulseGate:
    """Solid when pulse is in the closed half of the cycle."""
    body: RectEntity
    open_when_bright: bool = True

    def solid(self, pulse_t: float) -> bool:
        # pulse_t in [0,1); bright half = [0, 0.5)
        bright = pulse_t < 0.5
        open_now = bright if self.open_when_bright else not bright
        return not open_now


@dataclass
class SlidingBridge:
    """Platform that slides between A and B synced to pulse."""
    base: RectEntity
    travel: float  # pixels along X
    axis: str = "x"  # x or y

    def offset(self, pulse_t: float) -> float:
        # Smooth triangle 0→1→0 over the period
        t = pulse_t
        if t < 0.5:
            return (t / 0.5) * self.travel
        return (1.0 - (t - 0.5) / 0.5) * self.travel

    def world_rect(self, pulse_t: float) -> pygame.Rect:
        o = self.offset(pulse_t)
        if self.axis == "x":
            return pygame.Rect(
                int(self.base.x + o), int(self.base.y), int(self.base.w), int(self.base.h)
            )
        return pygame.Rect(
            int(self.base.x), int(self.base.y + o), int(self.base.w), int(self.base.h)
        )


@dataclass
class DelayedGate:
    body: RectEntity
    open_until: float = 0.0  # game time

    def solid(self, now: float) -> bool:
        return now >= self.open_until


@dataclass
class Switch:
    body: RectEntity
    gate_index: int
    cooldown_until: float = 0.0


@dataclass
class Sigil:
    body: RectEntity
    taken: bool = False
    label: str = ""


@dataclass
class World:
    walls: list[RectEntity] = field(default_factory=list)
    voids: list[RectEntity] = field(default_factory=list)  # deadly floor gaps
    pulse_gates: list[PulseGate] = field(default_factory=list)
    bridges: list[SlidingBridge] = field(default_factory=list)
    delayed_gates: list[DelayedGate] = field(default_factory=list)
    switches: list[Switch] = field(default_factory=list)
    sigils: list[Sigil] = field(default_factory=list)
    exit_portal: RectEntity = field(default_factory=lambda: RectEntity(0, 0, TILE, TILE))
    spawn: tuple[float, float] = (TILE * 2, TILE * 2)
    map_w: int = TILE * 36
    map_h: int = TILE * 22
    zone_labels: list[tuple[str, float, float]] = field(default_factory=list)


def build_world() -> World:
    """One continuous map: hub + three progressive puzzle spots."""
    W = World()
    tw, th = 36, 22
    W.map_w, W.map_h = tw * TILE, th * TILE

    # Outer walls + interior structure as rects (not a dense tile grid).
    # Border
    border = 20
    W.walls.extend(
        [
            RectEntity(0, 0, W.map_w, border),
            RectEntity(0, W.map_h - border, W.map_w, border),
            RectEntity(0, 0, border, W.map_h),
            RectEntity(W.map_w - border, 0, border, W.map_h),
        ]
    )

    # Soft ridges — leave multiple corridors so the map feels open/connected.
    # West ridge (hub → mid): openings north (~y 6) and mid (~y 10.5)
    W.walls.append(RectEntity(TILE * 8, border, TILE * 1.4, TILE * 4.2))
    W.walls.append(RectEntity(TILE * 8, TILE * 7.6, TILE * 1.4, TILE * 2.0))
    W.walls.append(RectEntity(TILE * 8, TILE * 12.2, TILE * 1.4, TILE * 3.5))
    # Middle ridge: openings mid and south-east approach
    W.walls.append(RectEntity(TILE * 14, border, TILE * 1.3, TILE * 3.2))
    W.walls.append(RectEntity(TILE * 14, TILE * 6.0, TILE * 1.3, TILE * 4.5))
    W.walls.append(RectEntity(TILE * 14, TILE * 13.5, TILE * 1.3, TILE * 5.5))
    # Far east ridge before exit chamber
    W.walls.append(RectEntity(TILE * 24, border, TILE * 1.3, TILE * 7.0))
    W.walls.append(RectEntity(TILE * 24, TILE * 12.5, TILE * 1.3, TILE * 6.5))
    # South pocket shelf for delayed-gate puzzle (gap in the middle as doorway)
    W.walls.append(RectEntity(TILE * 8, TILE * 16, TILE * 8.5, TILE * 1.2))
    W.walls.append(RectEntity(TILE * 19.5, TILE * 16, TILE * 8, TILE * 1.2))

    W.spawn = (TILE * 3.5, TILE * 10.5)
    W.exit_portal = RectEntity(TILE * 31.5, TILE * 10, TILE * 1.4, TILE * 1.4)

    # --- Spot 1: Öğretici Geçit (pulse gates in corridor east of hub) ------
    W.zone_labels.append(("1 · Öğretici Geçit", TILE * 9.5, TILE * 5.5))
    # Two staggered pulse gates in the north corridor path toward mid
    W.pulse_gates.append(
        PulseGate(RectEntity(TILE * 10.5, TILE * 5.5, TILE * 1.2, TILE * 2.2), open_when_bright=True)
    )
    W.pulse_gates.append(
        PulseGate(RectEntity(TILE * 12.2, TILE * 5.5, TILE * 1.2, TILE * 2.2), open_when_bright=False)
    )
    # Past both gates (clear of gate bodies)
    W.sigils.append(
        Sigil(RectEntity(TILE * 13.6, TILE * 6.2, 22, 22), label="İşaret 1")
    )

    # --- Spot 2: Kayan Köprü (void + sliding bridge) ----------------------
    W.zone_labels.append(("2 · Kayan Köprü", TILE * 16, TILE * 3))
    # Void pit in north-east mid area
    W.voids.append(RectEntity(TILE * 16, TILE * 3.5, TILE * 7, TILE * 4))
    # Walls framing the void so you approach from left/right ledges
    W.walls.append(RectEntity(TILE * 15.5, TILE * 3, TILE * 0.5, TILE * 5))
    W.walls.append(RectEntity(TILE * 23, TILE * 3, TILE * 0.5, TILE * 5))
    W.bridges.append(
        SlidingBridge(
            RectEntity(TILE * 16.2, TILE * 5, TILE * 2.2, TILE * 1.2),
            travel=TILE * 4.5,
            axis="x",
        )
    )
    W.sigils.append(
        Sigil(RectEntity(TILE * 21.5, TILE * 5.1, 22, 22), label="İşaret 2")
    )

    # --- Spot 3: Gecikmeli Kapı (switch race in south pocket) -------------
    W.zone_labels.append(("3 · Gecikmeli Kapı", TILE * 12, TILE * 18))
    W.switches.append(
        Switch(RectEntity(TILE * 10, TILE * 18.2, TILE * 1.1, TILE * 1.1), gate_index=0)
    )
    W.delayed_gates.append(
        DelayedGate(RectEntity(TILE * 17.5, TILE * 17.5, TILE * 1.3, TILE * 2.5))
    )
    W.sigils.append(
        Sigil(RectEntity(TILE * 20.5, TILE * 18.4, 22, 22), label="İşaret 3")
    )

    # Soft blockers so exit is east of everything but reachable after exploring
    # Decorative pillars in open mid space (don't block much)
    for px, py in ((TILE * 6, TILE * 4), (TILE * 5, TILE * 15), (TILE * 27, TILE * 6)):
        W.walls.append(RectEntity(px, py, TILE * 0.7, TILE * 0.7))

    return W


class Game:
    def __init__(self) -> None:
        pygame.init()
        pygame.display.set_caption("Nabız — prototip")
        self.screen = pygame.display.set_mode((SCREEN_W, SCREEN_H))
        self.clock = pygame.time.Clock()
        self.font = pygame.font.SysFont("dejavusans", 18)
        self.font_sm = pygame.font.SysFont("dejavusans", 14)
        self.font_lg = pygame.font.SysFont("dejavusans", 28, bold=True)
        self.world = build_world()
        self.player = Player(self.world.spawn[0], self.world.spawn[1], PLAYER_SIZE, PLAYER_SIZE)
        self.time = 0.0
        self.won = False
        self.message = ""
        self.message_t = 0.0

    def reset(self) -> None:
        self.world = build_world()
        self.player = Player(self.world.spawn[0], self.world.spawn[1], PLAYER_SIZE, PLAYER_SIZE)
        self.time = 0.0
        self.won = False
        self.message = "Yeniden başladı"
        self.message_t = 1.5

    def pulse_t(self) -> float:
        return (self.time % PULSE_PERIOD) / PULSE_PERIOD

    def pulse_bright(self) -> bool:
        return self.pulse_t() < 0.5

    def solid_rects(self) -> list[pygame.Rect]:
        rects = [w.rect() for w in self.world.walls]
        for g in self.world.pulse_gates:
            if g.solid(self.pulse_t()):
                rects.append(g.body.rect())
        for g in self.world.delayed_gates:
            if g.solid(self.time):
                rects.append(g.body.rect())
        return rects

    def on_bridge(self, r: pygame.Rect) -> bool:
        for b in self.world.bridges:
            if r.colliderect(b.world_rect(self.pulse_t()).inflate(-4, -4)):
                return True
        return False

    def in_void(self, r: pygame.Rect) -> bool:
        # Feet center sample — void only kills if not standing on a bridge
        if self.on_bridge(r):
            return False
        for v in self.world.voids:
            if r.colliderect(v.rect().inflate(-8, -8)):
                return True
        return False

    def try_move(self, dx: float, dy: float) -> None:
        p = self.player
        solids = self.solid_rects()

        # Move X
        p.x += dx
        pr = p.rect()
        for s in solids:
            if pr.colliderect(s):
                if dx > 0:
                    p.x = s.left - p.w
                elif dx < 0:
                    p.x = s.right
                pr = p.rect()

        # Move Y
        p.y += dy
        pr = p.rect()
        for s in solids:
            if pr.colliderect(s):
                if dy > 0:
                    p.y = s.top - p.h
                elif dy < 0:
                    p.y = s.bottom
                pr = p.rect()

        # Clamp to map
        p.x = max(0, min(p.x, self.world.map_w - p.w))
        p.y = max(0, min(p.y, self.world.map_h - p.h))

    def handle_interactions(self) -> None:
        pr = self.player.rect()

        # Switches
        for sw in self.world.switches:
            if pr.colliderect(sw.body.rect()) and self.time >= sw.cooldown_until:
                gate = self.world.delayed_gates[sw.gate_index]
                gate.open_until = self.time + SWITCH_HOLD
                sw.cooldown_until = self.time + 0.4
                self.message = "Kapı açıldı — acele et!"
                self.message_t = 1.2

        # Sigils
        for s in self.world.sigils:
            if not s.taken and pr.colliderect(s.body.rect()):
                s.taken = True
                left = sum(1 for x in self.world.sigils if not x.taken)
                self.message = f"{s.label} alındı · kalan {left}"
                self.message_t = 1.8

        # Exit
        if all(s.taken for s in self.world.sigils) and pr.colliderect(self.world.exit_portal.rect()):
            self.won = True

        # Void death → soft reset to spawn (keep collected sigils? for prototype reset sigils too on fall feels harsh — keep progress)
        if self.in_void(pr):
            self.player.x, self.player.y = self.world.spawn
            self.message = "Boşluğa düştün"
            self.message_t = 1.2

    def update(self, dt: float) -> None:
        if self.won:
            return
        self.time += dt
        if self.message_t > 0:
            self.message_t -= dt

        keys = pygame.key.get_pressed()
        mx = (1 if keys[pygame.K_d] or keys[pygame.K_RIGHT] else 0) - (
            1 if keys[pygame.K_a] or keys[pygame.K_LEFT] else 0
        )
        my = (1 if keys[pygame.K_s] or keys[pygame.K_DOWN] else 0) - (
            1 if keys[pygame.K_w] or keys[pygame.K_UP] else 0
        )
        if mx or my:
            length = math.hypot(mx, my)
            mx, my = mx / length, my / length
            self.try_move(mx * PLAYER_SPEED * dt, my * PLAYER_SPEED * dt)

        # Carry player with bridge if overlapping
        for b in self.world.bridges:
            br = b.world_rect(self.pulse_t())
            if self.player.rect().colliderect(br.inflate(2, 2)):
                # Approximate carry: recompute offset delta over dt
                t0 = ((self.time - dt) % PULSE_PERIOD) / PULSE_PERIOD
                t1 = self.pulse_t()
                if b.axis == "x":
                    self.try_move(b.offset(t1) - b.offset(t0), 0)
                else:
                    self.try_move(0, b.offset(t1) - b.offset(t0))

        self.handle_interactions()

    def camera(self) -> tuple[int, int]:
        cx = int(self.player.x + self.player.w / 2 - SCREEN_W / 2)
        cy = int(self.player.y + self.player.h / 2 - SCREEN_H / 2)
        cx = max(0, min(cx, self.world.map_w - SCREEN_W))
        cy = max(0, min(cy, self.world.map_h - SCREEN_H))
        return cx, cy

    def draw_world(self, cam: tuple[int, int]) -> None:
        ox, oy = cam
        # Floor
        self.screen.fill(COL_BG)
        floor = pygame.Rect(-ox, -oy, self.world.map_w, self.world.map_h)
        pygame.draw.rect(self.screen, COL_FLOOR, floor)

        # Soft grid for open-world sense of scale
        for x in range(0, self.world.map_w, TILE):
            pygame.draw.line(
                self.screen, (42, 50, 62), (x - ox, -oy), (x - ox, self.world.map_h - oy), 1
            )
        for y in range(0, self.world.map_h, TILE):
            pygame.draw.line(
                self.screen, (42, 50, 62), (-ox, y - oy), (self.world.map_w - ox, y - oy), 1
            )

        # Voids
        for v in self.world.voids:
            r = v.rect().move(-ox, -oy)
            pygame.draw.rect(self.screen, (12, 14, 18), r)
            pygame.draw.rect(self.screen, COL_DANGER, r, 2)

        # Bridges
        for b in self.world.bridges:
            r = b.world_rect(self.pulse_t()).move(-ox, -oy)
            pygame.draw.rect(self.screen, COL_BRIDGE, r, border_radius=6)
            pygame.draw.rect(self.screen, COL_ACCENT, r, 2, border_radius=6)

        # Walls
        for w in self.world.walls:
            pygame.draw.rect(self.screen, COL_WALL, w.rect().move(-ox, -oy), border_radius=3)

        # Pulse gates
        for g in self.world.pulse_gates:
            r = g.body.rect().move(-ox, -oy)
            solid = g.solid(self.pulse_t())
            col = COL_DANGER if solid else COL_ACCENT
            fill = (COL_DANGER[0] // 2, COL_DANGER[1] // 2, COL_DANGER[2] // 2) if solid else (40, 80, 70)
            pygame.draw.rect(self.screen, fill, r, border_radius=4)
            pygame.draw.rect(self.screen, col, r, 3, border_radius=4)

        # Delayed gates
        for g in self.world.delayed_gates:
            r = g.body.rect().move(-ox, -oy)
            solid = g.solid(self.time)
            fill = (90, 50, 40) if solid else (40, 70, 50)
            pygame.draw.rect(self.screen, fill, r, border_radius=4)
            pygame.draw.rect(self.screen, COL_SWITCH if solid else COL_EXIT_ON, r, 3, border_radius=4)

        # Switches
        for sw in self.world.switches:
            r = sw.body.rect().move(-ox, -oy)
            pygame.draw.rect(self.screen, COL_SWITCH, r, border_radius=8)
            label = self.font_sm.render("Düğme", True, COL_BG)
            self.screen.blit(label, (r.centerx - label.get_width() // 2, r.bottom + 2))

        # Sigils
        for s in self.world.sigils:
            if s.taken:
                continue
            r = s.body.rect().move(-ox, -oy)
            pygame.draw.polygon(
                self.screen,
                COL_SIGIL,
                [
                    (r.centerx, r.top),
                    (r.right, r.centery),
                    (r.centerx, r.bottom),
                    (r.left, r.centery),
                ],
            )

        # Exit
        er = self.world.exit_portal.rect().move(-ox, -oy)
        ready = all(s.taken for s in self.world.sigils)
        pygame.draw.rect(self.screen, COL_EXIT_ON if ready else COL_EXIT_OFF, er, border_radius=10)
        pygame.draw.rect(self.screen, COL_ACCENT if ready else COL_UI_DIM, er, 2, border_radius=10)
        el = self.font_sm.render("Çıkış" if ready else "Kilitli", True, COL_UI)
        self.screen.blit(el, (er.centerx - el.get_width() // 2, er.bottom + 4))

        # Zone labels
        for text, x, y in self.world.zone_labels:
            t = self.font_sm.render(text, True, COL_UI_DIM)
            self.screen.blit(t, (x - ox, y - oy))

        # Player
        pr = self.player.rect().move(-ox, -oy)
        pygame.draw.rect(self.screen, COL_PLAYER, pr, border_radius=6)
        pygame.draw.rect(self.screen, COL_UI, pr, 2, border_radius=6)

    def draw_ui(self) -> None:
        # Pulse meter
        meter_w, meter_h = 180, 14
        mx, my = 24, 20
        pygame.draw.rect(self.screen, COL_PULSE_DIM, (mx, my, meter_w, meter_h), border_radius=7)
        fill_w = int(meter_w * (1.0 - abs(self.pulse_t() * 2 - 1)))  # peak at bright mid
        # Better: show position in cycle
        fill_w = int(meter_w * self.pulse_t())
        col = COL_PULSE_BRIGHT if self.pulse_bright() else COL_ACCENT
        pygame.draw.rect(self.screen, col, (mx, my, max(6, fill_w), meter_h), border_radius=7)
        pygame.draw.rect(self.screen, COL_UI_DIM, (mx, my, meter_w, meter_h), 1, border_radius=7)
        label = self.font_sm.render(
            "Nabız · AÇIK" if self.pulse_bright() else "Nabız · KAPALI", True, COL_UI
        )
        self.screen.blit(label, (mx, my + 18))

        taken = sum(1 for s in self.world.sigils if s.taken)
        total = len(self.world.sigils)
        sig = self.font.render(f"İşaretler {taken}/{total}", True, COL_UI)
        self.screen.blit(sig, (SCREEN_W - sig.get_width() - 24, 20))

        help_l = self.font_sm.render("WASD hareket · R yeniden · Esc çıkış", True, COL_UI_DIM)
        self.screen.blit(help_l, (24, SCREEN_H - 28))

        if self.message_t > 0 and self.message:
            m = self.font.render(self.message, True, COL_PULSE_BRIGHT)
            self.screen.blit(m, (SCREEN_W // 2 - m.get_width() // 2, 48))

        if self.won:
            overlay = pygame.Surface((SCREEN_W, SCREEN_H), pygame.SRCALPHA)
            overlay.fill((10, 14, 20, 180))
            self.screen.blit(overlay, (0, 0))
            title = self.font_lg.render("Bölge tamamlandı", True, COL_EXIT_ON)
            sub = self.font.render("R ile yeniden dene · Esc ile çık", True, COL_UI)
            self.screen.blit(title, (SCREEN_W // 2 - title.get_width() // 2, SCREEN_H // 2 - 30))
            self.screen.blit(sub, (SCREEN_W // 2 - sub.get_width() // 2, SCREEN_H // 2 + 10))

    def run(self) -> None:
        running = True
        while running:
            dt = self.clock.tick(FPS) / 1000.0
            for event in pygame.event.get():
                if event.type == pygame.QUIT:
                    running = False
                elif event.type == pygame.KEYDOWN:
                    if event.key == pygame.K_ESCAPE:
                        running = False
                    elif event.key == pygame.K_r:
                        self.reset()

            self.update(dt)
            self.draw_world(self.camera())
            self.draw_ui()
            pygame.display.flip()

        pygame.quit()


def main() -> None:
    try:
        Game().run()
    except pygame.error as exc:
        print(f"Pygame error: {exc}", file=sys.stderr)
        sys.exit(1)


if __name__ == "__main__":
    main()
