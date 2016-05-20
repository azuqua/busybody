# busybody

Your friendly neighborhood request tracker?

### Example

#### Setup
```js
import express from 'express';
import busybody from 'busybody';

const app = express();
const tracker = busybody();

app.use(tracker);

app.get('/stats', (req, res) => {
  res.send(tracker.getStats(req.query.sortBy));
});

app.get('/ping', (req, res) => {
  setTimeout(() => res.send('pong'), 100);
});

app.listen(8080, () => console.log('Server listening'));
```

#### Output
```json
{
  "since": "2016-05-19T21:18:44.362Z",
  "routes": [
    {
      "route": "/ping",
      "count": 4,
      "mean": 127.5,
      "standardDeviation": 25.5,
      "min": 96.3,
      "max": 153.4
    },
    {
      "route": "/stats",
      "count": 4,
      "mean": 1.7,
      "standardDeviation": 1.1,
      "min": 1,
      "max": 3.5
    }
  ]
}
```

### API

#### `busybody(options) -> tracker`
Creates a new tracker. Takes in the following options.
 * `step=21600000` - Time between steps in milliseconds. Defaults to 6 hours.
 * `window = 4` - Maximum steps to store.
 * `precision = 2` - Maximum decimals to round to.
 * `filter(req) -> boolean` - Custom function to filter requests.
 * `sanitize(req) -> string` - Custom function to sanitize a url. By default, removes querystring, ids, uuids, and casing.

#### `busybody.sanitize(req) -> string`
The builtin sanitization function. It makes the following transformations to `req.originalUrl`.
 1. Extract the pathname
 2. Normalize the pathname
 3. Replaces all numbers with `:id`
 4. Replaces all uuids with `:uuid`
 5. Makes everythign lowercase.

##### Example
```
> /path/../2/something?foo=bar
/:id/something/

> /foo/BAR/21/123e4567-e89b-12d3-a456-426655440000
/foo/bar/:id/:uuid/
```

#### `tracker(req, res, next)`
Express middleware that should be placed
above routes you want to keep stats about.

#### `tracker.getStats(sort = 'mean') -> object`
Returns the stats output.

The `sort` parameter can be `count`, `mean`, `standardDeviation`, `min`, or `max`.

#### Events
The middleware returned by busybody is also an [`EventEmitter`]() that exposes
the following events:
 * `step`
 * `expire`
