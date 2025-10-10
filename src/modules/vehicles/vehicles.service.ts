import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Injectable()
export class VehiclesService {
  constructor(private prisma: PrismaService) {}

  // Category methods
  async createCategory(createCategoryDto: CreateCategoryDto) {
    return this.prisma.category.create({
      data: {
        ...createCategoryDto,
        type: 'RENTAL', // Default type
      },
      include: {
        subcategories: true,
      },
    });
  }

  async findAllCategories() {
    return this.prisma.category.findMany({
      include: {
        subcategories: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOneCategory(id: string) {
    const category = await this.prisma.category.findUnique({
      where: { id },
      include: {
        subcategories: true,
      },
    });

    if (!category) {
      throw new NotFoundException(`Category with ID ${id} not found`);
    }

    return category;
  }

  async updateCategory(id: string, updateCategoryDto: UpdateCategoryDto) {
    const category = await this.findOneCategory(id);
    
    return this.prisma.category.update({
      where: { id },
      data: updateCategoryDto,
      include: {
        subcategories: true,
      },
    });
  }

  async removeCategory(id: string) {
    const category = await this.findOneCategory(id);
    
    return this.prisma.category.delete({
      where: { id },
    });
  }

  async toggleCategoryStatus(id: string) {
    const category = await this.findOneCategory(id);
    
    return this.prisma.category.update({
      where: { id },
      data: {
        isActive: !category.isActive,
      },
      include: {
        subcategories: true,
      },
    });
  }

  // Subcategory methods
  async createSubcategory(createSubcategoryDto: CreateSubcategoryDto) {
    // Verify category exists
    await this.findOneCategory(createSubcategoryDto.categoryId);
    
    return this.prisma.subcategory.create({
      data: createSubcategoryDto,
    });
  }

  async findAllSubcategories(categoryId?: string) {
    const where = categoryId ? { categoryId } : {};
    
    return this.prisma.subcategory.findMany({
      where,
      include: {
        category: true,
      },
      orderBy: {
        sortOrder: 'asc',
      },
    });
  }

  async findOneSubcategory(id: string) {
    const subcategory = await this.prisma.subcategory.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!subcategory) {
      throw new NotFoundException(`Subcategory with ID ${id} not found`);
    }

    return subcategory;
  }

  async updateSubcategory(id: string, updateSubcategoryDto: UpdateSubcategoryDto) {
    const subcategory = await this.findOneSubcategory(id);
    
    return this.prisma.subcategory.update({
      where: { id },
      data: updateSubcategoryDto,
      include: {
        category: true,
      },
    });
  }

  async removeSubcategory(id: string) {
    const subcategory = await this.findOneSubcategory(id);
    
    return this.prisma.subcategory.delete({
      where: { id },
    });
  }

  async toggleSubcategoryStatus(id: string) {
    const subcategory = await this.findOneSubcategory(id);
    
    return this.prisma.subcategory.update({
      where: { id },
      data: {
        isActive: !subcategory.isActive,
      },
      include: {
        category: true,
      },
    });
  }

  // Vehicle methods
  async createVehicle(createVehicleDto: CreateVehicleDto) {
    // Verify category and subcategory exist
    if (createVehicleDto.categoryId) {
      await this.findOneCategory(createVehicleDto.categoryId);
    }
    if (createVehicleDto.subcategoryId) {
      await this.findOneSubcategory(createVehicleDto.subcategoryId);
    }
    
    return this.prisma.vehicle.create({
      data: {
        ...createVehicleDto,
        features: JSON.stringify(createVehicleDto.features || []),
        images: JSON.stringify(createVehicleDto.images || []),
      },
      include: {
        category: true,
        subcategory: true,
      },
    });
  }

  async findAllVehicles(filters?: {
    categoryId?: string;
    subcategoryId?: string;
    type?: string;
    isActive?: boolean;
    search?: string;
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    sortBy?: string;
  }) {
    const where: any = {};

    if (filters?.categoryId) {
      where.categoryId = filters.categoryId;
    }
    if (filters?.subcategoryId) {
      where.subcategoryId = filters.subcategoryId;
    }
    if (filters?.type) {
      where.type = filters.type;
    }
    if (filters?.isActive !== undefined) {
      where.isActive = filters.isActive;
    }
    if (filters?.search) {
      where.OR = [
        { make: { contains: filters.search } },
        { model: { contains: filters.search } },
        { description: { contains: filters.search } },
      ];
    }

    // Date filtering for availability
    if (filters?.startDate && filters?.endDate) {
      const startDate = new Date(filters.startDate);
      const endDate = new Date(filters.endDate);
      

      // Find vehicles that are NOT available during the specified date range
      const conflictingRentals = await this.prisma.rental.findMany({
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED', 'ACTIVE']
          },
          AND: [
            {
              OR: [
                // Selected period overlaps with existing booking
                {
                  AND: [
                    { startDate: { lt: endDate } },  // Existing booking starts before selected end
                    { endDate: { gte: startDate } }   // Existing booking ends on or after selected start
                  ]
                }
              ]
            }
          ]
        },
        select: { vehicleId: true, startDate: true, endDate: true, status: true }
      });

      // Find vehicles that have pending or confirmed sales (block all future rentals)
      const conflictingSales = await this.prisma.sale.findMany({
        where: {
          status: {
            in: ['PENDING', 'CONFIRMED']
          }
        },
        select: { vehicleId: true }
      });

      const conflictingVehicleIds = [
        ...conflictingRentals.map(rental => rental.vehicleId),
        ...conflictingSales.map(sale => sale.vehicleId)
      ];
      
      if (conflictingVehicleIds.length > 0) {
        where.id = { notIn: conflictingVehicleIds };
      }
    }

    // Set default pagination values
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalCount = await this.prisma.vehicle.count({ where });

    // Determine sorting
    let orderBy: any = { createdAt: 'desc' };
    if (filters?.sortBy) {
      switch (filters.sortBy) {
        case 'price':
          orderBy = { dailyRate: 'asc' };
          break;
        case 'year':
          orderBy = { year: 'desc' };
          break;
        case 'name':
          orderBy = { make: 'asc' };
          break;
        default:
          orderBy = { createdAt: 'desc' };
      }
    }

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include: {
        category: true,
        subcategory: true,
          rentals: {
            where: {
              status: {
                in: ['PENDING', 'CONFIRMED', 'ACTIVE']
              }
            },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true
          }
        },
        sales: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          },
          select: {
            id: true,
            status: true
          }
        }
      },
      orderBy,
      skip,
      take: limit,
    });


    // Transform JSON string fields to arrays and add availability info
    const transformedVehicles = vehicles.map(vehicle => {
      const transformedVehicle = {
        ...vehicle,
        features: typeof vehicle.features === 'string' ? JSON.parse(vehicle.features) : vehicle.features,
        images: typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images,
      };

      // Add availability information if dates are provided
      if (filters?.startDate && filters?.endDate) {
        const availability = this.checkVehicleAvailability(
          vehicle.rentals,
          vehicle.sales,
          filters.startDate,
          filters.endDate
        );
        (transformedVehicle as any).availability = availability;
        
        // Add debugging information
        (transformedVehicle as any).debugInfo = {
          vehicleId: vehicle.id,
          vehicleName: `${vehicle.year} ${vehicle.make} ${vehicle.model}`,
          selectedDates: {
            startDate: filters.startDate,
            endDate: filters.endDate
          },
          existingRentals: vehicle.rentals.map(rental => ({
            id: rental.id,
            startDate: rental.startDate,
            endDate: rental.endDate,
            status: rental.status
          })),
          existingSales: vehicle.sales.map(sale => ({
            id: sale.id,
            status: sale.status
          })),
          availability: availability
        };
      }

      return transformedVehicle;
    });

    // Return paginated response
    return {
      data: transformedVehicles,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPreviousPage: page > 1,
      },
    };
  }

  // Helper method to check vehicle availability based on existing rentals
  private checkVehicleAvailability(rentals: any[], sales: any[], startDate: string, endDate: string) {
    const selectedStart = new Date(startDate);
    const selectedEnd = new Date(endDate);
    
    // Check if dates are valid
    if (selectedStart >= selectedEnd) {
      return {
        available: false,
        reason: 'End date must be after start date'
      };
    }
    
    // Note: We don't check for past dates here as this is for future booking availability
    // The frontend should handle past date validation for user experience
    
    // Check for conflicts with existing rental bookings
    const conflictingRentals = rentals.filter(booking => {
      const bookingStart = new Date(booking.startDate);
      const bookingEnd = new Date(booking.endDate);
      
      // Check for date overlap
      return (
        (selectedStart >= bookingStart && selectedStart < bookingEnd) || // Selected start is within existing booking
        (selectedEnd > bookingStart && selectedEnd <= bookingEnd) ||     // Selected end is within existing booking
        (selectedStart <= bookingStart && selectedEnd >= bookingEnd)     // Selected period completely covers existing booking
      );
    });
    
    // Check if vehicle has any pending or confirmed sales (blocks all future rentals)
    const hasActiveSales = sales.length > 0;
    
    if (hasActiveSales) {
      return {
        available: false,
        reason: 'Vehicle is not available for rental (pending or confirmed sale)',
        conflictingSales: sales.map(sale => ({
          id: sale.id,
          status: sale.status
        }))
      };
    }
    
    if (conflictingRentals.length > 0) {
      return {
        available: false,
        reason: 'Vehicle is already booked for the selected dates',
        conflictingRentals: conflictingRentals.map(booking => ({
          id: booking.id,
          startDate: booking.startDate,
          endDate: booking.endDate
        }))
      };
    }
    
    return {
      available: true
    };
  }

  async findOneVehicle(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
        rentals: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED', 'ACTIVE']
            }
          },
          select: {
            id: true,
            startDate: true,
            endDate: true,
            status: true,
            userId: true
          }
        },
        sales: {
          where: {
            status: {
              in: ['PENDING', 'CONFIRMED']
            }
          },
          select: {
            id: true,
            status: true,
            userId: true,
            createdAt: true
          }
        }
      },
    });

    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found`);
    }

    // Transform JSON string fields to arrays
    return {
      ...vehicle,
      features: typeof vehicle.features === 'string' ? JSON.parse(vehicle.features) : vehicle.features,
      images: typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images,
    };
  }

  async updateVehicle(id: string, updateVehicleDto: UpdateVehicleDto) {
    const vehicle = await this.findOneVehicle(id);
    
    // Verify category and subcategory exist if provided
    if (updateVehicleDto.categoryId && updateVehicleDto.categoryId.trim() !== '') {
      await this.findOneCategory(updateVehicleDto.categoryId);
    }
    if (updateVehicleDto.subcategoryId && updateVehicleDto.subcategoryId.trim() !== '') {
      await this.findOneSubcategory(updateVehicleDto.subcategoryId);
    }
    
    const updatedVehicle = await this.prisma.vehicle.update({
      where: { id },
      data: {
        ...updateVehicleDto,
        features: updateVehicleDto.features ? JSON.stringify(updateVehicleDto.features) : undefined,
        images: updateVehicleDto.images ? JSON.stringify(updateVehicleDto.images) : undefined,
      },
      include: {
        category: true,
        subcategory: true,
      },
    });

    // Transform JSON string fields to arrays
    return {
      ...updatedVehicle,
      features: typeof updatedVehicle.features === 'string' ? JSON.parse(updatedVehicle.features) : updatedVehicle.features,
      images: typeof updatedVehicle.images === 'string' ? JSON.parse(updatedVehicle.images) : updatedVehicle.images,
    };
  }

  async removeVehicle(id: string) {
    const vehicle = await this.findOneVehicle(id);
    
    return this.prisma.vehicle.delete({
      where: { id },
    });
  }

  async toggleVehicleStatus(id: string) {
    const vehicle = await this.findOneVehicle(id);
    
    return this.prisma.vehicle.update({
      where: { id },
      data: {
        isActive: !vehicle.isActive,
      },
      include: {
        category: true,
        subcategory: true,
      },
    });
  }

  // Bulk operations
  async bulkUpdateVehicles(vehicleIds: string[], updates: Partial<UpdateVehicleDto>) {
    return this.prisma.vehicle.updateMany({
      where: {
        id: {
          in: vehicleIds,
        },
      },
      data: {
        ...updates,
        features: updates.features ? JSON.stringify(updates.features) : undefined,
        images: updates.images ? JSON.stringify(updates.images) : undefined,
      },
    });
  }

  async bulkDeleteVehicles(vehicleIds: string[]) {
    return this.prisma.vehicle.deleteMany({
      where: {
        id: {
          in: vehicleIds,
        },
      },
    });
  }

  // Debug method to check rentals for date range
  async getRentalsForDateRange(startDate: string, endDate: string) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const rentals = await this.prisma.rental.findMany({
      where: {
        status: {
          in: ['PENDING', 'CONFIRMED', 'ACTIVE']
        },
        AND: [
          {
            OR: [
              {
                AND: [
                  { startDate: { lt: end } },
                  { endDate: { gt: start } }
                ]
              }
            ]
          }
        ]
      },
      select: {
        id: true,
        vehicleId: true,
        startDate: true,
        endDate: true,
        status: true,
        vehicle: {
          select: {
            id: true,
            make: true,
            model: true,
            year: true
          }
        }
      }
    });

    return {
      selectedDates: { startDate, endDate },
      conflictingRentals: rentals,
      totalConflictingVehicles: [...new Set(rentals.map(r => r.vehicleId))].length
    };
  }

  // Analytics
  async getVehicleStats() {
    const [
      totalVehicles,
      activeVehicles,
      vehiclesByType,
      vehiclesByCategory,
      recentVehicles,
    ] = await Promise.all([
      this.prisma.vehicle.count(),
      this.prisma.vehicle.count({ where: { isActive: true } }),
      this.prisma.vehicle.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      this.prisma.vehicle.groupBy({
        by: ['categoryId'],
        _count: { categoryId: true },
        where: { categoryId: { not: null } },
      }),
      this.prisma.vehicle.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          category: true,
          subcategory: true,
        },
      }),
    ]);

    return {
      totalVehicles,
      activeVehicles,
      vehiclesByType: vehiclesByType.reduce((acc, item) => {
        acc[item.type] = item._count.type;
        return acc;
      }, {} as Record<string, number>),
      vehiclesByCategory: vehiclesByCategory.reduce((acc, item) => {
        if (item.categoryId) {
          acc[item.categoryId] = item._count.categoryId;
        }
        return acc;
      }, {} as Record<string, number>),
      recentVehicles,
    };
  }
}
