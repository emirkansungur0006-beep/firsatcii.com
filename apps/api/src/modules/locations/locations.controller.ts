// apps/api/src/modules/locations/locations.controller.ts
import { Controller, Get, Param } from '@nestjs/common';
import { LocationsService } from './locations.service';

@Controller('locations')
export class LocationsController {
  constructor(private readonly locationsService: LocationsService) {}

  @Get('cities')
  getCities() { return this.locationsService.getCities(); }

  @Get('districts/all')
  getAllDistricts() { return this.locationsService.getAllDistricts(); }

  @Get('cities/:cityId/districts')
  getDistricts(@Param('cityId') cityId: string) {
    return this.locationsService.getDistricts(+cityId);
  }

  @Get('districts/:districtId/neighborhoods')
  getNeighborhoods(@Param('districtId') districtId: string) {
    return this.locationsService.getNeighborhoods(+districtId);
  }
}
