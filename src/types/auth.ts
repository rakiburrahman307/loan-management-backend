export type IVerifyEmail = {
     email: string;
     oneTimeCode: number;
};

export type ILoginData = {
     email: string;
     password: string;
     fcmToken?: string;
     deviceId?: string;
     deviceType?: 'android' | 'ios' | 'web';
};

export type IAuthResetPassword = {
     newPassword: string;
     confirmPassword: string;
};

export type IChangePassword = {
     currentPassword: string;
     newPassword: string;
     confirmPassword: string;
};
