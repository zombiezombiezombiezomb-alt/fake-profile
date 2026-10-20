# Fake Profile (Local) — Unbound iOS prototype

A starter project for a **local-only Fake Profile-style add-on** for Unbound, inspired by the feature set of Vencord's FakeProfile.

## Current status

**Prototype / scaffold, not a finished drop-in replacement.**

Included:
- Valid Unbound `manifest.json`
- Plugin lifecycle (`start` / `stop`)
- Persistent local profile settings via `@unbound-app/api` storage
- Basic URL validation for avatar/banner fields
- Clean patcher teardown
- Notes for completing the profile UI integration

Not yet included:
- A visible settings editor in Discord
- Profile-card rendering patches
- Animated avatar/banner handling
- Decorations, profile effects, or custom badge rendering

Those UI pieces depend on the component structure in the exact Discord mobile build installed on your device. Blindly patching guessed component names can break profile screens, so this scaffold deliberately does not patch an unverified target.

## Safety / behavior

- Values are stored locally in Unbound.
- This does **not** change your Discord account, grant Nitro, or make the fake details visible to other users.
- For simulated badges/effects, keep a clear local-preview indicator so the mock-up is not mistaken for real account status.

## Install / develop

1. Install Bun on a computer.
2. Create an Unbound add-on project or use this folder as the plugin source.
3. Ensure `@unbound-app/api` is available in the Unbound add-on build environment.
4. Build the entry file to `index.js` using the Unbound add-on tooling.
5. Install the resulting plugin folder through Unbound's add-on manager.

Unbound's manifest requires the `id`, `name`, `description`, non-empty `authors`, `version`, and `main` fields. The `main` field must point to a real JavaScript entry file.

## Local settings data

The stored profile object uses these keys:

```js
{
  enabled: true,
  displayName: "Your display name",
  username: "your.username",
  bio: "Local fake-profile preview",
  avatarUrl: "",
  bannerUrl: "",
  accentColor: "#5865F2",
  showPreviewLabel: true
}
```

The exported `FakeProfileLocal` helper can be inspected through Unbound's debugger while developing.

## Next step to make it fully functional

Open Discord on your device with Unbound enabled and use the Unbound debugger / Metro inspection to identify the profile component and its props for your current app version. Then implement the UI patch against that exact target, test on a throwaway profile, and verify `stop()` fully restores the original UI.
