import express from 'express';
import { ROLE_GROUPS, USER_ROLES } from '../../../enums/user';
import { UserController } from './user.controller';
import { UserValidation } from './user.validation';
import auth from '../../middleware/auth';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import validateRequest from '../../middleware/validateRequest';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';
import { authLimiter } from '../../../DB/security';
const router = express.Router();

router
     .route('/profile')
     .get(auth(...ROLE_GROUPS.ALL), UserController.getUserProfile)
     .patch(
          auth(...ROLE_GROUPS.ALL),
          fileUploadHandler(),
          parseFileData(FOLDER_NAMES.IMAGE),
          validateRequest(UserValidation.updateUserZodSchema),
          UserController.updateProfile,
     );

router
     .route('/create')
     .post(
          authLimiter,
          validateRequest(UserValidation.createUserZodSchema),
          UserController.createUser,
     );

// Admin routes for user management
router
     .route('/admin')
     .post(
          auth(...ROLE_GROUPS.ADMINS),
          validateRequest(UserValidation.createUserZodSchema),
          UserController.createAdmin,
     );
export const UserRouter = router;
