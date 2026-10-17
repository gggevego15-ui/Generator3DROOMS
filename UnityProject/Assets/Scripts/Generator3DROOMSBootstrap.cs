using System;
using System.Runtime.InteropServices;
using UnityEngine;

/// <summary>
/// Runtime entry point for the Generator3DROOMS WebGL scene.
/// Attach to a GameObject named exactly "Generator3DROOMS".
/// Uses procedural meshes/materials so the scene works before external assets are added.
/// </summary>
public sealed class Generator3DROOMSBootstrap : MonoBehaviour
{
    [Serializable]
    private class RoomSettings
    {
        public float width = 5f;
        public float depth = 4f;
        public float height = 2.8f;
        public string style = "Warm minimal";
        public string type = "Living room";
        public string density = "balanced";
        public float light = 65f;
        public bool shadows = true;
    }

    private RoomGenerator roomGenerator;
    private Transform furnitureRoot;
    private Camera sceneCamera;
    private Light keyLight;
    private Material wallMaterial;
    private Material floorMaterial;
    private Material woodMaterial;
    private Material fabricMaterial;
    private Material accentMaterial;
    private RoomSettings settings = new RoomSettings();
    private Transform selectedFurniture;
    private string editMode = "select";
    private bool draggingFurniture;
    private Vector3 dragOffset;
    private float lastPointerX;
    private Plane floorPlane;
#if UNITY_WEBGL && !UNITY_EDITOR
    [DllImport("__Internal")] private static extern void Generator3DROOMS_OnSelection(string objectName, float x, float z, float yaw);
    [DllImport("__Internal")] private static extern void Generator3DROOMS_OnTransform(float x, float z, float yaw);
#endif

    private void Awake()
    {
        gameObject.name = "Generator3DROOMS";
        Application.targetFrameRate = 60;
        QualitySettings.vSyncCount = 0;
        BuildMaterials();
        BuildLighting();
        BuildCamera();
        roomGenerator = gameObject.AddComponent<RoomGenerator>();
        roomGenerator.generateOnStart = false;
        roomGenerator.floorMaterial = floorMaterial;
        roomGenerator.wallMaterial = wallMaterial;
        var furniture = new GameObject("GeneratedFurniture");
        furnitureRoot = furniture.transform;
        furnitureRoot.SetParent(transform, false);
        GenerateRoom(JsonUtility.ToJson(settings));
        floorPlane = new Plane(Vector3.up, Vector3.zero);
    }

    private void Update()
    {
        if (sceneCamera == null || furnitureRoot == null) return;

        if (Input.GetMouseButtonDown(0))
        {
            Ray ray = sceneCamera.ScreenPointToRay(Input.mousePosition);
            if (Physics.Raycast(ray, out RaycastHit hit, 500f))
            {
                Transform candidate = hit.transform;
                while (candidate != null && candidate.parent != furnitureRoot)
                    candidate = candidate.parent;

                if (candidate != null && candidate.parent == furnitureRoot)
                {
                    SelectFurniture(candidate);
                    draggingFurniture = editMode == "move" || editMode == "rotate";
                    if (floorPlane.Raycast(ray, out float dragEnter))
                        dragOffset = candidate.position - ray.GetPoint(dragEnter);
                    else
                        dragOffset = Vector3.zero;
                    dragOffset.y = 0f;
                    lastPointerX = Input.mousePosition.x;
                }
                else
                {
                    draggingFurniture = false;
                    if (editMode == "select") SelectFurniture(null);
                }
            }
            else if (editMode == "select") SelectFurniture(null);
        }

        if (draggingFurniture && selectedFurniture != null && Input.GetMouseButton(0))
        {
            Vector3 pointer = Input.mousePosition;
            if (editMode == "rotate")
            {
                float delta = pointer.x - lastPointerX;
                selectedFurniture.Rotate(Vector3.up, delta * 0.7f, Space.World);
                lastPointerX = pointer.x;
                NotifySelection();
            }
            else if (editMode == "move")
            {
                Ray ray = sceneCamera.ScreenPointToRay(pointer);
                if (floorPlane.Raycast(ray, out float enter))
                {
                    Vector3 point = ray.GetPoint(enter) + dragOffset;
                    point.x = Mathf.Clamp(point.x, -settings.width * 0.5f + 0.25f, settings.width * 0.5f - 0.25f);
                    point.z = Mathf.Clamp(point.z, -settings.depth * 0.5f + 0.25f, settings.depth * 0.5f - 0.25f);
                    point.y = 0f;
                    selectedFurniture.position = point;
                    NotifyTransform();
                }
            }
        }

        if (Input.GetMouseButtonUp(0)) draggingFurniture = false;
    }

    private void SelectFurniture(Transform target)
    {
        selectedFurniture = target;
        NotifySelection();
    }

    private void NotifySelection()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        try
        {
            Generator3DROOMS_OnSelection(selectedFurniture != null ? selectedFurniture.name : "", selectedFurniture != null ? selectedFurniture.position.x : 0f, selectedFurniture != null ? selectedFurniture.position.z : 0f, selectedFurniture != null ? selectedFurniture.eulerAngles.y : 0f);
        }
        catch (Exception exception) { Debug.LogWarning("Could not notify web editor selection: " + exception.Message); }
#endif
    }

    private void NotifyTransform()
    {
#if UNITY_WEBGL && !UNITY_EDITOR
        try
        {
            Generator3DROOMS_OnTransform(selectedFurniture.position.x, selectedFurniture.position.z, selectedFurniture.eulerAngles.y);
        }
        catch (Exception exception) { Debug.LogWarning("Could not notify web editor transform: " + exception.Message); }
#endif
    }

    public void SetEditMode(string mode)
    {
        if (mode == "select" || mode == "move" || mode == "rotate")
            editMode = mode;
        draggingFurniture = false;
    }

    public void SetSelectedPosition(string coordinates)
    {
        if (selectedFurniture == null || string.IsNullOrWhiteSpace(coordinates)) return;
        string[] values = coordinates.Split(',');
        if (values.Length < 2 || !float.TryParse(values[0], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float x) ||
            !float.TryParse(values[1], System.Globalization.NumberStyles.Float, System.Globalization.CultureInfo.InvariantCulture, out float z)) return;
        selectedFurniture.position = new Vector3(
            Mathf.Clamp(x, -settings.width * 0.5f + 0.25f, settings.width * 0.5f - 0.25f),
            selectedFurniture.position.y,
            Mathf.Clamp(z, -settings.depth * 0.5f + 0.25f, settings.depth * 0.5f - 0.25f));
        NotifyTransform();
    }

    public void RotateSelected(float degrees)
    {
        if (selectedFurniture == null) return;
        selectedFurniture.Rotate(Vector3.up, degrees, Space.World);
        NotifySelection();
    }

    public void DeleteSelectedObject()
    {
        if (selectedFurniture == null) return;
        Destroy(selectedFurniture.gameObject);
        selectedFurniture = null;
        draggingFurniture = false;
        NotifySelection();
    }

    private void BuildMaterials()
    {
        wallMaterial = MakeMaterial(new Color(0.78f, 0.75f, 0.67f), 0.05f, 0.0f);
        floorMaterial = MakeMaterial(new Color(0.38f, 0.27f, 0.17f), 0.12f, 0.0f);
        woodMaterial = MakeMaterial(new Color(0.42f, 0.29f, 0.18f), 0.18f, 0.0f);
        fabricMaterial = MakeMaterial(new Color(0.47f, 0.51f, 0.42f), 0.0f, 0.0f);
        accentMaterial = MakeMaterial(new Color(0.69f, 0.62f, 0.49f), 0.08f, 0.0f);
    }

    private Material MakeMaterial(Color color, float metallic, float smoothness)
    {
        Shader shader = Shader.Find("Universal Render Pipeline/Lit");
        if (shader == null) shader = Shader.Find("Standard");
        var material = new Material(shader);
        material.color = color;
        if (material.HasProperty("_Metallic")) material.SetFloat("_Metallic", metallic);
        if (material.HasProperty("_Smoothness")) material.SetFloat("_Smoothness", smoothness);
        return material;
    }

    private void BuildLighting()
    {
        var lightObject = new GameObject("Studio sunlight");
        keyLight = lightObject.AddComponent<Light>();
        keyLight.type = LightType.Directional;
        keyLight.transform.rotation = Quaternion.Euler(42f, -32f, 0f);
        keyLight.intensity = 1.1f;
        keyLight.shadows = LightShadows.Soft;
        RenderSettings.ambientMode = UnityEngine.Rendering.AmbientMode.Trilight;
        RenderSettings.ambientSkyColor = new Color(0.58f, 0.62f, 0.67f);
        RenderSettings.ambientEquatorColor = new Color(0.40f, 0.39f, 0.34f);
        RenderSettings.ambientGroundColor = new Color(0.19f, 0.16f, 0.12f);
    }

    private void BuildCamera()
    {
        var cameraObject = new GameObject("Room camera");
        sceneCamera = cameraObject.AddComponent<Camera>();
        sceneCamera.clearFlags = CameraClearFlags.SolidColor;
        sceneCamera.backgroundColor = new Color(0.13f, 0.16f, 0.13f);
        sceneCamera.fieldOfView = 42f;
        sceneCamera.nearClipPlane = 0.05f;
        sceneCamera.farClipPlane = 150f;
        cameraObject.AddComponent<AudioListener>();
        cameraObject.transform.position = new Vector3(7.4f, 5.8f, -8.8f);
        cameraObject.transform.LookAt(new Vector3(0f, 1.1f, 0f));
    }

    public void SetRoomDimensions(string json)
    {
        ApplySettings(json);
        if (roomGenerator != null)
        {
            roomGenerator.width = settings.width;
            roomGenerator.depth = settings.depth;
            roomGenerator.height = settings.height;
            roomGenerator.Generate();
        }
        if (keyLight != null) keyLight.intensity = Mathf.Lerp(0.15f, 1.8f, settings.light / 100f);
        if (keyLight != null) keyLight.shadows = settings.shadows ? LightShadows.Soft : LightShadows.None;
        if (sceneCamera != null)
        {
            float scale = Mathf.Max(settings.width, settings.depth);
            sceneCamera.transform.position = new Vector3(scale * 1.25f, settings.height * 1.65f, -scale * 1.5f);
            sceneCamera.transform.LookAt(new Vector3(0f, settings.height * 0.36f, 0f));
        }
    }

    public void GenerateRoom(string json)
    {
        ApplySettings(json);
        SetRoomDimensions(JsonUtility.ToJson(settings));
        ClearFurniture();
        AddFurnitureForSettings();
    }

    private void ApplySettings(string json)
    {
        if (string.IsNullOrWhiteSpace(json)) return;
        try
        {
            var incoming = JsonUtility.FromJson<RoomSettings>(json);
            if (incoming == null) return;
            settings.width = Mathf.Clamp(incoming.width, 2f, 20f);
            settings.depth = Mathf.Clamp(incoming.depth, 2f, 20f);
            settings.height = Mathf.Clamp(incoming.height, 2f, 6f);
            settings.style = incoming.style ?? "Warm minimal";
            settings.type = incoming.type ?? "Living room";
            settings.density = incoming.density ?? "balanced";
            settings.light = Mathf.Clamp(incoming.light, 0f, 100f);
            settings.shadows = incoming.shadows;
        }
        catch (Exception exception) { Debug.LogWarning("Invalid room settings JSON: " + exception.Message); }
    }

    private void AddFurnitureForSettings()
    {
        string room = (settings.type ?? "").ToLowerInvariant();
        if (room.Contains("bedroom"))
        {
            MakeBox("Bed frame", new Vector3(0f, 0.22f, 0.6f), new Vector3(2.1f, 0.35f, 1.7f), woodMaterial);
            MakeBox("Mattress", new Vector3(0f, 0.48f, 0.6f), new Vector3(1.95f, 0.22f, 1.55f), fabricMaterial);
            MakeBox("Headboard", new Vector3(0f, 0.8f, 1.42f), new Vector3(2.1f, 1.1f, 0.12f), accentMaterial);
            MakeBox("Bedside table", new Vector3(-1.45f, 0.35f, 1.0f), new Vector3(0.5f, 0.7f, 0.5f), woodMaterial);
        }
        else if (room.Contains("office"))
        {
            MakeBox("Desk", new Vector3(0f, 0.76f, 0.9f), new Vector3(1.6f, 0.1f, 0.75f), woodMaterial);
            MakeBox("Desk pedestal", new Vector3(-0.6f, 0.35f, 0.9f), new Vector3(0.3f, 0.7f, 0.6f), accentMaterial);
            MakeChair(new Vector3(0f, 0f, -0.2f));
        }
        else
        {
            MakeBox("Sofa base", new Vector3(0f, 0.3f, 0.65f), new Vector3(2.2f, 0.45f, 0.85f), fabricMaterial);
            MakeBox("Sofa back", new Vector3(0f, 0.78f, 1.0f), new Vector3(2.2f, 0.65f, 0.18f), fabricMaterial);
            MakeBox("Sofa arm left", new Vector3(-1.08f, 0.58f, 0.65f), new Vector3(0.18f, 0.5f, 0.85f), accentMaterial);
            MakeBox("Sofa arm right", new Vector3(1.08f, 0.58f, 0.65f), new Vector3(0.18f, 0.5f, 0.85f), accentMaterial);
            MakeBox("Coffee table", new Vector3(0f, 0.42f, -0.65f), new Vector3(1.2f, 0.1f, 0.65f), woodMaterial);
            MakeBox("Table leg left", new Vector3(-0.48f, 0.2f, -0.65f), new Vector3(0.07f, 0.4f, 0.07f), woodMaterial);
            MakeBox("Table leg right", new Vector3(0.48f, 0.2f, -0.65f), new Vector3(0.07f, 0.4f, 0.07f), woodMaterial);
            MakeChair(new Vector3(-1.5f, 0f, -0.65f));
        }
        if (settings.density != "minimal")
        {
            MakePlant(new Vector3(settings.width * 0.32f, 0f, settings.depth * 0.28f));
            MakeBox("Side cabinet", new Vector3(-settings.width * 0.31f, 0.42f, settings.depth * 0.27f), new Vector3(0.65f, 0.84f, 0.42f), woodMaterial);
        }
        if (settings.density == "full")
        {
            MakeBox("Accent rug", new Vector3(0f, 0.025f, -0.15f), new Vector3(2.8f, 0.035f, 1.8f), accentMaterial);
            MakePlant(new Vector3(-settings.width * 0.34f, 0f, -settings.depth * 0.25f));
        }
    }

    public void AddCatalogObject(string name)
    {
        if (string.IsNullOrWhiteSpace(name)) return;
        string lower = name.ToLowerInvariant();
        Vector3 position = new Vector3(UnityEngine.Random.Range(-settings.width * 0.3f, settings.width * 0.3f), 0f, UnityEngine.Random.Range(-settings.depth * 0.3f, settings.depth * 0.3f));
        if (lower.Contains("plant")) MakePlant(position);
        else if (lower.Contains("chair")) MakeChair(position);
        else if (lower.Contains("table")) MakeBox(name, position + Vector3.up * 0.4f, new Vector3(1f, 0.12f, 0.65f), woodMaterial);
        else if (lower.Contains("lamp")) MakeLamp(position + Vector3.up * 0.1f);
        else if (lower.Contains("sofa")) MakeBox(name, position + Vector3.up * 0.35f, new Vector3(1.8f, 0.7f, 0.75f), fabricMaterial);
        else if (lower.Contains("window")) MakeBox(name, new Vector3(position.x, settings.height * 0.55f, settings.depth * 0.48f), new Vector3(1.3f, 1.2f, 0.08f), accentMaterial);
        else MakeBox(name, position + Vector3.up * 0.35f, new Vector3(0.55f, 0.7f, 0.45f), accentMaterial);
    }

    private void MakeBox(string objectName, Vector3 position, Vector3 scale, Material material)
    {
        var group = new GameObject(objectName);
        group.transform.SetParent(furnitureRoot, false);
        group.transform.localPosition = position;
        var mesh = GameObject.CreatePrimitive(PrimitiveType.Cube);
        mesh.name = "Mesh";
        mesh.transform.SetParent(group.transform, false);
        mesh.transform.localPosition = Vector3.zero;
        mesh.transform.localScale = scale;
        mesh.GetComponent<Renderer>().sharedMaterial = material;
    }

    private void MakeChair(Vector3 position)
    {
        MakeBox("Lounge chair seat", position + new Vector3(0f, 0.45f, 0f), new Vector3(0.8f, 0.16f, 0.75f), fabricMaterial);
        MakeBox("Lounge chair back", position + new Vector3(0f, 0.82f, 0.28f), new Vector3(0.8f, 0.7f, 0.14f), fabricMaterial);
        MakeBox("Chair leg left", position + new Vector3(-0.3f, 0.2f, -0.25f), new Vector3(0.06f, 0.4f, 0.06f), woodMaterial);
        MakeBox("Chair leg right", position + new Vector3(0.3f, 0.2f, -0.25f), new Vector3(0.06f, 0.4f, 0.06f), woodMaterial);
    }

    private void MakePlant(Vector3 position)
    {
        MakeBox("Plant pot", position + new Vector3(0f, 0.2f, 0f), new Vector3(0.35f, 0.4f, 0.35f), accentMaterial);
        MakeBox("Plant foliage", position + new Vector3(0f, 0.65f, 0f), new Vector3(0.55f, 0.65f, 0.55f), fabricMaterial);
    }

    private void MakeLamp(Vector3 position)
    {
        MakeBox("Floor lamp stem", position + new Vector3(0f, 0.7f, 0f), new Vector3(0.04f, 1.4f, 0.04f), woodMaterial);
        MakeBox("Floor lamp shade", position + new Vector3(0f, 1.45f, 0f), new Vector3(0.4f, 0.22f, 0.4f), accentMaterial);
    }

    private void ClearFurniture()
    {
        if (furnitureRoot == null) return;
        for (int i = furnitureRoot.childCount - 1; i >= 0; i--)
            Destroy(furnitureRoot.GetChild(i).gameObject);
    }
}
