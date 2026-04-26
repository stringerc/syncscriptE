# Oracle Console — VCN + A1 instance (**US East (Ashburn)**)

## Region naming (facts)

| What you see in Console | API / CLI / Terraform `region` | Notes |
|-------------------------|----------------------------------|--------|
| **US East (Ashburn)** | **`iad`** | Oracle’s public identifier for this region is **`iad`** ([regions list](https://docs.oracle.com/iaas/Content/General/Concepts/regions.htm)). |

Always Free limits and services are described in Oracle’s **[Always Free](https://docs.oracle.com/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm)** documentation — not duplicated here as numbers can change.

---

## What is “A1”?

**`VM.Standard.A1.Flex`** is Oracle’s **Ampere (ARM)** flexible VM. You choose it on **Compute → Create instance** (image + shape), **not** on the raw VCN creation screen.

---

## Regional subnet vs availability domain (why you see “AD-1” errors)

- **Subnets** can be **AD-specific** or **regional** (span the region). See Oracle: **[Regional subnets](https://docs.oracle.com/iaas/Content/Network/Tasks/managingVCNs_topic-Regional_Subnets.htm)**.
- Putting an instance in a **regional** subnet (e.g. **`subnet-20260413-2348 (regional)`**) does **not** remove the need to pick **placement**: the service still places the VM in **an** availability domain. In the **Console**, the placement control often surfaces as **AD-1**, **AD-2**, **AD-3**, etc.
- If the Console says **Out of capacity for … in availability domain AD-1**, that means **that AD’s host pool** for **`VM.Standard.A1.Flex`** (for your request type) is full **right then** — not that your VCN or subnet is misconfigured.

Oracle’s own error text tells you the usual mitigations: **try another availability domain**, **try again later**, and if you pinned a **fault domain**, try **without** it ([Compute known issues](https://docs.oracle.com/iaas/Content/Compute/known-issues.htm) and community threads mirror this pattern).

---

## “Out of capacity” in Console — what it means

- There is **no** published Oracle dashboard that shows “A1 will be free at 3:15 AM” — capacity is **dynamic**.
- **Always Free** Ampere capacity is **often tight** in busy home regions; **Ashburn (`iad`)** is frequently cited in community reports (anecdotal, not an SLA).
- **Saving as a stack** (Resource Manager) **does not reserve** capacity — it only saves **configuration** so you can **re-apply** later without re-clicking every field.

---

## Console create vs `retry-launch-a1.sh` (this repo)

| | **Manual “Create” in Console** | **`deploy/oracle/scripts/retry-launch-a1.sh`** |
|--|-------------------------------|-----------------------------------------------|
| **What it tries** | Usually **one** placement path per attempt (often **AD-1** unless you change it). | **Each cycle**: tries **every** AD listed in **`AVAILABILITY_DOMAINS`**, then **sleeps** `RETRY_INTERVAL_SEC`, repeats. |
| **When Telegram fires** | N/A | Only after **`oci compute instance launch` returns success** (then sends DM if `TELEGRAM_*` are set). |
| **Why yours never messaged** | — | The script **was not running as a long-lived process**, and **`instance-launch.env` still had `REPLACE_*` placeholders** for **`SUBNET_OCID`** / **`AVAILABILITY_DOMAINS`** — so it **exited before calling Oracle**. |

**Conclusion:** The script **will** automate “try ADs + wait + retry” **once** `instance-launch.env` is complete (real **`ocid1.subnet…`**, real **AD names**, **`~/.oci/config`**), and you **start it** (terminal, **tmux**, or **`nohup`**). It matches Oracle’s guidance (multiple ADs + retry over time) in a loop; it does **not** reserve capacity ahead of time.

---

## Step 1 — VCN (wizard recommended)

Your VCN may be named e.g. **`vcn-20260413-2348`** — names are arbitrary.

1. **IPv4 CIDR** for the VCN (e.g. **`10.0.0.0/16`**) — [VCN overview](https://docs.oracle.com/iaas/Content/Network/Tasks/managingVCNs.htm).
2. Prefer **Networking → Start VCN Wizard** (“**VCN with Internet connectivity**”) so Oracle creates **Internet Gateway**, **subnets**, and **routes** ([Getting started](https://docs.oracle.com/iaas/Content/GSG/Concepts/bsettingupnetwork.htm)).
3. **Regional** vs AD-specific subnet: either can work for compute; **regional** subnets are common in newer flows (see link above).

---

## Step 2 — Security rules (SSH)

On the subnet’s **Network security groups** and/or **security lists**, allow **TCP 22** from **your public IP**/32 if you SSH from one place ([Security lists](https://docs.oracle.com/iaas/Content/Network/Concepts/securityrules.htm)).

---

## Step 3 — Create the A1 instance (Console)

1. **Compute → Instances → Create instance**.
2. **Image:** **Canonical Ubuntu** **22.04** or **24.04**, **aarch64** (ARM).
3. **Shape:** **`VM.Standard.A1.Flex`** — [Always Free compute](https://docs.oracle.com/iaas/Content/FreeTier/freetier_topic-Always_Free_Resources.htm).
4. **Networking:** your **public** subnet (e.g. **`subnet-20260413-2348`**), **assign public IPv4**.
5. **Placement:** if you get **out of capacity in AD-1**, switch to **AD-2** or **AD-3** and try again — same as Oracle’s error message.
6. **Fault domain:** if you explicitly set one and still fail, try **without** a fault domain (Oracle error text).
7. **SSH public key** — paste **one** `.pub` line.

---

## Step 4 — SyncScript on the VM (after A1 exists)

```bash
rsync -avz --exclude node_modules --exclude .git ./ ubuntu@PUBLIC_IP:/opt/syncscript/
ssh ubuntu@PUBLIC_IP
sudo bash /opt/syncscript/deploy/oracle/vm/bootstrap-ampere.sh
```

Then **`deploy/oracle/README.md`** (Kokoro, tunnel, `KOKORO_TTS_URL`).

---

## Subnet OCID for `instance-launch.env` (not the name)

The Console shows a **subnet name**; the CLI needs **`SUBNET_OCID`** = **`ocid1.subnet.oc1…`**

1. **Networking → Virtual cloud networks** → **`vcn-20260413-2348`**
2. **Subnets** → **`subnet-20260413-2348`**
3. Copy **OCID** under *Subnet information*.

Do **not** use **`ocid1.recoveryservicesubnet…`** for normal compute launch.

---

## E2.1.Micro vs `VM.Standard.A1.Flex`

**`VM.Standard.E2.1.Micro`** is **AMD**, **1 GB RAM** — fine for quick tests; **not** the Ampere path for **`bootstrap-ampere.sh`**. **SSH:** Oracle Linux → **`opc`**; Ubuntu → **`ubuntu`**.

---

## Quick actions (“Connect public subnet to internet”)

Use the Console **Quick actions** wizard if the subnet still needs **Internet Gateway / routes** for outbound and inbound SSH.
