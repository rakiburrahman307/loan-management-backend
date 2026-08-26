// import fs from 'fs';
// import path from 'path';

// const unlinkFile = (file: string) => {
//      const filePath = path.join('uploads', file);
//      if (fs.existsSync(filePath)) {
//           fs.unlinkSync(filePath);
//      }
// };

// export default unlinkFile;

import fs from 'fs';
import path from 'path';
import getUploadDirectory from '../utils/getUploadDirectory';

const unlinkFile = (file: string | string[]) => {
     // Check if the file parameter is a string or an array
     if (typeof file === 'string') {
          // If it's a single string (file path), unlink the file
          const baseUploadDir = getUploadDirectory();
          const filePath = path.join(baseUploadDir, file);
          if (fs.existsSync(filePath)) {
               fs.unlinkSync(filePath);
               console.log(`File ${file} deleted successfully.`);
          } else {
               console.log(`File ${file} not found.`);
          }
     } else if (Array.isArray(file)) {
          // If it's an array of file paths, loop through the array and unlink each file
          file.forEach((singleFile) => {
               const baseUploadDir = getUploadDirectory();
               const filePath = path.join(baseUploadDir, singleFile);
               if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    console.log(`File ${singleFile} deleted successfully.`);
               } else {
                    console.log(`File ${singleFile} not found.`);
               }
          });
     } else {
          console.log('Invalid input. Expected a string or an array of strings.');
     }
};

export default unlinkFile;
