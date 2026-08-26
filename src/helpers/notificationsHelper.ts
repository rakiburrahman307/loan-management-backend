import { INotification } from '../app/modules/notification/notification.interface';
import { Notification } from '../app/modules/notification/notification.model';
import { socketService } from './socket/service';

export const sendNotifications = async (data: any): Promise<INotification> => {
     const result = await Notification.create(data);

     if (data.receiver) {
          socketService.emit('notification', data.receiver.toString(), result);
     } else {
          socketService.emitToAll('notification', result);
     }

     return result;
};
