import _ from 'lodash';
import SDStream  from '../src/sd-stream';

describe('SDStream', function () {
  let stream = null;

  beforeEach(function() {
    stream = new SDStream();
  });

  it('should produce some reasonable values', function () {
    _.each(
      [0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100, 0, 100],
      function (item) {
        stream.push(item);
      }
    );

    expect(stream.count()).to.equal(30);
    expect(stream.mean()).to.equal(50);
    expect(stream.standardDeviation()).to.be.above(49).below(51);
    expect(stream.min()).to.equal(0);
    expect(stream.max()).to.equal(100);
  });

  it('should produce some reasonable values', function () {
    _.each(
      [0, 25, 50, 75, 100, 0, 25, 50, 75, 100, 0, 25, 50, 75, 100, 0, 25, 50, 75, 100, 0, 25, 50, 75, 100,
       0, 25, 50, 75, 100, 0, 25, 50, 75, 100, 0, 25, 50, 75, 100, 0, 25, 50, 75, 100, 0, 25, 50, 75, 100],
      function (item) {
        stream.push(item);
      }
    );

    expect(stream.count()).to.equal(50);
    expect(stream.mean()).to.equal(50);
    expect(stream.standardDeviation()).to.be.above(35).below(36);
    expect(stream.min()).to.equal(0);
    expect(stream.max()).to.equal(100);
  });
});
