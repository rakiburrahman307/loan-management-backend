import { Request, Response, NextFunction } from 'express';
import { getSingleFilePath, getMultipleFilesPath, IFolderName } from '../../shared/getFilePath';

interface FileFieldConfig {
     fieldName: IFolderName;
     forceMultiple?: boolean;
     forceSingle?: boolean;
}

type FieldInput = IFolderName | FileFieldConfig;

const parseFileData = (...fields: FieldInput[]) => {
     return async (req: Request, res: Response, next: NextFunction) => {
          try {
               const fileData: Record<string, string | string[] | null> = {};
               let fieldsToProcess: FileFieldConfig[] = [];
               fields.forEach((field) => {
                    if (typeof field === 'string') {
                         fieldsToProcess.push({ fieldName: field });
                    } else {
                         fieldsToProcess.push(field);
                    }
               });

               fieldsToProcess.forEach(({ fieldName, forceMultiple, forceSingle }) => {
                    try {
                         if (!req.files) {
                              fileData[fieldName] = null;
                              console.log(`No files found for field: ${fieldName}`);
                              return;
                         }
                         let filesForField: Express.Multer.File[] | undefined;

                         if (Array.isArray(req.files)) {
                              filesForField = req.files;
                         } else {
                              filesForField = req.files[fieldName];
                         }

                         if (!filesForField || filesForField.length === 0) {
                              fileData[fieldName] = null;
                              console.log(`No files found for field: ${fieldName}`);
                              return;
                         }
                         if (forceSingle) {
                              try {
                                   const filePath = getSingleFilePath(req.files, fieldName);
                                   fileData[fieldName] = filePath || null;
                                   console.log(
                                        `Single file processed (forced) for field: ${fieldName}`,
                                   );
                              } catch (error) {
                                   fileData[fieldName] = null;
                                   console.log(
                                        `Error in forced single file processing for field: ${fieldName}`,
                                   );
                              }
                         } else if (forceMultiple) {
                              try {
                                   const filePaths = getMultipleFilesPath(req.files, fieldName);
                                   fileData[fieldName] = filePaths || null;
                                   console.log(
                                        `Multiple files processed (forced) for field: ${fieldName}`,
                                   );
                              } catch (error) {
                                   fileData[fieldName] = null;
                                   console.log(
                                        `Error in forced multiple file processing for field: ${fieldName}`,
                                   );
                              }
                         } else {
                              if (Array.isArray(filesForField) && filesForField.length > 1) {
                                   // Multiple files detected
                                   try {
                                        const filePaths = getMultipleFilesPath(
                                             req.files,
                                             fieldName,
                                        );
                                        fileData[fieldName] = filePaths || null;
                                        console.log(
                                             `Multiple files processed for field: ${fieldName} (${filesForField.length} files)`,
                                        );
                                   } catch (error) {
                                        fileData[fieldName] = null;
                                        console.log(
                                             `Error in multiple file processing for field: ${fieldName}`,
                                        );
                                   }
                              } else {
                                   // Single file detected (either single file or array with one file)
                                   try {
                                        const filePath = getSingleFilePath(req.files, fieldName);
                                        fileData[fieldName] = filePath || null;
                                        console.log(
                                             `Single file processed for field: ${fieldName}`,
                                        );
                                   } catch (error) {
                                        fileData[fieldName] = null;
                                        console.log(
                                             `Error in single file processing for field: ${fieldName}`,
                                        );
                                   }
                              }
                         }
                    } catch (error: any) {
                         fileData[fieldName] = null;
                         console.log(
                              `Error processing files for field: ${fieldName}`,
                              error.message,
                         );
                    }
               });

               // Handle additional data if present
               if (req.body && req.body.data) {
                    try {
                         const data = JSON.parse(req.body.data);
                         req.body = { ...fileData, ...data };
                    } catch (parseError) {
                         req.body = { ...fileData, ...req.body };
                    }
               } else {
                    req.body = { ...fileData, ...req.body };
               }

               next();
          } catch (error) {
               next(error);
          }
     };
};

export default parseFileData;
