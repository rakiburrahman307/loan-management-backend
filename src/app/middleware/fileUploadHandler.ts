import { Request } from 'express';
import fs from 'fs';
import { StatusCodes } from 'http-status-codes';
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import AppError from '../../errors/AppError';
import getUploadDirectory from '../../utils/getUploadDirectory';

// File type configurations
interface FileTypeConfig {
     mimeTypes: string[];
     errorMessage: string;
}

const FILE_TYPES: Record<string, FileTypeConfig> = {
     image: {
          mimeTypes: [
               'image/png',
               'image/jpg',
               'image/jpeg',
               'image/svg',
               'image/webp',
               'image/svg+xml',
               'application/octet-stream',
          ],
          errorMessage: 'Only .jpeg, .png, .jpg .svg .webp .octet-stream .svg+xml file supported',
     },
     audio: {
          mimeTypes: ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm'],
          errorMessage: 'Only .mp3, .wav, .ogg, .webm audio files are supported',
     },
     video: {
          mimeTypes: [
               'video/mp4',
               'video/webm',
               'video/quicktime',
               'video/x-msvideo',
               'video/x-matroska',
               'video/mpeg',
          ],
          errorMessage: 'Only .mp4, .webm, .mov, .avi, .mkv, .mpeg video files are supported',
     },
     document: {
          mimeTypes: [
               'application/pdf',
               'application/msword',
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'application/vnd.ms-excel',
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'application/vnd.ms-powerpoint',
               'application/vnd.openxmlformats-officedocument.presentationml.presentation',
               'text/plain',
               'application/rtf',
               'application/zip',
               'application/x-7z-compressed',
               'application/x-rar-compressed',
          ],
          errorMessage:
               'Only PDF, Word, Excel, PowerPoint, text, RTF, zip, 7z, and rar files are supported',
     },
     documentOrImage: {
          mimeTypes: [
               'image/png',
               'image/jpg',
               'image/jpeg',
               'image/svg',
               'image/webp',
               'image/svg+xml',
               'application/octet-stream',
               'application/pdf',
               'application/msword',
               'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
               'application/vnd.ms-excel',
               'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
               'application/vnd.ms-powerpoint',
               'application/vnd.openxmlformats-officedocument.presentationml.presentation',
               'text/plain',
               'application/rtf',
               'application/zip',
               'application/x-7z-compressed',
               'application/x-rar-compressed',
          ],
          errorMessage:
               'Only PDF, Word, Excel, text, images (JPEG, JPG, PNG, WebP) and archive files are supported',
     },
};

// Field configurations - Add new fields here easily!
interface FieldConfig {
     fieldName: string;
     folderName: string;
     fileType: keyof typeof FILE_TYPES;
     maxCount: number;
}

const FIELD_CONFIGS: FieldConfig[] = [
     // Image fields
     { fieldName: 'image', folderName: 'image', fileType: 'image', maxCount: 10 },
     {
          fieldName: 'personalityImage',
          folderName: 'personalityImage',
          fileType: 'image',
          maxCount: 10,
     },
     { fieldName: 'bodyImage', folderName: 'bodyImage', fileType: 'image', maxCount: 10 },
     { fieldName: 'headShotImage', folderName: 'headShotImage', fileType: 'image', maxCount: 10 },
     { fieldName: 'images', folderName: 'images', fileType: 'image', maxCount: 10 },
     { fieldName: 'thumbnail', folderName: 'thumbnail', fileType: 'image', maxCount: 5 },
     { fieldName: 'logo', folderName: 'logo', fileType: 'image', maxCount: 5 },
     { fieldName: 'banner', folderName: 'banner', fileType: 'image', maxCount: 5 },
     { fieldName: 'permits', folderName: 'permits', fileType: 'image', maxCount: 1 },
     { fieldName: 'insurance', folderName: 'insurance', fileType: 'image', maxCount: 1 },
     { fieldName: 'driverLicense', folderName: 'driverLicense', fileType: 'image', maxCount: 1 },

     // Media fields
     { fieldName: 'audio', folderName: 'audio', fileType: 'audio', maxCount: 5 },
     { fieldName: 'video', folderName: 'video', fileType: 'video', maxCount: 5 },

     // Document fields
     { fieldName: 'document', folderName: 'document', fileType: 'document', maxCount: 10 },
];

const fileUploadHandler = (customFields?: FieldConfig[]) => {
     // Merge custom fields with default config, ensuring no duplicates by fieldName
     let fieldsToUse = FIELD_CONFIGS;
     if (customFields) {
          const mergedMap = new Map();
          FIELD_CONFIGS.forEach((f) => mergedMap.set(f.fieldName, f));
          customFields.forEach((f) => mergedMap.set(f.fieldName, f));
          fieldsToUse = Array.from(mergedMap.values());
     }

     // Create upload folder
     const baseUploadDir = getUploadDirectory();
     if (!fs.existsSync(baseUploadDir)) {
          fs.mkdirSync(baseUploadDir, { recursive: true });
     }

     // Helper function to create directories
     const createDir = (dirPath: string) => {
          if (!fs.existsSync(dirPath)) {
               fs.mkdirSync(dirPath, { recursive: true });
          }
     };

     // Create a map for quick lookup
     const fieldConfigMap = new Map(fieldsToUse.map((config) => [config.fieldName, config]));

     const storage = multer.diskStorage({
          destination: (req, file, cb) => {
               const fieldConfig = fieldConfigMap.get(file.fieldname.trim());

               let uploadDir;
               if (fieldConfig) {
                    uploadDir = path.join(baseUploadDir, fieldConfig.folderName);
               } else {
                    // Fallback for unknown fields
                    uploadDir = path.join(baseUploadDir, 'others');
               }

               createDir(uploadDir);
               cb(null, uploadDir);
          },

          filename: (req, file, cb) => {
               const fileExt = path.extname(file.originalname);
               const fileName =
                    file.originalname.replace(fileExt, '').toLowerCase().split(' ').join('-') +
                    '-' +
                    Date.now();
               cb(null, fileName + fileExt);
          },
     });

     // Dynamic file filter
     const fileFilter = (req: Request, file: any, cb: FileFilterCallback) => {
          const fieldConfig = fieldConfigMap.get(file.fieldname.trim());

          if (!fieldConfig) {
               // Allow any file type for unknown fields as fallback to prevent upload blocks
               cb(null, true);
               return;
          }

          const fileTypeConfig = FILE_TYPES[fieldConfig.fileType];

          if (fileTypeConfig.mimeTypes.includes(file.mimetype)) {
               cb(null, true);
          } else {
               cb(new AppError(StatusCodes.BAD_REQUEST, fileTypeConfig.errorMessage));
          }
     };

     const upload = multer({
          storage: storage,
          limits: {
               fileSize: 100 * 1024 * 1024, // 100MB file size limit
          },
          fileFilter: fileFilter,
     }).any();

     // Custom middleware wrapper to restructure any() array output back into fields object
     return (req: any, res: any, next: any) => {
          upload(req, res, (err: any) => {
               if (err) {
                    return next(err);
               }

               if (req.files && Array.isArray(req.files)) {
                    const filesObj: Record<string, Express.Multer.File[]> = {};
                    req.files.forEach((file: any) => {
                         const trimmedFieldname = file.fieldname.trim();
                         file.fieldname = trimmedFieldname;
                         if (!filesObj[trimmedFieldname]) {
                              filesObj[trimmedFieldname] = [];
                         }
                         filesObj[trimmedFieldname].push(file);
                    });
                    req.files = filesObj as any;
               }
               next();
          });
     };
};

export default fileUploadHandler;

// Export field configs for use in other files
export { FIELD_CONFIGS, FILE_TYPES };
export type { FieldConfig, FileTypeConfig };
