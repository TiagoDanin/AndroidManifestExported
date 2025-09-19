const fs = require('fs').promises;
const xml2js = require('xml2js');

const PARSER_OPTIONS = {
  explicitArray: false,
  mergeAttrs: false,
  ignoreAttrs: false
};

const BUILDER_OPTIONS = {
  xmldec: { version: '1.0', encoding: 'UTF-8' },
  rootName: 'manifest'
};

const COMPONENT_TYPES = {
  ACTIVITY: 'activity',
  SERVICE: 'service',
  RECEIVER: 'receiver',
  PROVIDER: 'provider'
};

const ANDROID_ATTRIBUTES = {
  EXPORTED: 'android:exported',
  NAME: 'android:name'
};

const COMPONENT_ICONS = {
  [COMPONENT_TYPES.ACTIVITY]: '📱',
  [COMPONENT_TYPES.SERVICE]: '🔧',
  [COMPONENT_TYPES.RECEIVER]: '📡',
  [COMPONENT_TYPES.PROVIDER]: '🗄️'
};

/**
 * Extracts exported Android components from AndroidManifest.xml files
 */
class ManifestExtractor {
  constructor() {
    this.parser = new xml2js.Parser(PARSER_OPTIONS);
    this.builder = new xml2js.Builder(BUILDER_OPTIONS);
  }

  /**
   * Extracts exported components from AndroidManifest.xml file
   * @param {string} inputPath - Path to input AndroidManifest.xml file
   * @param {string} outputPath - Path for output file
   * @param {boolean} verbose - Enable verbose logging
   */
  async extract(inputPath, outputPath, verbose = false) {
    this._logIfVerbose(verbose, `📖 Reading AndroidManifest.xml from: ${inputPath}`);

    const manifest = await this._parseManifestFile(inputPath);
    const extractedManifest = this._extractExportedComponents(manifest, verbose);

    await this._writeOutputFile(outputPath, extractedManifest);

    this._logIfVerbose(verbose, `📝 Output written to: ${outputPath}`);
  }

  /**
   * Parses AndroidManifest.xml file and validates structure
   * @param {string} inputPath - Path to input file
   * @returns {Object} Parsed manifest object
   * @private
   */
  async _parseManifestFile(inputPath) {
    const xmlContent = await fs.readFile(inputPath, 'utf8');
    const result = await this.parser.parseStringPromise(xmlContent);

    if (!result?.manifest) {
      throw new Error('Invalid AndroidManifest.xml file - no manifest root element found');
    }

    return result.manifest;
  }

  /**
   * Writes extracted manifest to output file
   * @param {string} outputPath - Path for output file
   * @param {Object} manifest - Extracted manifest object
   * @private
   */
  async _writeOutputFile(outputPath, manifest) {
    const outputXml = this.builder.buildObject(manifest);
    await fs.writeFile(outputPath, outputXml);
  }

  /**
   * Logs message if verbose mode is enabled
   * @param {boolean} verbose - Verbose flag
   * @param {string} message - Message to log
   * @private
   */
  _logIfVerbose(verbose, message) {
    if (verbose) {
      console.log(message);
    }
  }

  /**
   * Extracts exported components from parsed manifest
   * @param {Object} manifest - Parsed manifest object
   * @param {boolean} verbose - Enable verbose logging
   * @returns {Object} Filtered manifest with only exported components
   * @private
   */
  _extractExportedComponents(manifest, verbose) {
    const extractedManifest = this._createEmptyManifest(manifest);
    this._preserveManifestPermissions(manifest, extractedManifest);

    this._logIfVerbose(verbose, '🔍 Searching for exported components...');

    let totalFound = 0;
    const componentTypes = [
      COMPONENT_TYPES.ACTIVITY,
      COMPONENT_TYPES.SERVICE,
      COMPONENT_TYPES.RECEIVER,
      COMPONENT_TYPES.PROVIDER
    ];

    for (const componentType of componentTypes) {
      totalFound += this._extractComponentType(
        manifest.application,
        extractedManifest.application,
        componentType,
        verbose
      );
    }

    this._logIfVerbose(verbose, `✅ Found ${totalFound} exported components`);
    this._cleanupEmptyArrays(extractedManifest.application);

    return extractedManifest;
  }

  /**
   * Creates empty manifest structure preserving original attributes
   * @param {Object} manifest - Original manifest
   * @returns {Object} Empty manifest structure
   * @private
   */
  _createEmptyManifest(manifest) {
    return {
      $: manifest.$,
      application: {
        $: manifest.application?.$ || {},
        [COMPONENT_TYPES.ACTIVITY]: [],
        [COMPONENT_TYPES.SERVICE]: [],
        [COMPONENT_TYPES.RECEIVER]: [],
        [COMPONENT_TYPES.PROVIDER]: []
      }
    };
  }

  /**
   * Preserves permissions from original manifest
   * @param {Object} source - Source manifest
   * @param {Object} target - Target manifest
   * @private
   */
  _preserveManifestPermissions(source, target) {
    const permissionTypes = ['permission', 'uses-permission'];

    for (const permissionType of permissionTypes) {
      if (source[permissionType]) {
        target[permissionType] = Array.isArray(source[permissionType])
          ? source[permissionType]
          : [source[permissionType]];
      }
    }
  }

  /**
   * Extracts components of specific type and adds them to target application
   * @param {Object} sourceApp - Source application object
   * @param {Object} targetApp - Target application object
   * @param {string} componentType - Type of component to extract
   * @param {boolean} verbose - Enable verbose logging
   * @returns {number} Number of components found
   * @private
   */
  _extractComponentType(sourceApp, targetApp, componentType, verbose) {
    if (!sourceApp[componentType]) {
      return 0;
    }

    const components = this._normalizeToArray(sourceApp[componentType]);
    let found = 0;

    for (const component of components) {
      if (this._isComponentExported(component)) {
        targetApp[componentType].push(component);
        found++;

        if (verbose) {
          this._logComponentFound(componentType, component);
        }
      }
    }

    return found;
  }

  /**
   * Normalizes input to array format
   * @param {*} input - Input that might be array or single object
   * @returns {Array} Array of objects
   * @private
   */
  _normalizeToArray(input) {
    return Array.isArray(input) ? input : [input];
  }

  /**
   * Logs found component with appropriate icon
   * @param {string} componentType - Type of component
   * @param {Object} component - Component object
   * @private
   */
  _logComponentFound(componentType, component) {
    const icon = COMPONENT_ICONS[componentType] || '🔧';
    const name = component.$?.[ANDROID_ATTRIBUTES.NAME] || 'unnamed';
    const typeLabel = componentType.charAt(0).toUpperCase() + componentType.slice(1);

    console.log(`  ${icon} ${typeLabel}: ${name}`);
  }

  /**
   * Removes empty arrays from application object
   * @param {Object} application - Application object to clean
   * @private
   */
  _cleanupEmptyArrays(application) {
    Object.keys(application).forEach(key => {
      if (Array.isArray(application[key]) && application[key].length === 0) {
        delete application[key];
      }
    });
  }

  /**
   * Determines if a component should be exported based on android:exported attribute and intent-filter presence
   * @param {Object} component - Component object to check
   * @returns {boolean} True if component should be included in output
   * @private
   */
  _isComponentExported(component) {
    const exportedAttribute = component.$?.[ANDROID_ATTRIBUTES.EXPORTED];
    const hasIntentFilter = Boolean(component['intent-filter']);

    if (exportedAttribute === 'false') {
      return false;
    }

    const isExplicitlyExported = exportedAttribute === 'true';
    return isExplicitlyExported || hasIntentFilter;
  }
}

module.exports = ManifestExtractor;