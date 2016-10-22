import busybody from '../src';

describe('tracker.push()', () => {
  let tracker = null;

  beforeEach(() => {
    tracker = busybody({ step: 0 });
  });

  it('should add a custom value', () => {
    tracker.push('foo', 100);

    expect(tracker.getStats().routes[0]).to.deep.equal({ route: 'foo',
      count: 1,
      mean: 100,
      standardDeviation: 0,
      min: 100,
      max: 100
    });
  });
})
