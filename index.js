/*
 * Fake Profile (Local) — Unbound prototype
 * Version 0.1.0
 *
 * IMPORTANT:
 * This is a starter/prototype, not a feature-complete port of Vencord FakeProfile.
 * Discord's mobile profile component targets change between app builds. The profile
 * render target must be identified against the user's installed Discord/Unbound build
 * before safely applying visual overrides.
 *
 * All settings are stored locally by Unbound. This plugin does not call Discord's API,
 * modify account data, or grant Nitro-only features server-side.
 */

import { metro, patcher, storage, toasts } from "@unbound-app/api";

const PLUGIN_ID = "unbound-fakeprofile";
const Patcher = patcher.createPatcher(PLUGIN_ID);
const settings = storage.getStore(PLUGIN_ID);

const DEFAULT_PROFILE = {
  enabled: true,
  displayName: "Your display name",
  username: "your.username",
  bio: "Local fake-profile preview",
  avatarUrl: "",
  bannerUrl: "",
  accentColor: "#5865F2",
  showPreviewLabel: true
};

function readProfile() {
  const saved = settings.get("profile", {});
  return { ...DEFAULT_PROFILE, ...(saved && typeof saved === "object" ? saved : {}) };
}

function saveProfile(next) {
  settings.set("profile", { ...DEFAULT_PROFILE, ...next });
}

function validImageUrl(value) {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" || parsed.protocol === "http:";
  } catch {
    return false;
  }
}

export default {
  start() {
    // Keep startup safe: don't patch unknown Discord internals automatically.
    // The exact mobile profile component must be mapped for the installed build.
    const profile = readProfile();

    if (!validImageUrl(profile.avatarUrl) || !validImageUrl(profile.bannerUrl)) {
      saveProfile({
        ...profile,
        avatarUrl: validImageUrl(profile.avatarUrl) ? profile.avatarUrl : "",
        bannerUrl: validImageUrl(profile.bannerUrl) ? profile.bannerUrl : ""
      });
      toasts?.show?.("Fake Profile: invalid image URL cleared.");
    }

    console.info(`[${PLUGIN_ID}] loaded; local profile settings ready`, {
      enabled: profile.enabled,
      hasAvatar: Boolean(profile.avatarUrl),
      hasBanner: Boolean(profile.bannerUrl)
    });

    // TODO (device-specific integration):
    // 1. Inspect the current Discord mobile profile component via Unbound's Metro tools.
    // 2. Patch the smallest stable profile-render component with Patcher.after(...).
    // 3. Apply overrides only to the current user's local render / explicit preview.
    // 4. Keep original props intact for other users and always add a visible "LOCAL PREVIEW"
    //    indicator when displaying simulated profile effects or badges.
  },

  stop() {
    Patcher.unpatchAll();
  }
};

// Exported for debugger-based testing and future UI wiring.
export const FakeProfileLocal = {
  get: readProfile,
  set: saveProfile,
  reset() {
    settings.set("profile", { ...DEFAULT_PROFILE });
  },
  validateImageUrl: validImageUrl
};
