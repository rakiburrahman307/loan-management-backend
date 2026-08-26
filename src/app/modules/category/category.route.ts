import express from 'express';
import { USER_ROLES } from '../../../enums/user';
import { CategoryController } from './category.controller';
import { CategoryValidation } from './category.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import fileUploadHandler from '../../middleware/fileUploadHandler';
import parseFileData from '../../middleware/parseFileData';
import { FOLDER_NAMES } from '../../../enums/files';
const router = express.Router();

router.post(
     '/create-service',
     auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
     fileUploadHandler(),
     parseFileData(FOLDER_NAMES.IMAGE),
     validateRequest(CategoryValidation.createCategoryZodSchema),
     CategoryController.createCategory,
);

router
     .route('/:id')
     .patch(
          auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN),
          fileUploadHandler(),
          parseFileData(FOLDER_NAMES.IMAGE),
          CategoryController.updateCategory,
     )
     .delete(auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN), CategoryController.deleteCategory);

router.get(
     '/',
     auth(USER_ROLES.SUPER_ADMIN, USER_ROLES.ADMIN, USER_ROLES.USER),
     CategoryController.getCategories,
);

export const CategoryRoutes = router;
