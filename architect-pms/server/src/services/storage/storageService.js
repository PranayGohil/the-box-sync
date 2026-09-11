const config = require('../../config/env');
const LocalStorageProvider = require('./localStorage');
const S3StorageProvider = require('./s3Storage');
const CloudinaryStorageProvider = require('./cloudinaryStorage');

class StorageService {
  constructor() {
    const providerType = config.storageProvider.toLowerCase();
    switch (providerType) {
      case 's3':
        this.provider = new S3StorageProvider();
        break;
      case 'cloudinary':
        this.provider = new CloudinaryStorageProvider();
        break;
      case 'local':
      default:
        this.provider = new LocalStorageProvider();
        break;
    }
  }

  async uploadFile(file) {
    return await this.provider.uploadFile(file);
  }

  async deleteFile(identifier) {
    return await this.provider.deleteFile(identifier);
  }
}

module.exports = new StorageService();
