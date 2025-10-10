import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingsService } from './bookings.service';
import { CreateRentalDto } from './dto/create-rental.dto';
import { CreateSaleDto } from './dto/create-sale.dto';
import { CheckAvailabilityDto } from './dto/check-availability.dto';
import { UpdateRentalStatusDto } from './dto/update-rental-status.dto';
import { UpdateSaleStatusDto } from './dto/update-sale-status.dto';
import { CancelBookingDto } from './dto/cancel-booking.dto';
import { AdminGuard } from '../../common/guards/admin.guard';
import { Public } from '../../common/decorators/public.decorator';
@ApiTags('Bookings')
@Controller('bookings')
@ApiBearerAuth()
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Public()
  @Post('check-availability')
  @ApiOperation({ summary: 'Check vehicle availability for rental' })
  @ApiResponse({ status: 200, description: 'Availability checked successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data' })
  async checkAvailability(@Body() checkAvailabilityDto: CheckAvailabilityDto) {
    return this.bookingsService.checkAvailability(checkAvailabilityDto);
  }

  @Public()
  @Post('rentals')
  @ApiOperation({ summary: 'Create a new rental booking (supports both authenticated and guest bookings)' })
  @ApiResponse({ status: 201, description: 'Rental booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data or vehicle not available' })
  async createRental(@Body() createRentalDto: CreateRentalDto, @Request() req) {
    // Extract user ID if authenticated, otherwise undefined for guest booking
    const userId = req.user?.id;
    return this.bookingsService.createRental(createRentalDto, userId);
  }

  @Public()
  @Post('sales')
  @ApiOperation({ summary: 'Create a new sale booking (supports both authenticated and guest bookings)' })
  @ApiResponse({ status: 201, description: 'Sale booking created successfully' })
  @ApiResponse({ status: 400, description: 'Invalid request data or vehicle not available' })
  async createSale(@Body() createSaleDto: CreateSaleDto, @Request() req) {
    // Extract user ID if authenticated, otherwise undefined for guest booking
    const userId = req.user?.id;
    return this.bookingsService.createSale(createSaleDto, userId);
  }

  @Get('rentals')
  @ApiOperation({ summary: 'Get user rental bookings' })
  @ApiResponse({ status: 200, description: 'Rental bookings retrieved successfully' })
  async getUserRentals(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.bookingsService.getUserRentals(req.user.id, pageNum, limitNum);
  }

  @Get('sales')
  @ApiOperation({ summary: 'Get user sale bookings' })
  @ApiResponse({ status: 200, description: 'Sale bookings retrieved successfully' })
  async getUserSales(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.bookingsService.getUserSales(req.user.id, pageNum, limitNum);
  }

  @Get('all')
  @ApiOperation({ summary: 'Get all user bookings (rentals and sales)' })
  @ApiResponse({ status: 200, description: 'All user bookings retrieved successfully' })
  async getUserAllBookings(
    @Request() req,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.bookingsService.getUserAllBookings(req.user.id, pageNum, limitNum);
  }

  @Get('rentals/:id')
  @ApiOperation({ summary: 'Get rental booking by ID' })
  @ApiResponse({ status: 200, description: 'Rental booking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Rental booking not found' })
  async getRentalById(@Param('id') id: string, @Request() req) {
    return this.bookingsService.getRentalById(id, req.user.id);
  }

  @Get('sales/:id')
  @ApiOperation({ summary: 'Get sale booking by ID' })
  @ApiResponse({ status: 200, description: 'Sale booking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Sale booking not found' })
  async getSaleById(@Param('id') id: string, @Request() req) {
    return this.bookingsService.getSaleById(id, req.user.id);
  }

  // Admin endpoints
  @Get('admin/rentals')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all rental bookings (Admin only)' })
  @ApiResponse({ status: 200, description: 'All rental bookings retrieved successfully' })
  async getAllRentals(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.bookingsService.getAllRentals(pageNum, limitNum, status as any);
  }

  @Get('admin/sales')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all sale bookings (Admin only)' })
  @ApiResponse({ status: 200, description: 'All sale bookings retrieved successfully' })
  async getAllSales(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const pageNum = page ? parseInt(page, 10) : 1;
    const limitNum = limit ? parseInt(limit, 10) : 10;
    return this.bookingsService.getAllSales(pageNum, limitNum, status as any);
  }

  @Get('admin/all')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get all bookings (Admin only)' })
  @ApiResponse({ status: 200, description: 'All bookings retrieved successfully' })
  async getAllBookings() {
    return this.bookingsService.getAllBookings();
  }

  @Patch('admin/rentals/:id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update rental status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Rental status updated successfully' })
  @ApiResponse({ status: 404, description: 'Rental booking not found' })
  async updateRentalStatus(
    @Param('id') id: string,
    @Body() updateRentalStatusDto: UpdateRentalStatusDto,
    @Request() req,
  ) {
    return this.bookingsService.updateRentalStatus(id, updateRentalStatusDto, req.user.id);
  }

  @Patch('admin/sales/:id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update sale status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Sale status updated successfully' })
  @ApiResponse({ status: 404, description: 'Sale booking not found' })
  async updateSaleStatus(
    @Param('id') id: string,
    @Body() updateSaleStatusDto: UpdateSaleStatusDto,
    @Request() req,
  ) {
    return this.bookingsService.updateSaleStatus(id, updateSaleStatusDto, req.user.id);
  }

  @Get('vehicle/:vehicleId/rentals')
  @Public()
  @ApiOperation({ summary: 'Get all rentals for a specific vehicle' })
  @ApiResponse({ status: 200, description: 'Vehicle rentals retrieved successfully' })
  async getVehicleRentals(@Param('vehicleId') vehicleId: string) {
    return this.bookingsService.getVehicleRentals(vehicleId);
  }

  @Patch('rentals/:id/cancel')
  @ApiOperation({ summary: 'Cancel rental booking (Customer only)' })
  @ApiResponse({ status: 200, description: 'Rental booking cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel booking in current status' })
  @ApiResponse({ status: 404, description: 'Rental booking not found' })
  @ApiResponse({ status: 403, description: 'Access denied - not your booking' })
  async cancelRental(
    @Param('id') id: string,
    @Body() cancelBookingDto: CancelBookingDto,
    @Request() req,
  ) {
    return this.bookingsService.cancelRental(id, req.user.id, cancelBookingDto.cancellationReason);
  }

  @Patch('sales/:id/cancel')
  @ApiOperation({ summary: 'Cancel sale booking (Customer only)' })
  @ApiResponse({ status: 200, description: 'Sale booking cancelled successfully' })
  @ApiResponse({ status: 400, description: 'Cannot cancel booking in current status' })
  @ApiResponse({ status: 404, description: 'Sale booking not found' })
  @ApiResponse({ status: 403, description: 'Access denied - not your booking' })
  async cancelSale(
    @Param('id') id: string,
    @Body() cancelBookingDto: CancelBookingDto,
    @Request() req,
  ) {
    return this.bookingsService.cancelSale(id, req.user.id, cancelBookingDto.cancellationReason);
  }

  @Get('admin/dashboard-stats')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Get admin dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard statistics retrieved successfully' })
  async getAdminDashboardStats() {
    return this.bookingsService.getAdminDashboardStats();
  }

  @Get('customer/dashboard-stats')
  @ApiOperation({ summary: 'Get customer dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Customer dashboard statistics retrieved successfully' })
  async getCustomerDashboardStats(@Request() req) {
    return this.bookingsService.getCustomerDashboardStats(req.user.id);
  }
}
