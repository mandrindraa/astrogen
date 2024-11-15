import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SocketService } from '../socket/socket.service';
import { CreateNotificationDto } from '../types/CreateNotification.dto';

@Injectable()
export class NotificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly socketService: SocketService,
  ) {}
  private logger = new Logger(NotificationService.name);

  // return all notifications received by a user
  async getAllNotifications(username: string) {
    const notifs = await this.prisma.notifications.findMany({
      where: {
        user_id: username,
      },
      select: {     
        timestamp: true, // rename it to timestamp
        content: true,
        sender_name: true,
        users: {
          select: {
            avatar: true,
          }
        }
      }
    });
    return notifs;
  }
  // register notification in a database received by a user
  async newNotification(notification: CreateNotificationDto) {
    try {
      const [senderExist, recipientExist] = await Promise.all([
        this.prisma.users.findUnique({
          where: {
            user_id: notification.senderId!,
          },
          select: {
            name: true,
          },
        }),
        this.prisma.users.findUnique({
          where: {
            user_id: notification.recipientId!,
          },
          select: {
            name: true,
          },
        }),
      ]);
      if (senderExist && recipientExist) {
        await this.prisma.notifications.create({
          data: {
            content: notification.content,
            receiver_name: recipientExist.name,
            sender_name: senderExist.name,
            users: {
              connect: {
                user_id: notification.recipientId,
              },
            },
          },
        });
      } else throw new Error('Make sure both user exists!');
      this.socketService.server
        .to(notification.recipientId)
        .emit('new-notification', notification);
      return {
        error: false,
        notification,
      };
    } catch (e) {
      this.logger.error(e);
      return {
        error: true,
        e,
      };
    }
  }
}
