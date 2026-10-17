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
The catalog includes a **Free 3D models** filter backed by the public Poly Haven API. It filters furniture/decor/interior assets whose source metadata confirms at least 4096px texture resolution, displays thumbnails, and requests the exact 4K glTF variant only when a model is added. Texture dependencies are resolved from the API file manifest. A room collection selector filters the catalogue for living rooms, bedrooms, offices, kitchens, dining rooms, bathrooms, kids rooms, entryways and laundry rooms. The live library count is source-driven; it does not contain 1,000 unique 4K models, so the app does not claim that it does.

The live library requires an internet connection and the external API/CDN to be reachable from the user's browser. Poly Haven assets are CC0 and the interface displays a visible source credit as requested by the live API terms. If the API or a model URL is unavailable, the procedural catalog remains usable.

Source and licensing references: [Poly Haven public API](https://polyhaven.com/our-api) · [Poly Haven model standards](https://docs.polyhaven.com/en/technical-standards/models).

## Important realism limits
The room shell and built-in starter furniture are procedural meshes, while entries in **Free 3D models** are real external GLB assets. The exact number of live models depends on the remote library response and is not fixed at 1,000. The environment map is a studio reflection environment, not a path-traced representation of the actual room. The result is an editable 3D scene, not a photorealistic render guaranteed to match a photograph.

## Run locally
Serve the `web/` folder over HTTP, for example with VS Code Live Server or `python -m http.server 8080` from the repository root, then open `http://localhost:8080/web/`. Three.js and its addons load from esm.sh, so an internet connection is needed unless the library is later vendored locally.

## GitHub Actions
The workflow `Build Generator3DROOMS WebGL site` syntax-checks the browser modules, validates catalog invariants and the renderer/GLB/4K export entry points, packages the static site, and uploads a `Generator3DROOMS-WebGL` artifact. It does not invoke Unity and does not require a `UNITY_LICENSE` secret. Passing CI proves static checks and packaging only; it is not a live browser/GPU test.

GitHub Pages deployment is intentionally manual because this repository currently has no enabled Pages site. Enable it in **Settings → Pages → Build and deployment → Source: GitHub Actions**, then run the **Deploy web workspace to GitHub Pages** workflow.

## Catalog and assets
The catalog contains procedural entries across six categories. Variants are generated from base templates and finish/size labels; they are not separate licensed photorealistic model files. External models are loaded from the remote CC0 library when selected; the procedural count of 1,000 remains a count of variants, not a count of downloadable model files.


## Launching locally on Windows
Do not double-click `web/index.html` directly. The Three.js ES modules and live model API need an HTTP origin. Run `Run-Generator3DROOMS.bat` from the repository root; it starts a local Python HTTP server on an available port and opens `/web/` in your browser. Keep the console window open while using the studio. The live 4K library requires internet access.
