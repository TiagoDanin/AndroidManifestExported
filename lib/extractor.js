const fs = require('fs').promises;
const xml2js = require('xml2js');

class ManifestExtractor {
  constructor() {
    this.parser = new xml2js.Parser({
      explicitArray: false,
      mergeAttrs: false,
      ignoreAttrs: false
    });
    this.builder = new xml2js.Builder({
      xmldec: { version: '1.0', encoding: 'UTF-8' },
      rootName: 'manifest'
    });
  }

  async extract(inputPath, outputPath, verbose = false) {
    if (verbose) {
      console.log(`📖 Reading AndroidManifest.xml from: ${inputPath}`);
    }

    const xmlContent = await fs.readFile(inputPath, 'utf8');
    const result = await this.parser.parseStringPromise(xmlContent);

    if (!result.manifest) {
      throw new Error('Invalid AndroidManifest.xml file - no manifest root element found');
    }

    const extractedManifest = this.extractExportedComponents(result.manifest, verbose);

    const outputXml = this.builder.buildObject(extractedManifest);
    await fs.writeFile(outputPath, outputXml);

    if (verbose) {
      console.log(`📝 Output written to: ${outputPath}`);
    }
  }

  extractExportedComponents(manifest, verbose) {
    const extractedManifest = {
      $: manifest.$, // Keep manifest attributes
      application: {
        $: manifest.application.$ || {},
        activity: [],
        service: [],
        receiver: [],
        provider: []
      }
    };

    // Preserve permissions at manifest level
    if (manifest.permission) {
      extractedManifest.permission = Array.isArray(manifest.permission)
        ? manifest.permission
        : [manifest.permission];
    }

    // Preserve uses-permission at manifest level
    if (manifest['uses-permission']) {
      extractedManifest['uses-permission'] = Array.isArray(manifest['uses-permission'])
        ? manifest['uses-permission']
        : [manifest['uses-permission']];
    }

    if (verbose) {
      console.log('🔍 Searching for exported components...');
    }

    let totalFound = 0;

    // Extract activities
    if (manifest.application.activity) {
      const activities = Array.isArray(manifest.application.activity)
        ? manifest.application.activity
        : [manifest.application.activity];

      for (const activity of activities) {
        if (this.isExportedOrHasIntentFilter(activity)) {
          extractedManifest.application.activity.push(activity);
          totalFound++;
          if (verbose) {
            console.log(`  📱 Activity: ${activity.$?.['android:name'] || 'unnamed'}`);
          }
        }
      }
    }

    // Extract services
    if (manifest.application.service) {
      const services = Array.isArray(manifest.application.service)
        ? manifest.application.service
        : [manifest.application.service];

      for (const service of services) {
        if (this.isExportedOrHasIntentFilter(service)) {
          extractedManifest.application.service.push(service);
          totalFound++;
          if (verbose) {
            console.log(`  🔧 Service: ${service.$?.['android:name'] || 'unnamed'}`);
          }
        }
      }
    }

    // Extract receivers
    if (manifest.application.receiver) {
      const receivers = Array.isArray(manifest.application.receiver)
        ? manifest.application.receiver
        : [manifest.application.receiver];

      for (const receiver of receivers) {
        if (this.isExportedOrHasIntentFilter(receiver)) {
          extractedManifest.application.receiver.push(receiver);
          totalFound++;
          if (verbose) {
            console.log(`  📡 Receiver: ${receiver.$?.['android:name'] || 'unnamed'}`);
          }
        }
      }
    }

    // Extract providers
    if (manifest.application.provider) {
      const providers = Array.isArray(manifest.application.provider)
        ? manifest.application.provider
        : [manifest.application.provider];

      for (const provider of providers) {
        if (this.isExportedOrHasIntentFilter(provider)) {
          extractedManifest.application.provider.push(provider);
          totalFound++;
          if (verbose) {
            console.log(`  🗄️  Provider: ${provider.$?.['android:name'] || 'unnamed'}`);
          }
        }
      }
    }

    if (verbose) {
      console.log(`✅ Found ${totalFound} exported components`);
    }

    // Clean up empty arrays
    Object.keys(extractedManifest.application).forEach(key => {
      if (Array.isArray(extractedManifest.application[key]) && extractedManifest.application[key].length === 0) {
        delete extractedManifest.application[key];
      }
    });

    return extractedManifest;
  }

  isExportedOrHasIntentFilter(component) {
    // Only extract if explicitly exported as true OR has intent-filter AND not explicitly set to false
    const isExplicitlyExported = component.$?.['android:exported'] === 'true';
    const hasIntentFilter = component['intent-filter'];
    const isExplicitlyNotExported = component.$?.['android:exported'] === 'false';

    // If explicitly set to false, don't extract even with intent-filter
    if (isExplicitlyNotExported) {
      return false;
    }

    // Extract if explicitly exported OR has intent-filter (implicitly exported)
    return isExplicitlyExported || hasIntentFilter;
  }
}

module.exports = ManifestExtractor;