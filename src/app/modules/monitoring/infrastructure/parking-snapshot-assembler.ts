/*
  Assembler that translates between the ParkingSnapshot domain
  aggregate and its transport DTOs.

  Because the snapshot is a tree, the assembler walks it recursively:
  facility, stats (with its peak hours) and rows (with their spots).
  Each leaf instance is materialized through the corresponding entity
  constructor so the view layer only sees domain classes.
*/
import {
  Facility,
  ParkingRow,
  ParkingSnapshot,
  ParkingSpot,
  ParkingSpotStatus,
  ParkingStats,
  PeakHour,
} from '../domain/model/parking-spot.entity';
import {
  FacilityResource,
  ParkingRowResource,
  ParkingSnapshotResource,
  ParkingSpotResource,
  ParkingStatsResource,
  PeakHourResource,
} from './parking-snapshot-response';

export class ParkingSnapshotAssembler {
  toEntityFromResource(resource: ParkingSnapshotResource): ParkingSnapshot {
    return new ParkingSnapshot({
      facility: this.toFacility(resource.facility),
      stats: this.toStats(resource.stats),
      rows: resource.rows.map((row) => this.toRow(row)),
    });
  }

  toResourceFromEntity(entity: ParkingSnapshot): ParkingSnapshotResource {
    return {
      facility: this.fromFacility(entity.facility),
      stats: this.fromStats(entity.stats),
      rows: entity.rows.map((row) => this.fromRow(row)),
    };
  }

  private toFacility(r: FacilityResource): Facility {
    return new Facility({
      name: r.name,
      sector: r.sector,
      floor: r.floor,
      lastUpdated: r.lastUpdated,
      live: r.live,
    });
  }

  private fromFacility(e: Facility): FacilityResource {
    return {
      name: e.name,
      sector: e.sector,
      floor: e.floor,
      lastUpdated: e.lastUpdated,
      live: e.live,
    };
  }

  private toStats(r: ParkingStatsResource): ParkingStats {
    return new ParkingStats({
      totalSpaces: r.totalSpaces,
      currentlyAvailable: r.currentlyAvailable,
      availableTrendPercent: r.availableTrendPercent,
      occupancyRate: r.occupancyRate,
      revenueYield: r.revenueYield,
      revenueTrendPercent: r.revenueTrendPercent,
      peakHours: r.peakHours.map((p) => this.toPeakHour(p)),
    });
  }

  private fromStats(e: ParkingStats): ParkingStatsResource {
    return {
      totalSpaces: e.totalSpaces,
      currentlyAvailable: e.currentlyAvailable,
      availableTrendPercent: e.availableTrendPercent,
      occupancyRate: e.occupancyRate,
      revenueYield: e.revenueYield,
      revenueTrendPercent: e.revenueTrendPercent,
      peakHours: e.peakHours.map((p) => this.fromPeakHour(p)),
    };
  }

  private toPeakHour(r: PeakHourResource): PeakHour {
    return new PeakHour({ hour: r.hour, intensity: r.intensity });
  }

  private fromPeakHour(e: PeakHour): PeakHourResource {
    return { hour: e.hour, intensity: e.intensity };
  }

  private toRow(r: ParkingRowResource): ParkingRow {
    return new ParkingRow({
      id: r.id,
      spots: r.spots.map((s) => this.toSpot(s)),
    });
  }

  private fromRow(e: ParkingRow): ParkingRowResource {
    return {
      id: e.id,
      spots: e.spots.map((s) => this.fromSpot(s)),
    };
  }

  private toSpot(r: ParkingSpotResource): ParkingSpot {
    return new ParkingSpot({
      id: r.id,
      status: r.status as ParkingSpotStatus,
    });
  }

  private fromSpot(e: ParkingSpot): ParkingSpotResource {
    return { id: e.id, status: e.status };
  }
}
