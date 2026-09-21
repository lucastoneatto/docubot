import {
  ConflictException,
  Inject,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { DRIZZLE, Database } from '../db/db.module';
import { passwordResetTokens, users } from '../db/schema';
import { config } from '../config';
import { MailService } from '../mail/mail.service';

const RESET_TTL_MS = 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    @Inject(DRIZZLE) private readonly db: Database,
    private readonly jwt: JwtService,
    private readonly mail: MailService,
  ) {}

  async register(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const [existing] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalized));
    if (existing) throw new ConflictException('Email already registered');

    const passwordHash = await bcrypt.hash(password, 10);
    const [user] = await this.db
      .insert(users)
      .values({ email: normalized, passwordHash })
      .returning({ id: users.id, email: users.email, plan: users.plan });

    return this.tokenFor(user.id, user.email, user.plan);
  }

  async login(email: string, password: string) {
    const normalized = email.trim().toLowerCase();
    const [user] = await this.db
      .select()
      .from(users)
      .where(eq(users.email, normalized));

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid credentials');
    }

    return this.tokenFor(user.id, user.email, user.plan);
  }

  async me(userId: string) {
    const [user] = await this.db
      .select({ id: users.id, email: users.email, plan: users.plan })
      .from(users)
      .where(eq(users.id, userId));
    if (!user) throw new UnauthorizedException('User not found');
    return user;
  }

  async requestPasswordReset(email: string) {
    const normalized = email.trim().toLowerCase();
    const [user] = await this.db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalized));
    if (!user) return { ok: true };

    const token = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(token);
    await this.db.insert(passwordResetTokens).values({
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + RESET_TTL_MS),
    });

    const resetUrl = `${config.webUrl}/reset-password?token=${token}`;
    await this.mail.sendPasswordReset(normalized, resetUrl);

    return { ok: true };
  }

  async resetPassword(token: string, password: string) {
    const tokenHash = this.hashToken(token);
    const [record] = await this.db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.tokenHash, tokenHash));

    if (!record || record.usedAt || record.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired token');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await this.db.transaction(async (tx) => {
      await tx
        .update(users)
        .set({ passwordHash })
        .where(eq(users.id, record.userId));
      await tx
        .update(passwordResetTokens)
        .set({ usedAt: new Date() })
        .where(eq(passwordResetTokens.id, record.id));
    });

    return { ok: true };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private tokenFor(userId: string, email: string, plan: string) {
    const token = this.jwt.sign({ sub: userId, email });
    return { token, user: { id: userId, email, plan } };
  }
}
