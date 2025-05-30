import { Injectable, Logger } from '@nestjs/common';
import { networkInterfaces } from 'os';
import net from 'net';
import pLimit from 'p-limit';
import { exec } from 'child_process'; // Necesario para ejecutar comandos ARP
import { promisify } from 'util'; // Para convertir exec en promesa
import { DiscoveredPrinterDto } from './dto/discovered-printer.dto';

const execPromise = promisify(exec);

interface TcpScanOptions {
  scanTimeout?: number; // ms por intento TCP
  maxConcurrency?: number; // sockets simultáneos
  ports?: number[]; // puertos a probar
  subnet?: string | null; // 192.168.1.0/24  (auto si null)
}

@Injectable()
export class DiscoveryService {
  private readonly logger = new Logger(DiscoveryService.name);

  async discoverPrinters(
    opts: TcpScanOptions = {},
  ): Promise<DiscoveredPrinterDto[]> {
    const {
      scanTimeout = 1000, // Aumentado a 1 segundo
      maxConcurrency = 100,
      ports = [9100, 631, 515], // Puertos TCP comunes para impresoras
      subnet = null,
    } = opts;

    const found = new Map<string, DiscoveredPrinterDto>();

    try {
      await this.scanTcpAndArp(found, {
        ports,
        scanTimeout,
        maxConcurrency,
        subnet,
      });
    } catch (error) {
      this.logger.error(
        `Error durante el escaneo TCP/ARP: ${error.message}`,
        error.stack,
      );
    }

    this.logger.log(
      `Descubrimiento TCP finalizado. Total impresoras encontradas: ${found.size}`,
    );
    return [...found.values()];
  }

  /* ─────────────────────────────────────────────────── */

  private async scanTcpAndArp(
    store: Map<string, DiscoveredPrinterDto>,
    cfg: {
      ports: number[];
      scanTimeout: number;
      maxConcurrency: number;
      subnet?: string | null;
    },
  ): Promise<void> {
    const { ports, scanTimeout, maxConcurrency, subnet } = cfg;
    let networkIp: string; // Renombrar 'base' a 'networkIp'
    let mask: number;

    try {
      [networkIp, mask] = subnet ? this.parseSubnet(subnet) : this.autoSubnet();
    } catch (error) {
      this.logger.error(
        `Error determinando la subred: ${error.message}. Abortando escaneo TCP.`,
      );
      return;
    }

    const limit = pLimit(maxConcurrency);
    const promises: Promise<void>[] = [];
    const ips = this.expandCidr(networkIp, mask); // Usar networkIp

    if (ips.length === 0) {
      this.logger.warn(
        `No se generaron IPs para escanear en la subred ${networkIp}/${mask}.`, // Usar networkIp
      );
      return;
    }
    this.logger.log(
      `⏳ Explorando ${ips.length} direcciones en ${ports.length} puertos (${ports.join(', ')}) con timeout ${scanTimeout}ms y concurrencia ${maxConcurrency}...`,
    );

    for (const ip of ips) {
      for (const port of ports) {
        promises.push(
          limit(async () => {
            try {
              const isOpen = await this.probe(ip, port, scanTimeout);
              if (!isOpen) return;

              // Ya no necesitamos 'key'
              // Solo añadir si no existe la IP (ignorando el puerto, ya que la MAC es por IP)
              const existingEntry = Array.from(store.values()).find(
                (p) => p.ip === ip,
              );

              if (!existingEntry) {
                // Intentar obtener MAC via ARP
                const mac = await this.getMacFromArp(ip);
                store.set(ip, {
                  // Usar solo IP como clave final si encontramos MAC
                  ip,
                  port, // Guardamos el primer puerto abierto encontrado
                  type: 'tcp:raw',
                  name: `Printer @ ${ip}`,
                  mac: mac || undefined, // Añadir MAC si se encontró
                });
                this.logger.verbose(
                  `🔎 TCP ⇒ ${ip}:${port} abierto. ${mac ? `MAC: ${mac}` : 'MAC no encontrada en ARP.'}`,
                );
              } else {
                this.logger.debug(
                  `TCP: IP ${ip} ya encontrada (en puerto ${existingEntry.port}), ignorando puerto ${port}.`,
                );
              }
            } catch (error) {
              this.logger.warn(
                `Error sondeando ${ip}:${port} - ${error.message}`,
              );
            }
          }),
        );
      }
    }
    await Promise.all(promises);
    this.logger.log(
      `✔️  Escaneo TCP finalizado. Total candidatos únicos por IP: ${store.size}`,
    );
  }

  /* ARP Lookup ────────────────────────────────────── */

  private async getMacFromArp(ip: string): Promise<string | null> {
    try {
      // Ejecutar 'arp -a' y obtener salida
      // Nota: El formato de salida varía entre Windows, Linux, macOS.
      // Esta implementación intenta ser genérica pero podría necesitar ajustes.
      const { stdout } = await execPromise('arp -a');

      // Buscar la línea que contenga la IP
      const lines = stdout.split('\n');
      const line = lines.find((l) => l.includes(ip));

      if (!line) {
        this.logger.debug(`ARP: IP ${ip} no encontrada en la tabla ARP.`);
        return null;
      }

      // Extraer la MAC address (buscar patrón xx-xx-xx-xx-xx-xx o xx:xx:xx:xx:xx:xx)
      const macMatch = line.match(/([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})/);
      if (macMatch && macMatch[0]) {
        const mac = macMatch[0].replace(/-/g, ':').toUpperCase(); // Normalizar a formato con ':'
        return mac;
      } else {
        this.logger.debug(
          `ARP: No se pudo extraer MAC de la línea para ${ip}: "${line.trim()}"`,
        );
        return null;
      }
    } catch (error) {
      this.logger.warn(
        `ARP: Error al ejecutar/parsear 'arp -a' para ${ip}: ${error.message}`,
      );
      return null;
    }
  }

  /* Utilidades TCP/IP ────────────────── */

  private probe(host: string, port: number, timeout: number): Promise<boolean> {
    return new Promise((resolve) => {
      const socket = new net.Socket();
      let connected = false;
      socket.setTimeout(timeout);
      socket.on('connect', () => {
        connected = true;
        socket.end();
        resolve(true);
      });
      socket.on('timeout', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('error', () => {
        socket.destroy();
        resolve(false);
      });
      socket.on('close', () => {
        if (!connected) resolve(false);
      });
      socket.connect(port, host);
    });
  }

  private parseSubnet(subnet: string): [string, number] {
    const parts = subnet.split('/');
    if (
      parts.length !== 2 ||
      !net.isIPv4(parts[0]) ||
      isNaN(parseInt(parts[1], 10))
    ) {
      throw new Error(
        `Formato de subred inválido: ${subnet}. Use ej: 192.168.1.0/24`,
      );
    }
    const mask = parseInt(parts[1], 10);
    if (mask < 1 || mask > 30) {
      throw new Error(
        `Máscara de subred /${mask} inválida o demasiado grande.`,
      );
    }
    return [parts[0], mask];
  }

  private autoSubnet(): [string, number] {
    const interfaces = networkInterfaces();
    for (const name of Object.keys(interfaces)) {
      const ifaceDetails = interfaces[name];
      if (!ifaceDetails) continue;
      for (const iface of ifaceDetails) {
        if (iface.family === 'IPv4' && !iface.internal && iface.cidr) {
          this.logger.log(`Autodetectada interfaz: ${name} (${iface.cidr})`);
          const [, maskStr] = iface.cidr.split('/'); // Eliminar networkIpPart no usado
          const mask = parseInt(maskStr, 10);
          if (!isNaN(mask) && mask >= 1 && mask <= 30) {
            const ipInt = this.ipToInt(iface.address);
            const maskInt = -1 << (32 - mask);
            const networkInt = ipInt & maskInt;
            const networkIp = this.intToIp(networkInt); // Usar networkIp
            return [networkIp, mask];
          }
        }
      }
    }
    throw new Error(
      'No se pudo autodetectar una interfaz de red IPv4 activa con CIDR válido.',
    );
  }

  private expandCidr(baseIp: string, mask: number): string[] {
    if (mask < 1 || mask > 30) {
      this.logger.warn(
        `Máscara /${mask} inválida o demasiado grande, no se expandirá.`,
      );
      return [];
    }
    const networkInt = this.ipToInt(baseIp);
    const hostBits = 32 - mask;
    const totalHosts = 1 << hostBits;
    const broadcastInt = networkInt | (totalHosts - 1);
    const ips: string[] = [];
    for (let i = networkInt + 1; i < broadcastInt; i++) {
      ips.push(this.intToIp(i));
    }
    return ips;
  }

  private ipToInt(ip: string): number {
    return ip
      .split('.')
      .reduce((res, octet) => (res << 8) | parseInt(octet, 10), 0);
  }

  private intToIp(int: number): string {
    return [
      (int >>> 24) & 255,
      (int >>> 16) & 255,
      (int >>> 8) & 255,
      int & 255,
    ].join('.');
  }
}
