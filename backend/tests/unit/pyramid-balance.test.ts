import fs from 'fs';
import path from 'path';

describe('test pyramid ratio', () => {
  it('keeps unit tests >= 60%', () => {
    const countCases = (directory: string, regex: RegExp): number => {
      if (!fs.existsSync(directory)) {
        return 0;
      }

      return fs.readdirSync(directory, { withFileTypes: true }).reduce((count, entry) => {
        const fullPath = path.join(directory, entry.name);
        if (entry.isDirectory()) {
          return count + countCases(fullPath, regex);
        }

        if (!entry.name.endsWith('.ts') && !entry.name.endsWith('.tsx')) {
          return count;
        }

        const content = fs.readFileSync(fullPath, 'utf8');
        return count + (content.match(regex)?.length ?? 0);
      }, 0);
    };

    const unitCount = countCases(path.resolve('backend/tests/unit'), /\b(it|test)\s*\(/g)
      + countCases(path.resolve('frontend/tests/unit'), /\b(it|test)\s*\(/g);
    const integrationCount = countCases(path.resolve('backend/tests/integration'), /\b(it|test)\s*\(/g)
      + countCases(path.resolve('frontend/tests/integration'), /\b(it|test)\s*\(/g);
    const e2eCount = countCases(path.resolve('e2e/tests'), /\btest\s*\(/g);

    const total = unitCount + integrationCount + e2eCount;
    expect(total).toBeGreaterThan(0);
    expect(unitCount / total).toBeGreaterThanOrEqual(0.6);
  });
});
