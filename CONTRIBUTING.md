# Contributing to OpenFurqan for the web

Thank you for helping. These few things keep OpenFurqan what it is.

## Before you start

For a small fix, open a pull request. For anything larger, open an issue first so we can agree on
the approach before you spend time on it.

## Set up

You need Node.js 24.

```sh
npm ci
npm test
```

Running the site itself needs the key to OpenFurqan's data service, which only the maintainers
hold. Without it you can run every check below, and we build and try your change with the data
before merging it.

## What we look for

- **The Quran text is never edited by hand.** The text, translations and tafsirs come from
  OpenFurqan's data service. If you find a mistake in them, open an issue with the edition, the
  surah and ayah, and your source.
- **Arabic stays right.** Right to left, in its own fonts, never cut off or reflowed.
- **Content comes before controls.** The interface stays quiet; a new feature earns its place.
- **Everyone can use it.** Keyboard, screen reader and every theme.
- **One change at a time.** A pull request does one thing, and says why.
- **Nothing private.** Never commit `.env` files, keys, downloaded data or build output.

## Before you open a pull request

Run the checks:

```sh
npm test
npm run lint
npm run check:themes
```

For a change people will see, describe what changes on screen; we'll add the screenshots.

## The data

Builds use the exact versions pinned in `data.lock.json`, and only maintainers update them. See
[docs/DATA.md](docs/DATA.md).

## Licence

By contributing, you agree that your contribution is licensed under the
[AGPL-3.0](LICENSE), like the rest of the code. Please also read the
[Code of Conduct](CODE_OF_CONDUCT.md).
