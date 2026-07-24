import S3rver from 's3rver';
import fs from 'node:fs';

new S3rver({
  port: 4569,
  address: '0.0.0.0',
  silent: false,
  directory: '/tmp/claude-0/-home-user-PortfolioProjects/91641102-a8f3-5451-9b4c-3259c5422d3d/scratchpad/s3data',
  configureBuckets: [
    {
      name: 'surplus-flooring-listings',
      configs: [fs.readFileSync('/tmp/claude-0/-home-user-PortfolioProjects/91641102-a8f3-5451-9b4c-3259c5422d3d/scratchpad/cors.xml')],
    },
  ],
}).run((err, { address, port } = {}) => {
  if (err) { console.error(err); process.exit(1); }
  console.log(`s3rver listening on ${address}:${port}`);
});
