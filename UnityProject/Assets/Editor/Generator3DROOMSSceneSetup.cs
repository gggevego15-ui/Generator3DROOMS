#if UNITY_EDITOR
using UnityEditor;
using UnityEditor.SceneManagement;
using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>Creates a starter scene for the Generator3DROOMS WebGL runtime.</summary>
public static class Generator3DROOMSSceneSetup
{
    private const string SceneFolder = "Assets/Scenes";
    private const string ScenePath = SceneFolder + "/Generator3DROOMS.unity";

    [MenuItem("Generator3DROOMS/Create WebGL Starter Scene")]
    public static void CreateStarterScene()
    {
        if (!AssetDatabase.IsValidFolder(SceneFolder))
            AssetDatabase.CreateFolder("Assets", "Scenes");

        var scene = EditorSceneManager.NewScene(NewSceneSetup.EmptyScene, NewSceneMode.Single);
        var root = new GameObject("Generator3DROOMS");
        root.AddComponent<Generator3DROOMSBootstrap>();

        var scenes = new System.Collections.Generic.List<EditorBuildSettingsScene>(EditorBuildSettings.scenes);
        bool alreadyAdded = false;
        for (int i = 0; i < scenes.Count; i++)
        {
            if (scenes[i].path == ScenePath)
            {
                scenes[i] = new EditorBuildSettingsScene(ScenePath, true);
                alreadyAdded = true;
            }
        }
        if (!alreadyAdded) scenes.Add(new EditorBuildSettingsScene(ScenePath, true));
        EditorBuildSettings.scenes = scenes.ToArray();

        EditorSceneManager.SaveScene(scene, ScenePath);
        AssetDatabase.SaveAssets();
        Debug.Log("Generator3DROOMS starter scene created at " + ScenePath + ". Select WebGL in Build Settings and build to web/Build.");
    }
}
#endif
