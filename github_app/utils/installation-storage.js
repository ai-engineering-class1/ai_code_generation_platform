const fs = require('fs');
const path = require('path');

class InstallationStorage {
  constructor() {
    this.storagePath = path.join(__dirname, '..', '.keystore', 'installation-map.json');
    this.ensureKeystoreDirectory();
    this.loadFromDisk();
  }

  ensureKeystoreDirectory() {
    const keystoreDir = path.dirname(this.storagePath);
    if (!fs.existsSync(keystoreDir)) {
      fs.mkdirSync(keystoreDir, { recursive: true });
    }
  }

  loadFromDisk() {
    try {
      if (fs.existsSync(this.storagePath)) {
        const data = fs.readFileSync(this.storagePath, 'utf8');
        global.installationMap = JSON.parse(data);
      } else {
        // Initialize with sample data if file doesn't exist
        global.installationMap = {
          'sample-org': 'sample_installation_id',
          'sample-user': 'sample_installation_id_2'
        };
        this.saveToDisk(); // Save the sample data to file
        console.log('Created installation-map.json with sample data in .keystore');
      }
    } catch (error) {
      console.error('Error loading installation map from disk:', error);
      // Default to sample data if there's an error
      global.installationMap = {
        'sample-org': 'sample_installation_id',
        'sample-user': 'sample_installation_id_2'
      };
    }
  }

  saveToDisk() {
    try {
      // Ensure keystore directory exists
      this.ensureKeystoreDirectory();

      // Write the current installation map to file
      fs.writeFileSync(this.storagePath, JSON.stringify(global.installationMap || {}, null, 2));
    } catch (error) {
      console.error('Error saving installation map to disk:', error);
    }
  }

  // Update the installation map and persist to disk
  updateInstallation(owner, installationId) {
    if (!global.installationMap) {
      global.installationMap = {};
    }

    global.installationMap[owner] = installationId;
    this.saveToDisk();
  }

  // Remove an installation from the map and persist to disk
  removeInstallation(owner) {
    if (global.installationMap && global.installationMap[owner]) {
      delete global.installationMap[owner];
      this.saveToDisk();
    }
  }

  // Get installation ID for an owner
  getInstallationId(owner) {
    if (!global.installationMap) {
      return null;
    }
    const id = global.installationMap[owner] || null;
    if (!id && process.env.GITHUB_INSTALLATION_ID) {
      return process.env.GITHUB_INSTALLATION_ID;
    }
    return id;
  }

  // Get all installations
  getAllInstallations() {
    return global.installationMap || {};
  }
}

module.exports = new InstallationStorage();