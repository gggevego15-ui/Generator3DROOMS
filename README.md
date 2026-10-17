# Generator3DROOMS

A browser-based room design studio with a Rentier-inspired workspace and a Unity WebGL 3D editor.

## Product direction
- Browser application with a canvas-first layout.
- Unity WebGL for the interactive 3D scene.
- Manual placement and procedural room furnishing.
- A searchable catalog of 1,000 procedural entries generated from 50 base object templates × 20 finish/size combinations; these are not 1,000 separate photorealistic model files.
- Free assets only, with license metadata recorded per imported asset.
- Lightweight quality presets for integrated GPUs and memory-constrained PCs.

## Architecture
- `web/`: browser shell and workspace UI.
- `UnityProject/Assets/Scripts/`: runtime room generation and placement scripts.
- `web/Build/`: destination for a Unity WebGL build (generated locally by Unity; build output is not committed).

## Current status
This is an early prototype, not a finished renderer. The web shell has an interactive workspace UI and an illustrative CSS room preview. The catalog currently generates 1,000 entries across furniture, lighting, decor, plants, architecture, and appliances. These entries use procedural placeholder geometry/material variations; imported licensed model assets are not included yet. Multi-part procedural items such as sofas, chairs, plants, beds, cabinets, and bathroom fixtures are grouped under one movable parent object. A built Unity WebGL player must be placed in `web/Build/` to enable real-time 3D rendering and placement.

## Build outline
1. Open or create a Unity project in a compatible Unity LTS editor with WebGL Build Support installed.
2. Create a scene containing a camera, lighting, and a GameObject with the room-generation scripts.
3. Build for WebGL into `web/Build`.
4. Serve `web/` over HTTP (not by opening index.html directly); configure Unity's loader paths in the web shell.
5. Test on target browsers and integrated graphics before publishing.

## Asset policy
Do not bundle downloaded models without checking their individual licenses. Prefer CC0 or clearly compatible free licenses and retain attribution/author/license/source metadata. Procedural primitives are used for the initial prototype. `scripts/validate-catalog.cjs` checks the catalog category totals and variant setup in CI.
