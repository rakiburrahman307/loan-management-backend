import path from 'path';
import config from '../config';

// Shared function for getting upload directory
const getUploadDirectory = (): string => {
     return config.node_env === 'production'
          ? config.upload_path || '/var/uploads'
          : path.join(process.cwd(), 'uploads');
};
export default getUploadDirectory;
