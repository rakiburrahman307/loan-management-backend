import { Schema, Query, Aggregate, Document, Model } from 'mongoose';

// soft delete interfaces for methods
export interface ISoftDeleteMethods {
     softDelete(): Promise<Document>;
     restore(): Promise<Document>;
}

// soft delete interfaces for statics
export interface ISoftDeleteStatics<T> extends Model<T> {
     softDeleteById(id: string): Promise<T | null>;
     restoreById(id: string): Promise<T | null>;
     softDeleteMany(filter: any): Promise<any>;
     restoreMany(filter: any): Promise<any>;
}

export function softDeletePlugin<T>(schema: Schema<T>) {
     // add isDeleted fields to schema if not already defined
     schema.add({
          isDeleted: { type: Boolean, default: false, index: true },
          deletedAt: { type: Date, index: true },
     } as any);

     // query protection
     const excludeDeletedFilter = function (this: Query<any, any>) {
          const filters = this.getFilter();
          if (filters.isDeleted === undefined) {
               this.where({ isDeleted: { $ne: true } });
          }
     };

     const queryMethods = [
          'find',
          'findOne',
          'findOneAndDelete',
          'findOneAndReplace',
          'findOneAndUpdate',
          'countDocuments',
          'distinct',
     ];
     queryMethods.forEach((method) => {
          schema.pre(method as any, excludeDeletedFilter);
     });

     // update hooks
     schema.pre(/update/i, function (this: Query<any, any>) {
          const filters = this.getFilter();
          if (filters.isDeleted === undefined) {
               this.where({ isDeleted: { $ne: true } });
          }
     });

     // aggregation projection
     schema.pre('aggregate', function (this: Aggregate<any>) {
          // Add $match stage to pipeline to exclude deleted documents
          this.pipeline().unshift({ $match: { isDeleted: { $ne: true } } });
     });

     // inside methods
     schema.methods.softDelete = function () {
          this.isDeleted = true;
          this.deletedAt = new Date();
          return this.save();
     };

     schema.methods.restore = function () {
          this.isDeleted = false;
          this.deletedAt = null;
          return this.save();
     };

     // static methods
     schema.statics.softDeleteById = function (id: string) {
          return this.findOneAndUpdate(
               { _id: id },
               { $set: { isDeleted: true, deletedAt: new Date() } },
               { new: true },
          );
     };

     schema.statics.restoreById = function (id: string) {
          // restore a single document by ID
          // explicitly filter out deleted documents
          return (this as any).findOneAndUpdate(
               { _id: id, isDeleted: true },
               { $set: { isDeleted: false, deletedAt: null } },
               { new: true },
          );
     };

     schema.statics.softDeleteMany = function (filter: any) {
          return this.updateMany(filter, {
               $set: { isDeleted: true, deletedAt: new Date() },
          });
     };

     schema.statics.restoreMany = function (filter: any) {
          return this.updateMany(
               { ...filter, isDeleted: true },
               { $set: { isDeleted: false, deletedAt: null } },
          );
     };
}
