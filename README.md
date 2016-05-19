# strats

> stats. routes. strats?

### Example

#### Setup
```js
import express from 'express';
import strats from 'strats';

const app = express();
const tracker = strats();

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

#### `strats(options) -> tracker`
Creates a new tracker. Takes in the following options.
 * `step` - _integer_. Time between steps in milliseconds.
 * `window` - _integer_. Maximum steps to store.

#### `tracker(req, res, next)`
Express middleware that should be placed
above routes you want to keep stats about.

#### `tracker.getStats(sortBy = 'mean') -> object`
Returns the stats output.

The `sortBy` parameter can be `count`, `mean`, `standardDeviation`, `min`, or `max`.
