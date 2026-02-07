import { test, describe, beforeEach, afterEach } from 'node:test';
import assert from 'node:assert';
import { build } from '../../lib/app.mjs';
import cacheService from '../../lib/services/cacheService.ts';

describe('Telemetry Routes Integration Tests', () => {
  let app;

  beforeEach(async () => {
    app = await build({ logger: false });
  });

  afterEach(async () => {
    await app.close();
    // Clear cache between tests to ensure isolation
    cacheService.clearAll();
  });

  describe('GeoPose Routes', () => {
    test('POST /vehiclestate - should set geo pose', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/vehiclestate',
        payload: {
          vehicleId: 'vehicle-001',
          data: {
            latitude: 37.7749,
            longitude: -122.4194,
            altitude: 30.0
          }
        }
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.status, 'ok');
    });

    test('GET /vehiclestate/:vehicleId - should get geo pose', async () => {
      // First set the data
      await app.inject({
        method: 'POST',
        url: '/vehiclestate',
        payload: {
          vehicleId: 'vehicle-001',
          data: {
            latitude: 37.7749,
            longitude: -122.4194,
            altitude: 30.0
          }
        }
      });

      // Then retrieve it
      const response = await app.inject({
        method: 'GET',
        url: '/vehiclestate/vehicle-001'
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.latitude, 37.7749);
      assert.strictEqual(body.longitude, -122.4194);
      assert.strictEqual(body.altitude, 30.0);
    });

    test('GET /vehiclestate/:vehicleId - should return 404 with detailed error when not found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/vehiclestate/nonexistent-vehicle'
      });

      assert.strictEqual(response.statusCode, 404);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, 'Resource not found');
      assert.strictEqual(body.vehicleId, 'nonexistent-vehicle');
      assert.strictEqual(body.type, 'geopose');
      assert.ok(body.message.includes('nonexistent-vehicle'));
      assert.ok(body.suggestion);
    });

    test('GET /vehiclestate/:vehicleId/history - should get geo pose history', async () => {
      // Set multiple data points
      await app.inject({
        method: 'POST',
        url: '/vehiclestate',
        payload: { vehicleId: 'vehicle-001', data: { latitude: 37.7749, longitude: -122.4194, altitude: 30.0 } }
      });

      await app.inject({
        method: 'POST',
        url: '/vehiclestate',
        payload: { vehicleId: 'vehicle-001', data: { latitude: 37.7750, longitude: -122.4195, altitude: 31.0 } }
      });

      // Get history
      const response = await app.inject({
        method: 'GET',
        url: '/vehiclestate/vehicle-001/history'
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.vehicleId, 'vehicle-001');
      assert.strictEqual(body.type, 'geopose');
      assert.strictEqual(body.count, 2);
      assert.strictEqual(body.requested, 'all');
      assert.ok(Array.isArray(body.data));
      assert.strictEqual(body.data.length, 2);
      assert.ok(body.data[0].timestamp);
      assert.ok(body.data[0].data);
    });

    test('GET /vehiclestate/:vehicleId/history?count=1 - should limit history results', async () => {
      // Set multiple data points
      await app.inject({
        method: 'POST',
        url: '/vehiclestate',
        payload: { vehicleId: 'vehicle-001', data: { latitude: 37.7749, longitude: -122.4194, altitude: 30.0 } }
      });

      await app.inject({
        method: 'POST',
        url: '/vehiclestate',
        payload: { vehicleId: 'vehicle-001', data: { latitude: 37.7750, longitude: -122.4195, altitude: 31.0 } }
      });

      // Get limited history
      const response = await app.inject({
        method: 'GET',
        url: '/vehiclestate/vehicle-001/history?count=1'
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.count, 1);
      assert.strictEqual(body.requested, 1);
      assert.strictEqual(body.data.length, 1);
      assert.strictEqual(body.data[0].data.latitude, 37.7750);
    });

    test('POST /vehiclestate - should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/vehiclestate',
        payload: {
          vehicleId: 'vehicle-001',
          data: {
            latitude: 37.7749
            // Missing longitude and altitude
          }
        }
      });

      assert.strictEqual(response.statusCode, 400);
    });

    test('GET /vehiclestate/:vehicleId/timerange - should get geo pose data by time range', async () => {
      const now = Date.now();
      const twoHoursAgo = now - 7200000;

      // Set data points at different times
      await app.inject({
        method: 'POST',
        url: '/vehiclestate',
        payload: { vehicleId: 'vehicle-001', data: { latitude: 37.7749, longitude: -122.4194, altitude: 30.0 } }
      });

      // Wait a bit to ensure different timestamps
      await new Promise(resolve => setTimeout(resolve, 10));

      await app.inject({
        method: 'POST',
        url: '/vehiclestate',
        payload: { vehicleId: 'vehicle-001', data: { latitude: 37.7750, longitude: -122.4195, altitude: 31.0 } }
      });

      // Query for data in time range
      const response = await app.inject({
        method: 'GET',
        url: `/vehiclestate/vehicle-001/timerange?startTime=${twoHoursAgo}&endTime=${now + 1000}`
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.vehicleId, 'vehicle-001');
      assert.strictEqual(body.type, 'geopose');
      assert.ok(body.timeRange);
      assert.ok(body.timeRange.duration);
      assert.strictEqual(body.count, 2);
      assert.ok(Array.isArray(body.data));
      assert.strictEqual(body.data.length, 2);
      assert.ok(body.data[0].timestamp >= twoHoursAgo);
      assert.ok(body.data[0].timestamp <= now + 1000);
    });

    test('GET /vehiclestate/:vehicleId/timerange - should return empty array for no matches', async () => {
      await app.inject({
        method: 'POST',
        url: '/vehiclestate',
        payload: { vehicleId: 'vehicle-001', data: { latitude: 37.7749, longitude: -122.4194, altitude: 30.0 } }
      });

      const futureStart = Date.now() + 10000;
      const futureEnd = Date.now() + 20000;

      const response = await app.inject({
        method: 'GET',
        url: `/vehiclestate/vehicle-001/timerange?startTime=${futureStart}&endTime=${futureEnd}`
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.count, 0);
      assert.ok(Array.isArray(body.data));
      assert.strictEqual(body.data.length, 0);
    });

    test('GET /vehiclestate/:vehicleId/timerange - should validate required parameters', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/vehiclestate/vehicle-001/timerange?startTime=123456'
        // Missing endTime
      });

      assert.strictEqual(response.statusCode, 400);
    });
  });

  describe('Disk Routes', () => {
    test('POST /disk/:vehicleId - should set disk state', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/disk/vehicle-001',
        payload: {
          totalSpace: '1000000000',
          usedSpace: '500000000',
          freeSpace: '500000000'
        }
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.status, 'ok');
    });

    test('GET /disk/:vehicleId - should get disk state', async () => {
      // First set the data
      await app.inject({
        method: 'POST',
        url: '/disk/vehicle-001',
        payload: {
          totalSpace: '1000000000',
          usedSpace: '500000000',
          freeSpace: '500000000'
        }
      });

      // Then retrieve it
      const response = await app.inject({
        method: 'GET',
        url: '/disk/vehicle-001'
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.totalSpace, '1000000000');
      assert.strictEqual(body.usedSpace, '500000000');
      assert.strictEqual(body.freeSpace, '500000000');
    });

    test('GET /disk/:vehicleId - should return 404 with detailed error when not found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/disk/nonexistent-vehicle'
      });

      assert.strictEqual(response.statusCode, 404);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, 'Resource not found');
      assert.strictEqual(body.vehicleId, 'nonexistent-vehicle');
      assert.strictEqual(body.type, 'disk');
      assert.ok(body.message);
      assert.ok(body.suggestion);
    });

    test('GET /disk/:vehicleId/history - should get disk state history', async () => {
      // Set multiple data points
      await app.inject({
        method: 'POST',
        url: '/disk/vehicle-001',
        payload: {
          totalSpace: '1000000000',
          usedSpace: '500000000',
          freeSpace: '500000000'
        }
      });

      await app.inject({
        method: 'POST',
        url: '/disk/vehicle-001',
        payload: {
          totalSpace: '1000000000',
          usedSpace: '600000000',
          freeSpace: '400000000'
        }
      });

      // Get history
      const response = await app.inject({
        method: 'GET',
        url: '/disk/vehicle-001/history'
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.vehicleId, 'vehicle-001');
      assert.strictEqual(body.type, 'disk');
      assert.strictEqual(body.count, 2);
      assert.strictEqual(body.requested, 'all');
      assert.ok(Array.isArray(body.data));
      assert.strictEqual(body.data.length, 2);
      assert.ok(body.data[0].timestamp);
      assert.ok(body.data[0].data);
    });

    test('GET /disk/:vehicleId/timerange - should get disk state data by time range', async () => {
      const now = Date.now();
      const twoHoursAgo = now - 7200000;

      // Set data points
      await app.inject({
        method: 'POST',
        url: '/disk/vehicle-001',
        payload: {
          totalSpace: '1000000000',
          usedSpace: '500000000',
          freeSpace: '500000000'
        }
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await app.inject({
        method: 'POST',
        url: '/disk/vehicle-001',
        payload: {
          totalSpace: '1000000000',
          usedSpace: '600000000',
          freeSpace: '400000000'
        }
      });

      // Query for data in time range
      const response = await app.inject({
        method: 'GET',
        url: `/disk/vehicle-001/timerange?startTime=${twoHoursAgo}&endTime=${now + 1000}`
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.vehicleId, 'vehicle-001');
      assert.strictEqual(body.type, 'disk');
      assert.ok(body.timeRange);
      assert.ok(body.timeRange.duration);
      assert.strictEqual(body.count, 2);
      assert.ok(Array.isArray(body.data));
      assert.strictEqual(body.data.length, 2);
      assert.ok(body.data[0].timestamp >= twoHoursAgo);
      assert.ok(body.data[0].timestamp <= now + 1000);
    });
  });

  describe('Fuel Routes', () => {
    test('POST /fuellevel - should set fuel state', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/fuellevel',
        payload: {
          vehicleId: 'vehicle-001',
          data: {
            fuelLevel: 75.5,
            fuelConsumptionRate: 2.3
          }
        }
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.status, 'ok');
    });

    test('GET /fuellevel/:vehicleId - should get fuel state', async () => {
      // First set the data
      await app.inject({
        method: 'POST',
        url: '/fuellevel',
        payload: {
          vehicleId: 'vehicle-001',
          data: {
            fuelLevel: 75.5,
            fuelConsumptionRate: 2.3
          }
        }
      });

      // Then retrieve it
      const response = await app.inject({
        method: 'GET',
        url: '/fuellevel/vehicle-001'
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.fuelLevel, 75.5);
      assert.strictEqual(body.fuelConsumptionRate, 2.3);
    });

    test('GET /fuellevel/:vehicleId - should return 404 with detailed error when not found', async () => {
      const response = await app.inject({
        method: 'GET',
        url: '/fuellevel/nonexistent-vehicle'
      });

      assert.strictEqual(response.statusCode, 404);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.error, 'Resource not found');
      assert.strictEqual(body.vehicleId, 'nonexistent-vehicle');
      assert.strictEqual(body.type, 'fuel');
      assert.ok(body.message);
      assert.ok(body.suggestion);
    });

    test('GET /fuellevel/:vehicleId/history - should get fuel state history', async () => {
      // Set multiple data points
      await app.inject({
        method: 'POST',
        url: '/fuellevel',
        payload: { vehicleId: 'vehicle-001', data: { fuelLevel: 75.5, fuelConsumptionRate: 2.3 } }
      });

      await app.inject({
        method: 'POST',
        url: '/fuellevel',
        payload: { vehicleId: 'vehicle-001', data: { fuelLevel: 70.0, fuelConsumptionRate: 2.5 } }
      });

      // Get history
      const response = await app.inject({
        method: 'GET',
        url: '/fuellevel/vehicle-001/history'
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.vehicleId, 'vehicle-001');
      assert.strictEqual(body.type, 'fuel');
      assert.strictEqual(body.count, 2);
      assert.strictEqual(body.requested, 'all');
      assert.ok(Array.isArray(body.data));
      assert.strictEqual(body.data.length, 2);
      assert.ok(body.data[0].timestamp);
      assert.ok(body.data[0].data);
    });

    test('POST /fuellevel - should validate required fields', async () => {
      const response = await app.inject({
        method: 'POST',
        url: '/fuellevel',
        payload: {
          vehicleId: 'vehicle-001',
          data: {
            fuelLevel: 75.5
            // Missing fuelConsumptionRate
          }
        }
      });

      assert.strictEqual(response.statusCode, 400);
    });

    test('GET /fuellevel/:vehicleId/timerange - should get fuel state data by time range', async () => {
      const now = Date.now();
      const twoHoursAgo = now - 7200000;

      // Set data points
      await app.inject({
        method: 'POST',
        url: '/fuellevel',
        payload: { vehicleId: 'vehicle-001', data: { fuelLevel: 75.5, fuelConsumptionRate: 2.3 } }
      });

      await new Promise(resolve => setTimeout(resolve, 10));

      await app.inject({
        method: 'POST',
        url: '/fuellevel',
        payload: { vehicleId: 'vehicle-001', data: { fuelLevel: 70.0, fuelConsumptionRate: 2.5 } }
      });

      // Query for data in time range
      const response = await app.inject({
        method: 'GET',
        url: `/fuellevel/vehicle-001/timerange?startTime=${twoHoursAgo}&endTime=${now + 1000}`
      });

      assert.strictEqual(response.statusCode, 200);
      const body = JSON.parse(response.body);
      assert.strictEqual(body.vehicleId, 'vehicle-001');
      assert.strictEqual(body.type, 'fuel');
      assert.ok(body.timeRange);
      assert.ok(body.timeRange.duration);
      assert.strictEqual(body.count, 2);
      assert.ok(Array.isArray(body.data));
      assert.strictEqual(body.data.length, 2);
      assert.ok(body.data[0].timestamp >= twoHoursAgo);
      assert.ok(body.data[0].timestamp <= now + 1000);
    });
  });

  describe('Multiple Vehicles', () => {
    test('should handle data for multiple vehicles independently', async () => {
      // Set data for vehicle-001
      await app.inject({
        method: 'POST',
        url: '/vehiclestate',
        payload: { vehicleId: 'vehicle-001', data: { latitude: 37.7749, longitude: -122.4194, altitude: 30.0 } }
      });

      // Set data for vehicle-002
      await app.inject({
        method: 'POST',
        url: '/vehiclestate',
        payload: { vehicleId: 'vehicle-002', data: { latitude: 40.7128, longitude: -74.0060, altitude: 10.0 } }
      });

      // Get vehicle-001 data
      const response1 = await app.inject({
        method: 'GET',
        url: '/vehiclestate/vehicle-001'
      });

      // Get vehicle-002 data
      const response2 = await app.inject({
        method: 'GET',
        url: '/vehiclestate/vehicle-002'
      });

      const body1 = JSON.parse(response1.body);
      const body2 = JSON.parse(response2.body);

      assert.strictEqual(body1.latitude, 37.7749);
      assert.strictEqual(body2.latitude, 40.7128);
    });
  });
});
