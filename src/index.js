import url from 'url';
import path from 'path';
import assert from 'assert';
import onFinished from 'on-finished';
import createDebug from 'debug';
import round from 'lodash/round';
import map from 'lodash/map';
import head from 'lodash/head';
import mixin from 'merge-descriptors';
import { EventEmitter } from 'events';

import SDStream from './sd-stream';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const ID = /^\d+$/;

const debug = createDebug('busybody');
const defaultStep = createDebug.humanize('6 hours');
const defaultWindow = 4;
const defaultPrecision = 2;
const defaultPreFilter = () => true;
const defaultPostFilter = () => true;
const defaultSanitize = req => {
  // get normalized pathname
  let { pathname } = url.parse(req.originalUrl);
  pathname = pathname || '/';
  pathname = pathname.toLowerCase();
  pathname = path.normalize(`${pathname}/./`);

  // sanitize each part of it
  return pathname
    .split('/')
    .map(part => {
      if (ID.test(part)) return ':id';
      if (UUID.test(part)) return ':uuid';
      return part;
    })
    .join('/');
};

function busybody({
  step = defaultStep,
  window = defaultWindow,
  precision = defaultPrecision,
  preFilter = defaultPreFilter,
  postFilter = defaultPostFilter,
  sanitize = defaultSanitize,
  onStep = null,
  onExpire = null,
} = {}) {
  assert(step >= 0, 'step must be a positive number');
  assert(window > 0, 'window must be a positive non-zero number');
  assert(precision >= 0, 'precision must be a positive number');
  assert(typeof preFilter === 'function', 'preFilter must be a function');
  assert(typeof postFilter === 'function', 'postfilter must be a function');
  assert(typeof sanitize === 'function', 'filter must be a function');

  const intervals = [];

  // calcs time from start in ms
  function diff(start) {
    const hr = process.hrtime(start);
    const ms = hr[0] * 1e3 + hr[1] / 1e6;
    return round(ms, precision);
  }

  function push(key, ms) {
    intervals.forEach(interval => {
      if (!interval.streams[key]) interval.streams[key] = new SDStream();
      interval.streams[key].push(ms);
    });
  }

  // onFinished listener to record response time
  function recordTime(err, res) {
    if (!res.req.busybody || !postFilter(err, res.req, res)) {
      return;
    }

    const key = sanitize(res.req, res);
    const start = res.req.busybody;
    const ms = diff(start);
    push(key, ms);
  }

  // the middleware function to track stats
  function statsMiddleware(req, res, next) {
    if (req.busybody || !preFilter(req, req)) {
      return next();
    }

    req.busybody = process.hrtime();
    onFinished(res, recordTime);

    return next();
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

  // adds a new interval
  function addInterval() {
    debug('adding new interval');
    const newStep = {
      since: (new Date()).toISOString(),
      streams: {},
    };

    if (intervals.length >= window) {
      debug('removing expired interval');
      statsMiddleware.emit('expire', head(intervals));
      intervals.shift();
    }

    intervals.push(newStep);
    statsMiddleware.emit('step', newStep);
  }

  // expose some properties/event emitter
  statsMiddleware.intervals = intervals;
  statsMiddleware.addInterval = addInterval;
  statsMiddleware.getStats = getStats;
  statsMiddleware.push = push;
  mixin(statsMiddleware, EventEmitter.prototype, false);

  if (typeof onStep === 'function') statsMiddleware.on('step', onStep);
  if (typeof onExpire === 'function') statsMiddleware.on('expire', onExpire);

  // start timing
  addInterval();
  if (step > 0) setInterval(addInterval, step);

  return statsMiddleware;
}

// export busybody and the default sanitize function
module.exports = busybody;
busybody.sanitize = defaultSanitize;
