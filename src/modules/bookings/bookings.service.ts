import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { UpdateRentalStatusDto } from './dto/update-rental-status.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { RentalStatus, SaleStatus, PaymentStatus, VehicleStatus } from '@prisma/client';

@Injectable()
export class BookingsService {
  private readonly GUEST_USER_ID = '423255ef-8897-49fa-89aa-289a7e9447fb'; // Guest user ID from seed

  constructor(private readonly prisma: PrismaService) {}

  // Check vehicle availability for rental
  async checkAvailability(checkAvailabilityDto: CheckAvailabilityDto) {
    const { vehicleId, startDate, endDate, excludeRentalId } = checkAvailabilityDto;
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    if (start >= end) {
      throw new BadRequestException('End date must be after start date');
    }

    // Check if vehicle exists and is available for rental
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId },
      include: { category: true }
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (!vehicle.isActive) {
      return { available: false, reason: 'Vehicle is not available for rental' };
    }

    // Only block SOLD vehicles, allow RENTED vehicles for future non-conflicting dates
    if (vehicle.status === VehicleStatus.SOLD) {
      return { available: false, reason: 'Vehicle is not available for rental' };
    }

    if (vehicle.type !== 'rental' && vehicle.type !== 'both') {
      return { available: false, reason: 'Vehicle is not available for rental' };
    }

    // Check for conflicting rentals
    const conflictingRentals = await this.prisma.rental.findMany({
      where: {
        vehicleId,
        status: {
          in: [RentalStatus.PENDING, RentalStatus.CONFIRMED, RentalStatus.ACTIVE]
        },
        OR: [
          {
            AND: [
              { startDate: { lte: start } },
              { endDate: { gt: start } }
            ]
          },
          {
            AND: [
              { startDate: { lt: end } },
              { endDate: { gte: end } }
            ]
          },
          {
            AND: [
              { startDate: { gte: start } },
              { endDate: { lte: end } }
            ]
          }
        ],
        ...(excludeRentalId && { id: { not: excludeRentalId } })
      }
    });

    if (conflictingRentals.length > 0) {
      return { 
        available: false, 
        reason: 'Vehicle is already booked for the selected dates',
        conflictingRentals: conflictingRentals.map(r => ({
          id: r.id,
          startDate: r.startDate,
          endDate: r.endDate
        }))
      };
    }

    return { available: true };
  }

  // Create a new rental booking
  async createRental(createRentalDto: CreateRentalDto, userId?: string) {
    const { vehicleId, startDate, endDate, paymentMethod, notes, agreeToTerms, guestInfo } = createRentalDto;

    if (!agreeToTerms) {
      throw new BadRequestException('You must agree to the terms and conditions');
    }

    // Validate guest information if no user ID provided
    if (!userId && !guestInfo) {
      throw new BadRequestException('Either user authentication or guest information is required');
    }

    if (!userId && guestInfo) {
      // Validate guest information
      if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email || 
          !guestInfo.phone || !guestInfo.address || !guestInfo.licenseNumber) {
        throw new BadRequestException('All guest information fields are required');
      }
    }

    // Check availability first
    const availability = await this.checkAvailability({
      vehicleId,
      startDate,
      endDate
    });

    if (!availability.available) {
      throw new BadRequestException(availability.reason);
    }

    // Get vehicle details for pricing
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    // Calculate rental cost
    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    
    
    let totalPrice = 0;
    if (days >= 7 && vehicle.weeklyRate) {
      const weeks = Math.floor(days / 7);
      const remainingDays = days % 7;
      totalPrice = Number(weeks * Number(vehicle.weeklyRate)) + Number(remainingDays * Number(vehicle.dailyRate));
    } else {
      totalPrice = Number(days * Number(vehicle.dailyRate));
    }

    // Create rental booking
    const finalUserId = userId || this.GUEST_USER_ID;
    
    let rental;
    try {
      rental = await this.prisma.rental.create({
        data: {
          userId: finalUserId, // Use guest user ID if no userId provided
          vehicleId,
          startDate: start,
          endDate: end,
          totalPrice,
          status: RentalStatus.PENDING,
          paymentStatus: PaymentStatus.PENDING,
          paymentMethod: paymentMethod || 'card',
          contractSigned: false
        },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              images: true,
              dailyRate: true,
              weeklyRate: true
            }
          }
        }
      });
    } catch (error) {
      throw error;
    }


    return rental;
  }

  // Create a new sale booking
  async createSale(createSaleDto: CreateSaleDto, userId?: string) {
    const { vehicleId, paymentMethod, notes, agreeToTerms, guestInfo } = createSaleDto;

    if (!agreeToTerms) {
      throw new BadRequestException('You must agree to the terms and conditions');
    }

    // Validate guest information if no user ID provided
    if (!userId && !guestInfo) {
      throw new BadRequestException('Either user authentication or guest information is required');
    }

    if (!userId && guestInfo) {
      // Validate guest information
      if (!guestInfo.firstName || !guestInfo.lastName || !guestInfo.email || 
          !guestInfo.phone || !guestInfo.address || !guestInfo.licenseNumber) {
        throw new BadRequestException('All guest information fields are required');
      }
    }

    // Check if vehicle exists and is available for sale
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id: vehicleId }
    });

    if (!vehicle) {
      throw new NotFoundException('Vehicle not found');
    }

    if (!vehicle.isActive || vehicle.status !== VehicleStatus.AVAILABLE) {
      throw new BadRequestException('Vehicle is not available for sale');
    }

    if (vehicle.type !== 'sale' && vehicle.type !== 'both') {
      throw new BadRequestException('Vehicle is not available for sale');
    }

    if (!vehicle.salePrice) {
      throw new BadRequestException('Vehicle does not have a sale price');
    }

    // Create sale booking
    const finalUserId = userId || this.GUEST_USER_ID;
    
    const sale = await this.prisma.sale.create({
      data: {
        userId: finalUserId, // Use guest user ID if no userId provided
        vehicleId,
        salePrice: vehicle.salePrice,
        status: SaleStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paymentMethod: paymentMethod || 'card',
        contractSigned: false
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            images: true,
            salePrice: true
          }
        }
      }
    });


    return sale;
  }

  // Get user's rentals
  async getUserRentals(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [rentals, total] = await Promise.all([
      this.prisma.rental.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              images: true,
              dailyRate: true,
              weeklyRate: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.rental.count({ where: { userId } })
    ]);

    return {
      rentals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get user's sales
  async getUserSales(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              images: true,
              salePrice: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.sale.count({ where: { userId } })
    ]);

    return {
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get all user bookings (both rentals and sales)
  async getUserAllBookings(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    
    const [rentals, sales] = await Promise.all([
      this.prisma.rental.findMany({
        where: { userId },
        select: {
          id: true,
          userId: true,
          status: true,
          paymentStatus: true,
          totalPrice: true,
          startDate: true,
          endDate: true,
          paymentMethod: true,
          cancellationReason: true,
          cancelledAt: true,
          cancelledBy: true,
          createdAt: true,
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              images: true,
              salePrice: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.sale.findMany({
        where: { userId },
        select: {
          id: true,
          userId: true,
          status: true,
          paymentStatus: true,
          salePrice: true,
          paymentMethod: true,
          cancellationReason: true,
          cancelledAt: true,
          cancelledBy: true,
          createdAt: true,
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              images: true,
              salePrice: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Combine and format the bookings
    const allBookings = [
      ...rentals.map(rental => ({
        ...rental,
        type: 'rental' as const,
        totalPrice: rental.totalPrice,
        salePrice: null
      })),
      ...sales.map(sale => ({
        ...sale,
        type: 'sale' as const,
        totalPrice: sale.salePrice,
        salePrice: sale.salePrice,
        startDate: null,
        endDate: null
      }))
    ];

    // Sort by creation date (newest first)
    allBookings.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    // Apply pagination
    const total = allBookings.length;
    const paginatedBookings = allBookings.slice(skip, skip + limit);

    return {
      bookings: paginatedBookings,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get all rentals (admin)
  async getAllRentals(page: number = 1, limit: number = 10, status?: RentalStatus) {
    const skip = (page - 1) * limit;
    
    const where = status ? { status } : {};
    
    const [rentals, total] = await Promise.all([
      this.prisma.rental.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              images: true,
              dailyRate: true,
              weeklyRate: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.rental.count({ where })
    ]);

    return {
      rentals,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Get all sales (admin)
  async getAllSales(page: number = 1, limit: number = 10, status?: SaleStatus) {
    const skip = (page - 1) * limit;
    
    const where = status ? { status } : {};
    
    const [sales, total] = await Promise.all([
      this.prisma.sale.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          },
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              images: true,
              salePrice: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      this.prisma.sale.count({ where })
    ]);

    return {
      sales,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    };
  }

  // Update rental status (admin)
  async updateRentalStatus(rentalId: string, updateDto: UpdateRentalStatusDto, adminId: string) {
    const rental = await this.prisma.rental.findUnique({
      where: { id: rentalId },
      include: { vehicle: true }
    });

    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    const updateData: any = {
      status: updateDto.status,
      paymentStatus: updateDto.paymentStatus,
      updatedAt: new Date()
    };

    // If cancelling, add cancellation details
    if (updateDto.status === RentalStatus.CANCELLED) {
      updateData.cancellationReason = updateDto.cancellationReason || 'Admin cancelled';
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = adminId;
    }

    const updatedRental = await this.prisma.rental.update({
      where: { id: rentalId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            images: true,
            dailyRate: true,
            weeklyRate: true
          }
        }
      }
    });

    // Update vehicle status if rental is confirmed
    if (updateDto.status === RentalStatus.CONFIRMED) {
      await this.prisma.vehicle.update({
        where: { id: rental.vehicleId },
        data: { status: VehicleStatus.RENTED }
      });
    } else if (updateDto.status === RentalStatus.COMPLETED || updateDto.status === RentalStatus.CANCELLED) {
      await this.prisma.vehicle.update({
        where: { id: rental.vehicleId },
        data: { status: VehicleStatus.AVAILABLE }
      });
    }

    return updatedRental;
  }

  // Update sale status (admin)
  async updateSaleStatus(saleId: string, updateDto: UpdateSaleStatusDto, adminId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { vehicle: true }
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    const updateData: any = {
      status: updateDto.status,
      paymentStatus: updateDto.paymentStatus,
      updatedAt: new Date()
    };

    // If cancelling, add cancellation details
    if (updateDto.status === SaleStatus.CANCELLED) {
      updateData.cancellationReason = updateDto.cancellationReason || 'Admin cancelled';
      updateData.cancelledAt = new Date();
      updateData.cancelledBy = adminId;
    }

    const updatedSale = await this.prisma.sale.update({
      where: { id: saleId },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            images: true,
            salePrice: true
          }
        }
      }
    });

    // Update vehicle status if sale is confirmed
    if (updateDto.status === SaleStatus.CONFIRMED) {
      await this.prisma.vehicle.update({
        where: { id: sale.vehicleId },
        data: { status: VehicleStatus.SOLD }
      });
    } else if (updateDto.status === SaleStatus.CANCELLED) {
      await this.prisma.vehicle.update({
        where: { id: sale.vehicleId },
        data: { status: VehicleStatus.AVAILABLE }
      });
    }

    return updatedSale;
  }

  // Get rental by ID
  async getRentalById(rentalId: string, userId: string) {
    const rental = await this.prisma.rental.findUnique({
      where: { id: rentalId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            images: true,
            dailyRate: true,
            weeklyRate: true
          }
        }
      }
    });

    if (!rental) {
      throw new NotFoundException('Rental not found');
    }

    // Check if user has access to this rental
    if (rental.userId !== userId) {
      throw new ForbiddenException('You do not have access to this rental');
    }

    return rental;
  }

  // Get sale by ID
  async getSaleById(saleId: string, userId: string) {
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            images: true,
            salePrice: true
          }
        }
      }
    });

    if (!sale) {
      throw new NotFoundException('Sale not found');
    }

    // Check if user has access to this sale
    if (sale.userId !== userId) {
      throw new ForbiddenException('You do not have access to this sale');
    }

    return sale;
  }

  async getAllBookings() {
    const [rentals, sales] = await Promise.all([
      this.prisma.rental.findMany({
        select: {
          id: true,
          userId: true,
          status: true,
          paymentStatus: true,
          totalPrice: true,
          startDate: true,
          endDate: true,
          paymentMethod: true,
          cancellationReason: true,
          cancelledAt: true,
          cancelledBy: true,
          createdAt: true,
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              images: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.sale.findMany({
        select: {
          id: true,
          userId: true,
          status: true,
          paymentStatus: true,
          salePrice: true,
          paymentMethod: true,
          cancellationReason: true,
          cancelledAt: true,
          cancelledBy: true,
          createdAt: true,
          vehicle: {
            select: {
              id: true,
              make: true,
              model: true,
              year: true,
              images: true
            }
          },
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              phone: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      })
    ]);

    // Combine and format the bookings
    
    const allBookings = [
      ...rentals.map(rental => ({
        id: rental.id,
        type: 'rental' as const,
        status: rental.status,
        paymentStatus: rental.paymentStatus,
        totalPrice: rental.totalPrice,
        startDate: rental.startDate,
        endDate: rental.endDate,
        paymentMethod: rental.paymentMethod,
        cancellationReason: rental.cancellationReason,
        cancelledAt: rental.cancelledAt,
        cancelledBy: rental.cancelledBy,
        createdAt: rental.createdAt,
        vehicle: rental.vehicle,
        user: rental.userId === this.GUEST_USER_ID ? null : rental.user // Hide guest user, show guest info instead
      })),
      ...sales.map(sale => ({
        id: sale.id,
        type: 'sale' as const,
        status: sale.status,
        paymentStatus: sale.paymentStatus,
        salePrice: sale.salePrice,
        paymentMethod: sale.paymentMethod,
        cancellationReason: sale.cancellationReason,
        cancelledAt: sale.cancelledAt,
        cancelledBy: sale.cancelledBy,
        createdAt: sale.createdAt,
        vehicle: sale.vehicle,
        user: sale.userId === this.GUEST_USER_ID ? null : sale.user // Hide guest user, show guest info instead
      }))
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      success: true,
      data: allBookings
    };
  }

  // Get all rentals for a specific vehicle
  async getVehicleRentals(vehicleId: string) {
    
    const rentals = await this.prisma.rental.findMany({
      where: { vehicleId },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        status: true,
        paymentStatus: true,
        totalPrice: true,
        createdAt: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    
    return {
      success: true,
      data: rentals
    };
  }

  // Cancel rental booking (Customer only)
  async cancelRental(rentalId: string, userId: string, cancellationReason: string) {
    
    // Find the rental and verify ownership
    const rental = await this.prisma.rental.findUnique({
      where: { id: rentalId },
      include: { vehicle: true }
    });

    if (!rental) {
      throw new NotFoundException('Rental booking not found');
    }

    // Check if user owns this rental
    if (rental.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    // Check if rental can be cancelled (only pending rentals)
    if (rental.status !== RentalStatus.PENDING) {
      throw new BadRequestException('Cannot cancel booking. Only pending bookings can be cancelled by customers.');
    }

    // Update rental status to cancelled
    const updatedRental = await this.prisma.rental.update({
      where: { id: rentalId },
      data: {
        status: RentalStatus.CANCELLED,
        cancellationReason: cancellationReason,
        cancelledAt: new Date(),
        cancelledBy: userId,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            images: true,
            dailyRate: true,
            weeklyRate: true
          }
        }
      }
    });


    return {
      success: true,
      message: 'Rental booking cancelled successfully',
      data: updatedRental
    };
  }

  // Cancel sale booking (Customer only)
  async cancelSale(saleId: string, userId: string, cancellationReason: string) {
    
    // Find the sale and verify ownership
    const sale = await this.prisma.sale.findUnique({
      where: { id: saleId },
      include: { vehicle: true }
    });

    if (!sale) {
      throw new NotFoundException('Sale booking not found');
    }

    // Check if user owns this sale
    if (sale.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    // Check if sale can be cancelled (only pending sales)
    if (sale.status !== SaleStatus.PENDING) {
      throw new BadRequestException('Cannot cancel booking. Only pending bookings can be cancelled by customers.');
    }

    // Update sale status to cancelled
    const updatedSale = await this.prisma.sale.update({
      where: { id: saleId },
      data: {
        status: SaleStatus.CANCELLED,
        cancellationReason: cancellationReason,
        cancelledAt: new Date(),
        cancelledBy: userId,
        updatedAt: new Date()
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true,
            images: true,
            salePrice: true
          }
        }
      }
    });


    return {
      success: true,
      message: 'Sale booking cancelled successfully',
      data: updatedSale
    };
  }

  // Dashboard Statistics Methods
  async getAdminDashboardStats() {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    // Get total users
    const totalUsers = await this.prisma.user.count({
      where: { role: 'CUSTOMER' }
    });

    // Get active vehicles
    const activeVehicles = await this.prisma.vehicle.count({
      where: { isActive: true }
    });

    // Get monthly bookings
    const monthlyBookings = await this.prisma.rental.count({
      where: {
        createdAt: { gte: startOfMonth }
      }
    });

    // Get last month bookings for comparison
    const lastMonthBookings = await this.prisma.rental.count({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        }
      }
    });

    // Get monthly revenue
    const monthlyRevenue = await this.prisma.rental.aggregate({
      where: {
        createdAt: { gte: startOfMonth },
        paymentStatus: 'PAID'
      },
      _sum: { totalPrice: true }
    });

    const lastMonthRevenue = await this.prisma.rental.aggregate({
      where: {
        createdAt: {
          gte: startOfLastMonth,
          lte: endOfLastMonth
        },
        paymentStatus: 'PAID'
      },
      _sum: { totalPrice: true }
    });

    // Get recent bookings
    const recentBookings = await this.prisma.rental.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        user: true,
        vehicle: true
      }
    });

    // Calculate percentage changes
    const bookingChange = lastMonthBookings > 0 
      ? Math.round(((monthlyBookings - lastMonthBookings) / lastMonthBookings) * 100)
      : 0;

    const revenueChange = lastMonthRevenue._sum.totalPrice && Number(lastMonthRevenue._sum.totalPrice) > 0
      ? Math.round(((Number(monthlyRevenue._sum.totalPrice) - Number(lastMonthRevenue._sum.totalPrice)) / Number(lastMonthRevenue._sum.totalPrice)) * 100)
      : 0;

    return {
      success: true,
      data: {
        stats: {
          totalUsers: { value: totalUsers, change: '+12%' }, // Static for now
          activeVehicles: { value: activeVehicles, change: '+5%' }, // Static for now
          monthlyBookings: { value: monthlyBookings, change: `${bookingChange > 0 ? '+' : ''}${bookingChange}%` },
          monthlyRevenue: { value: Number(monthlyRevenue._sum.totalPrice || 0), change: `${revenueChange > 0 ? '+' : ''}${revenueChange}%` }
        },
        recentBookings: recentBookings.map(booking => ({
          id: booking.id,
          customer: booking.user ? `${booking.user.firstName} ${booking.user.lastName}` : 'Guest',
          vehicle: `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`,
          startDate: booking.startDate.toISOString().split('T')[0],
          endDate: booking.endDate.toISOString().split('T')[0],
          status: booking.status,
          amount: `$${booking.totalPrice}`
        }))
      }
    };
  }

  async getCustomerDashboardStats(userId: string) {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get active bookings
    const activeBookings = await this.prisma.rental.count({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED', 'ACTIVE'] }
      }
    });

    // Get total rentals
    const totalRentals = await this.prisma.rental.count({
      where: { userId }
    });

    // Get total spent
    const totalSpent = await this.prisma.rental.aggregate({
      where: {
        userId,
        paymentStatus: 'PAID'
      },
      _sum: { totalPrice: true }
    });

    // Get recent bookings
    const recentBookings = await this.prisma.rental.findMany({
      where: { userId },
      take: 3,
      orderBy: { createdAt: 'desc' },
      include: { vehicle: true }
    });

    // Get upcoming bookings
    const upcomingBookings = await this.prisma.rental.findMany({
      where: {
        userId,
        status: { in: ['PENDING', 'CONFIRMED'] },
        startDate: { gte: now }
      },
      orderBy: { startDate: 'asc' },
      include: { vehicle: true }
    });

    return {
      success: true,
      data: {
        stats: {
          activeBookings: { value: activeBookings },
          totalRentals: { value: totalRentals },
          totalSpent: { value: Number(totalSpent._sum.totalPrice || 0) },
          loyaltyPoints: { value: Math.floor(totalRentals * 100) } // Simple loyalty calculation
        },
        recentBookings: recentBookings.map(booking => ({
          id: booking.id,
          vehicle: `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`,
          startDate: booking.startDate.toISOString().split('T')[0],
          endDate: booking.endDate.toISOString().split('T')[0],
          status: booking.status,
          amount: `$${booking.totalPrice}`
        })),
        upcomingBookings: upcomingBookings.map(booking => ({
          id: booking.id,
          vehicle: `${booking.vehicle.year} ${booking.vehicle.make} ${booking.vehicle.model}`,
          startDate: booking.startDate.toISOString().split('T')[0],
          endDate: booking.endDate.toISOString().split('T')[0],
          status: booking.status,
          amount: `$${booking.totalPrice}`
        }))
      }
    };
  }
}
