# Apple-Style UI Refresh Design

## Goal

Refresh English Immerser v0.4.0 toward an Apple-inspired macOS desktop style while keeping the current product structure and all learning workflows intact.

## Chosen Direction

Use the "macOS Glass" direction:

- Light neutral workspace background with subtle depth.
- Frosted, semi-translucent sidebar and surfaces.
- Apple system blue as the primary accent.
- White glass cards with soft borders and restrained shadows.
- System font stack with tighter, cleaner hierarchy.

## Scope

Primary files:

- `src/app.css`
- `src/App.tsx`
- `src/components/layout/Sidebar.tsx`

Secondary updates are allowed only where a component uses local Tailwind classes that visually conflict with the new shell style.

## Visual System

- Replace the warm orange primary palette with a neutral Apple-style palette and system blue.
- Keep semantic colors for success, danger, warning, and info states.
- Use larger rounded corners for app-level surfaces and controls.
- Use subtle glass borders, translucent backgrounds, and soft shadows.
- Avoid decorative gradients or marketing-style hero composition.

## Layout

- Keep the current scene state machine and left navigation.
- Make the main app background feel like a macOS window canvas.
- Keep existing page information density; do not turn module screens into landing pages.
- Preserve all current labels, controls, and workflows.

## Components

- Sidebar: frosted surface, compact icon navigation, blue active state, quieter footer version label.
- Cards: glass-white panels with soft border and shadow.
- Buttons: rounded system controls, blue primary action, light gray secondary action.
- Inputs: white translucent fields with blue focus ring.
- Tabs: segmented-control style.
- Toasts and modals: glass-like surfaces with clear contrast.

## Behavior

No behavior changes. Stores, Tauri file access, media controls, update flow, and scene switching stay unchanged.

## Verification

- Run the production build.
- Start the dev server.
- Check the main UI in browser at desktop size.
- Verify no obvious text overlap, blank screens, or broken navigation.
