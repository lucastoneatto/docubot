import { Injectable, Logger } from '@nestjs/common';
import { connect, type Socket } from 'node:net';
import { connect as tlsConnect, type TLSSocket } from 'node:tls';
import { config } from '../config';

type AnySocket = Socket | TLSSocket;

class SmtpConnection {
  private buffer = '';
  private waiters: Array<{
    resolve: (line: string) => void;
    reject: (error: Error) => void;
  }> = [];
  private failure: Error | null = null;

  constructor(private socket: AnySocket) {
    this.attach(socket);
  }

  private attach(socket: AnySocket) {
    socket.setEncoding('utf8');
    socket.on('data', (chunk: string) => this.onData(chunk));
    socket.on('error', (error) => this.fail(error));
    socket.on('end', () => this.fail(new Error('SMTP connection closed')));
  }

  upgrade(socket: AnySocket) {
    this.socket = socket;
    this.attach(socket);
  }

  private fail(error: Error) {
    this.failure = error;
    const waiters = this.waiters;
    this.waiters = [];
    for (const waiter of waiters) waiter.reject(error);
  }

  private onData(chunk: string) {
    this.buffer += chunk;
    let index: number;
    while ((index = this.buffer.indexOf('\r\n')) !== -1) {
      const line = this.buffer.slice(0, index);
      this.buffer = this.buffer.slice(index + 2);
      const waiter = this.waiters.shift();
      if (waiter) waiter.resolve(line);
    }
  }

  private readLine(): Promise<string> {
    if (this.failure) return Promise.reject(this.failure);
    return new Promise<string>((resolve, reject) =>
      this.waiters.push({ resolve, reject }),
    );
  }

  async command(
    cmd: string | null,
    expectedCode: number,
  ): Promise<{ lines: string[] }> {
    if (cmd !== null) this.socket.write(cmd + '\r\n');

    const lines: string[] = [];
    const first = await this.readLine();
    const code = Number(first.slice(0, 3));
    if (code !== expectedCode) {
      throw new Error(
        `SMTP expected ${expectedCode}, got ${first.slice(0, 3)}: ${first.slice(4)}`,
      );
    }

    if (first[3] === ' ') {
      lines.push(first.slice(4));
      return { lines };
    }

    lines.push(first.slice(4));
    const expected = String(expectedCode);
    for (;;) {
      const line = await this.readLine();
      if (line.startsWith(expected) && line[3] === ' ') {
        lines.push(line.slice(4));
        break;
      }
      lines.push(line.startsWith(expected) ? line.slice(4) : line);
    }
    return { lines };
  }
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);

  async sendPasswordReset(to: string, resetUrl: string): Promise<boolean> {
    const { host, from } = config.smtp;
    if (!host) {
      this.logger.warn(
        `SMTP not configured. Recovery link for ${to}: ${resetUrl}`,
      );
      return false;
    }

    const subject = 'Reset your DocuBot password';
    const body =
      `Hi,\n\n` +
      `We received a request to reset your password.\n\n` +
      `Open this link to choose a new password (expires in 1 hour):\n` +
      `${resetUrl}\n\n` +
      `If you did not request this, ignore this email.\n`;

    const message =
      `From: <${from}>\r\n` +
      `To: <${to}>\r\n` +
      `Subject: ${subject}\r\n` +
      `Content-Type: text/plain; charset=utf-8\r\n` +
      `\r\n` +
      body;

    try {
      await this.send({ to, from, message });
      return true;
    } catch (error) {
      this.logger.error(
        `Error sending recovery email to ${to}: ${(error as Error).message}`,
      );
      return false;
    }
  }

  private async send(params: {
    to: string;
    from: string;
    message: string;
  }): Promise<void> {
    const { host, port, user, pass } = config.smtp;

    let socket: AnySocket;
    if (port === 465) {
      socket = await new Promise<TLSSocket>((resolve, reject) => {
        const s = tlsConnect({ host, port, servername: host }, () => resolve(s));
        s.on('error', reject);
      });
    } else {
      socket = await new Promise<Socket>((resolve, reject) => {
        const s = connect({ host, port }, () => resolve(s));
        s.on('error', reject);
      });
    }

    const conn = new SmtpConnection(socket);

    await conn.command(null, 220);
    let reply = await conn.command('EHLO docubot.local', 250);

    if (
      port !== 465 &&
      reply.lines.some((line) => line.toLowerCase().includes('starttls'))
    ) {
      await conn.command('STARTTLS', 220);
      const tlsSocket = await new Promise<TLSSocket>((resolve, reject) => {
        const s = tlsConnect(
          { socket: socket as Socket, servername: host },
          () => resolve(s),
        );
        s.on('error', reject);
      });
      socket = tlsSocket;
      conn.upgrade(tlsSocket);
      reply = await conn.command('EHLO docubot.local', 250);
    }

    if (user) {
      await conn.command('AUTH LOGIN', 334);
      await conn.command(Buffer.from(user).toString('base64'), 334);
      await conn.command(Buffer.from(pass).toString('base64'), 235);
    }

    await conn.command(`MAIL FROM:<${params.from}>`, 250);
    await conn.command(`RCPT TO:<${params.to}>`, 250);
    await conn.command('DATA', 354);
    const dotted = params.message.replace(/\r?\n\./g, '\r\n..');
    await conn.command(`${dotted}\r\n.`, 250);
    await conn.command('QUIT', 221);
    socket.destroy();
  }
}
