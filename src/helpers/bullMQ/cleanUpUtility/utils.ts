import { getAllQueues } from '../../../DB/bullMQ';
import { errorLogger, logger } from '../../../shared/logger';
import colors from 'colors';
// Clean completed jobs from all queues
export async function cleanAllCompletedJobs(olderThanHours: number = 24) {
     try {
          const queues = getAllQueues();
          const results: Record<string, number> = {};

          for (const [name, queue] of Object.entries(queues)) {
               const removed = await queue.clean(olderThanHours * 60 * 60 * 1000, 100, 'completed');
               results[name] = removed.length;
               logger.info(
                    colors.green(`✅ Cleaned ${removed.length} completed jobs from ${name} queue`),
               );
          }

          return results;
     } catch (error) {
          errorLogger.error(colors.red('Failed to clean completed jobs:'), error);
          throw error;
     }
}

// Clean failed jobs from all queues
export async function cleanAllFailedJobs(olderThanDays: number = 7) {
     try {
          const queues = getAllQueues();
          const results: Record<string, number> = {};

          for (const [name, queue] of Object.entries(queues)) {
               const removed = await queue.clean(
                    olderThanDays * 24 * 60 * 60 * 1000,
                    100,
                    'failed',
               );
               results[name] = removed.length;
               logger.info(
                    colors.green(`✅ Cleaned ${removed.length} failed jobs from ${name} queue`),
               );
          }

          return results;
     } catch (error) {
          errorLogger.error(colors.red('Failed to clean failed jobs:'), error);
          throw error;
     }
}

// Pause a queue
export async function pauseQueue(queueName: string) {
     try {
          const queues = getAllQueues();
          const queue = queues[queueName as keyof typeof queues];

          if (!queue) {
               throw new Error(`Queue ${queueName} not found`);
          }

          await queue.pause();
          logger.info(colors.yellow(`⏸️  Queue ${queueName} paused`));
          return true;
     } catch (error) {
          errorLogger.error(colors.red(`Failed to pause queue ${queueName}:`), error);
          throw error;
     }
}

// Resume a queue
export async function resumeQueue(queueName: string) {
     try {
          const queues = getAllQueues();
          const queue = queues[queueName as keyof typeof queues];

          if (!queue) {
               throw new Error(`Queue ${queueName} not found`);
          }

          await queue.resume();
          logger.info(colors.green(`▶️  Queue ${queueName} resumed`));
          return true;
     } catch (error) {
          errorLogger.error(colors.red(`Failed to resume queue ${queueName}:`), error);
          throw error;
     }
}

// Drain a queue (remove all waiting jobs)
export async function drainQueue(queueName: string) {
     try {
          const queues = getAllQueues();
          const queue = queues[queueName as keyof typeof queues];

          if (!queue) {
               throw new Error(`Queue ${queueName} not found`);
          }

          await queue.drain();
          logger.info(colors.yellow(`🗑️  Queue ${queueName} drained`));
          return true;
     } catch (error) {
          errorLogger.error(colors.red(`Failed to drain queue ${queueName}:`), error);
          throw error;
     }
}

// Obliterate a queue (remove all jobs including active)
export async function obliterateQueue(queueName: string) {
     try {
          const queues = getAllQueues();
          const queue = queues[queueName as keyof typeof queues];

          if (!queue) {
               throw new Error(`Queue ${queueName} not found`);
          }

          await queue.obliterate({ force: true });
          logger.info(colors.red(`💥 Queue ${queueName} obliterated`));
          return true;
     } catch (error) {
          errorLogger.error(colors.red(`Failed to obliterate queue ${queueName}:`), error);
          throw error;
     }
}

// Get failed jobs from a queue
export async function getFailedJobs(queueName: string, start: number = 0, end: number = 10) {
     try {
          const queues = getAllQueues();
          const queue = queues[queueName as keyof typeof queues];

          if (!queue) {
               throw new Error(`Queue ${queueName} not found`);
          }

          const jobs = await queue.getFailed(start, end);
          return jobs.map((job) => ({
               id: job.id,
               name: job.name,
               data: job.data,
               failedReason: job.failedReason,
               attemptsMade: job.attemptsMade,
               timestamp: job.timestamp,
               processedOn: job.processedOn,
               finishedOn: job.finishedOn,
          }));
     } catch (error) {
          errorLogger.error(colors.red(`Failed to get failed jobs from ${queueName}:`), error);
          throw error;
     }
}

// Get completed jobs from a queue
export async function getCompletedJobs(queueName: string, start: number = 0, end: number = 10) {
     try {
          const queues = getAllQueues();
          const queue = queues[queueName as keyof typeof queues];

          if (!queue) {
               throw new Error(`Queue ${queueName} not found`);
          }

          const jobs = await queue.getCompleted(start, end);
          return jobs.map((job) => ({
               id: job.id,
               name: job.name,
               data: job.data,
               returnvalue: job.returnvalue,
               timestamp: job.timestamp,
               processedOn: job.processedOn,
               finishedOn: job.finishedOn,
          }));
     } catch (error) {
          errorLogger.error(colors.red(`Failed to get completed jobs from ${queueName}:`), error);
          throw error;
     }
}

// Get active jobs from a queue
export async function getActiveJobs(queueName: string) {
     try {
          const queues = getAllQueues();
          const queue = queues[queueName as keyof typeof queues];

          if (!queue) {
               throw new Error(`Queue ${queueName} not found`);
          }

          const jobs = await queue.getActive();
          return jobs.map((job) => ({
               id: job.id,
               name: job.name,
               data: job.data,
               progress: job.progress,
               timestamp: job.timestamp,
               processedOn: job.processedOn,
          }));
     } catch (error) {
          errorLogger.error(colors.red(`Failed to get active jobs from ${queueName}:`), error);
          throw error;
     }
}

// Get waiting jobs from a queue
export async function getWaitingJobs(queueName: string, start: number = 0, end: number = 10) {
     try {
          const queues = getAllQueues();
          const queue = queues[queueName as keyof typeof queues];

          if (!queue) {
               throw new Error(`Queue ${queueName} not found`);
          }

          const jobs = await queue.getWaiting(start, end);
          return jobs.map((job) => ({
               id: job.id,
               name: job.name,
               data: job.data,
               timestamp: job.timestamp,
               delay: job.opts.delay,
          }));
     } catch (error) {
          errorLogger.error(colors.red(`Failed to get waiting jobs from ${queueName}:`), error);
          throw error;
     }
}

// Retry all failed jobs in a queue
export async function retryAllFailedJobs(queueName: string) {
     try {
          const queues = getAllQueues();
          const queue = queues[queueName as keyof typeof queues];

          if (!queue) {
               throw new Error(`Queue ${queueName} not found`);
          }

          const failedJobs = await queue.getFailed();
          let retriedCount = 0;

          for (const job of failedJobs) {
               try {
                    await job.retry();
                    retriedCount++;
               } catch (err) {
                    errorLogger.error(colors.red(`Failed to retry job ${job.id}:`), err);
               }
          }

          logger.info(
               colors.green(
                    `✅ Retried ${retriedCount}/${failedJobs.length} failed jobs in ${queueName}`,
               ),
          );
          return { total: failedJobs.length, retried: retriedCount };
     } catch (error) {
          errorLogger.error(colors.red(`Failed to retry failed jobs in ${queueName}:`), error);
          throw error;
     }
}

// Get detailed queue metrics
export async function getDetailedQueueMetrics(queueName: string) {
     try {
          const queues = getAllQueues();
          const queue = queues[queueName as keyof typeof queues];

          if (!queue) {
               throw new Error(`Queue ${queueName} not found`);
          }

          const [
               waiting,
               active,
               completed,
               failed,
               delayed,
               paused,
               waitingChildren,
               prioritized,
          ] = await Promise.all([
               queue.getWaitingCount(),
               queue.getActiveCount(),
               queue.getCompletedCount(),
               queue.getFailedCount(),
               queue.getDelayedCount(),
               queue.isPaused(),
               queue.getWaitingChildrenCount(),
               queue.getPrioritizedCount(),
          ]);

          const workers = await queue.getWorkers();
          const repeatableJobs = await queue.getRepeatableJobs();

          return {
               name: queueName,
               counts: {
                    waiting,
                    active,
                    completed,
                    failed,
                    delayed,
                    waitingChildren,
                    prioritized,
                    total: waiting + active + delayed + prioritized,
               },
               status: {
                    paused,
                    workersCount: workers.length,
                    repeatableJobsCount: repeatableJobs.length,
               },
               workers: workers.map((w) => ({
                    id: w.id,
                    name: w.name,
                    isRunning: w.isRunning,
               })),
               repeatableJobs: repeatableJobs.map((j) => ({
                    id: j.id,
                    name: j.name,
                    pattern: j.pattern,
                    next: j.next,
               })),
          };
     } catch (error) {
          errorLogger.error(colors.red(`Failed to get detailed metrics for ${queueName}:`), error);
          throw error;
     }
}
