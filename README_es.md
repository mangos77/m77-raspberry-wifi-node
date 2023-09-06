# m77-raspberry-wifi-node

Es un módulo que he desarrollado en **node.js** para configurar red Wifi de **Raspberry Pi** que usa **wpa_cli** de **wpa_supplicant**.

___
**Ya está dispponible la implementación de este módulo para crear una API con todas las funcionalidades para node.js con express.**

La puedes encontrar en [***api-m77-raspberry-wifi-node***](https://github.com/mangos77/api-m77-raspberry-wifi-node)

___


### ¿Por qué?

Porque me he beneficiado mucho del trabajo de otras personas y organizaciones que ofrecen módulos de desarrollo y quiero regresar algo a la comunidad.

Le he dedicado varias horas para intentar dar las funcionalidades necesarias para un correcto desarrollo de aplicaciones en node.js.

Espero que les sea de gran utilidad y la recomienden para que llegue a más desarrolladores :-)

## Instalar
```
npm install m77-raspberry-wifi-node
```

## Uso
Para poder inicializar el módulo, primero se debe de importar, crear una instancia e inicializar **(en una función asíncrona)** con la configuración deseada
```
const M77RaspberryWIFI = require('m77-raspberry-wifi-node')
const wifi = new M77RaspberryWIFI()

async function start() {
    const init = await wifi.init()
}
start()
```

## Métodos
*** **Nota importante: Todos los métodos son asíncronos**

### listInterfaces()
Método auxiliar para conocer cuáles son las interfaces Wifi del sistema
```
const interfaces = await wifi.listInterfaces()
console.log(interfaces)
```
Respuesta:
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

### init(opciones)
Inicializa la interfaz y opciones para poder usar los demás métodos
opciones:
- *device* - La interfaz que se usará - por defecto **wlan0**
- *debugLevel* - El nivel de debug que se muestra en consola (0 - Nada, 1 - Básico, 2 - Completo) - Por defecto **2**
- *scan_timeout* - Tiempo máximo de espera en milisegundos para escanar redes Wi-Fi - Por defecto **15000**
- *connect_timeout* - Tiempo máximo de espera en milisegundos para escanar redes Wi-Fi - Por defecto **45000**

```
const init = await wifi.init({ device: "wlan0", debugLevel: 0 })
console.log(init)
```

Respuesta:
```
{ success: true, msg: 'Interface wlan0 has been found on the system' }
```

Error:
```
{ success: false, msg: `The wlan0 interface does not exist. Please execute the listInterfaces() method to get the list of available Wifi interfaces and set in init() method.` }
```

### status()
Muestra el estatus de conexión en la interfaz
```
const status = await wifi.status()
console.log(status)
```

Respuesta:
*** Sin conexión establecida***
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
*** Con conexión establecida***
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
Respuesta simple de status() que muestra si el dispositivo está conectado o no a una red Wifi
```
const hasConnection = await wifi.hasConnection()
console.log(hasConnection)
```

Respuesta:
***Conectado***
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
***No conectado***
```
{
  success: true,
  msg: 'Does interface wlan0 have a connection?',
  data: { has_connection: false, ssid: '', ip_address: '' }
}
```

### savedNetworks()
Entrega listado de todas las redes Wifi guardadas en la interfaz a las que se puede conectar
```
const saved = await wifi.savedNetworks()
console.log(saved)
```

Respuesta:
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
Elimina todas  las redes Wifi guardadas. Si existe alguna conexión establecida la cerrará.
```
const removeAllNetworks = await wifi.removeAllNetworks()
console.log(removeAllNetworks)
```

Respuesta:
```
{
  success: true,
  msg: 'Removed all Wifi network configurations for interface wlan0'
}
```


### scan()
Entrega resultado de todas las redes Wifi disponibles para conectarse ordenadas por fuerza de señal.

Se agregan datos en la respuesta en cada una de las redes detectadas: 
- **typeGHz** - (2.4, 5, etc.)
- **signalStrength** - [1 (fuerte) - 5 (débil)]
```
const scan = await wifi.scan()
console.log(scan)
```
Respuesta:
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
Muestra listado de todas las redes disponibles no ocultas y sin duplicados de ssid y frecuencia.
```
const availableUniques = await wifi.scanUniques()
console.log(availableUniques)
```

Respuesta:
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
Entrega las redes Wifi disponibles **agrupadas por tipo 2.4, 5, etc.**.  
**Se entregan ordenadas en cada bloque por la fuerza de la señal**

- **typeGHz** - (2.4, 5, etc.)
- **signalStrength** - [1 (fuerte) - 5 (débil)]
- **current** - [true | false] dependiendo si es a la red a la que se está conectado
```
const inTypes = await wifi.scanInTypes()
console.log(inTypes)
```

Respuesta:
```
{
  "success": true,
  "msg": "A list grouped by type of the scanned Wi-Fi networks was obtained",
  "data": {
    "wifi_24": [
      {
        "bssid": "48:26:14:8d:4c:d8",
        "frequency": "2417",
        "signallevel": "-26",
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
        "frequency": "5240",
        "signallevel": "-87",
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

### connect(configuración)
Método que intenta establecer conexión con una red Wifi, esto puede ser redes seguras, ocultas, abiertas o combinaciones.
Si la conexión no pudo realizarse se intenta conectar a alguna de las redes Wifi guardadas en el sistema que estén disponibles.
**Esta acción puede llevar mucho tiempo por el intento de conexión, el tiempo máximo de espera de cada intento de conexión está definido en init() con el parámetro de configuración *connect_timeout* **
configuración:
- *ssid* - Nombre de la red Wifi a conectarse
- *psk* - Contraseña de la red Wifi - **Dejar vacío en caso de red abierta**
- *removeAllNetworks* - [true | false] Si se desea que elimine todas las redes guardadas - Por defecto **false**
- *hidden* - [true | false] Para indicar si se trata o no de una red oculta - Por defecto **false**
- *bssid* - Usar el bssid en caso que se deseara fijar la conexión, *o en el caso que el ssid use dos bandas y se necsite conectar a una banda determinada* - Por defecto '' (no ata la conexión al bssid)

```
const connect = await wifi.connect({ ssid: "mangos77_other", psk: "sd343dsdsss"})
console.log(connect)
```
Respuesta:
***Se pudo establecer la conexión***
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
***No fue posible establecer la conexión***
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
Método para desconectar la Wifi actual de la interfaz
```
const disconnect = await wifi.disconnect()
console.log(disconnect)
```
Respuesta:
```
{ success: true, msg: 'Interface wlan0 has been disconnected' }
```

### reconnect()
Intenta re-conectar a una red guardada en el sistema
```
const reconnect = await wifi.reconnect()
console.log(reconnect)
```
Respuesta: 
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

Espero les sea de utilidad, si encuentras algún punto de mejora o comentario, por favor hazlo :-)