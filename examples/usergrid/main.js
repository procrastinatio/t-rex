import './style.css';
import {Map, View} from 'ol';
import TileLayer from 'ol/layer/Tile';
import {TileDebug}  from 'ol/source.js';

import proj4 from 'proj4';
import {ScaleLine, defaults as defaultControls} from 'ol/control.js';
import {fromLonLat} from 'ol/proj.js';
import {register} from 'ol/proj/proj4.js';
import {get as getProjection, getTransform} from 'ol/proj.js';
import WMTS from 'ol/source/WMTS.js';
import WMTSTileGrid from 'ol/tilegrid/WMTS.js';
import {Fill, Stroke, Style} from 'ol/style.js';
import VectorTileLayer from 'ol/layer/VectorTile.js';
import VectorTileSource from 'ol/source/VectorTile.js';
import {MVT} from 'ol/format.js';


const RESOLUTIONS = [
    4000, 3750, 3500, 3250, 3000, 2750, 2500, 2250, 2000, 1750, 1500, 1250,
    1000, 750, 650, 500, 250, 100, 50, 20, 10, 5, 2.5, 2, 1.5, 1, 0.5
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

  const servername = urlParams.get('server') || location.href;

 console.log(servername);

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

  var vtLayer = new VectorTileLayer({
    source: new VectorTileSource({
      format: new MVT(),
      tileGrid: tileGrid,
      tilePixelRatio: 16,
      url: servername + layername + '/{z}/{x}/{y}.pbf',
      projection: projection
    }),
    style: style
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