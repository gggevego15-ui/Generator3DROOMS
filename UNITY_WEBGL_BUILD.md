# Unity WebGL integration — Generator3DROOMS

## What is connected in code
- web/unity-bridge.js looks for a Unity WebGL build at web/Build/Build.loader.js, loads the player, and forwards room settings, generation requests, and catalog selections through Unity SendMessage.
- UnityProject/Assets/Scripts/Generator3DROOMSBootstrap.cs creates a runtime camera, lighting, room shell, and procedural furniture without external models.
- UnityProject/Assets/Scripts/RoomGenerator.cs creates the floor and walls.
- UnityProject/Assets/Editor/Generator3DROOMSSceneSetup.cs adds a Unity menu command to create and register a starter scene.

## Important limitation
The repository contains source scripts, not a generated Unity WebGL player. A Unity editor with WebGL Build Support is required to produce the loader, data, framework, and WASM files. The browser UI keeps its CSS preview if those build files are missing. These source changes alone do not make the site a real 3D renderer until the WebGL build is generated and deployed.

## Build steps
1. Open the Unity project that contains these scripts. If this repository does not yet contain a complete Unity project with ProjectSettings and Packages, create a Unity LTS project and copy the UnityProject/Assets folder into it.
2. Ensure WebGL Build Support is installed in Unity Hub.
3. In Unity, choose Generator3DROOMS > Create WebGL Starter Scene.
4. Open File > Build Profiles (or Build Settings in older Unity versions), select WebGL, and make sure Assets/Scenes/Generator3DROOMS.unity is enabled.
5. Build the player into the repository's web/Build folder. Use the default filenames Build.loader.js, Build.data, Build.framework.js, and Build.wasm.
6. Serve/deploy the web folder over HTTP. WebGL builds generally do not run correctly through file://.
7. Open the site, check the browser console, and verify that the notice changes to Unity 3D scene connected. Test room dimensions, Generate layout, and Add to scene.

## Performance notes
Use a low/medium quality profile for integrated graphics and cap device pixel ratio. Add high-quality furniture models and realistic textures only after testing memory and WebGL download size.
