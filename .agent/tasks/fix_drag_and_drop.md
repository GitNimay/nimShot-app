Fix Drag and Drop and Build Errors

The user requires a fully functional drag-and-drop feature for screenshots and a fix for existing build errors.
The previous attempt to use a `drag` crate caused build failures.
We have switched to a frontend-based HTML5 Drag and Drop approach.
Currently, there is a syntax error in `src-tauri/src/lib.rs` preventing the backend from building.

## proposed_plan
- [x] Fix syntax error in `src-tauri/src/lib.rs` (Remove extra closing brace).
- [x] Verify Backend Build (`cargo check`).
- [x] Verify functionality of Drag and Drop implementation in `GalleryView.tsx`.
- [x] Ensure all dependencies are correct and no unused crates cause issues.
- [x] Final verification of the codebase.
- [x] Implement drag and drop in `PopupPanel.tsx`.
- [x] Verify `PopupPanel` drag and drop.
