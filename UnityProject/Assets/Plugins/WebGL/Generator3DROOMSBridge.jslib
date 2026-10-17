mergeInto(LibraryManager.library, {
  Generator3DROOMS_OnSelection: function (namePtr, x, z, yaw) {
    var name = UTF8ToString(namePtr);
    if (typeof window.Generator3DROOMS_OnSelection === "function") window.Generator3DROOMS_OnSelection(name, x, z, yaw);
  },
  Generator3DROOMS_OnTransform: function (x, z, yaw) {
    if (typeof window.Generator3DROOMS_OnTransform === "function") window.Generator3DROOMS_OnTransform(x, z, yaw);
  }
});