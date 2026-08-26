import { FilterQuery, Query } from 'mongoose';
import AppError from '../../errors/AppError';
import { StatusCodes } from 'http-status-codes';
export const excludeFields = () => {
     return [
          'searchTerm',
          'sort',
          'limit',
          'page',
          'fields',
          'maxPrice',
          'minPrice',
          'dateRange',
          'year',
          'month',
          'day',
          'dateFilter',
     ];
};

class QueryBuilder<T> {
     public modelQuery: Query<T[], T>;
     public query: Record<string, unknown>;

     constructor(modelQuery: Query<T[], T>, query: Record<string, unknown>) {
          this.modelQuery = modelQuery;
          this.query = query;
     }

     search(searchableFields: string[]) {
          const searchTerm = this.query?.searchTerm as string;
          if (searchTerm) {
               this.modelQuery = this.modelQuery.find({
                    $or: searchableFields.map(
                         (field) =>
                              ({
                                   [field]: { $regex: searchTerm, $options: 'i' },
                              }) as FilterQuery<T>,
                    ),
               });
          }
          return this;
     }

     filter() {
          const excludeFields = [
               'searchTerm',
               'sort',
               'limit',
               'page',
               'fields',
               'maxPrice',
               'minPrice',
               'dateRange',
               'year',
               'month',
               'day',
               'dateFilter',
          ];
          const queryObj = { ...this.query };
          excludeFields.forEach((el) => delete queryObj[el]);

          this.modelQuery = this.modelQuery.find(queryObj as FilterQuery<T>);
          return this;
     }

     sort() {
          const sort = (this.query?.sort as string)?.split(',')?.join(' ') || '-createdAt';
          this.modelQuery = this.modelQuery.sort(sort as string);
          return this;
     }

     paginate(defaultLimit = 10) {
          const page = Number(this.query?.page) || 1;
          const limit = Number(this.query?.limit) || defaultLimit;
          const skip = (page - 1) * limit;

          this.modelQuery = this.modelQuery.skip(skip).limit(limit).sort();
          return this;
     }

     fields() {
          const fields = (this.query?.fields as string)?.split(',')?.join(' ') || '-__v';
          this.modelQuery = this.modelQuery.select(fields);
          return this;
     }
     priceRange() {
          const priceFilter: Record<string, unknown> = {};
          const minPrice = this.query?.minPrice as number;
          const maxPrice = this.query?.maxPrice as number;
          if (minPrice !== undefined) priceFilter.$gte = minPrice;
          if (maxPrice !== undefined) priceFilter.$lte = maxPrice;

          if (minPrice !== undefined || maxPrice !== undefined) {
               this.modelQuery = this.modelQuery.find({
                    price: priceFilter,
               } as FilterQuery<T>);
          }

          return this;
     }
     dateFilter(dateField: string = 'createdAt') {
          const year = this.query?.year as string;
          const month = this.query?.month as string;
          const day = this.query?.day as string;
          const customDateField = (this.query?.dateField as string) || dateField;

          let dateQuery: any = {};

          if (year) {
               const yearNum = parseInt(year);
               if (!isNaN(yearNum)) {
                    // Year filter: from Jan 1 to Dec 31 of the specified year
                    const startOfYear = new Date(yearNum, 0, 1); // January 1st
                    const endOfYear = new Date(yearNum + 1, 0, 1); // January 1st of next year

                    dateQuery[customDateField] = {
                         $gte: startOfYear,
                         $lt: endOfYear,
                    };
               }
          }

          if (month && year) {
               const yearNum = parseInt(year);
               const monthNum = parseInt(month) - 1; // Month is 0-indexed in JavaScript Date

               if (!isNaN(yearNum) && !isNaN(monthNum) && monthNum >= 0 && monthNum <= 11) {
                    // Month filter: from 1st day to last day of the specified month
                    const startOfMonth = new Date(yearNum, monthNum, 1);
                    const endOfMonth = new Date(yearNum, monthNum + 1, 1);

                    dateQuery[customDateField] = {
                         $gte: startOfMonth,
                         $lt: endOfMonth,
                    };
               }
          }

          if (day && month && year) {
               const yearNum = parseInt(year);
               const monthNum = parseInt(month) - 1;
               const dayNum = parseInt(day);

               if (
                    !isNaN(yearNum) &&
                    !isNaN(monthNum) &&
                    !isNaN(dayNum) &&
                    monthNum >= 0 &&
                    monthNum <= 11 &&
                    dayNum >= 1 &&
                    dayNum <= 31
               ) {
                    // Day filter: from start of day to end of day
                    const startOfDay = new Date(yearNum, monthNum, dayNum, 0, 0, 0, 0);
                    const endOfDay = new Date(yearNum, monthNum, dayNum, 23, 59, 59, 999);

                    dateQuery[customDateField] = {
                         $gte: startOfDay,
                         $lte: endOfDay,
                    };
               }
          }

          // Apply the date filter if any date criteria is specified
          if (Object.keys(dateQuery).length > 0) {
               this.modelQuery = this.modelQuery.find(dateQuery as FilterQuery<T>);
          }

          return this;
     }

     dateRange(dateField: string = 'createdAt') {
          const startDate = this.query?.startDate as string;
          const endDate = this.query?.endDate as string;
          const customDateField = (this.query?.dateField as string) || dateField;

          let dateQuery: any = {};

          if (startDate) {
               const start = new Date(startDate);
               if (!isNaN(start.getTime())) {
                    dateQuery[customDateField] = { ...dateQuery[customDateField], $gte: start };
               }
          }

          if (endDate) {
               const end = new Date(endDate);
               if (!isNaN(end.getTime())) {
                    // Set to end of day if only date is provided (no time)
                    if (endDate.length === 10) {
                         // YYYY-MM-DD format
                         end.setHours(23, 59, 59, 999);
                    }
                    dateQuery[customDateField] = { ...dateQuery[customDateField], $lte: end };
               }
          }

          if (Object.keys(dateQuery).length > 0) {
               this.modelQuery = this.modelQuery.find(dateQuery as FilterQuery<T>);
          }

          return this;
     }
     async countTotal() {
          try {
               const totalQueries = this.modelQuery.getFilter();
               const total = await this.modelQuery.model.countDocuments(totalQueries);
               const page = Number(this.query?.page) || 1;
               const limit = Number(this.query?.limit) || 10;
               const totalPage = Math.ceil(total / limit);

               return { page, limit, total, totalPage };
          } catch (error) {
               throw new AppError(StatusCodes.SERVICE_UNAVAILABLE, error as string);
          }
     }
}

export default QueryBuilder;
