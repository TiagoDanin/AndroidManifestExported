#!/usr/bin/env node

const { program } = require('commander');
const ManifestExtractor = require('../lib/extractor');

program
  .name('android-manifest-extractor')
  .description('Extract exported components and intent filters from AndroidManifest.xml')
  .version('1.0.0')
  .argument('<input>', 'Input AndroidManifest.xml file path')
  .option('-o, --output <file>', 'Output file path', 'AndroidManifestExported.xml')
  .option('-v, --verbose', 'Verbose output')
  .action(async (input, options) => {
    try {
      const extractor = new ManifestExtractor();
      await extractor.extract(input, options.output, options.verbose);
      console.log(`✅ Exported components extracted to ${options.output}`);
    } catch (error) {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  });

program.parse();