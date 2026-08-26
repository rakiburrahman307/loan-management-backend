import colors from 'colors';
import { getAllQueues, getAllQueuesStats } from '../../DB/bullMQ';
import { errorLogger, logger } from '../../shared/logger';
import { QueueStats } from './bullInterface';
import { cleanAllCompletedJobs, cleanAllFailedJobs } from './cleanUpUtility/utils';

export async function checkQueueHealth(): Promise<{
     healthy: boolean;
     queues: Record<string, any>;
     issues: string[];
     timestamp: Date;
}> {
     try {
          const queues = getAllQueues();
          const issues: string[] = [];
          const queueHealth: Record<string, any> = {};

          for (const [name, queue] of Object.entries(queues)) {
               try {
                    const [waiting, active, failed, paused] = await Promise.all([
                         queue.getWaitingCount(),
                         queue.getActiveCount(),
                         queue.getFailedCount(),
                         queue.isPaused(),
                    ]);

                    queueHealth[name] = {
                         status: paused ? 'paused' : 'active',
                         waiting,
                         active,
                         failed,
                         healthy: failed < 100 && !paused, // Failed jobs less than 100
                    };

                    // Check for issues
                    if (paused) {
                         issues.push(`Queue ${name} is paused`);
                    }

                    if (failed > 100) {
                         issues.push(`Queue ${name} has ${failed} failed jobs`);
                    }

                    if (waiting > 1000) {
                         issues.push(
                              `Queue ${name} has ${waiting} waiting jobs (possible backlog)`,
                         );
                    }

                    if (active > 50) {
                         issues.push(`Queue ${name} has ${active} active jobs (high load)`);
                    }
               } catch (error) {
                    issues.push(`Failed to check ${name} queue: ${error}`);
                    queueHealth[name] = { status: 'error', healthy: false };
               }
          }

          const healthy = issues.length === 0;

          if (healthy) {
               logger.info(colors.green('✅ All queues are healthy'));
          } else {
               logger.warn(colors.yellow(`⚠️  ${issues.length} queue health issues found`));
               issues.forEach((issue) => logger.warn(colors.yellow(`   - ${issue}`)));
          }

          return {
               healthy,
               queues: queueHealth,
               issues,
               timestamp: new Date(),
          };
     } catch (error) {
          errorLogger.error(colors.red('Failed to check queue health:'), error);
          throw error;
     }
}

// ==========================================
// PERFORMANCE MONITORING
// ==========================================
export async function getQueuePerformanceMetrics(): Promise<Record<string, any>> {
     try {
          const queues = getAllQueues();
          const metrics: Record<string, any> = {};

          for (const [name, queue] of Object.entries(queues)) {
               const jobs = await queue.getCompleted(0, 100);

               if (jobs.length === 0) {
                    metrics[name] = {
                         avgProcessingTime: 0,
                         minProcessingTime: 0,
                         maxProcessingTime: 0,
                         throughput: 0,
                    };
                    continue;
               }

               const processingTimes = jobs
                    .filter((j) => j.processedOn && j.finishedOn)
                    .map((j) => j.finishedOn! - j.processedOn!);

               const avgTime = processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length;
               const minTime = Math.min(...processingTimes);
               const maxTime = Math.max(...processingTimes);

               // Calculate throughput (jobs per minute)
               const oldestJob = jobs[jobs.length - 1];
               const newestJob = jobs[0];
               const timeRange = (newestJob.finishedOn! - oldestJob.finishedOn!) / 1000 / 60; // minutes
               const throughput = timeRange > 0 ? jobs.length / timeRange : 0;

               metrics[name] = {
                    avgProcessingTime: Math.round(avgTime),
                    minProcessingTime: minTime,
                    maxProcessingTime: maxTime,
                    throughput: Math.round(throughput * 100) / 100,
                    sampleSize: jobs.length,
               };
          }

          return metrics;
     } catch (error) {
          errorLogger.error(colors.red('Failed to get performance metrics:'), error);
          throw error;
     }
}

// ==========================================
// DAILY REPORT
// ==========================================
export async function generateDailyReport(): Promise<string> {
     try {
          const stats = await getAllQueuesStats();
          const health = await checkQueueHealth();
          const performance = await getQueuePerformanceMetrics();

          let report = '\n';
          report += colors.bgBlue.white(`${'='.repeat(70)}\n`);
          report += colors.bgBlue.white(
               `  DAILY QUEUE REPORT - ${new Date().toLocaleDateString()}  \n`,
          );
          report += colors.bgBlue.white(`${'='.repeat(70)}\n\n`);

          // Overall Health
          report += colors.bold('📊 Overall Health:\n');
          report += `   Status: ${health.healthy ? colors.green('✅ Healthy') : colors.red('❌ Issues Found')}\n`;
          report += `   Total Issues: ${health.issues.length}\n\n`;

          if (health.issues.length > 0) {
               report += colors.bold('⚠️  Issues:\n');
               health.issues.forEach((issue) => {
                    report += `   - ${colors.yellow(issue)}\n`;
               });
               report += '\n';
          }

          // Queue Statistics
          report += colors.bold('📈 Queue Statistics:\n\n');

          let totalWaiting = 0;
          let totalActive = 0;
          let totalCompleted = 0;
          let totalFailed = 0;

          stats.forEach((stat: QueueStats) => {
               totalWaiting += stat.waiting;
               totalActive += stat.active;
               totalCompleted += stat.completed;
               totalFailed += stat.failed;

               report += colors.cyan(`   ${stat.name.padEnd(20)}`);
               report += ` W:${String(stat.waiting).padStart(4)} `;
               report += ` A:${String(stat.active).padStart(4)} `;
               report += ` C:${String(stat.completed).padStart(6)} `;
               report += ` F:${String(stat.failed).padStart(4)}\n`;
          });

          report += '\n';
          report += colors.bold('   Totals:              ');
          report += ` W:${String(totalWaiting).padStart(4)} `;
          report += ` A:${String(totalActive).padStart(4)} `;
          report += ` C:${String(totalCompleted).padStart(6)} `;
          report += ` F:${String(totalFailed).padStart(4)}\n\n`;

          // Performance Metrics
          report += colors.bold('⚡ Performance Metrics:\n\n');

          Object.entries(performance).forEach(([name, metrics]: [string, any]) => {
               report += colors.cyan(`   ${name.padEnd(20)}`);
               report += ` Avg: ${String(metrics.avgProcessingTime).padStart(6)}ms `;
               report += ` Throughput: ${String(metrics.throughput).padStart(6)}/min\n`;
          });

          report += '\n';
          report += colors.bgBlue.white(`${'='.repeat(70)}\n`);

          logger.info(report);
          return report;
     } catch (error) {
          errorLogger.error(colors.red('Failed to generate daily report:'), error);
          throw error;
     }
}

// ==========================================
// AUTO MAINTENANCE
// ==========================================
export async function performAutoMaintenance(): Promise<{
     cleaned: Record<string, number>;
     retried: Record<string, { total: number; retried: number }>;
     timestamp: Date;
}> {
     try {
          logger.info(colors.bgYellow.black('🔧 Starting Auto Maintenance...'));

          // 1. Clean completed jobs older than 24 hours
          logger.info(colors.cyan('📦 Cleaning completed jobs...'));
          const cleanedCompleted = await cleanAllCompletedJobs(24);

          // 2. Clean failed jobs older than 7 days
          logger.info(colors.cyan('🗑️  Cleaning old failed jobs...'));
          const cleanedFailed = await cleanAllFailedJobs(7);

          // 3. Retry recent failed jobs (less than 1 day old)
          logger.info(colors.cyan('🔄 Retrying recent failed jobs...'));
          const queues = getAllQueues();
          const retriedResults: Record<string, { total: number; retried: number }> = {};

          for (const [name, queue] of Object.entries(queues)) {
               const failedJobs = await queue.getFailed();
               const recentFailed = failedJobs.filter((job) => {
                    const age = Date.now() - (job.finishedOn || 0);
                    return age < 24 * 60 * 60 * 1000; // Less than 24 hours
               });

               if (recentFailed.length > 0) {
                    let retried = 0;
                    for (const job of recentFailed) {
                         try {
                              await job.retry();
                              retried++;
                         } catch (err) {
                              // Skip if retry fails
                         }
                    }
                    retriedResults[name] = { total: recentFailed.length, retried };
                    logger.info(
                         colors.green(
                              `   ✅ ${name}: Retried ${retried}/${recentFailed.length} jobs`,
                         ),
                    );
               }
          }

          logger.info(colors.bgGreen.black('✅ Auto Maintenance Completed'));

          return {
               cleaned: { ...cleanedCompleted, ...cleanedFailed },
               retried: retriedResults,
               timestamp: new Date(),
          };
     } catch (error) {
          errorLogger.error(colors.red('Failed to perform auto maintenance:'), error);
          throw error;
     }
}

// ==========================================
// ALERT SYSTEM
// ==========================================
export interface AlertThresholds {
     maxWaiting?: number;
     maxFailed?: number;
     maxActive?: number;
     minThroughput?: number;
}

const DEFAULT_THRESHOLDS: AlertThresholds = {
     maxWaiting: 1000,
     maxFailed: 100,
     maxActive: 50,
     minThroughput: 10,
};

export async function checkAlerts(thresholds: AlertThresholds = DEFAULT_THRESHOLDS): Promise<{
     alerts: Array<{ level: 'warning' | 'critical'; message: string }>;
     timestamp: Date;
}> {
     try {
          const alerts: Array<{ level: 'warning' | 'critical'; message: string }> = [];
          const stats = await getAllQueuesStats();

          stats.forEach((stat: QueueStats) => {
               // Check waiting jobs
               if (thresholds.maxWaiting && stat.waiting > thresholds.maxWaiting) {
                    alerts.push({
                         level: stat.waiting > thresholds.maxWaiting * 2 ? 'critical' : 'warning',
                         message: `Queue ${stat.name} has ${stat.waiting} waiting jobs (threshold: ${thresholds.maxWaiting})`,
                    });
               }

               // Check failed jobs
               if (thresholds.maxFailed && stat.failed > thresholds.maxFailed) {
                    alerts.push({
                         level: 'critical',
                         message: `Queue ${stat.name} has ${stat.failed} failed jobs (threshold: ${thresholds.maxFailed})`,
                    });
               }

               // Check active jobs
               if (thresholds.maxActive && stat.active > thresholds.maxActive) {
                    alerts.push({
                         level: 'warning',
                         message: `Queue ${stat.name} has ${stat.active} active jobs (threshold: ${thresholds.maxActive})`,
                    });
               }

               // Check if queue is paused
               if (stat.paused) {
                    alerts.push({
                         level: 'critical',
                         message: `Queue ${stat.name} is PAUSED`,
                    });
               }
          });

          // Log alerts
          if (alerts.length > 0) {
               logger.warn(colors.bgYellow.black(`\n⚠️  ${alerts.length} ALERTS DETECTED\n`));
               alerts.forEach((alert) => {
                    const color = alert.level === 'critical' ? colors.red : colors.yellow;
                    logger.warn(color(`   [${alert.level.toUpperCase()}] ${alert.message}`));
               });
               logger.warn('\n');
          }

          return { alerts, timestamp: new Date() };
     } catch (error) {
          errorLogger.error(colors.red('Failed to check alerts:'), error);
          throw error;
     }
}
