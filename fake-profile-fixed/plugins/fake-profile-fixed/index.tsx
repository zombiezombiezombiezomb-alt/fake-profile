
import { storage } from "@unbound-app/api";

const PLUGIN_ID = "unbound-fakeprofile";
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
  connections: [] as {
    id: string;
    label: string;
    url: string;
    icon: string;
  }[],
};

function validHttpsUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && !!url.hostname &&
      !url.username && !url.password;
  } catch {
    return false;
  }
}

function readProfile() {
  const saved = settings.get("profile", {});
  const profile = {
    ...DEFAULT_PROFILE,
    ...(saved && typeof saved === "object" ? saved : {}),
  };

  profile.connections = Array.isArray(profile.connections)
    ? profile.connections.slice(0, 20).filter((item) =>
        item &&
        typeof item.label === "string" &&
        typeof item.url === "string" &&
        validHttpsUrl(item.url)
      )
    : [];

  return profile;
}

function saveProfile(next: Partial<typeof DEFAULT_PROFILE>) {
  const profile = { ...readProfile(), ...next };
  profile.connections = Array.isArray(profile.connections)
    ? profile.connections.slice(0, 20)
    : [];
  settings.set("profile", profile);
  return profile;
}

export default {
  start() {
    saveProfile(readProfile());
    console.info("[Fake Profile Local] Loaded local profile data.");
  },
  stop() {},
};

export const FakeProfileLocal = {
  get: readProfile,
  set: saveProfile,
  reset() {
    settings.set("profile", { ...DEFAULT_PROFILE, connections: [] });
    return readProfile();
  },
  validateHttpsUrl: validHttpsUrl,
  addConnection(input: { label: string; url: string; icon?: string }) {
    const profile = readProfile();
    if (profile.connections.length >= 20) {
      throw new Error("You can add up to 20 custom connections.");
    }
    if (!input.label?.trim() || !validHttpsUrl(input.url)) {
      throw new Error("Enter a label and a valid HTTPS URL.");
    }

    const connection = {
      id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      label: input.label.trim().slice(0, 48),
      url: input.url.trim(),
      icon: input.icon?.trim().slice(0, 64) || "link",
    };

    return saveProfile({
      connections: [...profile.connections, connection],
    }).connections;
  },
  removeConnection(id: string) {
    const profile = readProfile();
    return saveProfile({
      connections: profile.connections.filter((item) => item.id !== id),
    });
  },
  previewModel() {
    const profile = readProfile();
    return {
      ...profile,
      previewLabel: "LOCAL PREVIEW — NOT YOUR DISCORD PROFILE",
      connections: profile.connections.map((connection) => ({
        ...connection,
        custom: true,
        localOnly: true,
        statusLabel: "CUSTOM · LOCAL",
      })),
    };
  },
};
