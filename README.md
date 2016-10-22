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
 * `preFilter(req, res) -> boolean` - Custom function to filter tracked requests before they're handled.
 * `postFilter(err, req, res) -> boolean` - Custom function to filter tracked requests after they're handled.
 * `sanitize(req, res) -> string` - Custom function to sanitize a url. By default, removes querystring, ids, uuids, and casing.
 * `onStep(step)` - shortcut for `tracker.on('step', fn)` (see [Events](#events))
 * `onExpire(step)` - shortcut for `tracker.on('expire', fn)` (see [Events](#events))

#### `busybody.sanitize(req, res) -> string`
The default sanitization function. It makes the following transformations to `req.originalUrl`.
 1. Extract the pathname.
 2. Normalize the pathname.
 3. Replace all numbers with `:id`.
 4. Replace all uuids with `:uuid`.
 5. Make everything lowercase.

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

#### `tracker.push(path, ms)`
Manually track a path and duration.

#### Events
The middleware returned by busybody is also an [`EventEmitter`](https://nodejs.org/api/events.html#events_class_eventemitter) that exposes
the following events:
 * `expire` - emitted when a step is about to expire. Passed the expiring step.
 * `step` - emitted after a new step was created. Passed the new step.
