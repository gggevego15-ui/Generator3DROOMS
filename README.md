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

## Unity project and WebGL build
- The Unity project root is `UnityProject/`; it includes the Unity version pin, package manifest, starter scene, build settings, and an Editor build entry point.
- Open `UnityProject/` in Unity **2022.3.62f1 LTS** with **WebGL Build Support** installed.
- The scene is `Assets/Scenes/Generator3DROOMS.unity`. The runtime bootstrap creates the room, camera, lighting, and procedural objects.
- GitHub Actions has a manual workflow at **Actions → Build Generator3DROOMS WebGL → Run workflow**. Before running it, add a valid Unity license file as the repository Actions secret named `UNITY_LICENSE`. Do not commit the license file or place it in the repository.
- The workflow verifies `Build.loader.js`, `Build.data`, `Build.framework.js`, and `Build.wasm`, then uploads a `Generator3DROOMS-WebGL` artifact. Static validation is not a Unity build.
- Serve `web/` over HTTP (not by opening `index.html` directly). The Unity bridge expects `web/Build/Build.loader.js`.
- Unity compilation, browser interaction, and GPU performance remain unverified until the Unity WebGL workflow succeeds and the result is tested in a browser.

## Asset policy
Do not bundle downloaded models without checking their individual licenses. Prefer CC0 or clearly compatible free licenses and retain attribution/author/license/source metadata. Procedural primitives are used for the initial prototype. `scripts/validate-catalog.cjs` checks the catalog category totals and variant setup in CI. The existing web design and animations are preserved; Unity WebGL output is generated as a CI artifact and is not committed to source control.
