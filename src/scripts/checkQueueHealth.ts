import colors from 'colors';
import { checkQueueHealth } from '../helpers/bullMQ/queueMonitoring';

async function main() {
     console.log(colors.bgBlue.white('\n🏥 Checking Queue Health...\n'));

     try {
          const health = await checkQueueHealth();

          if (health.healthy) {
               console.log(colors.bgGreen.black('\n✅ ALL QUEUES ARE HEALTHY\n'));
               process.exit(0);
          } else {
               console.log(colors.bgRed.white('\n❌ HEALTH ISSUES DETECTED\n'));
               process.exit(1);
          }
     } catch (error) {
          console.error(colors.red('Health check failed:'), error);
          process.exit(1);
     }
}

main();
