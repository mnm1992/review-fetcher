#!/usr/bin/env node

'use strict';

const devices = require( './devices.json' );
const brands = require( './brands.json' );

function deviceList () {
  return devices;
}

function brandList () {
  return brands;
}

function getDevices ( find, field, caseInsensitive, contains ) {
  return devices.filter( device => {
    return device[field] === find ||
      contains && device[field].indexOf( find ) !== -1 ||
      caseInsensitive && device[field].toLowerCase() === find.toLowerCase() ||
      caseInsensitive && contains && device[field].toLowerCase().indexOf( find.toLowerCase() ) !== -1;
  } );
}


function getDevicesByBrand ( brand, options ) {
  if ( typeof brand !== 'string' ) {
    throw new TypeError( '`brand` parameter must be a string' );
  }
  options = options || {};
  let caseInsensitive = !!options.caseInsensitive;
  let contains = !!options.contains;

  return getDevices( brand, 'brand', caseInsensitive, contains );
}

function getDevicesByName ( name, options ) {
  if ( typeof name !== 'string' ) {
    throw new TypeError( '`name` parameter must be a string' );
  }
  options = options || {};
  let caseInsensitive = !!options.caseInsensitive;
  let contains = !!options.contains;

  return getDevices( name, 'name', caseInsensitive, contains );
}

function getDevicesByDeviceId ( deviceId, options ) {
  if ( typeof deviceId !== 'string' ) {
    throw new TypeError( '`deviceId` parameter must be a string' );
  }
  options = options || {};
  let caseInsensitive = !!options.caseInsensitive;
  let contains = !!options.contains;

  return getDevices( deviceId, 'device', caseInsensitive, contains );
}

function getDevicesByModel ( model, options ) {
  if ( typeof model !== 'string' ) {
    throw new TypeError( '`model` parameter must be a string' );
  }
  options = options || {};
  let caseInsensitive = !!options.caseInsensitive;
  let contains = !!options.contains;

  return getDevices( model, 'model', caseInsensitive, contains );
}

module.exports = { deviceList, brandList,
  getDevicesByBrand, getDevicesByName, getDevicesByDeviceId, getDevicesByModel };
