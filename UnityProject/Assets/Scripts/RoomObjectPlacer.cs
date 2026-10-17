using UnityEngine;

/// <summary>
/// Runtime placement helper for catalog prefabs. Intended to be called by the
/// web workspace bridge once a Unity WebGL build is integrated.
/// </summary>
public sealed class RoomObjectPlacer : MonoBehaviour
{
    [SerializeField] private Camera sceneCamera;
    [SerializeField] private LayerMask placementSurfaceMask = ~0;
    [SerializeField] private float gridSize = 0.1f;
    [SerializeField] private bool snapToGrid = true;

    private GameObject selectedObject;
    private bool placementMode;

    public GameObject SelectedObject => selectedObject;

    public void BeginPlacement(GameObject prefab)
    {
        if (prefab == null) return;
        selectedObject = Instantiate(prefab);
        selectedObject.name = prefab.name;
        placementMode = true;
    }

    public void Select(GameObject target)
    {
        selectedObject = target;
        placementMode = false;
    }

    public void DeleteSelected()
    {
        if (selectedObject == null) return;
        Destroy(selectedObject);
        selectedObject = null;
        placementMode = false;
    }

    public void SetGridSnapping(bool enabled)
    {
        snapToGrid = enabled;
    }

    private void Update()
    {
        if (!placementMode || selectedObject == null || sceneCamera == null) return;

        if (Input.GetMouseButtonDown(1))
        {
            Destroy(selectedObject);
            selectedObject = null;
            placementMode = false;
            return;
        }

        if (!Input.GetMouseButton(0)) return;

        Ray ray = sceneCamera.ScreenPointToRay(Input.mousePosition);
        if (!Physics.Raycast(ray, out RaycastHit hit, 500f, placementSurfaceMask)) return;

        Vector3 point = hit.point;
        if (snapToGrid && gridSize > 0.001f)
        {
            point.x = Mathf.Round(point.x / gridSize) * gridSize;
            point.z = Mathf.Round(point.z / gridSize) * gridSize;
        }

        selectedObject.transform.position = point;
        if (Input.GetMouseButtonUp(0)) placementMode = false;
    }
}
