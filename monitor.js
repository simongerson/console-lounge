// agent/monitor.js
//
// Console Lounge Manager — Monitoring Agent (v2)
//
// Unlike v1, this agent ships with almost nothing hardcoded. It fetches
// its list of consoles (and how to detect each one — MAC and/or IP)
// remotely from your deployed app, so you can configure everything in
// the browser AFTER shipping this to the business, once you actually
// know the network.
//
// DETECTION METHOD:
//   - If a console has a MAC address configured: agent ping-sweeps the
//     local subnet to populate the ARP cache, then checks if that MAC
//     appears — works on ANY network, no router setup needed.
//   - If only an IP is configured (no MAC): falls back to a direct ping
//     of that IP. Requires the IP to stay fixed (static IP / DHCP
//     reservation in your router).
//   - If a console has both, MAC is used (more reliable — survives the
//     console getting a different IP over time).
//
// WHAT THIS CAN'T DO: detect which game is being played — no public API
// exists for that on PS5/Xbox. Game names only ever come from sessions
// started in your own POS.
//
// SETUP:
//   1. Install Node.js on the Windows PC (nodejs.org) — no other
//      installs needed, this only uses built-in modules.
//   2. Edit config.json — just your API URL and the shared agent key
//      (get the key value from whoever set AGENT_API_KEY in Vercel).
//   3. In the app's Monitoring page (Monitoring Setup section), enter
//      each console's MAC address (and/or static IP) once you're
//      actually on-site and know the network.
//   4. Run: node monitor.js
//   5. To run permanently, set up as a Windows Scheduled Task
//      (trigger: "At log on", action: node.exe monitor.js).

const { exec } = require('child_process')
const os = require('os')
const fs = require('fs')
const path = require('path')

const CONFIG_PATH = path.join(__dirname, 'config.json')
const localConfig = JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'))
const { apiBaseUrl, agentKey, pollIntervalSeconds } = localConfig

let consoles = [] // fetched remotely, refreshed periodically

function run(cmd) {
  return new Promise((resolve) => {
    exec(cmd, { timeout: 5000 }, (error, stdout) => resolve(error ? '' : stdout))
  })
}

// Finds this machine's own local IPv4 address + subnet prefix
// (e.g. "192.168.1"), so we know what range to ping-sweep.
function getLocalSubnetPrefix() {
  const interfaces = os.networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address.split('.').slice(0, 3).join('.')
      }
    }
  }
  return null
}

async function pingSweepSubnet(prefix) {
  // Fire off pings to the whole subnet in parallel so the ARP cache
  // gets populated quickly. We don't care about individual results —
  // just that devices get a chance to respond and register in ARP.
  const pings = []
  for (let i = 1; i <= 254; i++) {
    pings.push(run(`ping -n 1 -w 300 ${prefix}.${i}`))
  }
  await Promise.all(pings)
}

async function getArpTable() {
  const output = await run('arp -a')
  // Windows arp -a output lines look like:
  //   192.168.1.20          a4-83-e7-xx-xx-xx     dynamic
  const entries = []
  const lines = output.split('\n')
  for (const line of lines) {
    const match = line.match(/(\d+\.\d+\.\d+\.\d+)\s+([0-9a-fA-F-]{17})/)
    if (match) {
      entries.push({ ip: match[1], mac: match[2].toLowerCase().replace(/-/g, ':') })
    }
  }
  return entries
}

function normalizeMac(mac) {
  return (mac || '').toLowerCase().replace(/-/g, ':').trim()
}

async function pingHost(ip) {
  const output = await run(`ping -n 1 -w 1000 ${ip}`)
  return output.includes('Reply from') && !output.includes('unreachable')
}

async function fetchRemoteConfig() {
  try {
    const res = await fetch(`${apiBaseUrl}/api/monitoring/config`, {
      headers: { 'x-agent-key': agentKey },
    })
    if (!res.ok) {
      console.error(`  ✗ Failed to fetch config: ${res.status}`)
      return
    }
    const data = await res.json()
    consoles = data.consoles || []
    console.log(`Config refreshed: ${consoles.length} console(s) to monitor`)
  } catch (err) {
    console.error('  ✗ Error fetching config:', err.message)
  }
}

async function sendHeartbeat(consoleId, ipAddress, isOn) {
  try {
    const res = await fetch(`${apiBaseUrl}/api/monitoring/heartbeat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-agent-key': agentKey },
      body: JSON.stringify({ consoleId, ipAddress, isOn, currentGame: null }),
    })
    if (!res.ok) console.error(`  ✗ Heartbeat failed for ${ipAddress}: ${res.status}`)
  } catch (err) {
    console.error(`  ✗ Error sending heartbeat:`, err.message)
  }
}

async function checkAllConsoles() {
  if (!consoles.length) {
    console.log('No consoles configured yet — set MAC/IP in the Monitoring Setup page.')
    return
  }

  const timestamp = new Date().toLocaleTimeString()
  console.log(`\n[${timestamp}] Checking ${consoles.length} console(s)...`)

  const macConsoles = consoles.filter(c => c.mac)
  const ipOnlyConsoles = consoles.filter(c => !c.mac && c.ip)

  let arpTable = []
  if (macConsoles.length) {
    const prefix = getLocalSubnetPrefix()
    if (prefix) {
      await pingSweepSubnet(prefix)
      arpTable = await getArpTable()
    } else {
      console.error('  ✗ Could not determine local subnet for MAC scanning')
    }
  }

  for (const c of macConsoles) {
    const targetMac = normalizeMac(c.mac)
    const found = arpTable.find(e => e.mac === targetMac)
    const isOn = !!found
    console.log(`  ${c.name} (MAC ${c.mac}): ${isOn ? `ON at ${found.ip}` : 'off'}`)
    await sendHeartbeat(c.consoleId, found?.ip || null, isOn)
  }

  for (const c of ipOnlyConsoles) {
    const isOn = await pingHost(c.ip)
    console.log(`  ${c.name} (IP ${c.ip}): ${isOn ? 'ON' : 'off'}`)
    await sendHeartbeat(c.consoleId, c.ip, isOn)
  }
}

async function main() {
  console.log('Console Lounge Manager — Monitoring Agent v2')
  console.log(`Reporting to: ${apiBaseUrl}\n`)

  await fetchRemoteConfig()
  checkAllConsoles()

  setInterval(checkAllConsoles, pollIntervalSeconds * 1000)
  // Refresh the console list every 2 minutes, in case new consoles
  // get configured while the agent is already running.
  setInterval(fetchRemoteConfig, 120000)
}

main()
