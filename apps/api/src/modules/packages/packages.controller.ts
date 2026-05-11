import { Controller, Get, Post, Body, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { PackagesService } from './packages.service';
import { CreatePackageDto } from './dto/create-package.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@Controller('packages')
@UseGuards(JwtAuthGuard)
export class PackagesController {
  constructor(private readonly packagesService: PackagesService) {}

  @Post()
  create(@Req() req: any, @Body() createPackageDto: CreatePackageDto) {
    return this.packagesService.createPackage(req.user.id, createPackageDto);
  }

  @Get()
  findAll() {
    return this.packagesService.getAllPackages();
  }

  @Get('my')
  findMy(@Req() req: any) {
    return this.packagesService.getMyPackages(req.user.id);
  }

  @Get('orders')
  findMyOrders(@Req() req: any) {
    return this.packagesService.getMyOrders(req.user.id, req.user.role);
  }

  @Post(':id/buy')
  buy(@Req() req: any, @Param('id') id: string) {
    return this.packagesService.buyPackage(id, req.user.id);
  }

  @Patch('orders/:id/respond')
  respond(@Req() req: any, @Param('id') id: string, @Body('status') status: 'ACCEPTED' | 'REJECTED') {
    return this.packagesService.respondToOrder(id, req.user.id, status);
  }
}
