import assert from 'node:assert/strict';
import { parseScoreText, scoreOrder } from '../netlify/functions/leaderboard.mjs';

assert.ok(parseScoreText('165TCe') > 1e300, '165TCe should be parsed as a very large score');
assert.ok(parseScoreText('10DDcg') > 1e90, '10DDcg should be parsed as a very large score');
assert.ok(parseScoreText('10.1e672') > 1e600, 'scientific notation should remain comparable');
assert.ok(scoreOrder('165TCe') > scoreOrder('10DDcg'), 'suffix-based values should rank by their real magnitude');

const ordered = ['434', '8.5Qig', '8.74DCe', '10DDcg', '165TCe'].sort((a, b) => scoreOrder(b) - scoreOrder(a));
assert.deepEqual(ordered, ['165TCe', '10DDcg', '8.74DCe', '8.5Qig', '434']);

console.log('leaderboard ordering tests passed');
