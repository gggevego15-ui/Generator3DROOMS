using UnityEngine;

/// <summary>
/// Lightweight procedural room shell for the Generator3DROOMS WebGL prototype.
/// Add this component to an empty GameObject in a Unity scene.
/// </summary>
[DisallowMultipleComponent]
public sealed class RoomGenerator : MonoBehaviour
{
    [Header("Room dimensions (metres)")]
    [Min(2f)] public float width = 5f;
    [Min(2f)] public float depth = 4f;
    [Min(2f)] public float height = 2.8f;
    [Min(0.02f)] public float wallThickness = 0.12f;

    [Header("Materials")]
    public Material floorMaterial;
    public Material wallMaterial;

    [Header("Generation")]
    public bool generateOnStart = true;
    public bool includeCeiling = false;

    private Transform generatedRoot;

    private void Start()
    {
        if (generateOnStart) Generate();
    }

    public void Generate()
    {
        width = Mathf.Clamp(width, 2f, 20f);
        depth = Mathf.Clamp(depth, 2f, 20f);
        height = Mathf.Clamp(height, 2f, 6f);

        if (generatedRoot != null)
        {
            if (Application.isPlaying) Destroy(generatedRoot.gameObject);
            else DestroyImmediate(generatedRoot.gameObject);
        }

        var root = new GameObject("GeneratedRoom");
        root.transform.SetParent(transform, false);
        generatedRoot = root.transform;

        CreateBox("Floor", new Vector3(0f, -wallThickness * 0.5f, 0f),
            new Vector3(width, wallThickness, depth), floorMaterial);

        CreateBox("BackWall", new Vector3(0f, height * 0.5f, depth * 0.5f),
            new Vector3(width, height, wallThickness), wallMaterial);
        CreateBox("LeftWall", new Vector3(-width * 0.5f, height * 0.5f, 0f),
            new Vector3(wallThickness, height, depth), wallMaterial);
        CreateBox("RightWall", new Vector3(width * 0.5f, height * 0.5f, 0f),
            new Vector3(wallThickness, height, depth), wallMaterial);

        // Front wall is intentionally omitted to keep the room visible to the camera.
        if (includeCeiling)
            CreateBox("Ceiling", new Vector3(0f, height, 0f),
                new Vector3(width, wallThickness, depth), wallMaterial);
    }

    private void CreateBox(string objectName, Vector3 localPosition, Vector3 localScale, Material material)
    {
        var item = GameObject.CreatePrimitive(PrimitiveType.Cube);
        item.name = objectName;
        item.transform.SetParent(generatedRoot, false);
        item.transform.localPosition = localPosition;
        item.transform.localScale = localScale;

        if (material != null)
            item.GetComponent<Renderer>().sharedMaterial = material;
    }
}
