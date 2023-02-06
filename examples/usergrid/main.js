import './style.css';
import {Map, View} from 'ol';




import {get as getProjection} from 'ol/proj.js';
import {register} from 'ol/proj/proj4.js'




import TileLayer from 'ol/layer/Tile.js';
//import View from 'ol/View.js';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';

import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';

import {TileDebug} from 'ol/source.js';

import {Fill, Stroke, Style} from 'ol/style.js';
import {MVT} from 'ol/format.js';

const RESOLUTIONS = [
  4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250,
  1000, 750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5, 0.2, 0.1
];

/* Registering a new custom projection */

proj4.defs("EPSG:2056", "+proj=somerc +lat_0=46.95240555555556 +lon_0=7.439583333333333 +k_0=1 +x_0=2600000 +y_0=1200000 +ellps=bessel +towgs84=674.374,15.056,405.346,0,0,0,0 +units=m +no_defs");

register(proj4);


var extent = [2420000, 1030000, 2900000, 1350000];
var projection = getProjection("EPSG:2056");
projection.setExtent(extent);


/* Convenience for trying layers */
const queryString = window.location.search;
const urlParams = new URLSearchParams(queryString);
const layername = urlParams.get('layer') || 'g1k18'
const debug = urlParams.get('debug') || false;
const hostname = urlParams.get('hostname') || window.location.origin;

var matrixIds = [];
for (var i = 0; i < RESOLUTIONS.length; i++) {
  matrixIds.push(i);
}

var tileGrid = new WMTSTileGrid({
  origin: [extent[0], extent[3]],
  resolutions: RESOLUTIONS,
  matrixIds: matrixIds
});

/* Trusted raster layer */

var wmtsLayer = new TileLayer({
  source: new WMTS(({
      url: 'https://wmts.geo.admin.ch/1.0.0/{Layer}/default/current/2056/{TileMatrix}/{TileCol}/{TileRow}.jpeg',
      tileGrid: tileGrid,
      projection: projection,
      layer: "ch.swisstopo.swissimage",
      requestEncoding: 'REST'
  }))
});

/* Vector layer   */

var style = new Style({
  stroke: new Stroke({
      color: '#FFFF33',
      width: 3
  })
});

const colors = {
  /* Custom styles (not finished)  */
  'Wanderweg': "rgba(255,204,50,0.7)",
  'Bergwanderweg': "rgba(230,20,20,0.7)",
  'Alpinwanderweg': "rgba(20,20,230,0.7)",
  4: "rgba(240,255,255,0.7)",
  5: "rgba(240,255,255,0.7)",
  6: "rgba(187,252,255,0.7)",
  'unknown': "rgba(187,252,255,0.7)",

};


function myStyle(feature) {
  var objval = feature.get("wanderwege_resolved") || 'unknown'
  //console.log(objval);

  return new Style({
      stroke: new Stroke({
          color: colors[objval],
          width: 2
      })

  });
}

var vtLayer = new VectorTileLayer({
  source: new VectorTileSource({
      format: new MVT(),
      tileGrid: tileGrid,
      tilePixelRatio: 16,
      url: hostname + '/' + layername + '/{z}/{x}/{y}.pbf',
      projection: projection
  }),
  style: myStyle
});


const tileDebug = new TileLayer({
  source: new TileDebug({
      projection: vtLayer.getSource().getProjection(),
      tileGrid: vtLayer.getSource().getTileGrid(),
  })
});

/* View and vector projection have to match, no reprojection like for raster layers */
var map = new Map({
  layers: [wmtsLayer, vtLayer],
  target: 'map',
  view: new View({
      center: [2660000, 1190000],
      projection: projection,
      resolution: 500
  })
});

if (debug) {
  map.addLayer(tileDebug);
}





var selectElement = "singleselect"; //document.getElementById('type');

map.on("click", function (event) {
  var features = map.getFeaturesAtPixel(event.pixel);
  if (!features) {
      selection = {};
      // force redraw of layer style
      //vtLayer.setStyle(vtLayer.getStyle());
      return;
  }
  var feature = features[0];

  console.log(feature);

  if (selectElement.value === "singleselect") {
      selection = {};
  }
  // add selected feature to lookup
  // selection[fid] = feature;

  // force redraw of layer style
  //vtLayer.setStyle(vtLayer.getStyle());
});
