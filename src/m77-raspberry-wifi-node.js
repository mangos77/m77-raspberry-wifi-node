class M77RaspberryWIFI {
    #exec = null
    #debugLevel
    #device = ""
    #scan_timeout = 0
    #connect_timeout = 0
    #ready = false
    #responseNoInterface = () => { return { success: false, msg: `The ${this.#device} interface does not exist. Please execute the listInterfaces() method to get the list of available Wifi interfaces and set in init() method.` } }

    constructor() {
        this.#exec = require('child_process').exec
    }

    #sleep(ms) {
        return new Promise(resolve => {
            setTimeout(resolve, ms);
        });
    }

    #debug(text = "", extra = "") {
        if (this.#debugLevel > 0) console.warn("log:", text)
        if (this.#debugLevel > 1 && extra !== "" && extra !== null && extra !== undefined) console.warn("Extra information:", extra, "\n\n")
    }

    #validateDevice() {
        return new Promise((resolve, reject) => {
            const command = `/usr/sbin/iw dev | grep -E 'Interface ${this.#device}$'`
            this.#exec(command, (err, stdout, stderr) => {
                stdout = stdout.replace(/\t/g, '').trim().split(/\r?\n/)
                if (err !== null || stdout.length < 1) {
                    this.#debug(`The ${this.#device} interface does not exist.`, 'Please execute the listInterfaces() method to get the list of available Wifi interfaces.')
                    resolve(false)
                }
                resolve(true)
            })
        })
    }

    #wpa(action) {
        return new Promise((resolve, reject) => {
            if (this.#ready === false) {
                this.#debug(`The ${this.#device} interface does not exist.`, 'Please execute the listInterfaces() method to get the list of available Wifi interfaces.')
                resolve(false)
            } else {
                const command = `/usr/sbin/wpa_cli -i ${this.#device} ${action}`
                this.#exec(command, (err, stdout, stderr) => {
                    if (err !== null) {
                        this.#debug(stderr)
                        resolve(false)
                    } else {
                        resolve(stdout.trim())
                    }
                })
            }
        })
    }

    #scanStatus() {
        return new Promise(async (resolve, reject) => {
            const startTime = new Date()
            let scanned = ''
            do {
                if (new Date() - startTime > this.#scan_timeout) {
                    this.#debug(`The waiting time to obtain the result of the Wi-Fi network scan has been exceeded (${this.scan_timeout} milliseconds), this waiting time can be set in the init function as a parameter of the json object { scan_timeout: [in_milliseconds] }`)
                    resolve(false)
                    return false
                }
                scanned = await this.#wpa('scan')
                try { scanned = scanned.trim() } catch (e) { }
                if (scanned !== "FAIL-BUSY") {
                    if (scanned !== "OK") {
                        this.#debug('It has not been possible to scan Wi-Fi networks')
                        resolve(false)
                        return false
                    } else {
                        resolve(true)
                    }
                }
                await this.#sleep(100)
            } while (scanned === 'FAIL-BUSY')
        })
    }

    #validIPaddr(ip = "") {
        if (typeof ip !== "string") return false

        const result = ip.search(/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/)
        return result < 0 ? false : true
    }

    #waitConnection() {
        return new Promise(async (resolve, reject) => {
            const startTime = new Date()
            let hasConnection = { data: { has_connection: false } }
            do {
                let theTime = new Date() - startTime
                if (theTime > this.#connect_timeout) {
                    this.#debug(`The waiting time to connect Wi-Fi network scan has been exceeded (${this.#connect_timeout} milliseconds), this waiting time can be set in the init function as a parameter of the json object { connect_timeout: [in_milliseconds] }`)
                    resolve(false)
                    return false
                }
                hasConnection = await this.hasConnection()

                if (hasConnection.data.has_connection === true) {
                    this.#debug(`The wait for connection has been ${theTime} milliseconds`)
                    resolve(true)
                    return false
                }
                await this.#sleep(250)
            } while (hasConnection.data.has_connection === false)
        })
    }

    #removeNetwork(idNet) {
        return new Promise(async (resolve, reject) => {
            if (this.#ready === false) { resolve(this.#responseNoInterface()); return false }

            const removeNetwork = await this.#wpa(`remove_network ${idNet}`)

            if (removeNetwork !== "OK") {
                resolve(false); return false
            }
            resolve(true)
        })
    }

    #reconfigure() {
        return new Promise(async (resolve, reject) => {
            if (this.#ready === false) { resolve(this.#responseNoInterface()); return false }

            const reconfigure = await this.#wpa('reconfigure')

            if (reconfigure !== "OK") {
                this.#debug(`Could not reconfigure interface ${this.#device}`)
                resolve(false); return false
            }
            this.#debug(`Interface ${this.#device} has been reconfigured`)
            resolve(true)
        })
    }

    #removeAllNetworks() {
        return new Promise(async (resolve, reject) => {
            const saved = await this.savedNetworks()

            if (saved.success === true) {
                for (let i = 0; i < saved.data.length; i++) {
                    let netRemoved = await this.#removeNetwork(saved.data[i].networkid)
                    this.#debug(`Network "${saved.data[i].ssid}" has benn removed`)
                }
                resolve(true)
            } else {
                resolve(false)
            }
        })
    }

    #typeWifi(freq = 0) {
        const ranges = {
            wifi_24: { min: 2400, max: 2500 },
            wifi_5: { min: 5150, max: 5850 },
            wifi_6: { min: 5925, max: 7125 },
        }

        let typeWifi = ""
        switch (true) {
            case freq >= ranges.wifi_24.min && freq <= ranges.wifi_24.max: typeWifi = "2.4"; break;
            case freq >= ranges.wifi_5.min && freq <= ranges.wifi_5.max: typeWifi = "5"; break;
            case freq >= ranges.wifi_6.min && freq <= ranges.wifi_6.max: typeWifi = "6"; break;
            default: typeWifi = "other";

        }
        return typeWifi
    }

    #signal_poll(idNetwork = 0, signallevel = 0) {
        return new Promise(async (resolve, reject) => {
            let rssi = await this.#wpa(`signal_poll ${idNetwork}`)
            try {
                const rssiArr = rssi.split(/\r?\n/)

                if (rssiArr.length > 1) {
                    const rssiJSON = {}

                    rssiArr.map(row => {
                        const rowArr = row.split(/=/g)
                        rssiJSON[rowArr[0]] = rowArr[1]
                    })

                    try {
                        rssiJSON.RSSI = parseInt(rssiJSON.RSSI)
                        rssiJSON.LINKSPEED = parseInt(rssiJSON.LINKSPEED)
                        rssiJSON.FREQUENCY = parseInt(rssiJSON.FREQUENCY)
                        rssiJSON.RSSI = parseInt(rssiJSON.RSSI)
                    } catch (e) { }

                    resolve(rssiJSON)
                } else {
                    resolve(false)
                }
            } catch (e) {
                resolve(false)
                return false
            }
        })
    }

    #signalStrength(signallevel = 0) {
        signallevel = parseInt(signallevel)
        let signalStrength = 0
        switch (true) {
            case signallevel > -50: signalStrength = 4; break;
            case signallevel > -70: signalStrength = 3; break;
            case signallevel > -85: signalStrength = 2; break;
            case signallevel <= -85: signalStrength = 1; break;
        }
        return signalStrength
    }

    init(config = {}) {
        return new Promise(async (resolve, reject) => {
            const configValues = { ...{ device: "wlan0", debugLevel: 2, scan_timeout: 15000, connect_timeout: 45000 }, ...config }

            this.#scan_timeout = configValues.scan_timeout
            this.#connect_timeout = configValues.connect_timeout
            this.#device = configValues.device.trim() === "" ? "none" : configValues.device.trim()
            this.#debugLevel = Math.abs(configValues.debugLevel) > 2 ? 2 : Math.abs(configValues.debugLevel)

            const validate = await this.#validateDevice()

            let response = { success: true, msg: `Interface ${this.#device} has been found on the system` }
            if (!validate) {
                response = this.#responseNoInterface()
            }

            this.#ready = validate
            resolve(response)
        })
    }

    connect(config = {}) {
        const _this = this
        return new Promise(async (resolve, reject) => {
            const startTime = new Date()
            const configValues = { ...{ ssid: "", psk: "", bssid: "", removeAllNetworks: false, hidden: false }, ...config }

            _this.#debug(`Starting connection to SSID "${configValues.ssid}" with PSK "${configValues.psk}"`)
            configValues.hidden === true ? _this.#debug(`Is a hidden network`) : false

            const hasConnection = await this.hasConnection()
            if (hasConnection.success === true && hasConnection.data.has_connection === true) {
                _this.#debug(`Disconnect from current network`)
                await this.disconnect()
            }

            if (configValues.removeAllNetworks === true) {
                // remove all networks
                _this.#debug(`Delete all Wi-Fi network saved in ${_this.#device}`)
                const removeAll = await _this.#removeAllNetworks()
                if (removeAll === false) { ifError(); return false }

            } else {
                // remove network same ssid
                _this.#debug(`Search and delete Wi-Fi network with the same SSID (${configValues.ssid})`)
                const removeDuplicated = await removeDuplicateSSID()
                if (removeDuplicated === false) { ifError(); return false }
            }

            // add new network
            const idNetwork = await addNetwork()
            _this.#debug(`Create network with id ${idNetwork}`)
            if (idNetwork === false) { ifError(); return false }

            // set_network ssid
            const setSSID = await setNetwork(idNetwork, 'ssid', configValues.ssid)
            _this.#debug(`Set SSID "${configValues.ssid}"`)
            if (setSSID === false) { ifError(); return false }

            // set_network bssid
            //if (configValues.bssid.length == 17) {
                const setBSSID = await setNetwork(idNetwork, 'bssid', configValues.bssid)
                _this.#debug(`Set BSSID "${configValues.bssid}"`)
                if (setBSSID === false) { ifError(); return false }
            //}

            // set_network psk
            if (configValues.psk.length > 0) {
                const setPSK = await setNetwork(idNetwork, 'psk', configValues.psk)
                _this.#debug(`Set PSK "${configValues.psk}"`)
                if (setPSK === false) { ifError(); return false }
            } else {
                const asHidden = await setNetwork(idNetwork, 'key_mgmt', 'NONE')
                _this.#debug(`No password set as "${configValues.ssid}" is an open network`)
                if (asHidden === false) { ifError(); return false }
            }

            // set_network priority
            const setPriority = await setNetwork(idNetwork, 'priority', idNetwork)
            _this.#debug(`Set max priority`)
            if (setPriority === false) { ifError(); return false }

            // Set as hidden network
            if (configValues.hidden === true) {
                _this.#debug(`Set as hidden network`)
                const setHidden = await setNetwork(idNetwork, 'scan_ssid', '1')
                if (setHidden === false) { ifError(); return false }
            }

            // select_network
            const selectNet = await selectNetwork(idNetwork)
            _this.#debug(`Select network to try to connect`)
            if (selectNet === false) { ifError(); return false }

            // wait connection (timeout)
            _this.#debug(`Waiting for connection...`)
            const waitConnection = await _this.#waitConnection()
            _this.#debug(`Connection result: ${waitConnection}`)
            if (waitConnection === false) { ifError(); return false }

            // save_config
            const saveCnf = await saveConfig()
            _this.#debug(`Save config network`)
            if (saveCnf === false) { ifError() } else { ifSuccess() }



            function addNetwork(idNet) {
                return new Promise(async (resolve, reject) => {
                    let addNetwork = await _this.#wpa(`add_network`)
                    addNetwork = parseInt(addNetwork)
                    if (isNaN(addNetwork)) {
                        resolve(false)
                    } else {
                        resolve(addNetwork)
                    }
                })
            }

            function removeDuplicateSSID() {
                return new Promise(async (resolve, reject) => {
                    const saved = await _this.savedNetworks()

                    if (saved.success === true) {
                        let netToRemove = saved.data.filter(net => net.ssid === configValues.ssid)
                        for (let i = 0; i < netToRemove.length; i++) {
                            let netRemoved = await _this.#removeNetwork(netToRemove[i].networkid)
                            _this.#debug(`Network "${netToRemove[i].ssid}" has benn removed`)
                        }
                        resolve(true)
                    } else {
                        resolve(false)
                    }
                })
            }

            function setNetwork(idNetwork, key = "", value = "") {
                return new Promise(async (resolve, reject) => {
                    let setValue = await _this.#wpa(`set_network ${idNetwork} ${key} ${value}`)
                    try{setValue = setValue.trim()} catch(e){}
                    if (setValue !== false && setValue !== 'OK') {
                        setValue = await _this.#wpa(`set_network ${idNetwork} ${key} '${value}'`)
                        if (setValue.trim() !== 'OK') {
                            setValue = await _this.#wpa(`set_network ${idNetwork} ${key} '"${value}"'`)
                            if (setValue.trim() !== 'OK') { resolve(false) } else { resolve(true) }
                        }
                    } else {
                        resolve(true)
                    }
                })
            }

            function selectNetwork(idNetwork) {
                return new Promise(async (resolve, reject) => {
                    const selectNetwork = await _this.#wpa(`select_network ${idNetwork}`)
                    if (selectNetwork.trim() !== 'OK') {
                        resolve(false)
                    } else {
                        resolve(true)
                    }
                })
            }

            function saveConfig() {
                return new Promise(async (resolve, reject) => {
                    const saveConfig = await _this.#wpa(`save_config`)
                    if (saveConfig.trim() !== 'OK') {
                        resolve(false)
                    } else {
                        resolve(true)
                    }
                })
            }

            async function ifSuccess() {
                resolve({
                    success: true,
                    msg: `The Wi-Fi network has been successfully configured on interface ${_this.#device}`,
                    data: {
                        milliseconds: new Date - startTime,
                        connected_to: { milliseconds: new Date - startTime, ssid: configValues.ssid }
                    }
                })
                return false
            }

            function setPassphrase(idNetwork, ssid, psk) {
                return new Promise(async (resolve, reject) => {
                    const passphrase = await wpaPassphraseGen(ssid, psk)

                    const setPassphrase = await _this.#wpa(`passphrase ${idNetwork} ${passphrase.psk}`)
                    if (setPassphrase.trim() !== 'OK') {
                        resolve(false)
                    } else {
                        resolve(true)
                    }
                })
            }

            async function ifError() {
                await _this.#reconfigure()
                const reconnect = await _this.reconnect()

                resolve({
                    success: false,
                    msg: `Could not connect to SSID "${configValues.ssid}" on interface ${_this.#device}. ${reconnect.msg}`,
                    data: {
                        milliseconds: new Date - startTime,
                        connected_to: reconnect.data ? reconnect.data : { milliseconds: 0, ssid: '' }
                    }
                })
                return false
            }
        })
    }

    listInterfaces() {
        return new Promise((resolve, reject) => {
            const command = `/usr/sbin/iw dev | grep -E 'Interface '`
            this.#exec(command, (err, stdout, stderr) => {
                stdout = stdout.replace(/\t/g, '').replace(/(Interface )/g, '').trim().split(/\r?\n/)
                if (err !== null || stdout.length < 1) {
                    this.#debug('There are no Wi-Fi interfaces in the system.')
                    resolve({ success: false, msg: `There are no Wi-Fi interfaces in the system.`, data: [] })
                    return false
                }
                resolve({ success: true, msg: `Wi-Fi interfaces found on the system`, data: stdout })
            })
        })
    }

    status() {
        return new Promise(async (resolve, reject) => {
            if (this.#ready === false) { resolve(this.#responseNoInterface()); return false }

            const status = await this.#wpa('status')

            if (status === false) { resolve({ success: false, msg: `Failed to get the status of interface ${this.#device}`, data: {} }); return false }

            const statusArr = status.split(/\r?\n/)

            const statusJSON = {}

            statusArr.map(row => {
                const rowArr = row.split(/=/g)
                statusJSON[rowArr[0]] = rowArr[1]
            })

            try {
                statusJSON.freq ? statusJSON.freq = parseInt(statusJSON.freq) : false
                statusJSON.id ? statusJSON.id = parseInt(statusJSON.id) : false

                if (statusJSON.freq) {
                    statusJSON.typeGHz = this.#typeWifi(statusJSON.freq)

                    const signal_poll = await this.#signal_poll(statusJSON.id, statusJSON.freq)

                    if (signal_poll.RSSI) {
                        statusJSON.signallevel = signal_poll.RSSI
                        statusJSON.signalStrength = this.#signalStrength(statusJSON.signallevel)
                    }

                }
            } catch (e) { }

            resolve({ success: true, msg: `Got interface status ${this.#device}`, data: statusJSON })
        })
    }

    savedNetworks() {
        return new Promise(async (resolve, reject) => {
            if (this.#ready === false) { resolve(this.#responseNoInterface()); return false }

            const saved = await this.#wpa('list_networks')

            if (saved === false) { resolve({ success: false, msg: `It was not possible to obtain the list of saved Wi-Fi networks in inteface ${this.#device}`, data: [] }); return false }


            const savedArr = saved.split(/\r?\n/)

            let headers = []
            try {
                headers = savedArr.shift().replace(/\s/g, '').split(/\//g)
            } catch (e) { }

            const result = savedArr.map(row => {
                const rowArr = row.split(/\t/g)

                const net = {}
                for (let i = 0; i < rowArr.length; i++) {
                    net[headers[i]] = rowArr[i]
                }
                return net
            })

            resolve({ success: true, msg: `List of saved Wi-Fi networks`, data: result })

        })
    }

    disconnect() {
        return new Promise(async (resolve, reject) => {
            if (this.#ready === false) { resolve(this.#responseNoInterface()); return false }

            const disconnect = await this.#wpa('disconnect')

            if (disconnect !== "OK") {
                resolve({ success: false, msg: `Failed to detach interface ${this.#device}` }); return false
            }
            resolve({ success: true, msg: `Interface ${this.#device} has been disconnected` })
        })
    }

    reconnect() {
        return new Promise(async (resolve, reject) => {
            if (this.#ready === false) { resolve(this.#responseNoInterface()); return false }

            this.#debug(`Trying to reconnect to some non-hidden wifi network saved for interface ${this.#device}`)

            const saved = await this.savedNetworks()
            let nets = saved.data.reverse()

            const scan = await this.scan()
            if (scan.success === false) { nets = [] }

            const startTime = new Date()
            let reconnect
            let connected
            let ssid

            for (let i = 0; i < nets.length; i++) {
                ssid = saved.data[i].ssid
                let exist = scan.data.find(scan_net => scan_net.ssid === ssid)
                if (exist) {
                    this.#debug(`Try connect to ${ssid}`)
                    reconnect = await this.#wpa('select_network ' + saved.data[i].networkid)

                    connected = await this.#waitConnection()
                    if (connected) break
                }

            }

            if (reconnect !== "OK" || connected === false) {
                resolve({ success: false, msg: `Failed to reconnect interface ${this.#device}` }); return false
            } else {
                resolve({ success: true, msg: `The interface ${this.#device} has been reconnected to ssid "${ssid}" in ${new Date() - startTime} milliseconds`, data: { milliseconds: new Date() - startTime, ssid: ssid } })
            }
        })
    }

    hasConnection() {
        return new Promise(async (resolve, reject) => {
            if (this.#ready === false) { resolve(this.#responseNoInterface()); return false }

            const status = await this.status()
            if (status.success === false) { resolve({ success: false, msg: `Cannot determine if interface ${this.#device} is connected`, data: false }); return false }

            const result = status.data.wpa_state === 'COMPLETED' && this.#validIPaddr(status.data.ip_address)

            resolve({ success: true, msg: `Does interface ${this.#device} have a connection?`, data: { has_connection: result, ssid: result ? status.data.ssid : '', ip_address: result ? status.data.ip_address : '' } })
        })
    }

    scan() {
        return new Promise(async (resolve, reject) => {
            if (this.#ready === false) { resolve(this.#responseNoInterface()); return false }

            const scanStatus = await this.#scanStatus()
            if (scanStatus === false) { resolve({ success: false, msg: `Failed to get Wi-Fi scan in device ${this.#device}`, data: [] }); return false }

            const scanned = await this.#wpa('scan_results')
            if (scanned === false) { resolve({ success: false, msg: `It was not possible to obtain the list of the scanned Wi-Fi networks in inteface ${this.#device}`, data: [] }); return false }

            const scannedArr = scanned.split(/\r?\n/)
            const headers = scannedArr.shift().replace(/\s/g, '').split(/\//g)

            const result = scannedArr.map(row => {
                const rowArr = row.split(/\t/g)

                const net = {}
                for (let i = 0; i < rowArr.length; i++) {
                    net[headers[i]] = rowArr[i]
                    if (headers[i] == "flags") {
                        net.open = rowArr[i].search(/^(?!.*\bWPA\b)(?!.*\bWPA2\b).*ESS.*$/) >= 0 ? true : false
                    }
                }

                try {
                    net.frequency = parseInt(net.frequency)
                    net.signallevel = parseInt(net.signallevel)
                } catch (e) { }

                net.typeGHz = this.#typeWifi(net.frequency)
                net.signalStrength = this.#signalStrength(net.signallevel)

                net.ssid = net.ssid.replace(/\\x00/g, '')

                return net
            })

            resolve({ success: true, msg: `List of scanned Wi-Fi networks was obtained`, data: result })

        })
    }

    scanInTypes() {
        return new Promise(async (resolve, reject) => {
            if (this.#ready === false) { resolve(this.#responseNoInterface()); return false }

            const ranges = {
                wifi_24: { min: 2400, max: 2500 },
                wifi_5: { min: 5150, max: 5850 },
                wifi_6: { min: 5925, max: 7125 },
            }

            const scan = await this.scan()
            if (scan.success === false) { resolve({ success: false, msg: `It was not possible to obtain the list grouped by type of the scanned Wi-Fi networks in device ${this.#device}`, data: [] }); return false }

            const { data } = await this.status()
            const ssid = data.ssid
            const freq = data.freq

            const ordered = scan.data.sort((a, b) => b.signallevel - a.signallevel)


            const types = {
                wifi_24: [],
                wifi_5: [],
                wifi_6: [],
                wifi_other: []
            }

            ordered.map(result => {
                let typeBlock = `wifi_${result.typeGHz.replace(".", "")}`
                result.current = result.ssid == ssid && result.frequency == freq
                result.current ? types[typeBlock].unshift(result) : types[typeBlock].push(result)
            })


            Object.keys(types).forEach(key => {
                const ssidSet = new Set()
                types[key] = types[key].filter((wifi) => {
                    try {
                        if (wifi.ssid.trim().length < 1) return false
                    } catch (e) { return false }
                    if (!ssidSet.has(wifi.ssid)) {
                        ssidSet.add(wifi.ssid);
                        return true;
                    }
                    return false;
                })

                if (types[key].length < 1) try { delete types[key] } catch (e) { }
            })

            resolve({ success: true, msg: `A list grouped by type of the scanned Wi-Fi networks was obtained`, data: types })
        })
    }

    removeAllNetworks() {
        return new Promise(async (resolve, reject) => {
            if (this.#ready === false) { resolve(this.#responseNoInterface()); return false }
            this.#debug(`Delete all Wi-Fi network saved in ${this.#device}`)

            const remove = await this.#removeAllNetworks()
            if (remove === false) { resolve({ success: false, msg: `Could not delete saved Wi-Fi networks in ${this.#device}` }); return false }

            const saveConfig = await this.#wpa(`save_config`)
            if (saveConfig.trim() !== 'OK') {
                resolve({ success: false, msg: `Failed to save delete changes to interface configuration ${this.#device}` })
            } else {
                resolve({ success: true, msg: `Removed all Wifi network configurations for interface ${this.#device}` })
            }
        })
    }
}

module.exports = M77RaspberryWIFI 