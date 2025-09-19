#!/usr/bin/env node

const { program } = require('commander');
const ManifestExtractor = require('../lib/extractor');

const DEFAULT_OUTPUT_FILE = 'AndroidManifestExported.xml';
const CLI_VERSION = '1.0.0';

/**
 * Main CLI action handler
 * @param {string} inputPath - Path to input AndroidManifest.xml file
 * @param {Object} options - CLI options
 * @param {string} options.output - Output file path
 * @param {boolean} options.verbose - Enable verbose output
 */
async function extractManifest(inputPath, options) {
  try {
    const extractor = new ManifestExtractor();
    await extractor.extract(inputPath, options.output, options.verbose);

    console.log(`✅ Exported components extracted to ${options.output}`);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function setupCLI() {
  program
    .name('android-manifest-extractor')
    .description('Extract exported components and intent filters from AndroidManifest.xml')
    .version(CLI_VERSION)
    .argument('<input>', 'Input AndroidManifest.xml file path')
    .option('-o, --output <file>', 'Output file path', DEFAULT_OUTPUT_FILE)
    .option('-v, --verbose', 'Verbose output')
    .action(extractManifest);
}

function main() {
  setupCLI();
  program.parse();
}

if (require.main === module) {
  main();
}