# Data

## Where it comes from

The Quran text, translations, tafsirs, word data and Mushaf page fonts come from OpenFurqan's own
data service, which publishes them as bundles. A bundle's file name carries its checksum, so a
published file never changes.

The service is private. A build needs the maintainers' key, `OPENFURQAN_DATA_KEY`, and stops with
a message saying so when it is missing.

## How a build gets it

`data.lock.json` pins every bundle the site uses: its file name, size and SHA-256.
`npm run dev` and `npm run build` first run `scripts/prepare-data.mjs`, which:

1. downloads each pinned bundle it doesn't have yet,
2. checks its size and SHA-256, and stops if either is wrong,
3. unpacks it into `.openfurqan-data/`, which git ignores.

The server routes in `app/api/` then read from there. Later runs reuse what was downloaded.

The Mushaf page fonts (QCF V2, one font per page) come in 30 parts, one per juz. A page shared by
two juz belongs to the first.

## Updating

A build always uses the versions in the lock, even when a newer release is out. To update:

```sh
npm run data:update     # pins the latest release in data.lock.json
git diff data.lock.json # review what changed
npm run data:prepare    # downloads and checks it
```

To try a release before it is published, set `OPENFURQAN_DATA_MIRROR` to another HTTPS or local
address that serves the same files. The checksums in the lock still apply, and the key is never
sent to a mirror.

## Prayer locations

City names, coordinates and time zones come from [GeoNames](https://www.geonames.org), adapted under
[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/). The list ships with the code in
`app/data/`, so prayer times need nothing downloaded. `scripts/geonames-major-cities.json` records
the source and checksum of the larger cities added to it.
