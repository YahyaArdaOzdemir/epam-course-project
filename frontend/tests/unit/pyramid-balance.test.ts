declare const require: (name: string) => any;

const fs = require('fs');
const path = require('path');

describe('frontend test pyramid policy', () => {
  it('keeps frontend unit tests at least as many as frontend integration tests', () => {
    const countCases = (directory: string): number => {
      if (!fs.existsSync(directory)) {
        return 0;
      }

      return fs.readdirSync(directory, { withFileTypes: true }).reduce((count: number, entry: any) => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          return count + countCases(fullPath);
        }

        if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) {
          return count;
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        return count + (content.match(/\b(it|test)\s*\(/g)?.length ?? 0);
      }, 0);
    };

    const unitCases = countCases(path.resolve('frontend/tests/unit'));
    const integrationCases = countCases(path.resolve('frontend/tests/integration'));

    expect(unitCases).toBeGreaterThan(0);
    expect(unitCases).toBeGreaterThanOrEqual(integrationCases);
  });
});
