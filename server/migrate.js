const fs = require('fs');
const path = require('path');

const BACKEND_URL = process.argv[2] || 'https://spotgo-backend-axiora.up.railway.app/api/v1';

async function migrate() {
  console.log(`Starting data migration to backend: ${BACKEND_URL}`);

  // 1. Read db.json
  const dbPath = path.join(__dirname, 'db.json');
  if (!fs.existsSync(dbPath)) {
    console.error(`Error: db.json not found at ${dbPath}`);
    process.exit(1);
  }

  let rawData = fs.readFileSync(dbPath, 'utf8');
  if (rawData.startsWith('\uFEFF')) {
    rawData = rawData.slice(1);
  }
  const db = JSON.parse(rawData);

  // 2. Migrate Parkings
  console.log('\n--- Migrating Parkings ---');
  const parkings = db.parkings || [];
  const parkingIdMap = new Map(); // Maps old string ID (e.g., prk-001) to new numeric ID (e.g., 1)

  for (const parking of parkings) {
    const payload = {
      name: parking.name,
      location: parking.address || parking.location,
      totalSpots: parking.totalSpaces || parking.totalSpots || 28,
      rating: parking.rating || 4.0,
      pricePerHour: parking.pricePerHour || 3.0
    };

    try {
      console.log(`Sending parking: ${parking.name}...`);
      const response = await fetch(`${BACKEND_URL}/parkings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${await response.text()}`);
      }

      const created = await response.json();
      parkingIdMap.set(parking.id, created.id);
      console.log(`Successfully migrated parking: ${parking.name} (Old ID: ${parking.id} -> New ID: ${created.id})`);
    } catch (err) {
      console.error(`Failed to migrate parking ${parking.name}:`, err.message);
    }
  }

  // 3. Migrate Blueprints and Detected Spots if needed?
  // Note: The backend has BlueprintsController and DetectedSpotsController, but they are not directly queried in this sprint's history module.
  // However, we should register at least one blueprint and spots so reservation spot IDs exist!
  // Let's create a blueprint and some spots for each migrated parking so database foreign keys (spotId) are satisfied!
  console.log('\n--- Creating Blueprints and Spots ---');

  for (const [oldParkingId, newParkingId] of parkingIdMap.entries()) {
    try {
      // Create a default blueprint for this parking
      console.log(`Creating default blueprint for parking ${newParkingId}...`);
      const blueprintResponse = await fetch(`${BACKEND_URL}/blueprints`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
          parkingId: newParkingId
        })
      });

      if (!blueprintResponse.ok) {
        throw new Error(`HTTP ${blueprintResponse.status} - ${await blueprintResponse.text()}`);
      }

      const blueprint = await blueprintResponse.json();
      console.log(`Created blueprint ${blueprint.id} for parking ${newParkingId}`);

      // Seed 100 detected spots for this blueprint so the database has enough spots to satisfy validations
      console.log(`Seeding 100 spots for blueprint ${blueprint.id}...`);
      for (let charCode = 0; charCode < 10; charCode++) {
        for (let num = 1; num <= 10; num++) {
          const spotResponse = await fetch(`${BACKEND_URL}/detected-spots`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              x: charCode * 10,
              y: num * 10,
              blueprintId: blueprint.id
            })
          });

          if (!spotResponse.ok) {
            console.error(`Failed to create spot ${String.fromCharCode(65 + charCode)}${num}: ${await spotResponse.text()}`);
          }
        }
      }
      console.log(`Successfully seeded 100 spots for blueprint ${blueprint.id}`);
    } catch (err) {
      console.error(`Failed to create blueprint/spots for parking ${newParkingId}:`, err.message);
    }
  }

  // 4. Migrate Reservations
  console.log('\n--- Migrating Reservations ---');
  const reservations = db.reservations || [];

  for (const res of reservations) {
    // Determine spotId based on spot name (e.g., A2, B5) and parkingId
    let spotId = 1;
    const newParkingId = parkingIdMap.get(res.parkingId) || 1;
    if (res.spot && typeof res.spot === 'string') {
      const charCode = res.spot.charCodeAt(0) - 65; // 'A' -> 0, 'B' -> 1
      const num = parseInt(res.spot.substring(1), 10) || 1;
      spotId = (newParkingId - 1) * 100 + (charCode * 10) + num;
    }

    // Convert dates to LocalDateTime string format
    const startTime = res.startDate ? new Date(res.startDate).toISOString().split('.')[0] : new Date().toISOString().split('.')[0];
    const endTime = res.endDate ? new Date(res.endDate).toISOString().split('.')[0] : new Date().toISOString().split('.')[0];

    const payload = {
      vehiclePlate: res.code || 'UNKNOWN',
      spotId: spotId,
      startTime: startTime,
      endTime: endTime
    };

    try {
      console.log(`Sending reservation for plate ${payload.vehiclePlate}...`);
      const response = await fetch(`${BACKEND_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status} - ${await response.text()}`);
      }

      const created = await response.json();
      console.log(`Successfully migrated reservation for plate: ${payload.vehiclePlate} (New ID: ${created.id})`);
    } catch (err) {
      console.error(`Failed to migrate reservation for plate ${payload.vehiclePlate}:`, err.message);
    }
  }

  console.log('\n--- Migration Finished! ---');
}

migrate();
