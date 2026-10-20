# Unbound Fake Profile — Custom Connections update

This is an updated version of the original `unbound-fakeprofile-prototype.zip`.

Included:
- `unbound-fakeprofile/manifest.json` — version 0.3.0
- `unbound-fakeprofile/index.js` — local-only profile storage, connection validation, and add/edit/remove/reset helpers
- `unbound-fakeprofile/README.md` — setup and debugger examples

## Important
This implements the local data and preview model, not a finished on-screen editor. The custom connections are local mock data only and do not appear to other Discord users. They are explicitly labelled `CUSTOM · LOCAL` in the preview model. A visual editor/profile card integration requires testing against the exact Unbound and Discord app build.

For Unbound's current add-on API and lifecycle, consult the upstream project documentation before deploying: https://github.com/marioparaschiv/unbound
