#if UNITY_EDITOR
using System;
using System.IO;
using UnityEditor;
using UnityEditor.Build.Reporting;
using UnityEngine;

/// <summary>
/// Deterministic WebGL build entry point used by the repository's GitHub Actions workflow.
/// </summary>
public static class Generator3DROOMSBuild
{
    public static void BuildWebGL()
    {
        const string scenePath = "Assets/Scenes/Generator3DROOMS.unity";
        string sceneOnDisk = Path.Combine(Application.dataPath, "Scenes/Generator3DROOMS.unity");
        if (!File.Exists(sceneOnDisk))
            Generator3DROOMSSceneSetup.CreateStarterScene();

        EditorBuildSettings.scenes = new[]
        {
            new EditorBuildSettingsScene(scenePath, true)
        };

        if (EditorUserBuildSettings.activeBuildTarget != BuildTarget.WebGL)
        {
            bool switched = EditorUserBuildSettings.SwitchActiveBuildTarget(BuildTargetGroup.WebGL, BuildTarget.WebGL);
            if (!switched)
                throw new InvalidOperationException("Could not switch Unity's active build target to WebGL. Install WebGL Build Support in the Unity Editor.");
        }

        string webRoot = Path.GetFullPath(Path.Combine(Application.dataPath, "../../web"));
        Directory.CreateDirectory(webRoot);
        string outputPath = Path.Combine(webRoot, "Generator3DROOMS.html");

        var options = new BuildPlayerOptions
        {
            scenes = new[] { scenePath },
            locationPathName = outputPath,
            target = BuildTarget.WebGL,
            options = BuildOptions.None
        };

        Debug.Log("[Generator3DROOMS] Starting WebGL build to " + outputPath);
        BuildReport report = BuildPipeline.BuildPlayer(options);
        if (report.summary.result != BuildResult.Succeeded)
            throw new InvalidOperationException("Generator3DROOMS WebGL build failed: " + report.summary.result + ", errors=" + report.summary.totalErrors);

        string loaderPath = Path.Combine(webRoot, "Build", "Build.loader.js");
        if (!File.Exists(loaderPath))
            throw new FileNotFoundException("Unity reported a successful build but Build.loader.js was not found at the expected path.", loaderPath);

        Debug.Log("[Generator3DROOMS] WebGL build verified: " + loaderPath + " (" + report.summary.totalSize + " bytes). UI index.html was preserved; Unity player HTML is " + outputPath);
    }
}
#endif
