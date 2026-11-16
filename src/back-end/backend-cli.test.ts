import { resolve } from 'node:path';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const DEFAULT_DATABASE_PATH = '/tmp/movies-default.sqlite';

const closeMock = vi.fn();
const getDatabaseMock = vi.fn(() => ({
  close: closeMock,
}));
const readFileSyncMock = vi.fn();
const parseCountriesCsvMock = vi.fn();
const importCountriesMock = vi.fn();
const deleteUnusedCountriesMock = vi.fn();

vi.mock('./database/schema.ts', () => ({
  DEFAULT_DATABASE_PATH,
  getDatabase: getDatabaseMock,
}));
vi.mock('node:fs', () => ({ readFileSync: readFileSyncMock }));
vi.mock('./services/country-import-service.ts', () => ({
  parseCountriesCsv: parseCountriesCsvMock,
  importCountries: importCountriesMock,
}));
vi.mock('./database/country-repository.ts', () => ({
  deleteUnusedCountries: deleteUnusedCountriesMock,
}));

/**
 * Executes the backend CLI with the specified command-line arguments
 * @param args The command-line arguments to pass to the CLI
 */
async function runCliWithArgs(args: string[]): Promise<void> {
  const originalArgv = process.argv;
  process.argv = ['node', 'src/back-end/backend-cli.ts', ...args];
  try {
    await import('./backend-cli.ts');
  } finally {
    process.argv = originalArgv;
  }
}

describe('backend-cli.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
    readFileSyncMock.mockReturnValue('code,name\nFR,France');
    parseCountriesCsvMock.mockReturnValue([{ code: 'FR', name: 'France' }]);
    importCountriesMock.mockReturnValue(1);
    deleteUnusedCountriesMock.mockReturnValue(1);
  });

  describe('create-database', () => {
    it('uses the default database path when the subcommand has no path option', async () => {
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        await runCliWithArgs(['create-database']);

        expect(getDatabaseMock).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `Database available at ${resolve(DEFAULT_DATABASE_PATH)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });

    it('uses the path passed in --path', async () => {
      const customDatabasePath = './data/custom-movies.sqlite';
      const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
      try {
        await runCliWithArgs(['create-database', '--path', customDatabasePath]);

        expect(getDatabaseMock).toHaveBeenCalledWith(customDatabasePath);
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `Database available at ${resolve(customDatabasePath)}`,
        );
      } finally {
        logSpy.mockRestore();
      }
    });

    describe('add-countries', () => {
      it('validates the CSV before opening the default database and closes it', async () => {
        // Arrange: prepare a parsed country and an observable CLI output.
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        // Act: import countries from the CSV path.
        await runCliWithArgs(['add-countries', './countries.csv']);

        // Assert: parse happens before database access and the connection closes.
        expect(readFileSyncMock).toHaveBeenCalledWith(
          './countries.csv',
          'utf8',
        );
        expect(parseCountriesCsvMock).toHaveBeenCalledWith(
          'code,name\nFR,France',
        );
        expect(getDatabaseMock).toHaveBeenCalledWith(DEFAULT_DATABASE_PATH);
        expect(importCountriesMock).toHaveBeenCalledWith(
          expect.objectContaining({ close: closeMock }),
          [{ code: 'FR', name: 'France' }],
        );
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `Imported 1 countries into ${resolve(DEFAULT_DATABASE_PATH)}`,
        );
        logSpy.mockRestore();
      });

      it('uses the path passed before the command', async () => {
        // Arrange: observe the database path selected by the root option.
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        // Act: import with a custom database path.
        await runCliWithArgs([
          '--path',
          './data/custom.sqlite',
          'add-countries',
          './countries.csv',
        ]);

        // Assert: the custom path is used and the imported count is displayed.
        expect(getDatabaseMock).toHaveBeenCalledWith('./data/custom.sqlite');
        expect(logSpy).toHaveBeenCalledWith(
          `Imported 1 countries into ${resolve('./data/custom.sqlite')}`,
        );
        logSpy.mockRestore();
      });

      it('does not open the database when CSV validation fails', async () => {
        // Arrange: make CSV validation fail.
        parseCountriesCsvMock.mockImplementation(() => {
          throw new Error('invalid CSV');
        });

        // Act and Assert: propagate the validation error before opening SQLite.
        await expect(
          runCliWithArgs(['add-countries', './countries.csv']),
        ).rejects.toThrow('invalid CSV');
        expect(getDatabaseMock).not.toHaveBeenCalled();
      });
    });

    describe('clean-countries', () => {
      it('removes unused countries and reports the result', async () => {
        // Arrange: observe the cleanup result.
        const logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});

        // Act: clean the default database.
        await runCliWithArgs(['clean-countries']);

        // Assert: cleanup uses and closes the selected database.
        expect(deleteUnusedCountriesMock).toHaveBeenCalledWith(
          expect.objectContaining({ close: closeMock }),
        );
        expect(closeMock).toHaveBeenCalledOnce();
        expect(logSpy).toHaveBeenCalledWith(
          `Removed 1 unused countries from ${resolve(DEFAULT_DATABASE_PATH)}`,
        );
        logSpy.mockRestore();
      });
    });
  });
});
