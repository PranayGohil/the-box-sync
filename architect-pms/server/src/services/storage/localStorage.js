const fs = require('fs');
const path = require('path');

class LocalStorageProvider {
  constructor() {
    this.uploadDir = path.join(__dirname, '../../../uploads');
    if (!fs.existsSync(this.uploadDir)) {
      fs.mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async uploadFile(file) {
    // In Express with Multer diskStorage, the file is already stored in uploads/
    const filename = file.filename || path.basename(file.path);
    return {
      fileUrl: `/uploads/${filename}`,
      fileName: file.originalname || filename,
      provider: 'local'
    };
  }

  async deleteFile(filePath) {
    const filename = path.basename(filePath);
    const absolutePath = path.join(this.uploadDir, filename);
    if (fs.existsSync(absolutePath)) {
      fs.unlinkSync(absolutePath);
      return true;
    }
    return false;
  }
}

module.exports = LocalStorageProvider;
