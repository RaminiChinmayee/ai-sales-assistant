import { runAllTests } from '../src/server/testRunner.ts';

async function main() {
  console.log('====================================================');
  console.log('InsightPulse - Mini AI BI Assistant Test Suite');
  console.log('====================================================\n');

  try {
    const report = await runAllTests();

    for (const test of report.results) {
      const statusIcon = test.passed ? '✅ PASS' : '❌ FAIL';
      console.log(`[${test.id}] ${statusIcon} - ${test.name} (${test.executionTimeMs}ms)`);
      console.log(`     Question: "${test.question}"`);
      console.log(`     Outcome:  ${test.actualSummary}`);
      console.log('');
    }

    console.log('----------------------------------------------------');
    console.log(`Summary: ${report.passedTests}/${report.totalTests} Passed | ${report.failedTests} Failed | Duration: ${report.durationMs}ms`);
    console.log('----------------------------------------------------');

    if (report.failedTests > 0) {
      process.exit(1);
    } else {
      console.log('🎉 All test cases passed successfully!');
      process.exit(0);
    }
  } catch (err) {
    console.error('Fatal error running tests:', err);
    process.exit(1);
  }
}

main();
