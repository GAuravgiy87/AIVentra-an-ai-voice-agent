# SIP Phone Credentials — Ventra AI Voice Agent

> **Server:** Asterisk PBX (running inside Docker via `docker-compose`)
> **SIP Protocol:** PJSIP over UDP/TCP
> **SIP Port:** `5061` (Mapped from 5060 in Docker)
> **Codec:** G.711 µ-law (`ulaw`)
> **AI Extension:** Dial `200` to reach the Ventra AI voice agent

---

## Asterisk Server Connection

| Parameter      | Value                     |
|----------------|---------------------------|
| SIP Server     | `localhost` (or server IP)|
| SIP Port       | `5061`                    |
| Transport      | UDP / TCP                 |
| AI Dial Number | `200`                     |

---

## SIP Phone Credentials (Extensions 100–110)

| Extension | Username | Password | SIP URI                      |
|-----------|----------|----------|------------------------------|
| 100       | `100`    | `secret` | `sip:100@localhost:5061`     |
| 101       | `101`    | `secret` | `sip:101@localhost:5061`     |
| 102       | `102`    | `secret` | `sip:102@localhost:5061`     |
| 103       | `103`    | `secret` | `sip:103@localhost:5061`     |
| 104       | `104`    | `secret` | `sip:104@localhost:5061`     |
| 105       | `105`    | `secret` | `sip:105@localhost:5061`     |
| 106       | `106`    | `secret` | `sip:106@localhost:5061`     |
| 107       | `107`    | `secret` | `sip:107@localhost:5061`     |
| 108       | `108`    | `secret` | `sip:108@localhost:5061`     |
| 109       | `109`    | `secret` | `sip:109@localhost:5061`     |
| 110       | `110`    | `secret` | `sip:110@localhost:5061`     |

---

## LiveKit SIP Gateway

| Parameter       | Value                          |
|-----------------|--------------------------------|
| LiveKit API Key | `devkey`                       |
| API Secret      | `secret`                       |
| WebSocket URL   | `ws://livekit:7880`            |
| SIP Port        | `5060`                         |
| Redis Address   | `redis:6379`                   |
| AI SIP URI      | `sip:ai@livekit-sip:5060`      |

---

## LiveKit Server

| Parameter          | Value                    |
|--------------------|--------------------------|
| HTTP Port          | `7880`                   |
| TCP RTC Port       | `7891`                   |
| RTP Port Range     | `50000 – 50050`          |
| Node IP            | `127.0.0.1`              |
| API Key            | `devkey`                 |
| API Secret         | `secret`                 |

---

## RTP Port Range (Asterisk)

| Parameter    | Value           |
|--------------|-----------------|
| RTP Start    | `10000`         |
| RTP End      | `10050`         |

---

## Admin Panel

| Parameter       | Value              |
|-----------------|--------------------|
| Admin Passcode  | `admin123`         |
| Backend API URL | `http://localhost:8001` |

---

## How to Register a Softphone

Because Docker runs inside WSL2 on Windows, UDP networking is heavily restricted. **You must use TCP for all connections.**

### Option A: MicroSIP (Running on this Windows computer)
Because MicroSIP is on the same machine, it can connect via `127.0.0.1` (localhost).
1. **SIP Server:** `127.0.0.1:5061`
2. **Username:** `100`
3. **Domain:** `127.0.0.1:5061`
4. **Password:** `secret`
5. **Transport:** `TCP`
*(Make sure Transport is explicitly set to TCP in your account settings!)*

### Option B: Zoiper / Mobile Phone (Running on Wi-Fi LAN)
Because your phone is on the physical Wi-Fi network, it must connect using your computer's LAN IP.
1. **Account Name:** `Ventra AI` (or whatever you like)
2. **Domain:** `10.7.11.141:5061`
3. **Username:** `100` (or `101`, `102`, etc.)
4. **Password:** `secret`
5. **Transport:** `TCP`
6. **Use Outbound Proxy:** `ON`
7. **Outbound Proxy:** `10.7.11.141:5061;transport=tcp`

Once registered, dial **`200`** to connect to the Ventra AI voice agent.

---

## Dialplan Summary (`extensions.conf`)

```
[default]
; Dial 200 to reach the AI
exten => 200,1,Dial(PJSIP/livekit/sip:ai@livekit-sip:5060)
exten => 200,n,Hangup()
```

---

*Last updated: July 2026*
