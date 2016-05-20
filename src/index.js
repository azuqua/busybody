import url from 'url';
import path from 'path';
import assert from 'assert';
import onFinished from 'on-finished';
import SDStream from 'standard-deviation-stream';
import createDebug from 'debug';
import round from 'lodash/round';
import map from 'lodash/map';

const UUID = /\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\//g;
const ID = /\/\d+\//g;

const debug = createDebug('busybody');
const defaultStep = createDebug.humanize('6 hours');
const defaultWindow = 4;
const defaultPrecision = 2;
const defaultFilter = () => true;
const defaultSanitize = req => {
  const { pathname } = url.parse(req.originalUrl);

  // attempt to normalize/sanitize common url patterns
  return path.normalize(`${pathname}/./`) // makes a url like /path/to/
    .replace(UUID, '/:uuid/')
    .replace(ID, '/:id/')
    .toLowerCase();
};

module.exports = ({
  step = defaultStep,
  window = defaultWindow,
  precision = defaultPrecision,
  filter = defaultFilter,
  sanitize = defaultSanitize,
} = {}) => {
  assert(step >= 0, 'step must be a positive number');
  assert(window > 0, 'window must be a positive non-zero number');
  assert(precision >= 0, 'precision must be a positive number');
  assert(typeof filter === 'function', 'filter must be a function');
  assert(typeof sanitize === 'function', 'filter must be a function');

  const intervals = [];

  // calcs time from start in ms
  function diff(start) {
    const hr = process.hrtime(start);
    const ms = hr[0] * 1e3 + hr[1] / 1e6;
    return round(ms, precision);
  }

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
      count: stream.count(),
      mean: round(stream.mean(), precision),
      standardDeviation: round(stream.standardDeviation(), precision),
      min: round(stream.min(), precision),
      max: round(stream.max(), precision),
    }));

    // sort in-place
    routes.sort((a, b) => b[sort] - a[sort]);
    return { since, routes };
  }

  // the middleware function to track stats
  function statsMiddleware(req, res, next) {
    if (!filter(req)) {
      return next();
    }

    const key = sanitize(req);
    const start = process.hrtime();

    // listen for response
    onFinished(res, () => {
      intervals.forEach(interval => {
        if (!interval.streams[key]) interval.streams[key] = new SDStream();
        interval.streams[key].push(diff(start));
      });
    });

    return next();
  }

  // start timing
  addInterval();
  if (step > 0) setInterval(addInterval, step);

  // expose some properties and return middleware
  statsMiddleware.intervals = intervals;
  statsMiddleware.addInterval = addInterval;
  statsMiddleware.getStats = getStats;
  return statsMiddleware;
};
