# nimShot - Implementation Plan

## Project Overview

**nimShot** is a Windows screenshot tool built with Tauri v2 and React + TypeScript. It provides:
- Global hotkey activation (customizable, default: Win+Alt+S)
- Fullscreen capture overlay with blur effect and region selection
- Automatic screenshot saving with timestamp naming
- Floating desktop overlay widget (draggable circle)
- Hover-to-reveal recent 5 screenshots with drag-and-drop
- System tray integration and autostart support

---

## System Requirements (Verified)

All prerequisites are **already installed** on the development machine:

| Requirement | Version | Status |
|---|---|---|
| Rust (MSVC toolchain) | 1.93.0 | Installed |
| Cargo | 1.93.0 | Installed |
| Node.js | v22.17.1 | Installed |
| npm | 10.8.3 | Installed |
| pnpm | 10.15.0 | Installed |
| MSVC Build Tools | VS 2022, 14.44.35207 | Installed |
| Windows SDK | 10.0.26100.0 | Installed |
| WebView2 Runtime | 144.0.3719.115 | Installed |

---

## Technology Stack

### Frontend
- **Framework**: React 18 + TypeScript
- **Bundler**: Vite
- **Styling**: Tailwind CSS
- **Animation**: Framer Motion
- **Icons**: Lucide React
- **State Management**: React Context + Hooks

### Backend (Rust)
- **Core**: Tauri v2
- **Plugins**:
  - `tauri-plugin-global-shortcut` - Global hotkey registration
  - `tauri-plugin-autostart` - Windows startup integration
  - `tauri-plugin-store` - Settings persistence
  - `tauri-plugin-single-instance` - Prevent duplicate instances
- **Screen Capture**: `xcap` crate (native Windows screen capture)
- **Image Processing**: `image` crate (crop, resize, blur)
- **Storage**: `tauri-plugin-sql` or JSON via `tauri-plugin-store`

---

## Window Architecture

The app uses **4 distinct window types** managed by Tauri:

### 1. Main Window (`main`)
- **Purpose**: Settings, gallery view, full screenshot history
- **Visibility**: Hidden by default, shown via system tray or widget
- **Size**: 1200x800 (resizable)
- **Style**: Standard decorated window

### 2. Widget Window (`widget`)
- **Purpose**: Floating circular overlay on desktop
- **Visibility**: Always visible
- **Size**: 64x64 pixels
- **Style**: Frameless, transparent, always-on-top, skip-taskbar
- **Behavior**: Draggable, remembers position, on hover shows popup

### 3. Capture Window (`capture`)
- **Purpose**: Fullscreen screenshot capture interface
- **Visibility**: Created on-demand when hotkey pressed
- **Size**: Full screen (covers all monitors)
- **Style**: Frameless, transparent, always-on-top
- **Behavior**: Blurred screenshot background, region selection, toolbar at top

### 4. Popup Window (`popup`)
- **Purpose**: Recent screenshots panel
- **Visibility**: Shown on widget hover
- **Size**: 320x400 pixels
- **Style**: Frameless, rounded corners, shadow
- **Behavior**: Auto-hides on mouse leave (300ms delay)

---

## Feature Implementation Breakdown

### Phase 1: Project Setup

1. **Initialize Tauri Project**
   ```bash
   npm create tauri-app@latest nimShot -- --template react-ts
   cd nimShot
   ```

2. **Install Tauri Plugins**
   ```bash
   npm run tauri add global-shortcut
   npm run tauri add autostart
   npm run tauri add store
   npm run tauri add single-instance
   ```

3. **Install Frontend Dependencies**
   ```bash
   npm install framer-motion lucide-react
   npm install -D @types/react @types/react-dom
   ```

4. **Configure Tailwind**
   - Initialize with default configuration
   - Add color palette from `color-palette.md`

### Phase 2: Rust Backend Commands

Expose these Tauri commands:

```rust
// capture.rs
#[tauri::command]
async fn capture_fullscreen(window: Window) -> Result<String, String>

#[tauri::command]
async fn capture_region(
    window: Window,
    x: i32,
    y: i32,
    width: u32,
    height: u32
) -> Result<String, String>

// screenshots.rs
#[tauri::command]
async fn get_recent_screenshots(count: usize) -> Result<Vec<ScreenshotMeta>, String>

#[tauri::command]
async fn delete_screenshot(id: String) -> Result<(), String>

#[tauri::command]
async fn get_screenshot_path(id: String) -> Result<String, String>

// settings.rs
#[tauri::command]
async fn get_settings() -> Result<Settings, String>

#[tauri::command]
async fn save_settings(settings: Settings) -> Result<(), String>

#[tauri::command]
async fn register_global_shortcut(shortcut: String) -> Result<(), String>
```

### Phase 3: Global Hotkey System

**Implementation:**
- Default hotkey: `Win+Alt+S` (or customizable)
- Use `tauri-plugin-global-shortcut` to register hotkey
- On trigger:
  1. Capture all screens to temporary buffer
  2. Create fullscreen capture window
  3. Display blurred screenshot with overlay
  4. Enable region selection

**Hotkey customization:**
- Store in settings
- Support modifiers: Ctrl, Alt, Shift, Win
- Support keys: alphanumeric, F1-F12, etc.
- Validate and prevent conflicts

### Phase 4: Screenshot Capture Flow

1. **Capture Trigger** (Hotkey or Tray Menu)
   - Hide widget window temporarily
   - Use `xcap` to capture all monitors
   - Blur captured image for background

2. **Show Capture Window**
   - Fullscreen overlay on all monitors
   - Display blurred screenshot
   - Show toolbar at top center:
     - Rectangle select (default)
     - Fullscreen capture button
     - Cancel button
   - Show crosshair cursor

3. **Region Selection**
   - User clicks and drags to draw rectangle
   - Real-time preview of selected area (unblurred)
   - Show dimensions tooltip
   - Press Escape to cancel
   - Press Enter or click "Capture" to confirm

4. **Save Screenshot**
   - Crop to selected region
   - Generate filename: `screenshot_YYYYMMDD_HHMMSS.png`
   - Save to: `%AppData%/nimShot/screenshots/`
   - Update recent screenshots list
   - Notify via system notification
   - Close capture window, show widget

### Phase 5: Widget System

**Floating Widget (`FloatingWidget.tsx`)**

```tsx
interface WidgetProps {
  position: { x: number; y: number };
  onPositionChange: (pos: { x: number; y: number }) => void;
  onHover: () => void;
  onLeave: () => void;
}
```

**Behavior:**
- Always-on-top circular window
- Draggable anywhere on screen
- Saves position to settings on drag end
- On mouse enter: trigger popup after 200ms delay
- Visual feedback: subtle scale animation on hover

**Popup Panel (`PopupPanel.tsx`)**

```tsx
interface PopupProps {
  screenshots: ScreenshotMeta[];
  maxItems: 5;
  onDragStart: (screenshot: ScreenshotMeta) => void;
  onDelete: (id: string) => void;
}
```

**Behavior:**
- Shows 5 most recent screenshots as thumbnails
- Each thumbnail is draggable using native OS drag
- Click to open full size
- Right-click context menu: Open, Copy, Delete
- Auto-hide on mouse leave (300ms grace period)

### Phase 6: Drag-and-Drop System

**Native File Drag:**
- Use Tauri's `startDragging` API
- On drag start from popup thumbnail:
  1. Get screenshot file path
  2. Call `invoke('start_drag', { filePath })`
  3. User can drop into any application accepting files

**Drag Visual:**
- Show thumbnail preview during drag
- Cursor changes to indicate draggable state

### Phase 7: Storage & Persistence

**Settings Schema:**
```json
{
  "hotkey": "Win+Alt+S",
  "autostart": true,
  "widgetPosition": { "x": 50, "y": 500 },
  "firstLaunch": false,
  "screenshotFolder": "%AppData%/nimShot/screenshots",
  "maxStorageMB": 1000,
  "theme": "dark"
}
```

**Screenshot Metadata:**
```json
{
  "id": "uuid",
  "filename": "screenshot_20250218_143022.png",
  "path": "C:/Users/.../nimShot/screenshots/...",
  "createdAt": "2025-02-18T14:30:22Z",
  "width": 1920,
  "height": 1080,
  "fileSize": 2450000
}
```

**Storage Strategy:**
- Settings: Tauri Store plugin (JSON file)
- Screenshots: Local filesystem
- Metadata: SQLite database or JSON file in app data

### Phase 8: First-Launch Onboarding

**Widget Placement Flow:**
1. On first launch, show modal dialog
2. Explain: "Drag the circle to your preferred position"
3. Highlight the widget prominently
4. User drags widget to desired location
5. Click "Done" to save position
6. Never show this dialog again (unless reset in settings)

### Phase 9: System Tray Integration

**Tray Menu Items:**
- `Capture Screenshot` - Trigger hotkey action
- `Open Gallery` - Show main window
- `Settings` - Show settings page
- `---` (separator)
- `Quit` - Exit application

**Tray Icon:**
- Use nimShot logo (orange circle)
- Show notification on screenshot saved

### Phase 10: Autostart Configuration

- Use `tauri-plugin-autostart`
- Enable by default
- User can toggle in settings
- Registry entry: `HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run`

---

## File Structure

```
nimShot/
├── src/                          # React frontend
│   ├── App.tsx                   # Root component, routing
│   ├── main.tsx                  # Entry point
│   ├── components/
│   │   ├── capture/
│   │   │   ├── CaptureOverlay.tsx      # Fullscreen capture UI
│   │   │   ├── CaptureToolbar.tsx      # Top toolbar
│   │   │   └── RegionSelector.tsx      # Rectangle selection
│   │   ├── widget/
│   │   │   ├── FloatingWidget.tsx      # Circle overlay
│   │   │   ├── PopupPanel.tsx          # Recent screenshots popup
│   │   │   └── ScreenshotThumbnail.tsx # Draggable thumbnail
│   │   ├── gallery/
│   │   │   ├── GalleryView.tsx         # All screenshots grid
│   │   │   └── ScreenshotCard.tsx      # Gallery item
│   │   ├── settings/
│   │   │   ├── SettingsPage.tsx        # Settings UI
│   │   │   └── HotkeyInput.tsx         # Hotkey capture
│   │   └── onboarding/
│   │       └── WidgetPlacement.tsx     # First-launch setup
│   ├── hooks/
│   │   ├── useScreenshots.ts     # Screenshot operations
│   │   ├── useGlobalShortcut.ts  # Hotkey management
│   │   ├── useWidgetPosition.ts  # Widget position state
│   │   └── useSettings.ts        # Settings persistence
│   ├── lib/
│   │   ├── tauri-commands.ts     # Typed invoke wrappers
│   │   ├── storage.ts            # Storage utilities
│   │   └── theme.ts              # Color palette constants
│   └── styles/
│       ├── globals.css           # Tailwind + custom styles
│       └── animations.css        # Custom animations
├── src-tauri/                    # Rust backend
│   ├── src/
│   │   ├── lib.rs                # Plugin registration
│   │   ├── main.rs               # Entry point
│   │   ├── commands/
│   │   │   ├── mod.rs
│   │   │   ├── capture.rs        # Screen capture
│   │   │   ├── screenshots.rs    # Screenshot CRUD
│   │   │   └── settings.rs       # Settings commands
│   │   ├── utils/
│   │   │   ├── mod.rs
│   │   │   ├── image.rs          # Image processing
│   │   │   └── window.rs         # Window management
│   │   └── models/
│   │       ├── mod.rs
│   │       ├── screenshot.rs     # Screenshot struct
│   │       └── settings.rs       # Settings struct
│   ├── Cargo.toml
│   ├── tauri.conf.json           # Tauri configuration
│   └── capabilities/
│       └── default.json          # Permissions
├── public/
│   └── icons/                    # App icons
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
├── tailwind.config.ts
└── README.md
```

---

## Permission Requirements

Add to `src-tauri/capabilities/default.json`:

```json
{
  "permissions": [
    "core:default",
    "core:window:default",
    "core:window:allow-create",
    "core:window:allow-close",
    "core:window:allow-minimize",
    "core:window:allow-start-dragging",
    "core:window:allow-set-always-on-top",
    "core:window:allow-set-skip-taskbar",
    "global-shortcut:allow-register",
    "global-shortcut:allow-unregister",
    "global-shortcut:allow-is-registered",
    "autostart:allow-enable",
    "autostart:allow-disable",
    "autostart:allow-is-enabled",
    "store:allow-get",
    "store:allow-set",
    "store:allow-save",
    "fs:default",
    "fs:allow-appdata-read",
    "fs:allow-appdata-write",
    "dialog:allow-open",
    "notification:default"
  ]
}
```

---

## Development Workflow

### Build Commands

```bash
# Development (hot reload)
npm run tauri dev

# Production build
npm run tauri build

# Build MSI installer
npm run tauri build -- --target x86_64-pc-windows-msvc
```

### Testing Strategy

1. **Unit Tests**: React components with Vitest
2. **Integration Tests**: Tauri commands with Rust tests
3. **E2E Tests**: Screenshot capture and widget interaction

### Debugging

- Frontend: Chrome DevTools (right-click, Inspect)
- Backend: Rust logging with `tauri-plugin-log`
- Window issues: Use Tauri's debug mode

---

## Milestones

### Milestone 1: Core Setup
- [ ] Initialize Tauri project
- [ ] Install and configure all plugins
- [ ] Basic window creation (main, widget)
- [ ] System tray integration

### Milestone 2: Screenshot Capture
- [ ] Rust screen capture with xcap
- [ ] Capture overlay window
- [ ] Region selection
- [ ] Save to filesystem

### Milestone 3: Widget System
- [ ] Floating widget window
- [ ] Draggable positioning
- [ ] Position persistence
- [ ] Popup on hover

### Milestone 4: Recent Screenshots
- [ ] Track recent screenshots
- [ ] Popup panel UI
- [ ] Thumbnail generation
- [ ] Drag-and-drop to other apps

### Milestone 5: Polish
- [ ] First-launch onboarding
- [ ] Settings page
- [ ] Gallery view
- [ ] Hotkey customization
- [ ] UI animations

### Milestone 6: Distribution
- [ ] Icon design
- [ ] MSI installer build
- [ ] Code signing (optional)
- [ ] Documentation

---

## Notes

### Multi-Monitor Support
- Capture all monitors using `xcap`
- Create capture window spanning all screens
- Widget position is relative to primary monitor

### High DPI
- Use Tauri's `zoom` factor for scaling
- Test at 125%, 150%, 200% scaling

### Performance
- Lazy load gallery images
- Compress thumbnails to 200px width
- Limit recent screenshots to 5 in popup
- Implement storage quota management

### Error Handling
- Graceful fallback if screen capture fails
- Notify user of permission issues
- Auto-recovery from corrupted settings

---

## Resources

- [Tauri v2 Documentation](https://v2.tauri.app/)
- [Global Shortcut Plugin](https://v2.tauri.app/plugin/global-shortcut/)
- [System Tray Guide](https://v2.tauri.app/learn/system-tray/)
- [Window Customization](https://v2.tauri.app/learn/window-customization/)
- [xcap crate](https://docs.rs/xcap)
- [Claude Code Color Palette](./color-palette.md)
