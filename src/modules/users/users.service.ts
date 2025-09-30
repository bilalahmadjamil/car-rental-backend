import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createUserDto: CreateUserDto) {
    try {
      const user = await this.prisma.user.create({
        data: createUserDto,
      });

      const { passwordHash, ...result } = user;
      return result;
    } catch (error) {
      if (error.code === 'P2002') {
        throw new ConflictException('User with this email already exists');
      }
      throw error;
    }
  }

  async findAll(skip = 0, take = 10) {
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        skip,
        take,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          phone: true,
          address: true,
          licenseNumber: true,
          role: true,
          customerTier: true,
          totalSpent: true,
          loyaltyPoints: true,
          isActive: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count(),
    ]);

    return {
      users,
      total,
      page: Math.floor(skip / take) + 1,
      totalPages: Math.ceil(total / take),
    };
  }

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        licenseNumber: true,
        role: true,
        customerTier: true,
        totalSpent: true,
        loyaltyPoints: true,
        registrationSource: true,
        lastLoginAt: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const user = await this.findById(id);

    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: updateUserDto,
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phone: true,
        address: true,
        licenseNumber: true,
        role: true,
        customerTier: true,
        totalSpent: true,
        loyaltyPoints: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return updatedUser;
  }

  async updateLastLogin(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }

  async remove(id: string) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
    });
  }

  async updateCustomerTier(id: string, tier: string) {
    return this.prisma.user.update({
      where: { id },
      data: { customerTier: tier as any },
    });
  }

  async updateTotalSpent(id: string, amount: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        totalSpent: {
          increment: amount,
        },
      },
    });
  }

  async updateLoyaltyPoints(id: string, points: number) {
    return this.prisma.user.update({
      where: { id },
      data: {
        loyaltyPoints: {
          increment: points,
        },
      },
    });
  }
}
