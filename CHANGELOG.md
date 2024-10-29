# Changelog
All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [1.2.0] - 2024-10-04
### Changed
- Now fully supports the new events-based `observable` API.
- Uses `wrapargs: true` by observable option by default.
- Builder now supports extending existing Webservice instances!
- Moved to using `@lumjs/build` for building documentation.
- Extended and enhanced the documentation, including the examples.

## [1.1.0] - 2024-04-15
### Changed
- The `Builder` is now `observable` and has a `build` event observed.
- Replaced `DEFS.AUTO_IDS` with a new `@lumjs/core.UniqueObjectIds` instance.
- Updated `Webservice` to use the new `AUTO_IDS`, cleaning up the codebase.

## [1.0.0] - 2024-04-11
### Added
- Initial release.

[Unreleased]: https://github.com/supernovus/lum.web-service.js/compare/v1.2.0...HEAD
[1.2.0]: https://github.com/supernovus/lum.web-service.js/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/supernovus/lum.web-service.js/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/supernovus/lum.web-service.js/releases/tag/v1.0.0

