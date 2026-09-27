"""Build web-ready clips for the homepage "Citiply Studio" section.

Raw exports live in video-source/studio/ (git-ignored). Every entry in MANIFEST
below becomes public/videos/studio/<out>.mp4 plus a <out>.jpg poster:

  - "highlights": N short moments sampled across a long video, cut together
    into one muted loop (used for the featured podcast/vlog player).
  - "loop": LOOP_SECONDS from `start` (default 0) as a muted loop (shorts and reels).

All outputs are silent (browsers only autoplay muted video) — the full
versions play on YouTube / Instagram.

Usage:
    python scripts/optimize-studio-videos.py            # build missing outputs
    python scripts/optimize-studio-videos.py --force    # rebuild everything
    python scripts/optimize-studio-videos.py reel-x     # rebuild one entry by name
"""

import argparse
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SOURCE_DIR = ROOT / "video-source" / "studio"
OUT_DIR = ROOT / "public" / "videos" / "studio"

MANIFEST = [
    {
        "out": "reflect-and-design-ep1",
        "src": "yt/Ep. 1 - The Way of TAO_ Architecture That Heals, Inspires & Connects _ Manish Banker_720p.mp4",
        "mode": "highlights",
        # Seconds into the episode — hand-picked from a contact sheet (intro, B-roll, guest, host).
        "moments": [3, 20, 60, 125, 240, 420, 780, 960, 1320, 1500, 1860, 2040],
        "clip": 3.5,
        "poster_at": 5,
    },
    {"out": "short-ai-digest-exhibition", "src": "yt/CITIPLY at A&I Digest Design Exhibition 2025_720p.mp4", "mode": "loop"},
    {"out": "short-pune-showroom", "src": "yt/Citiply experience at our Pune showroom!_720p.mp4", "mode": "loop"},
    {"out": "short-veneer-factory", "src": "yt/Inside Natural Veneers Factory _ Citiply Pune Visits Our Manufacturing Facility_1080p.mp4", "mode": "loop", "start": 20, "poster_at": 24},
    {"out": "reel-showroom-tour", "src": "insta/citi.ply_DVU6xI0kgRx.mp4", "mode": "loop"},
    {"out": "reel-texture-is-design", "src": "insta/citi.ply_DV-va0gDA4e.mp4", "mode": "loop", "poster_at": 6},
    {"out": "reel-joshi-buildcon", "src": "insta/citi.ply_DWGlkufEm6I.mp4", "mode": "loop", "poster_at": 3},
    {"out": "reel-just-a-showroom", "src": "insta/citi.ply_DWOJPuGjK9b.mp4", "mode": "loop", "poster_at": 10},
    {"out": "reel-more-than-a-surface", "src": "insta/Video-82306.mp4", "mode": "loop"},
]

# Landscape stays at up to 1280x720; portrait cards render ~200-260px wide, so 540x960
# is already sharp on 2x screens while keeping 8 simultaneous loops light.
LANDSCAPE_SCALE = "scale='min(1280,iw)':-2:flags=lanczos"
PORTRAIT_SCALE = "scale='min(540,iw)':-2:flags=lanczos"
LOOP_SECONDS = 15

# x264 "slow" + CRF gives the best quality per byte; maxrate caps spikes so a
# re-encode never balloons past the (already compressed) source.
X264 = ["-c:v", "libx264", "-preset", "slow", "-profile:v", "high", "-pix_fmt", "yuv420p", "-movflags", "+faststart", "-an"]


def ffmpeg(*args: str) -> None:
    result = subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *args], capture_output=True, text=True)
    if result.returncode != 0:
        sys.stderr.write(result.stderr[-2000:])
        raise SystemExit("ffmpeg failed")


def probe_is_portrait(src: Path) -> bool:
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height", "-of", "csv=p=0", str(src)],
        capture_output=True, text=True, check=True,
    ).stdout.strip()
    width, height = (int(v) for v in out.split(",")[:2])
    return height > width


def build_highlights(entry: dict, src: Path, video_out: Path) -> None:
    clip = entry["clip"]
    fade = 0.25
    with tempfile.TemporaryDirectory() as tmp:
        parts = []
        # Cut each moment separately (fast seek), with a short dip to black so the joins feel intentional.
        for index, start in enumerate(entry["moments"]):
            part = Path(tmp) / f"part{index:02d}.mp4"
            ffmpeg(
                "-ss", str(start), "-i", str(src), "-t", str(clip),
                "-vf", f"{LANDSCAPE_SCALE},fps=30,fade=t=in:st=0:d={fade},fade=t=out:st={clip - fade}:d={fade}",
                "-c:v", "libx264", "-preset", "slow", "-crf", "16", "-pix_fmt", "yuv420p", "-an",
                str(part),
            )
            parts.append(part)
        concat_list = Path(tmp) / "list.txt"
        concat_list.write_text("".join(f"file '{p.as_posix()}'\n" for p in parts), encoding="utf-8")
        ffmpeg(
            "-f", "concat", "-safe", "0", "-i", str(concat_list),
            *X264, "-crf", "21", "-maxrate", "2M", "-bufsize", "4M", "-tune", "film",
            str(video_out),
        )


def build_loop(src: Path, video_out: Path, portrait: bool, start: float) -> None:
    ffmpeg(
        "-ss", str(start), "-i", str(src), "-t", str(LOOP_SECONDS),
        "-vf", f"{PORTRAIT_SCALE if portrait else LANDSCAPE_SCALE},fps=30",
        *X264, "-crf", "22", "-maxrate", "1.5M" if portrait else "2.5M", "-bufsize", "3M",
        str(video_out),
    )


def build(entry: dict, force: bool) -> None:
    src = SOURCE_DIR / entry["src"]
    if not src.exists():
        print(f"miss  {entry['out']}: {src.relative_to(ROOT)} not found")
        return

    video_out = OUT_DIR / f"{entry['out']}.mp4"
    poster_out = OUT_DIR / f"{entry['out']}.jpg"
    if video_out.exists() and poster_out.exists() and not force:
        print(f"skip  {entry['out']} (already built)")
        return

    portrait = probe_is_portrait(src)
    if entry["mode"] == "highlights":
        build_highlights(entry, src, video_out)
    else:
        build_loop(src, video_out, portrait, entry.get("start", 0))

    ffmpeg(
        "-ss", str(entry.get("poster_at", 1)), "-i", str(src), "-frames:v", "1",
        "-vf", PORTRAIT_SCALE if portrait else LANDSCAPE_SCALE, "-q:v", "3",
        str(poster_out),
    )

    before = src.stat().st_size / 1_048_576
    after = video_out.stat().st_size / 1_048_576
    print(f"done  {entry['out']}: {before:.1f} MB source -> {after:.2f} MB")


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("names", nargs="*", help="only build these manifest entries")
    parser.add_argument("--force", action="store_true", help="rebuild even if outputs exist")
    args = parser.parse_args()

    if not shutil.which("ffmpeg") or not shutil.which("ffprobe"):
        raise SystemExit("ffmpeg/ffprobe not found on PATH")

    entries = [e for e in MANIFEST if not args.names or e["out"] in args.names]
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    for entry in entries:
        build(entry, args.force or bool(args.names))


if __name__ == "__main__":
    main()
