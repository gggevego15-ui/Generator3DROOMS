# Generator3DROOMS

A browser-based room design studio with a dark studio workspace, animated panels, a searchable procedural catalog, and a real-time Three.js WebGL room editor.

## Architecture
- `web/`: the browser application, including the preserved workspace design and CSS animations.
- `web/three-scene.js`: real-time 3D renderer, room shell, physically based materials, procedural furniture, orbit camera, selection, moving and rotation.
- `web/Build/`: not required. The scene runs directly in the browser with Three.js; there is no Unity license requirement.
- `UnityProject/`: earlier experimental Unity scaffold retained in the repository, but not used by the browser app or current CI build.

## Real-time 3D
The browser scene uses Three.js and WebGL. It includes textured wood and plaster surfaces, glass, furniture, a plant, directional daylight, hemisphere fill, tone mapping, soft shadows, orbit controls, selectable furniture, drag-to-move and rotate modes, room dimensions, light controls, and room-type presets. Materials and geometry are generated procedurally; this is not yet a photogrammetry-based renderer and does not ship a library of photorealistic external furniture models.

## Run locally
Serve the `web/` folder over HTTP, for example with VS Code Live Server or `python -m http.server 8080` from the repository root, then open `http://localhost:8080/web/`. The app loads Three.js from jsDelivr, so an internet connection is needed unless the library is later vendored locally.

## GitHub Actions
The workflow `Build Generator3DROOMS WebGL site` checks JavaScript and catalog invariants, packages the static browser app, and uploads a `Generator3DROOMS-WebGL` artifact. It does not invoke Unity and does not require a `UNITY_LICENSE` secret. Static validation is not a substitute for a live browser/GPU smoke test.

## Catalog and assets
The catalog contains 1,000 procedural entries across six categories. Variants are generated from base templates and finish/size labels; they are not 1,000 separate licensed photorealistic model files. The current 3D objects are procedural meshes. External models can be added later after verifying their individual licenses and retaining attribution.
