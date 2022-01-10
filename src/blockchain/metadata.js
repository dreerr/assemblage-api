const uploadsDir = config.get('uploads');
const mkdirs = require('mkdirs');
const fs = require('fs');


const { v4: uuidv4 } = require('uuid');

// Try to access uploads directory
try {
  fs.accessSync(uploadsDir, fs.constants.R_OK | fs.constants.W_OK)
} catch {
  try {
    mkdirs(uploadsDir)
  } catch (error) {
    throw "Could not access/create uploads dir!"
  }
}