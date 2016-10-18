const sanitize = require('../src').sanitize;

describe('sanitize', () => {

  [
    { before: '/', after: '/' },
    { before: '/1', after: '/:id/' },
    { before: '/12', after: '/:id/' },
    { before: '/foo/123', after: '/foo/:id/' },
    { before: '/1/2/3/foo', after: '/:id/:id/:id/foo/' },
    { before: '/123e4567-e89b-12d3-a456-426655440000/foo', after: '/:uuid/foo/' },
    { before: '/123e4567-e89b-12d3-a456-426655440000/123e4567-e89b-12d3-a456-426655440000/', after: '/:uuid/:uuid/' },
    { before: '/foo/123e4567-e89b-12d3-a456-426655440000/foo', after: '/foo/:uuid/foo/' },
    { before: '/1/2/123e4567-e89b-12d3-a456-426655440000/123e4567-e89b-12d3-a456-426655440000', after: '/:id/:id/:uuid/:uuid/' },
    { before: '', after: '/' },
    { before: '/foo/../foo/..', after: '/' },
  ].forEach(test => it(`should handle ${test.before}`, () => {
    const originalUrl = test.before;
    expect(sanitize({ originalUrl })).to.equal(test.after);
  }));

})
