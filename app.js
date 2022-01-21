/* eslint-disable no-console */

// Import helper libraries
const fsPromises = require('fs/promises');
const xml2js = require('xml2js');

const builder = new xml2js.Builder({ cdata: true });

// Load locations from filesystem
const locations = require('./data/locations.json');

function formatDescription(data) {
  const restaurantDescription = data.restaurants.map((restaurant) => `<h1 style="font-family:sans-serif;">${restaurant.name}</h1>
      <table>
        <tr>
          <th>Address:</th><td>${restaurant.address}</td>
        </tr>
        <tr>
          <th>Hours:</th><td>${restaurant.hours}</td>
        </tr>
        <tr>
          <th>Website:</th><td><a href="${restaurant.url}">Website</a></td>
        </td>
        <tr>
          <th>Notes:</th><td>${restaurant.notes}</td>
        </tr>
      </table>`);

  return restaurantDescription;
}

function buildPlacemarks(rawLocations) {
  // Take JSON location data and convert to Placemark schema (still in JSON)
  const processedLocations = rawLocations.map((location) => ({
    Placemark: {
      name: `${location.airport.code} - ${location.airport.name}`,
      description: formatDescription(location),
      styleUrl: '#styleMap',
      Point: {
        coordinates: location.airport.coordinates,
      },
    },
  }));

  return processedLocations;
}

async function buildXml(data) {
  const xml = {
    kml: {
      $: {
        xmlns: 'http://www.opengis.net/kml/2.2',
      },
      Document: {
        name: 'AerowoodFlyingToFoodMap.kml',
        Style: {
          $: {
            id: 'normalPlacemark',
          },
          IconStyle: {
            color: 'ff000000',
            scale: 1.2,
            Icon: {
              href: 'http://maps.google.com/mapfiles/kml/shapes/open-diamond.png',
            },
          },
        },
        StyleMap: {
          $: {
            id: 'styleMap',
          },
          Pair: {
            key: 'normal',
            styleUrl: '#normalPlacemark',
          },
        },
        Placemark: data,
      },
    },
  };

  return builder.buildObject(xml);
}

async function main() {
  console.log('Starting generation of KML file from location data.');

  // Loop through CASCs and build an object
  const processedLocations = await buildPlacemarks(locations);

  // Convert centers from JSON to XML
  const xml = await buildXml(processedLocations);

  // Write KML to disk
  await fsPromises.mkdir('./output');
  await fsPromises.writeFile('./output/AerowoodFlyingToFoodMap.kml', xml, 'utf-8');

  console.log('Finished generating KML file.  Pleaes see output/AerowoodFlyingToFoodMap.kml.');
}

main();
