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
    [MenuItem("Generator3DROOMS/Build WebGL")]
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
        string tempRoot = Path.Combine(webRoot, ".unity-temp");
        string tempBuildRoot = Path.Combine(tempRoot, "Build");
        Directory.CreateDirectory(webRoot);
        if (Directory.Exists(tempRoot)) Directory.Delete(tempRoot, true);
        Directory.CreateDirectory(tempRoot);

        var options = new BuildPlayerOptions
        {
            scenes = new[] { scenePath },
            locationPathName = tempBuildRoot,
            target = BuildTarget.WebGL,
            options = BuildOptions.None
        };

        Debug.Log("[Generator3DROOMS] Starting WebGL build to " + tempBuildRoot);
        BuildReport report = BuildPipeline.BuildPlayer(options);
        if (report.summary.result != BuildResult.Succeeded)
            throw new InvalidOperationException("Generator3DROOMS WebGL build failed: " + report.summary.result + ", errors=" + report.summary.totalErrors);

        string generatedAssets = Path.Combine(tempBuildRoot, "Build");
        string generatedLoader = Path.Combine(generatedAssets, "Build.loader.js");
        if (!File.Exists(generatedLoader))
            throw new FileNotFoundException("Unity reported a successful build but Build.loader.js was not found in the generated output.", generatedLoader);

        string finalAssets = Path.Combine(webRoot, "Build");
        if (Directory.Exists(finalAssets)) Directory.Delete(finalAssets, true);
        Directory.Move(generatedAssets, finalAssets);

        string templateSource = Path.Combine(tempBuildRoot, "TemplateData");
        string templateDestination = Path.Combine(webRoot, "TemplateData");
        if (Directory.Exists(templateSource))
        {
            if (Directory.Exists(templateDestination)) Directory.Delete(templateDestination, true);
            Directory.Move(templateSource, templateDestination);
        }

        string generatedHtml = Path.Combine(tempBuildRoot, "index.html");
        if (!File.Exists(generatedHtml))
            throw new FileNotFoundException("Unity WebGL output is missing index.html.", generatedHtml);
        string finalHtml = Path.Combine(webRoot, "Generator3DROOMS.html");
        File.Copy(generatedHtml, finalHtml, true);
        Directory.Delete(tempRoot, true);

        string loaderPath = Path.Combine(finalAssets, "Build.loader.js");
        Debug.Log("[Generator3DROOMS] WebGL build verified: " + loaderPath + " (" + report.summary.totalSize + " bytes). Existing web/index.html was preserved; standalone player: " + finalHtml);
    }
}
#endif
