# Generator3DROOMS

A browser-based room design studio with a dark studio workspace, preserved animated panels, a searchable procedural catalog, and a real-time Three.js WebGL editor. The browser build does not require Unity or a Unity license.

## Current real-time renderer
- Three.js WebGL with physically based standard/physical materials, PMREM studio environment reflections, tone mapping, hemisphere fill, directional sunlight, a window bounce light, and soft shadows.
- Procedural 1024px wood, plaster and rug textures; bump maps and bevelled furniture geometry.
- Live room dimensions and room-type/style presets, selectable furniture, selection outline, orbit camera, zoom, grid snapping, move/rotate/scale controls, duplicate and delete.
- Balanced, High and Ultra render quality presets.
- **4K PNG export at 3840 × 2160** through the browser renderer. The export temporarily renders a 16:9 frame at 4K and then restores the interactive viewport. Actual export depends on the browser and GPU render-target limits; Intel UHD may take time or refuse 4K allocation.
- The existing studio UI and CSS animations are retained; the Unity scaffold remains in the repository for reference but is not required for this app.

## Important realism limits
The current scene is still a procedural mesh scene, not a photogrammetry renderer. The furniture models are generated from geometry and textures rather than a curated library of scanned, highly detailed assets. The environment map is a studio reflection environment, not a path-traced representation of the actual room. These improvements increase visual quality, but they do not make the result indistinguishable from a photograph.

## Run locally
Serve the `web/` folder over HTTP, for example with VS Code Live Server or `python -m http.server 8080` from the repository root, then open `http://localhost:8080/web/`. Three.js and its addons load from esm.sh, so an internet connection is needed unless the library is later vendored locally.

## GitHub Actions
The workflow `Build Generator3DROOMS WebGL site` syntax-checks the browser modules, validates catalog invariants and the renderer/4K entry points, packages the static site, and uploads a `Generator3DROOMS-WebGL` artifact. It does not invoke Unity and does not require a `UNITY_LICENSE` secret. Passing CI proves static checks and packaging only; it is not a live browser/GPU test.\n\nGitHub Pages deployment is intentionally manual because this repository currently has no enabled Pages site. Enable it in **Settings → Pages → Build and deployment → Source: GitHub Actions**, then run the **Deploy web workspace to GitHub Pages** workflow.

## Catalog and assets
The catalog contains procedural entries across six categories. Variants are generated from base templates and finish/size labels; they are not separate licensed photorealistic model files. External models can be added later after verifying their individual licenses and retaining attribution.
