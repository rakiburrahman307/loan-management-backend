import colors from 'colors';
import { generateDailyReport } from '../helpers/bullMQ/queueMonitoring';

async function main() {
     try {
          const report = await generateDailyReport();

          // Optionally save to file
          const fs = require('fs').promises;
          const date = new Date().toISOString().split('T')[0];
          const filename = `reports/queue-report-${date}.txt`;

          await fs.mkdir('reports', { recursive: true });
          await fs.writeFile(filename, report.replace(/\x1b\[[0-9;]*m/g, '')); // Remove colors

          console.log(colors.green(`\n✅ Report saved to ${filename}\n`));
          process.exit(0);
     } catch (error) {
          console.error(colors.red('Report generation failed:'), error);
          process.exit(1);
     }
}

main();
