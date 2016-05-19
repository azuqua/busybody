import url from 'url';
import path from 'path';
import assert from 'assert';
import onFinished from 'on-finished';
import DeviationStream from 'standard-deviation-stream';
import createDebug from 'debug';
import round from 'lodash/round';
import map from 'lodash/map';

const debug = createDebug('designer:util:stats');
const defaultStep = createDebug.humanize('6 hours');
const defaultWindow = 4;

function diff(start) {
  const hr = process.hrtime(start);
  const ms = hr[0] * 1e3 + hr[1] / 1e6;
  return round(ms, 2);
}

module.exports = ({
  step = defaultStep,
  _window = defaultWindow,
} = {}) => {
  const window = Math.floor(_window);
  assert(step >= 0, 'step must be a positive number');
  assert(window > 0, 'window must be a positive and non-zero number');

  const intervals = [];

  // adds a new interval
  function addInterval() {
    debug('adding new interval');
    const len = intervals.push({
      since: (new Date()).toISOString(),
      streams: {},
    });

    if (len > window) {
      debug('removing expired interval');
      intervals.shift();
    }
  }

  // returns the formatted stats of the oldest interval
  function getStats(sort = 'mean') {
    debug('calculating stats');
    const { since, streams } = intervals[0];

    const routes = map(streams, (stream, key) => ({
      route: key,
      count: round(stream.count(), 2),
      mean: round(stream.mean(), 2),
      standardDeviation: round(stream.standardDeviation(), 2),
      min: round(stream.min(), 2),
      max: round(stream.max(), 2),
    }));

    // sort in-place
    routes.sort((a, b) => b[sort] - a[sort]);

    return { since, routes };
  }

  // the middleware function to track stats
  function statsMiddleware(req, res, next) {
    // normalize pathname
    const { pathname } = url.parse(req.originalUrl);

    // attempt to sanitize common url patterns
    const key = path.normalize(`${pathname}/.`)
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/g, '/:uuid')
      .replace(/\/\d+/g, '/:id')
      .toLowerCase();

    // record start time
    const start = process.hrtime();

    // listen for response
    onFinished(res, () => {
      intervals.forEach(interval => {
        if (!interval.streams[key]) interval.streams[key] = new DeviationStream();
        interval.streams[key].push(diff(start));
      });
    });

    next();
  }


  // start timing
  addInterval();
  if (step > 0) setInterval(addInterval, step);

  statsMiddleware.intervals = intervals;
  statsMiddleware.addInterval = addInterval;
  statsMiddleware.getStats = getStats;
  return statsMiddleware;
};
