# lum.web-service.js

A package for defining web service APIs in web apps.

## Summary

Is not a port of my old webservice.js from the old Lum.js/Nano.js collection.
Instead it is an entirely new package written from the ground up, and uses
the [Fetch], [URL], and [File] APIs that all modern browsers support.

If the client browser doesn't support those APIs, this library is useless,
but if the browser doesn't support those APIs, it's ancient, obsolete,
and entirely unsupported. YMMV.

## TODO

Nothing too high up on the priority list, but a few _would like_ features:

- Helpers to make working with binary (`Blob`, etc.) _Request_ data easier.
- Helpers to make working with `FormData` _Request_ data easier.
- Helpers to make working with binary _Response_ data easier.

## [Examples](docs/EXAMPLES.md)

## Official URLs

This library can be found in two places:

 * [Github](https://github.com/supernovus/lum.web-service.js)
 * [NPM](https://www.npmjs.com/package/@lumjs/web-service)

## Author

Timothy Totten <2010@totten.ca>

## License

[MIT](https://spdx.org/licenses/MIT.html)


[Fetch]: https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API
[URL]: https://developer.mozilla.org/en-US/docs/Web/API/URL_API
[File]: https://developer.mozilla.org/en-US/docs/Web/API/File_API
