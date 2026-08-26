import colors from 'colors';
import { performAutoMaintenance } from '../helpers/bullMQ/queueMonitoring';

async function main() {
     console.log(colors.bgYellow.black('\n🔧 Running Queue Maintenance...\n'));

     try {
          const result = await performAutoMaintenance();

          console.log(colors.bgGreen.black('\n✅ Maintenance Complete\n'));
          console.log(colors.bold('Summary:'));
          console.log(`   Timestamp: ${result.timestamp.toISOString()}`);
          console.log(
               `   Cleaned Jobs: ${Object.values(result.cleaned).reduce((a, b) => a + b, 0)}`,
          );
          console.log(
               `   Retried Jobs: ${Object.values(result.retried).reduce((a, b) => a + b.retried, 0)}`,
          );
          console.log('\n');

          process.exit(0);
     } catch (error) {
          console.error(colors.red('Maintenance failed:'), error);
          process.exit(1);
     }
}

main();
