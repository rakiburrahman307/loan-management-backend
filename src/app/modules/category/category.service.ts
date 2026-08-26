import { StatusCodes } from 'http-status-codes';
import { ICategory } from './category.interface';
import { Category } from './category.model';
import unlinkFile from '../../../shared/unlinkFile';
import AppError from '../../../errors/AppError';
import { CACHE_TTL, createCacheHelper } from '../../builder/RedisCacheHelper';
const categoryCache = createCacheHelper('category');
const createCategoryToDB = async (payload: ICategory) => {
     const { name, image } = payload;
     const isExistName = await Category.findOne({ name: name });
     if (isExistName) {
          unlinkFile(image);
          throw new AppError(StatusCodes.NOT_ACCEPTABLE, 'This Category Name Already Exist');
     }
     const createCategory: any = await Category.create(payload);
     if (!createCategory) {
          unlinkFile(image);
          throw new AppError(StatusCodes.BAD_REQUEST, 'Failed to create Category');
     }
     await categoryCache.clearLists();
     return createCategory;
};

const getCategoriesFromDB = async (): Promise<ICategory[]> => {
     const result = await categoryCache.wrapList(
          {},
          async () => await Category.find({}),
          CACHE_TTL.VERY_LONG,
     );
     return result;
};

const updateCategoryToDB = async (id: string, payload: ICategory) => {
     const isExistCategory: any = await Category.findById(id);

     if (!isExistCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Category doesn't exist");
     }

     if (payload.image) {
          unlinkFile(isExistCategory?.image);
     }

     const updateCategory = await Category.findOneAndUpdate({ _id: id }, payload, {
          new: true,
     });
     await categoryCache.clearAfterUpdate(id);
     return updateCategory;
};

const deleteCategoryToDB = async (id: string): Promise<ICategory | null> => {
     const deleteCategory = await Category.findByIdAndDelete(id);
     if (!deleteCategory) {
          throw new AppError(StatusCodes.BAD_REQUEST, "Category doesn't exist");
     }
     await categoryCache.clearAfterUpdate(id);
     return deleteCategory;
};

export const CategoryService = {
     createCategoryToDB,
     getCategoriesFromDB,
     updateCategoryToDB,
     deleteCategoryToDB,
};
