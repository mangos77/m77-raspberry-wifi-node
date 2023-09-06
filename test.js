const M77RaspberryWIFI = require('./src/m77-raspberry-wifi-node')

const wifi = new M77RaspberryWIFI()

async function init() {
    console.log("Init:")
    const init = await wifi.init({ device: "wlan0", debugLevel: 2, scan_timeout: 15000, connect_timeout: 45000 })
    console.log(init)

    /*
    console.log("\n\nInterfaces:")
    const interfaces = await wifi.listInterfaces()
    console.log(interfaces)
    */

    
    
    /*
    console.log("\n\nSaved Networks:")
    const saved = await wifi.savedNetworks()
    console.log(saved)
    */

    /*
    console.log("\n\Remove all networks:")
    const removeAllNetworks = await wifi.removeAllNetworks()
    console.log(removeAllNetworks)
    */

    /*
    console.log("\n\nStatus:")
    const status = await wifi.status()
    console.log(status)
    */

    /*
    console.log("\n\Connected?:")
    const hasConnection = await wifi.hasConnection()
    console.log(hasConnection)
    */

    /*
    console.log("\n\nScan:")
    const available = await wifi.scan()
    console.log(available)
    */

    /*
    console.log("\n\nScan Uniques Ordered:")
    const availableUniques = await wifi.scanUniques()
    console.log(availableUniques)
    */

    /*
    console.log("\n\nScan In Types:")
    const inTypes = await wifi.scanInTypes()
    console.log(JSON.stringify(inTypes, null, 2))
    */

    /*
    console.log("\n\nDisconnect:")
    const disconnect = await wifi.disconnect()
    console.log(disconnect)
    */

    /*
    console.log("\n\nReconnect:")
    const reconnect = await wifi.reconnect()
    console.log(reconnect)
    */
    
    /*
    console.log("\n\Connect:")
    const connect = await wifi.connect({ ssid: "mangos77", psk: "dfssdsdf44343", bssid: "", hidden: false, removeAllNetworks: false})
    console.log(connect)
    */
    
}
init()