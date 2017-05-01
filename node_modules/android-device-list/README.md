# Android device list

A JSON list created from Google Play Supported devices CVS.

Source: https://support.google.com/googleplay/android-developer/answer/6154891?hl=en

## Install

```
$ npm install android-device-list
```

## Usage

### `.deviceList()` : Array

Returns the full device list

### `.brandList()` : Array

Returns the full brand list

### `.getDevicesByBrand(brand, [options])` : Array

Returns a device list with matching retail brand.

`options` is an `Object`.
- `caseInsensitive`: boolean *(default false)* - do not care of case type
- `contains`: boolean *(default false)* - return partial (substring) results too

### `.getDevicesByName(name, [options])` : Array

Returns a device list with matching marketing name.

### `.getDevicesByDeviceId(deviceId, [options])` : Array

Returns a device list with matching [build.os.DEVICE](http://developer.android.com/reference/android/os/Build.html#DEVICE).

### `.getDevicesByModel(model, [options])` : Array

Returns a device list with matching [build.os.MODEL](http://developer.android.com/reference/android/os/Build.html#MODEL).


## Example

```js
var androidDevices = require('android-device-list');

var devices = androidDevices.deviceList();
var brands = androidDevices.brandList();

console.log(devices.length);
// 11174

console.log(brands.length);
// 485

console.log(brands[209]);
// 'LGE'

var LGDevices;

LGDevices = androidDevices.getDevicesByBrand('lg');
console.log(LGDevices.length);
// 0

LGDevices = androidDevices.getDevicesByBrand('LG');
console.log(LGDevices.length);
// 0

LGDevices = androidDevices.getDevicesByBrand('lg', { contains: true, caseInsensitive: true });
console.log(LGDevices.length);
// 902

LGDevices = androidDevices.getDevicesByBrand('LG', { contains: true });
console.log(LGDevices.length);
// 901


LGDevices = androidDevices.getDevicesByBrand('LGE');
console.log(LGDevices.length);
// 896

console.log(LGDevices[403]);
// { brand: 'LGE', name: 'LG G4', device: 'p1', model: 'LG-H815' }

```


## License

**android-device-list** is licensed under the MIT Open Source license. For more information, see the LICENSE file in this repository.
