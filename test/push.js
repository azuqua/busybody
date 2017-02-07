import busybody from '../src';

describe('tracker.push()', () => {

  it('should add a custom value', () => {
    const tracker = busybody();
    tracker.push('foo', 100);

    expect(tracker.getStats().routes[0]).to.deep.equal({
      route: 'foo',
      count: 1,
      mean: 100,
      standardDeviation: 0,
      min: 100,
      max: 100
    });
  });

  it('should stop tracking after maxSize has been reached', () => {
    const tracker = busybody({ maxSize: 2 });

    tracker.push('foo', 1);
    tracker.push('foo', 1);
    tracker.push('bar', 2);
    tracker.push('baz', 3);

    const stats = tracker.getStats();
    expect(stats.closed).to.equal(true);
    expect(stats.routes).to.deep.equal([
      {
        route: 'bar',
        count: 1,
        mean: 2,
        standardDeviation: 0,
        min: 2,
        max: 2,
      },
      {
        route: 'foo',
        count: 2,
        mean: 1,
        standardDeviation: 0,
        min: 1,
        max: 1,
      }
    ])
  })
})
