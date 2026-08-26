import os from 'os';

const formatBytes = (bytes: number) => {
     return {
          bytes,
          GB: +(bytes / 1024 / 1024 / 1024).toFixed(2),
          MB: +(bytes / 1024 / 1024).toFixed(0),
     };
};

const formatUptime = (seconds: number) => {
     const days = Math.floor(seconds / 86400);
     seconds %= 86400;
     const hours = Math.floor(seconds / 3600);
     seconds %= 3600;
     const minutes = Math.floor(seconds / 60);
     return { days, hours, minutes };
};

const serverHealth = async () => {
     const totalMemory = os.totalmem();
     const freeMemory = os.freemem();
     const usedMemory = totalMemory - freeMemory;

     return {
          cpuCores: os.cpus().length,
          loadAverage: {
               '1min': os.loadavg()[0],
               '5min': os.loadavg()[1],
               '15min': os.loadavg()[2],
          },
          memory: {
               totalMemory: formatBytes(totalMemory),
               freeMemory: formatBytes(freeMemory),
               usedMemory: formatBytes(usedMemory),
               usedMemoryPercentage: +((usedMemory / totalMemory) * 100).toFixed(2),
          },
          uptime: formatUptime(os.uptime()),
          timestamp: new Date().toISOString(),
     };
};

export const ServerHealthServices = {
     serverHealth,
};
