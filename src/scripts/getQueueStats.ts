import colors from 'colors';
import { getAllQueuesStats } from '../DB/bullMQ';

async function main() {
     console.log(colors.bgBlue.white('\n📊 Queue Statistics\n'));

     try {
          const stats = await getAllQueuesStats();

          console.log(
               colors.bold('Queue Name           Waiting  Active  Completed  Failed  Total\n'),
          );
          console.log(colors.gray('─'.repeat(75)));

          stats.forEach((stat) => {
               console.log(
                    colors.cyan(stat.name.padEnd(20)) +
                         String(stat.waiting).padStart(8) +
                         String(stat.active).padStart(8) +
                         String(stat.completed).padStart(11) +
                         String(stat.failed).padStart(8) +
                         String(stat.total).padStart(7),
               );
          });

          console.log('\n');
          process.exit(0);
     } catch (error) {
          console.error(colors.red('Failed to get stats:'), error);
          process.exit(1);
     }
}

main();
