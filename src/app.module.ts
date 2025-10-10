import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';

// Core modules
import { AppController } from './app.controller';
import { AppService } from './app.service';

// Prisma
import { PrismaModule } from './prisma/prisma.module';

// Feature modules
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { VehiclesModule } from './modules/vehicles/vehicles.module';
import { BookingsModule } from './modules/bookings/bookings.module';
// import { PaymentsModule } from './modules/payments/payments.module';
// import { AnalyticsModule } from './modules/analytics/analytics.module';
// // import { AdminModule } from './modules/admin/admin.module';
// import { NotificationsModule } from './modules/notifications/notifications.module';

// Guards
import { ThrottlerGuard } from '@nestjs/throttler';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';

// Configuration
import { JwtConfig } from './config/jwt.config';
import { StripeConfig } from './config/stripe.config';

@Module({
  imports: [
    // Configuration
    ConfigModule.forRoot({
      isGlobal: true,
      load: [JwtConfig, StripeConfig],
    }),

    // Prisma
    PrismaModule,

    // Rate limiting
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL || '60'),
        limit: parseInt(process.env.THROTTLE_LIMIT || '10'),
      },
    ]),

    // Scheduling
    ScheduleModule.forRoot(),

    // Event emitter
    EventEmitterModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    VehiclesModule,
    BookingsModule,
    // PaymentsModule,
    // AnalyticsModule,
    // AdminModule,
    // NotificationsModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}