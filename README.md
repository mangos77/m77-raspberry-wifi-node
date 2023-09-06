***Si quieres ver el documento en español, por favor consulta el archivo README_es.md***

***My natural language is Spanish. All texts have been translated with Google Translator.***
---

# m77-raspberry-wifi-node

It is a module that I have developed in **node.js** to configure a **Raspberry Pi** Wifi network that uses **wpa_cli** from **wpa_supplicant**.

___
**Implementation of this module is now available to create a fully featured API for node.js with express.**

You can find it at [***api-m77-raspberry-wifi-node***](https://github.com/mangos77/api-m77-raspberry-wifi-node)

___

### Why do I do it?

Because I have benefited a lot from the work of other people and organizations that offer development modules and I want to give something back to the community.

I have dedicated several hours to try to give the necessary functionalities for a correct development of applications in node.js.

I hope you find it very useful and recommend it so that it reaches more developers :-)
## Install
```
npm install m77-raspberry-wifi-node
```

## Use
In order to initialize the module, it must first be imported, instantiated and initialized **(in an asynchronous function)** with the desired configuration
```
const M77RaspberryWIFI = require('m77-raspberry-wifi-node')
const wifi = new M77RaspberryWIFI()

async function start() {
    const init = await wifi.init()
}
start()
```

## Methods
*** **Important note: All methods are asynchronous**

### listInterfaces()
Auxiliary method to know which are the Wi-Fi interfaces of the system
```
const interfaces = await wifi.listInterfaces()
console.log(interfaces)
```
Response:
```
{
  success: true,
  msg: 'Wi-Fi interfaces found on the system',
  data: [ 'wlan0_ap', 'wlan0' ]
}
```
Error:
```
{ success: false, msg: `There are no Wi-Fi interfaces in the system.`, data: [] }
```

### init(options)
Initialize the interface and options to be able to use the other methods
options:
- *device* - The interface to use - default **wlan0**
- *debugLevel* - The debug level displayed on the console (0 - Nothing, 1 - Basic, 2 - Full) - Default **2**
- *scan_timeout* - Maximum waiting time in milliseconds to scan Wi-Fi networks - Default **15000**
- *connect_timeout* - Maximum waiting time in milliseconds to scan Wi-Fi networks - Default **45000**
```
const init = await wifi.init({ device: "wlan0", debugLevel: 0 })
console.log(init)
```

Response:
```
{ success: true, msg: 'Interface wlan0 has been found on the system' }
```

Error:
```
{ success: false, msg: `The wlan0 interface does not exist. Please execute the listInterfaces() method to get the list of available Wifi interfaces and set in init() method.` }
```

### status()
Show the connection status on the interface
```
const status = await wifi.status()
console.log(status)
```

Response:
*** No connection established***
```
{
  success: true,
  msg: 'Got interface status wlan0',
  data: {
    wpa_state: 'DISCONNECTED',
    p2p_device_address: 'da:3a:e8:35:d0:b7',
    address: 'da:3a:e8:35:d0:b7',
    uuid: 'aefc91bf-693f-57b0-3542-eeb8bc7e495a',
    connected: false
  }
}
```
*** With connection established***
```
{
  success: true,
  msg: 'Got interface status wlan0',
  data: {
    bssid: '48:45:4e:8f:4b:e7',
    freq: 5240,
    ssid: 'mangos77',
    id: 0,
    mode: 'station',
    pairwise_cipher: 'CCMP',
    group_cipher: 'CCMP',
    key_mgmt: 'WPA2-PSK',
    wpa_state: 'COMPLETED',
    ip_address: '192.168.68.60',
    p2p_device_address: 'da:3a:e8:35:d0:b7',
    address: 'da:3a:e8:35:d0:b7',
    uuid: 'aefc91bf-693f-57b0-3542-eeb8bc7e495a',
    ieee80211ac: '1',
    connected: true,
    typeGHz: '5',
    signallevel: -34,
    signalStrength: 4
  }
}
```

### hasConnection()
Simple status() response showing whether or not the device is connected to a Wifi network
```
const hasConnection = await wifi.hasConnection()
console.log(hasConnection)
```

Response:
***Connected***
```
{
  success: true,
  msg: 'Does interface wlan0 have a connection?',
  data: {
    has_connection: true,
    ssid: 'mangos77',
    ip_address: '192.168.1.60'
  }
}
```
***Not connected***
```
{
  success: true,
  msg: 'Does interface wlan0 have a connection?',
  data: { has_connection: false, ssid: '', ip_address: '' }
}
```

### savedNetworks()
Delivers a list of all the Wifi networks saved in the interface to which it can be connected
```
const saved = await wifi.savedNetworks()
console.log(saved)
```

Response:
```
{
  success: true,
  msg: 'List of saved Wi-Fi networks',
  data: [
    {
      networkid: '0',
      ssid: 'mangos77',
      bssid: 'any',
      flags: '[CURRENT]'
    },
    ...
    ...
  ]
}
```

### removeAllNetworks()
Delete all saved Wi-Fi networks. If there is any established connection, it will close it.
```
const removeAllNetworks = await wifi.removeAllNetworks()
console.log(removeAllNetworks)
```

Response:
```
{
  success: true,
  msg: 'Removed all Wifi network configurations for interface wlan0'
}
```


### scan()
Delivers the result of all available Wi-Fi networks to connect ordered by signal strength.

Data is added in the response on each of the detected networks:
- **typeGHz** - (2.4, 5, etc.)
- **signalStrength** - [1 (strong) - 5 (weak)]
```
const scan = await wifi.scan()
console.log(scan)
```
Response:
```
{
  success: true,
  msg: 'List of scanned Wi-Fi networks was obtained',
  data: [
    {
      "bssid": "48:22:34:7d:4c:c7",
      "frequency": 5240,
      "signallevel": -33,
      "flags": "[WPA2-PSK+FT/PSK-CCMP][WPS][ESS]",
      "open": false,
      "ssid": "mangos77",
      "typeGHz": "5",
      "signalStrength": 1,
      "current": true
    },
    ...
    ...
    {
      "bssid": "0e:96:e6:43:44:e4",
      "frequency": 2412,
      "signallevel": -88,
      "flags": "[ESS]",
      "open": true,
      "ssid": "My Open Net",
      "typeGHz": "5",
      "signalStrength": 2,
      "current": false
    }
  ]
}
```

### scanUniques()
Shows list of all available networks not hidden and without duplicates of ssid and frequency.
```
const availableUniques = await wifi.scanUniques()
console.log(availableUniques)
```

Response:
```
{
  success: true,
  msg: 'Got a list of unique and not hidden Wi-Fi networks',
  data: [
    {
      bssid: '48:54:5b:9e:4a:c7',
      frequency: 5240,
      signallevel: -39,
      flags: '[WPA2-PSK+FT/PSK-CCMP][WPS][ESS]',
      open: false,
      ssid: 'mangos77',
      typeGHz: '5',
      signalStrength: 4,
      current: true
    },
    ...
    {
      bssid: '4e:23:b4:9e:4a:c6',
      frequency: 2417,
      signallevel: -27,
      flags: '[WPA2-PSK+FT/PSK-CCMP][ESS]',
      open: false,
      ssid: 'mangos77',
      typeGHz: '2.4',
      signalStrength: 4,
      current: false
    }
  ]
}
```


### scanInTypes()
Returns the available Wi-Fi networks **grouped by type 2.4, 5, etc.**.
**They are delivered ordered in each block by the strength of the signal**

Data is added in the response on each of the detected networks:
- **typeGHz** - (2.4, 5, etc.)
- **signalStrength** - [1 (strong) - 5 (weak)]
- **current** - [true | false] depending on whether it is the network you are connected to
```
const inTypes = await wifi.scanInTypes()
console.log(inTypes)
```

Response:
```
{
  "success": true,
  "msg": "A list grouped by type of the scanned Wi-Fi networks was obtained",
  "data": {
    "wifi_24": [
      {
        "bssid": "48:26:14:8d:4c:d8",
        "frequency": 2417,
        "signallevel": -26,
        "flags": "[WPA2-PSK+FT/PSK-CCMP][WPS][ESS]",
        "open": false,
        "ssid": "mangos77",
        "typeGHz": "2.4",
        "signalStrength": 1,
        "current": false
      },
      ...
    ],
    "wifi_5": [
      {
        "bssid": "48:22:78:8e:6a:bf",
        "frequency": 5240,
        "signallevel": -87,
        "flags": "[WPA2-PSK+FT/PSK-CCMP][WPS][ESS]",
        "open": false,
        "ssid": "mangos77",
        "typeGHz": "5",
        "signalStrength": 2,
        "current": true
      },
      ...    
    ]
  }
}
```

### connect(config)
Method that tries to establish a connection with a Wi-Fi network, this can be secure, hidden, open networks or combinations.
If the connection could not be made, it tries to connect to any of the Wi-Fi networks saved in the system that are available.
**This action can take a long time per connection attempt, the maximum timeout for each connection attempt is defined in init() with the *connect_timeout* configuration parameter **

config:
- *ssid* - Name of the Wi-Fi network to connect to
- *psk* - Wifi network password - **Leave empty in case of open network**
- *removeAllNetworks* - [true | false] If you want to delete all saved networks - Default **false**
- *hidden* - [true | false] To indicate whether or not it is a hidden network - By default **false**
- *bssid* - Use the bssid in case you want to fix the connection, *or in the case that the ssid uses two bands and you need to connect to a specific band* - By default '' (does not bind the connection to the bssid)

```
const connect = await wifi.connect({ ssid: "mangos77_other", psk: "sd343dsdsss"})
console.log(connect)
```
Response:
***Connection could be established***
```
{
  success: true,
  msg: 'The Wi-Fi network has been successfully configured on interface wlan0',
  data: {
    milliseconds: 24851,
    connected_to: { milliseconds: 24851, ssid: 'mangos77_other' }
  }
}
```
***Could not establish connection***
```
{
  success: false,
  msg: 'Could not connect to SSID "mangos77_other" on interface wlan0. The interface wlan0 has been reconnected to ssid "mangos77" in 6315 milliseconds',
  data: {
    milliseconds: 59481,
    connected_to: { milliseconds: 6315, ssid: 'mangos77' }
  }
}
```

### disconnect()
Method to disconnect the current Wifi from the interface
```
const disconnect = await wifi.disconnect()
console.log(disconnect)
```
Response:
```
{ success: true, msg: 'Interface wlan0 has been disconnected' }
```

### reconnect()
Try to re-connect to a network saved in the system
```
const reconnect = await wifi.reconnect()
console.log(reconnect)
```
Response: 
```
{
  success: true,
  msg: 'The interface wlan0 has been reconnected to ssid "mangos77" in 13487 milliseconds',
  data: { milliseconds: 13487, ssid: 'mangos77' }
}
```

Error:
```
{ success: false, msg: 'Failed to reconnect interface wlan0' }
```

I hope you find it useful, if you find any point of improvement or comment, please do so :-)