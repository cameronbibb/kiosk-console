import {
  LiveDevice,
  ConnectionState,
  BatteryInfo,
  DevicePolicyInfo,
} from "src/shared/devices.types";

export function parseDeviceLine(line: string): LiveDevice | null {
  const [serial, state, ...rest] = line.split(/\s+/);
  if (!serial || !state) return null;

  const props: Record<string, string> = {};
  for (const token of rest) {
    const [key, value] = token.split(":");
    if (key && value) props[key] = value;
  }

  return {
    serial,
    connection: state as ConnectionState,
    model: props.model,
    usbPath: props.usb,
  };
}

export function parseBattery(stdout: string): BatteryInfo {
  const fields: Record<string, string> = {};

  for (const line of stdout.split(/\r?\n/)) {
    const match = line.trim().match(/^([\w ]+):\s*(.+)$/);
    if (match) fields[match[1].trim()] = match[2].trim();
  }

  const level = fields["level"] ? Number(fields["level"]) : null;
  const temp = fields["temperature"]
    ? Number(fields["temperature"]) / 10
    : null;

  return {
    level: Number.isFinite(level) ? level : null,
    charging:
      fields["USB powered"] === "true" || fields["AC powered"] === "true",
    temperatureC: Number.isFinite(temp) ? temp : null,
  };
}

export function parseDevicePolicy(stdout: string): DevicePolicyInfo {
  const lines = stdout.split(/\r?\n/);

  const ownerPackage = matchFirst(lines, /^\s*package=(\S+)\s*$/);
  const provisioning = matchFirst(lines, /provisioningState:\s*(\d+)/);
  const hasOwnerBlock = lines.some((l) => /^\s*Device Owner:\s*$/.test(l));

  return {
    deviceOwnerActive: hasOwnerBlock && ownerPackage !== null,
    ownerPackage,
    provisioningState: provisioning ? Number(provisioning) : null,
    userRestrictions: collectIndentedBlock(lines, "userRestrictions:"),
    policies: collectIndentedBlock(lines, "policies:"),
  };
}

function matchFirst(lines: string[], re: RegExp): string | null {
  for (const line of lines) {
    const m = line.match(re);
    if (m) return m[1];
  }
  return null;
}

// Collects lines indented deeper than the header line, stopping at the first dedent.
function collectIndentedBlock(lines: string[], header: string): string[] {
  const start = lines.findIndex((l) => l.trim() === header);
  if (start === -1) return [];

  const headerIndent = indentOf(lines[start]);
  const out: string[] = [];

  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === "") continue;
    if (indentOf(line) <= headerIndent) break;
    out.push(line.trim());
  }
  return out;
}

function indentOf(line: string): number {
  return line.length - line.trimStart().length;
}
