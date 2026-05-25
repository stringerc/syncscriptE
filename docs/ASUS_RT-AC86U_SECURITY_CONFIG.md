# ASUS RT-AC86U Security Configuration

## Overview
This document configures your ASUS RT-AC86U for maximum security while keeping
it simple enough for daily use. Two primary devices: PS5 and work computer.

## Physical Access
- Router admin interface: http://192.168.1.1 or http://router.asus.com
- Default credentials: admin / admin (CHANGE THESE IMMEDIATELY)

---

## Step 1: Change Admin Password (2 minutes)
1. Log in to router admin
2. Go to **Administration** > **System** > **Account Setting**
3. Set a strong admin password (20+ characters)
4. Save and reboot

## Step 2: Enable AiProtection (1 minute)
This is the most important single step. AiProtection is built into the RT-AC86U
and uses Trend Micro's threat database.

1. Go to **AiProtection** > **Network Protection**
2. Enable **Malicious Sites Blocking** — ON
3. Enable **Two-Way IPS (Intrusion Prevention)** — ON
4. Enable **Infected Device Prevention and Blocking** — ON

These three settings block:
- Known malware/phishing domains (network-wide, protects PS5 and computer)
- Intrusion attempts from outside
- Device-to-C2 (command & control) communication if a device gets infected

## Step 3: DNS Filtering (2 minutes)
Change your DNS from ISP default to a security-focused DNS provider.

1. Go to **WAN** > **DNS Setting**
2. Set **DNS Server 1**: `1.1.1.2` (Cloudflare Malware Blocking)
3. Set **DNS Server 2**: `9.9.9.9` (Quad9 — malware filtered)
4. Disable **Enable DNS Relay** if you don't need local DNS caching
5. Save

Why these DNS servers:
- Cloudflare 1.1.1.2: blocks malware domains, fast, privacy-focused
- Quad9 9.9.9.9: blocks known threat domains using 20+ threat intelligence feeds
- Both are free and require no account

## Step 4: Firewall Configuration (3 minutes)
1. Go to **Firewall** > **General**
2. Set **Firewall** to **Enabled**
3. Set **SPI (Stateful Packet Inspection)** to **Enabled**
4. Set **DoS (Denial of Service) Protection** to **Enabled**
5. Set **Respond ICMP Echo (ping) from WAN** to **Disabled** (don't respond to pings from internet)
6. Save

## Step 5: WiFi Security (2 minutes)
1. Go to **Wireless** > **General**
2. 2.4GHz band:
   - **Authentication Method**: WPA2-Personal
   - **WPA Encryption**: AES
   - Set a strong WiFi password (16+ characters)
3. 5GHz band:
   - Same settings as above
4. Disable **WPS** (WiFi Protected Setup — has known vulnerabilities)
   - Go to **Wireless** > **WPS** > set to **Disable**

## Step 6: Remote Access — DISABLE (1 minute)
1. Go to **Administration** > **System**
2. **Enable Web Access from WAN**: DISABLE
3. **Enable SSH Access from WAN**: DISABLE
4. **Enable Telnet Access from WAN**: DISABLE

This ensures nobody can access your router from the internet.

## Step 7: Guest Network for PS5 (2 minutes)
Putting your PS5 on a guest network isolates it from your work computer.
If the PS5 is ever compromised (game exploits), it can't reach your computer.

1. Go to **Wireless** > **Guest Network**
2. Enable **2.4GHz Guest Network** (or 5GHz if PS5 supports it)
3. Set a separate password
4. **Access Intranet**: DISABLE (this isolates guest from your work machine)
5. **Access Time**: Set to unlimited or as needed

Your PS5 connects to the guest network. Your computer connects to the main network.
They can't see each other. Both get AiProtection and DNS filtering.

## Step 8: DHCP Static Lease for Work Machine (1 minute)
This ensures your work computer always gets the same IP, useful for any
future firewall rules.

1. Go to **LAN** > **DHCP Server**
2. Under **DHCP Static IP List**, add your work machine:
   - Find your Mac's MAC address: `ifconfig en0 | grep ether`
   - Assign it a fixed IP like 192.168.1.100
3. Save

---

## Summary of What This Achieves

| Protection | What It Blocks |
|-----------|---------------|
| AiProtection | Malware domains, intrusion attempts, C2 communication |
| DNS filtering | Known threat domains at the DNS level (all devices) |
| SPI Firewall | Invalid/malicious packets from reaching any device |
| No ping response | Attackers can't discover your IP via ping scans |
| WPA2-AES + no WPS | Strong WiFi encryption, no WPS bypass |
| No WAN access | Router admin only accessible from inside your network |
| Guest network (PS5) | PS5 isolated from work machine even if compromised |
| Static DHCP | Consistent IP for future rules |

## What This Does NOT Do (and why that's OK)
- No VLAN setup — guest network achieves the same isolation more simply
- No VPN on router — you can add this later if needed, but it adds complexity
- No port forwarding — no inbound connections needed for your use case

## Verification After Configuration
1. On your computer: visit https://dnsleaktest.com — should show Cloudflare/Quad9
2. On your computer: visit https://1.1.1.1/help — should show "Connected to 1.1.1.2"
3. On PS5: connect to guest network and test online gaming
4. Try to ping your computer from PS5 network — should fail (isolated)
