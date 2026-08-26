import express from 'express';
import { DashboardUserController } from './userManagements.controller';
import { userManagementsValidations } from './userManagements.validation';
import validateRequest from '../../middleware/validateRequest';
import auth from '../../middleware/auth';
import { USER_ROLES } from '../../../enums/user';

const router = express.Router();

router.get('/', auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN), DashboardUserController.getAllUser);
router.get(
     '/:id',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     DashboardUserController.getSingleUser,
);
router.patch(
     '/status/:id',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     validateRequest(userManagementsValidations.updateStatus),
     DashboardUserController.updateStatus,
);

router.post(
     '/restore/:id',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     DashboardUserController.restoreUser,
);

router.get(
     '/deleted-users',
     auth(USER_ROLES.ADMIN, USER_ROLES.SUPER_ADMIN),
     DashboardUserController.getDeletedUsers,
);

export const UserManagementsRouter = router;
