import { Document } from 'mongoose';

// Define the interface for your settings
export interface ISettings extends Document {
     privacyPolicy: string;
     termsOfService: string;
     deliveryPrice: number;
     rideCommission: number;
     restaurantCommission: number;
     deliveryCommission: number;
     serviceCharge: number;
     driverRadius: number;
     deliveryRadius: number;
     restaurantRadius: number;
}
