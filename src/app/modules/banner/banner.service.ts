import { StatusCodes } from 'http-status-codes';
import { IBanner } from './banner.interface';
import { Banner } from './banner.model';
import unlinkFile from '../../../shared/unlinkFile';
import mongoose from 'mongoose';
import AppError from '../../../errors/AppError';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
const bannerCache = createCacheHelper('banner');
const createBannerToDB = async (payload: IBanner): Promise<IBanner> => {
     const createBanner: any = await Banner.create(payload);
     if (!createBanner) {
          unlinkFile(payload.image);
          throw new AppError(StatusCodes.OK, 'Failed to created banner');
     }
     await bannerCache.clearLists();
     return createBanner;
};

const getAllBannerFromDB = async (): Promise<IBanner[]> => {
     return await bannerCache.wrapList(
          {},
          async () => {
               return await Banner.find({});
          },
          CACHE_TTL.VERY_LONG,
     );
};

const updateBannerToDB = async (id: string, payload: IBanner): Promise<IBanner | {}> => {
     if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'Invalid ');
     }

     const isBannerExist: any = await Banner.findById(id);

     if (payload.image && isBannerExist?.image) {
          unlinkFile(isBannerExist?.image);
     }

     const banner: any = await Banner.findOneAndUpdate({ _id: id }, payload, { new: true });
     if (!banner) {
          throw new AppError(StatusCodes.OK, 'Failed to update banner');
     }
     await bannerCache.clearAfterUpdate(id);
     return banner;
};

const deleteBannerToDB = async (id: string): Promise<IBanner | undefined> => {
     if (!mongoose.Types.ObjectId.isValid(id)) {
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'Invalid ');
     }

     const isBannerExist: any = await Banner.findById({ _id: id });

     //delete from folder
     if (isBannerExist) {
          unlinkFile(isBannerExist?.image);
     }

     //delete from database
     await Banner.findByIdAndDelete(id);
     await bannerCache.clearAfterUpdate(id);
     return;
};

export const BannerService = {
     createBannerToDB,
     getAllBannerFromDB,
     updateBannerToDB,
     deleteBannerToDB,
};
