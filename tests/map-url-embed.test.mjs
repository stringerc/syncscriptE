import assert from 'node:assert/strict';
import { extractFirstMapUrl, parseLatLngFromMapUrl } from '../src/utils/map-url-embed.mjs';

// --- extractFirstMapUrl
assert.equal(
  extractFirstMapUrl('See https://www.google.com/maps/@37.7749,-122.4194,15z for the spot.'),
  'https://www.google.com/maps/@37.7749,-122.4194,15z',
);
assert.equal(extractFirstMapUrl('no url here'), null);

// --- parseLatLngFromMapUrl (@ pattern — primary smoke-test case)
const at = parseLatLngFromMapUrl('https://www.google.com/maps/@37.7749,-122.4194,15z');
assert.deepEqual(at, { lat: 37.7749, lng: -122.4194 });

// OSM mlat/mlon
const osm = parseLatLngFromMapUrl('https://www.openstreetmap.org/?mlat=48.8584&mlon=2.2945#map=18/48.8584/2.2945');
assert.ok(osm && Math.abs(osm.lat - 48.8584) < 1e-6 && Math.abs(osm.lng - 2.2945) < 1e-6);

// !3d !4d (Places-style fragment) — must not include @lat,lng earlier in the path or @ wins first
const pd = parseLatLngFromMapUrl(
  'https://www.google.com/maps/place/Test/data=!3m1!1s0x0:0x0!3d40.7128!4d-74.0060',
);
assert.ok(pd && Math.abs(pd.lat - 40.7128) < 1e-6 && Math.abs(pd.lng - (-74.006)) < 1e-6);

// Short link: no coords in string
assert.equal(parseLatLngFromMapUrl('https://goo.gl/maps/abc123'), null);

console.log('map-url-embed: ok');
