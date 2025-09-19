# Android Manifest Exported Extractor

A CLI tool to extract exported components and intent filters from AndroidManifest.xml files. This tool helps security researchers and developers identify potentially vulnerable Android components that are exposed to other applications.

## Features

- ✅ Extracts components with `android:exported="true"`
- ✅ Extracts components with intent filters (implicitly exported)
- ✅ Supports all component types: Activities, Services, Receivers, and Providers
- ✅ Generates clean AndroidManifestExported.xml output
- ✅ Verbose mode for detailed analysis
- ✅ Easy to use CLI interface

## Installation

### Using npm

```bash
npm install -g android-manifest-exported-extractor
```

### Using yarn (recommended)

```bash
yarn global add android-manifest-exported-extractor
```

## Usage

### Basic usage

```bash
android-manifest-extractor AndroidManifest.xml
```

This will create an `AndroidManifestExported.xml` file containing only the exported components.

### Custom output file

```bash
android-manifest-extractor AndroidManifest.xml -o MyExportedComponents.xml
```

### Verbose mode

```bash
android-manifest-extractor AndroidManifest.xml -v
```

This will show detailed information about each exported component found:

```
📖 Reading AndroidManifest.xml from: AndroidManifest.xml
🔍 Searching for exported components...
  📱 Activity: com.example.MainActivity
  🔧 Service: com.example.BackgroundService
  📡 Receiver: com.example.BootReceiver
  🗄️  Provider: com.example.DataProvider
✅ Found 4 exported components
📝 Output written to: AndroidManifestExported.xml
✅ Exported components extracted to AndroidManifestExported.xml
```

## Command Line Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--output` | `-o` | Output file path | `AndroidManifestExported.xml` |
| `--verbose` | `-v` | Show verbose output | `false` |
| `--help` | `-h` | Show help | |
| `--version` | `-V` | Show version | |

## Security Analysis

This tool is particularly useful for:

- **Security Research**: Identifying attack surfaces in Android applications
- **Penetration Testing**: Finding exported components that might be vulnerable
- **Code Review**: Ensuring components are properly protected
- **Compliance**: Verifying that sensitive components are not exported

### What gets extracted?

1. **Explicitly exported components**: Components with `android:exported="true"`
2. **Implicitly exported components**: Components with intent filters (which are exported by default in older Android versions)

### Component types analyzed:

- **Activities**: User interface components
- **Services**: Background processing components
- **Receivers**: Components that respond to system or app events
- **Providers**: Components that manage shared app data

## Examples

### Example AndroidManifest.xml input:

```xml
<manifest>
  <application>
    <activity android:name=".MainActivity" android:exported="false"/>
    <activity android:name=".ExportedActivity" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
      </intent-filter>
    </activity>
    <service android:name=".BackgroundService" android:exported="false"/>
    <receiver android:name=".BootReceiver" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED"/>
      </intent-filter>
    </receiver>
  </application>
</manifest>
```

### Generated AndroidManifestExported.xml output:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<manifest>
  <application>
    <activity android:name=".ExportedActivity" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.VIEW"/>
        <category android:name="android.intent.category.DEFAULT"/>
      </intent-filter>
    </activity>
    <receiver android:name=".BootReceiver" android:exported="true">
      <intent-filter>
        <action android:name="android.intent.action.BOOT_COMPLETED"/>
      </intent-filter>
    </receiver>
  </application>
</manifest>
```

## License

MIT License

## Security Notice

This tool is designed for legitimate security research and development purposes. Always ensure you have proper authorization before analyzing Android applications that you do not own.