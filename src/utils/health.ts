import os from 'os';

export function getSystemHealth() {
  return {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memoryUsage: process.memoryUsage(),
    system: {
      platform: process.platform,
      arch: process.arch,
      nodeVersion: process.version,
      freeMemory: os.freemem(),
      totalMemory: os.totalmem(),
    },
  };
}
