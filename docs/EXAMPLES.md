# Examples

## Basic Usage

This example shows how to create a new Webservice instance using a
Builder, then make some calls on it with multiple examples of how
different HTTP methods and arguments are handled.

```js
// Get a Builder instance to define the web service.
const wsb = require('@lumjs/web-service').make({id: 'demo'});
const {MIME} = wsb.DEFS; // A list of common MIME types.

const DOCS = '/docs/';
const DOC  = DOCS+'{docId}'; // Could also use ':docId' syntax.

const ws = wsb
  .content(MIME.JSON) // Content-Type: 'application/json'
  .accept(true)       // Accept: header.get('Content-Type')
  .get('listDocs',  DOCS)
  .post('newDoc',   DOCS)
  .get('getDoc',    DOC)
  .put('saveDoc',   DOC)
  .delete('delDoc', DOC)
  .build(); // Build the Webservice instance.

// Request path will be '/docs/'
ws.listDocs().then(data => console.log(data.docs));

// Request path will be '/docs/?author=me'
//
// This works as 'GET', 'HEAD', 'DELETE', and 'OPTIONS' will use the passed 
// options to build a query string if no `query` option is set.
ws.listDocs({author: "me"}).then(console.log);

// Request path will be '/docs/123'
//
// This works as the passed options will be used to look for
// URL placeholder values if no `vars` option is set.
ws.getDoc({docId: '123'});

// Request path will be '/docs/123?getProp=foo'
//
// The placeholder variables are removed from the options object
// before it is used to build the implicit query string.
ws.getDoc({docId: '123', getProp: 'foo'})

// Request path will be '/docs/321'
//
// JSON data payload will be:
// {"author":"me","text":"Hello world","now":true,"count": 42}
//
// This works as 'PUT', 'POST', and 'PATCH' will use the passed
// options to build the request body if no `body` option is set.
// Like the implicit query strings used with the other methods,
// the placeholder variables are removed from the options object
// before it is used to build the implicit request body.
ws.saveDoc(
{
  docId: 321, 
  author: 'me',
  text: "hello world",
  now: true,
  count: 42,
});

// Can specify everything using explicitly named options.
//
// Using named options is the only way that query strings can be used
// with the 'PUT', 'POST', and 'PATCH' HTTP methods.
//
// It's also the only way to set custom headers for a request.
//
// Request path will be '/docs/666?mode=2'
//
// JSON data payload will be something like:
// {"author":"me","date":"2024-04-11T22:45:00Z"}
//
// A custom 'X-My-Auth' header will be added, set to
// whatever myApp.getAuth() returns.
// 
// The 'Content-Type' and 'Accept' headers have NOT
// been manually specified, so they will still use the
// 'application/json' default value set by the builder.
ws.saveDoc(
{
  headers: {'X-My-Auth': myApp.getAuth()},
  vars:    {docId: 666},
  body:    {author: 'me', date: new Date()},
  query:   {mode: 2},
});
```
## Extending an existing Webservice

For this example we're going to extend an existing web-service.

We're using the `customWrappers` option so that custom HTTP methods
will add wrapper methods (the lowercase name of the HTTP method).

We'll also assume that `./ws.js` is the Webservice we defined in the
previous example (that we're now extending).

```js
const wsb = require('@lumjs/web-service').make(
{
  extend: require('./ws.js'),
  customWrappers: true,
});

const ws = wsb.http('UNDELETE', 'DELETE')
  .undelete('restoreDoc', '/docs/{docId}')
  .build(); // Extend the existing Webservice.

// Request -> UNDELETE /docs/420?all=true
ws.restoreDoc({docId: 420, all: true});

```
