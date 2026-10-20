/*
 * Fake Profile (Local) — Unbound iOS
 * v0.3.0 — local custom connections
 *
 * All values are stored in Unbound's local plugin storage. This plugin does not
 * call Discord's API, create real Discord connections, or make them visible to
 * other users. The exported preview model labels every connection as CUSTOM · LOCAL.
 */

import { patcher, storage, toasts } from "@unbound-app/api";

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
  showPreviewLabel: true,
  connections: []
};

const MAX_CONNECTIONS = 20;
const MAX_LABEL = 48;
const MAX_ICON = 64;
const MAX_URL = 2048;
const ALLOWED_ICON_CHARS = /^[a-zA-Z0-9 _.-]+$/;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function validHttpsUrl(value) {
  if (typeof value !== "string" || value.length === 0 || value.length > MAX_URL) return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === "https:" && Boolean(parsed.hostname) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function cleanString(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

function normalizeConnection(input, index = 0) {
  if (!isRecord(input)) return null;
  const label = cleanString(input.label, MAX_LABEL);
  const url = cleanString(input.url, MAX_URL);
  const icon = cleanString(input.icon, MAX_ICON);

  if (!label || !validHttpsUrl(url)) return null;
  // Icons are plain icon names/emoji/text labels, not arbitrary HTML or remote markup.
  if (icon && !ALLOWED_ICON_CHARS.test(icon) && !/^\p{Extended_Pictographic}+$/u.test(icon)) return null;

  const id = cleanString(input.id, 80) || `connection-${index + 1}`;
  return { id, label, url, icon: icon || "link" };
}

function normalizeConnections(value) {
  if (!Array.isArray(value)) return [];
  const seen = new Set();
  const result = [];
  for (const item of value.slice(0, MAX_CONNECTIONS * 2)) {
    const normalized = normalizeConnection(item, result.length);
    if (!normalized || seen.has(normalized.id)) continue;
    seen.add(normalized.id);
    result.push(normalized);
    if (result.length >= MAX_CONNECTIONS) break;
  }
  return result;
}

function readProfile() {
  const saved = settings.get("profile", {});
  const merged = { ...DEFAULT_PROFILE, ...(isRecord(saved) ? saved : {}) };
  merged.displayName = cleanString(merged.displayName, 80);
  merged.username = cleanString(merged.username, 40);
  merged.bio = cleanString(merged.bio, 190);
  merged.accentColor = /^#[0-9a-fA-F]{6}$/.test(merged.accentColor) ? merged.accentColor : DEFAULT_PROFILE.accentColor;
  merged.avatarUrl = merged.avatarUrl && validHttpsUrl(merged.avatarUrl) ? merged.avatarUrl : "";
  merged.bannerUrl = merged.bannerUrl && validHttpsUrl(merged.bannerUrl) ? merged.bannerUrl : "";
  merged.connections = normalizeConnections(merged.connections);
  merged.showPreviewLabel = merged.showPreviewLabel !== false;
  return merged;
}

function saveProfile(next) {
  const merged = { ...readProfile(), ...(isRecord(next) ? next : {}) };
  merged.displayName = cleanString(merged.displayName, 80);
  merged.username = cleanString(merged.username, 40);
  merged.bio = cleanString(merged.bio, 190);
  merged.accentColor = /^#[0-9a-fA-F]{6}$/.test(merged.accentColor) ? merged.accentColor : DEFAULT_PROFILE.accentColor;
  merged.avatarUrl = merged.avatarUrl && validHttpsUrl(merged.avatarUrl) ? merged.avatarUrl : "";
  merged.bannerUrl = merged.bannerUrl && validHttpsUrl(merged.bannerUrl) ? merged.bannerUrl : "";
  merged.connections = normalizeConnections(merged.connections);
  merged.showPreviewLabel = merged.showPreviewLabel !== false;
  settings.set("profile", merged);
  return merged;
}

function makeId() {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function addConnection(input) {
  const profile = readProfile();
  if (profile.connections.length >= MAX_CONNECTIONS) {
    throw new Error(`You can add up to ${MAX_CONNECTIONS} custom connections.`);
  }
  const normalized = normalizeConnection({ ...input, id: input?.id || makeId() }, profile.connections.length);
  if (!normalized) {
    throw new Error("Connection needs a label, an HTTPS URL, and a simple icon name or emoji.");
  }
  if (profile.connections.some(item => item.id === normalized.id)) {
    throw new Error("A connection with that ID already exists.");
  }
  return saveProfile({ connections: [...profile.connections, normalized] }).connections;
}

function updateConnection(id, changes) {
  const profile = readProfile();
  let found = false;
  const connections = profile.connections.map(item => {
    if (item.id !== id) return item;
    found = true;
    const normalized = normalizeConnection({ ...item, ...(isRecord(changes) ? changes : {}), id });
    if (!normalized) throw new Error("Invalid connection. Use a label, HTTPS URL, and valid icon.");
    return normalized;
  });
  if (!found) throw new Error("Connection not found.");
  return saveProfile({ connections }).connections;
}

function removeConnection(id) {
  const profile = readProfile();
  const connections = profile.connections.filter(item => item.id !== id);
  if (connections.length === profile.connections.length) return false;
  saveProfile({ connections });
  return true;
}

function resetConnections() {
  saveProfile({ connections: [] });
}

export default {
  start() {
    // Persist normalized values on startup; no unverified Discord UI component patches.
    const before = settings.get("profile", {});
    const profile = saveProfile(before);
    console.info(`[${PLUGIN_ID}] loaded; ${profile.connections.length} local custom connection(s).`);
  },
  stop() {
    Patcher.unpatchAll();
  }
};

/**
 * Developer/debugger API. Use FakeProfileLocal.previewModel() to build a local
 * preview. Every connection is marked custom/local and is never represented as
 * an official Discord connection or verification badge.
 */
export const FakeProfileLocal = {
  get: readProfile,
  set: saveProfile,
  reset() {
    settings.set("profile", { ...DEFAULT_PROFILE, connections: [] });
    return readProfile();
  },
  validateHttpsUrl: validHttpsUrl,
  addConnection,
  updateConnection,
  removeConnection,
  resetConnections,
  previewModel() {
    const profile = readProfile();
    return {
      ...profile,
      previewLabel: "LOCAL PREVIEW — NOT YOUR DISCORD PROFILE",
      connections: profile.connections.map(connection => ({
        ...connection,
        displayLabel: connection.label,
        custom: true,
        localOnly: true,
        statusLabel: "CUSTOM · LOCAL"
      }))
    };
  }
};
