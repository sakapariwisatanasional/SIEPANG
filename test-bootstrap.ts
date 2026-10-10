// Polyfill localStorage, window, and document for Node environment during CLI test execution
if (typeof globalThis.localStorage === 'undefined') {
  const store = new Map<string, string>();
  globalThis.localStorage = {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, String(value)),
    removeItem: (key: string) => store.delete(key),
    clear: () => store.clear(),
    key: (index: number) => Array.from(store.keys())[index] ?? null,
    length: 0,
  } as any;
}
if (typeof (globalThis as any).window === 'undefined') {
  (globalThis as any).window = {
    location: {
      pathname: '/',
      search: '',
    },
    history: {
      replaceState: () => {},
      pushState: () => {},
    },
    addEventListener: () => {},
    removeEventListener: () => {},
    matchMedia: () => ({
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  };
}
if (typeof (globalThis as any).document === 'undefined') {
  (globalThis as any).document = {
    documentElement: {
      setAttribute: () => {},
      classList: {
        add: () => {},
        remove: () => {},
        toggle: () => {},
      },
    },
    querySelector: () => null,
    getElementById: () => null,
  };
}

async function run() {
  const { runBootstrapSecuritySuite } = await import('./src/tests/bootstrapSecuritySuite');
  console.log('Running SiEpang Bootstrap Security Suite (TEST 1 - TEST 8)...');
  const report = await runBootstrapSecuritySuite();
  console.log('\n==================================================');
  console.log('TEST SUITE RESULTS:');
  console.log('==================================================');
  report.results.forEach((r) => {
    console.log(`[${r.passed ? 'PASS' : 'FAIL'}] ${r.id}: ${r.name}`);
    console.log(`       ${r.actualResult}`);
  });
  console.log('==================================================');
  console.log(`Summary: ${report.passedTests}/${report.totalTests} tests passed.`);
  console.log(`All Passed: ${report.allPassed}`);
  console.log('==================================================\n');

  process.exit(report.allPassed ? 0 : 1);
}

run().catch((err) => {
  console.error('Test Suite Failed with unexpected error:', err);
  process.exit(1);
});

