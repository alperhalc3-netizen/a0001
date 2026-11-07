# Nabız — playable prototype

2D desktop prototype: one continuous open-feeling map with **time + movement** puzzles (shared world pulse). Turkish UI labels.

## Mechanic
**Nabız (Pulse)** — paths and gates sync to a visible world clock. Explore freely; three progressive puzzle spots live in the same map:

1. **Öğretici Geçit** — staggered pulse gates  
2. **Kayan Köprü** — sliding bridge over a void  
3. **Gecikmeli Kapı** — hit a switch, race through before it closes  

Collect all **işaret** sigils, then enter **Çıkış**.

## Controls
| Key | Action |
|-----|--------|
| WASD / Arrows | Move |
| R | Restart |
| Esc | Quit |

## Requirements
- Python 3.10+  
- pygame 2.5+

Works on **Windows**, **macOS**, and Linux (same source).

## Run

```bash
cd game
python3 -m pip install -r requirements.txt
python3 main.py
```

### Windows
```bat
cd game
py -3 -m pip install -r requirements.txt
py -3 main.py
```

### macOS
```bash
cd game
python3 -m pip install -r requirements.txt
python3 main.py
```
If pygame fails to open a window on Apple Silicon, use a recent python.org or Homebrew Python 3 build.

## Scope
Prototype only — placeholder art, no packaging/installer yet. Optional later: PyInstaller for `.exe` / `.app`.
