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
        { make: { contains: filters.search, mode: 'insensitive' } },
        { model: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    // Set default pagination values
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata
    const totalCount = await this.prisma.vehicle.count({ where });

    const vehicles = await this.prisma.vehicle.findMany({
      where,
      include: {
        category: true,
        subcategory: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take: limit,
    });

    // Transform JSON string fields to arrays
    const transformedVehicles = vehicles.map(vehicle => ({
      ...vehicle,
      features: typeof vehicle.features === 'string' ? JSON.parse(vehicle.features) : vehicle.features,
      images: typeof vehicle.images === 'string' ? JSON.parse(vehicle.images) : vehicle.images,
    }));

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

  async findOneVehicle(id: string) {
    const vehicle = await this.prisma.vehicle.findUnique({
      where: { id },
      include: {
        category: true,
        subcategory: true,
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
    if (updateVehicleDto.categoryId) {
      await this.findOneCategory(updateVehicleDto.categoryId);
    }
    if (updateVehicleDto.subcategoryId) {
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
