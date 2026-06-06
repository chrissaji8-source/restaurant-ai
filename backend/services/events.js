function getLocalEvents(city, date) {
  // TODO: Replace with Eventbrite API in Phase 2
  return [
    { name: 'Local Food Festival', venue: 'Bandra Kurla Complex', time: '18:00', distance_km: 2.5, expected_footfall: 5000 },
    { name: 'Cricket Match Screening', venue: 'Jio World Garden', time: '19:30', distance_km: 1.2, expected_footfall: 2000 },
    { name: 'Standup Comedy Night', venue: 'Habitat', time: '20:00', distance_km: 4.0, expected_footfall: 300 }
  ];
}

module.exports = { getLocalEvents };
