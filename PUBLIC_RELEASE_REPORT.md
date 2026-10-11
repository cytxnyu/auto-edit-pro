# Auto Edit Pro 0.7.1 — public package verification

Repository: [cytxnyu/auto-edit-pro](https://github.com/cytxnyu/auto-edit-pro)

## Shipped behavior

- One registered visual style per beat and no reuse across a video; saved seeds, pools and assignments remain reproducible. Exhausted pools stop planning instead of silently repeating styles.
- Ten frame-driven semantic stage layouts and 71 registered visual directions. Catalog size is not a claim that every style has passed aesthetic review for a particular video.
- Bound Gate A/B/C/D workflow with 15-item real-composition review. Explicit current-job delegation changes the reviewer, not the checks or failure blocking.
- Readable semantic settling, PNG frame inputs, CRF 14 H.264, BT.709 metadata, exact rounded frame boundaries, and a bound continuous PCM audio master for final muxing.
- Source footage and authentic job evidence are supplied separately. A passing build or test suite does not certify a user's final video.

## Changes in 0.7.1

- Optional static `stage.contentRegion` and `stage.styleRegion` reserve independently authored normalized subviewports within one stage and one assigned style. Invalid, non-finite, out-of-bounds and keyframed region declarations are rejected. Omitted/full regions preserve the existing layout; semantic typography remains in physical pixels.
- Partial style regions render the actual registered backdrop at their physical dimensions and retain a same-palette canvas outside them. Transparent stages remain transparent. Region placement is not a fixed left/right template and does not waive real-composition review.
- Galaxy star density/size/contrast and depth travel are strengthened; SpotlightCard illumination and FluidGlass lens boundaries are more visible. This changes renderer fingerprints and requires fresh bound visual review, not reuse of an older aesthetic approval.
- 124 additional tests cover region schema, all ten semantic layouts, physical sizing, single-backdrop identity, transparent/default compatibility, seek-stability, StyleProof parity and the three visibility fixes. The source-video rendering branch is unchanged.

## Verification completed for this snapshot

| Check | Result |
|---|---|
| Vitest full suite | `Test Files 39 passed (39)`; `Tests 1024 passed (1024)`; exit 0 |
| TypeScript `tsc --noEmit` | exit 0 |
| `npm run build` | exit 0; VideoPackaging, StyleProof and three synthetic demo compositions discovered |
| Public source scan | no credentials, private media, oversized files or private local paths in the candidate set |
| Runtime identity | 110 package/script/manifest files match the tested implementation byte-for-byte |

The package preserves the tested package name, version and dependency lockfile. `.gitattributes` disables newline normalization so published source bytes retain their implementation hashes. `docs/EXAMPLES.md` documents public synthetic examples rather than a historical private-media case; `docs/USAGE.md` identifies this repository and the current 0.7.1 workflow. SHA-256 values for every other public file are listed in `SHA256SUMS.txt`.

## Dependency audit status

`npm audit --omit=dev` completed with exit 1: 3 high and 1 moderate advisories in the existing pinned transitive dependency set. This release does **not** claim a clean dependency audit. The dependency lockfile was not changed during publication; the repository's CI audit step remains enabled.

| Package | Severity | Registry advisory |
|---|---|---|
| fast-uri | high | [GHSA-5jgf-p345-68v8](https://github.com/advisories/GHSA-5jgf-p345-68v8) and related normalization advisories reported by npm |
| js-yaml | high | [GHSA-2883-xcg3-v3hh](https://github.com/advisories/GHSA-2883-xcg3-v3hh) |
| source-map-js | high | [GHSA-68fv-2mgg-jv7q](https://github.com/advisories/GHSA-68fv-2mgg-jv7q) |
| postcss-selector-parser | moderate | [GHSA-rj75-hqrm-r3gf](https://github.com/advisories/GHSA-rj75-hqrm-r3gf) |

## Public package boundary and attribution

The package includes source, tests, workflow documentation, license notices and one synthetic SRT fixture. It excludes personal source/final videos, real-person previews, historical private-case metadata, review logs, local audit directories and credentials. The synthetic media commands generate their outputs locally; media is not bundled.

Original Nana AI copyright and MIT terms are retained in [LICENSE](LICENSE) and [NOTICE](NOTICE). Remotion and optional HyperFrames retain their upstream licensing terms. The local frame-driven style interpretations are documented with reference links; the package does not redistribute the React Bits repository.