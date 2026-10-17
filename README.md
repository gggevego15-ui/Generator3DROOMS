# Generator3DROOMS

A browser-based room design studio with a dark studio workspace, preserved animated panels, a searchable procedural catalog, and a real-time Three.js WebGL editor. The browser build does not require Unity or a Unity license.

## Current real-time renderer
- Three.js WebGL with physically based standard/physical materials, PMREM studio environment reflections, tone mapping, hemisphere fill, directional sunlight, a window bounce light, and soft shadows.
- Procedural 1024px wood, plaster and rug textures; bump maps and bevelled furniture geometry.
- Live room dimensions and room-type/style presets, selectable furniture, selection outline, orbit camera, zoom, grid snapping, move/rotate/scale controls, duplicate and delete.
- Balanced, High and Ultra render quality presets.
- **GLB 3D scene export** packages the room geometry, placed furniture and supported materials/textures into `Generator3DROOMS-room.glb` for Blender and other GLB-compatible tools.
- **4K PNG export at 3840 × 2160** through the browser renderer. The export temporarily renders a 16:9 frame at 4K and then restores the interactive viewport. Actual export depends on the browser and GPU render-target limits; Intel UHD may take time or refuse 4K allocation.
- The existing studio UI and CSS animations are retained; the Unity scaffold remains in the repository for reference but is not required for this app.

## Free detailed 3D furniture library
The catalog includes a **Free 3D models** filter that loads CC0 GLB assets on demand from the public three.ws object-library API (its published library is sourced from Poly Haven). The app filters for furniture/interior-related entries, displays available thumbnails, and loads the selected GLB into the room with its original materials using Three.js GLTFLoader. Models are downloaded only when selected and added, not all at startup.

The live library requires an internet connection and the external API/CDN to be reachable from the user's browser. The UI labels these entries CC0 and displays a visible source credit, as required when using the live library API. If the remote API or a model URL is unavailable, the existing procedural catalog remains usable.

Source and licensing references: [three.ws object library documentation](https://github.com/nirholas/three.ws/blob/main/docs/object-library.md) · [Poly Haven API terms](https://polyhaven.com/our-api).

## Important realism limits
The room shell and built-in starter furniture are procedural meshes, while entries in **Free 3D models** are real external GLB assets. The exact number of live models depends on the remote library response and is not fixed at 1,000. The environment map is a studio reflection environment, not a path-traced representation of the actual room. The result is an editable 3D scene, not a photorealistic render guaranteed to match a photograph.

## Run locally
Serve the `web/` folder over HTTP, for example with VS Code Live Server or `python -m http.server 8080` from the repository root, then open `http://localhost:8080/web/`. Three.js and its addons load from esm.sh, so an internet connection is needed unless the library is later vendored locally.

## GitHub Actions
The workflow `Build Generator3DROOMS WebGL site` syntax-checks the browser modules, validates catalog invariants and the renderer/GLB/4K export entry points, packages the static site, and uploads a `Generator3DROOMS-WebGL` artifact. It does not invoke Unity and does not require a `UNITY_LICENSE` secret. Passing CI proves static checks and packaging only; it is not a live browser/GPU test.

GitHub Pages deployment is intentionally manual because this repository currently has no enabled Pages site. Enable it in **Settings → Pages → Build and deployment → Source: GitHub Actions**, then run the **Deploy web workspace to GitHub Pages** workflow.

## Catalog and assets
The catalog contains procedural entries across six categories. Variants are generated from base templates and finish/size labels; they are not separate licensed photorealistic model files. External models are loaded from the remote CC0 library when selected; the procedural count of 1,000 remains a count of variants, not a count of downloadable model files.
