import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { Public } from 'src/common/decorators/public.decorator';
import { VehiclesService } from './vehicles.service';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';
import { CreateSubcategoryDto } from './dto/create-subcategory.dto';
import { UpdateSubcategoryDto } from './dto/update-subcategory.dto';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('vehicles')
@UseGuards(JwtAuthGuard)
export class VehiclesController {
  constructor(private readonly vehiclesService: VehiclesService) {}

  // Category endpoints
  @Post('categories')
  createCategory(@Body() createCategoryDto: CreateCategoryDto) {
    return this.vehiclesService.createCategory(createCategoryDto);
  }

  @Public()
  @Get('categories')
  findAllCategories() {
    return this.vehiclesService.findAllCategories();
  }

  @Get('categories/:id')
  findOneCategory(@Param('id') id: string) {
    return this.vehiclesService.findOneCategory(id);
  }

  @Patch('categories/:id')
  updateCategory(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ) {
    return this.vehiclesService.updateCategory(id, updateCategoryDto);
  }

  @Delete('categories/:id')
  removeCategory(@Param('id') id: string) {
    return this.vehiclesService.removeCategory(id);
  }

  @Patch('categories/:id/toggle-status')
  toggleCategoryStatus(@Param('id') id: string) {
    return this.vehiclesService.toggleCategoryStatus(id);
  }

  // Subcategory endpoints
  @Post('subcategories')
  createSubcategory(@Body() createSubcategoryDto: CreateSubcategoryDto) {
    return this.vehiclesService.createSubcategory(createSubcategoryDto);
  }

  @Public()
  @Get('subcategories')
  findAllSubcategories(@Query('categoryId') categoryId?: string) {
    return this.vehiclesService.findAllSubcategories(categoryId);
  }

  @Get('subcategories/:id')
  findOneSubcategory(@Param('id') id: string) {
    return this.vehiclesService.findOneSubcategory(id);
  }

  @Patch('subcategories/:id')
  updateSubcategory(
    @Param('id') id: string,
    @Body() updateSubcategoryDto: UpdateSubcategoryDto,
  ) {
    return this.vehiclesService.updateSubcategory(id, updateSubcategoryDto);
  }

  @Delete('subcategories/:id')
  removeSubcategory(@Param('id') id: string) {
    return this.vehiclesService.removeSubcategory(id);
  }

  @Patch('subcategories/:id/toggle-status')
  toggleSubcategoryStatus(@Param('id') id: string) {
    return this.vehiclesService.toggleSubcategoryStatus(id);
  }

  // Vehicle endpoints
  @Post()
  createVehicle(@Body() createVehicleDto: CreateVehicleDto) {
    return this.vehiclesService.createVehicle(createVehicleDto);
  }

  @Public()
  @Get()
  findAllVehicles(
    @Query('categoryId') categoryId?: string,
    @Query('subcategoryId') subcategoryId?: string,
    @Query('type') type?: string,
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const filters: any = {};
    if (categoryId) filters.categoryId = categoryId;
    if (subcategoryId) filters.subcategoryId = subcategoryId;
    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;
    if (page) filters.page = parseInt(page, 10);
    if (limit) filters.limit = parseInt(limit, 10);

    return this.vehiclesService.findAllVehicles(filters);
  }

  @Get(':id')
  findOneVehicle(@Param('id') id: string) {
    return this.vehiclesService.findOneVehicle(id);
  }

  @Patch(':id')
  updateVehicle(
    @Param('id') id: string,
    @Body() updateVehicleDto: UpdateVehicleDto,
  ) {
    return this.vehiclesService.updateVehicle(id, updateVehicleDto);
  }

  @Delete(':id')
  removeVehicle(@Param('id') id: string) {
    return this.vehiclesService.removeVehicle(id);
  }

  @Patch(':id/toggle-status')
  toggleVehicleStatus(@Param('id') id: string) {
    return this.vehiclesService.toggleVehicleStatus(id);
  }

  // Bulk operations
  @Patch('bulk-update')
  bulkUpdateVehicles(
    @Body() body: { vehicleIds: string[]; updates: Partial<UpdateVehicleDto> },
  ) {
    return this.vehiclesService.bulkUpdateVehicles(body.vehicleIds, body.updates);
  }

  @Delete('bulk-delete')
  bulkDeleteVehicles(@Body() body: { vehicleIds: string[] }) {
    return this.vehiclesService.bulkDeleteVehicles(body.vehicleIds);
  }

  // Analytics
  @Get('stats')
  getVehicleStats() {
    return this.vehiclesService.getVehicleStats();
  }
}
