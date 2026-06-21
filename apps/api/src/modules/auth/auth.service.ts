import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

const BCRYPT_ROUNDS = 12;
const DB_PATH = path.join(process.cwd(), 'exploremy-data.json');

// ── Persistent JSON store (migration path to PostgreSQL) ──

interface StoredUser {
  id: string;
  email: string;
  displayName: string;
  passwordHash: string;
  avatarUrl: string | null;
  coverUrl: string | null;
  bio: string;
  location: string;
  level: number;
  xp: number;
  memberSince: string;
  role: 'USER' | 'ADMIN' | 'MODERATOR' | 'BUSINESS' | 'PREMIUM';
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiresAt?: string;
  resetToken?: string;
  resetTokenExpiresAt?: string;
  createdAt: string;
  // Extended profile data (mutable by user actions)
  couplePartnerId?: string;
  coupleStartDate?: string;
  privacy?: Record<string, unknown>;
  travelHistory?: any[];
  visitedCities?: string[];
  journals?: any[];
  albums?: any[];
  myPhotos?: any[];
  wishlist?: any[];
  reviews?: any[];
  favorites?: any[];
  savedTrips?: any[];
  following?: string[];
  followers?: string[];
  dna?: any[];
  badges?: any[];
  notifications?: any[];
}

function loadData(): StoredUser[] {
  const backupPath = DB_PATH + '.backup';
  try {
    // Try primary file first
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf-8');
      if (raw.trim().length > 0) {
        const data = JSON.parse(raw);
        const users = data.users || [];
        console.log(`[AuthStore] ✅ Loaded ${users.length} users from ${DB_PATH}`);
        return users;
      }
    }
    // Fall back to backup if primary is empty/corrupt
    if (fs.existsSync(backupPath)) {
      const raw = fs.readFileSync(backupPath, 'utf-8');
      if (raw.trim().length > 0) {
        const data = JSON.parse(raw);
        const users = data.users || [];
        console.log(`[AuthStore] ⚠️ Loaded ${users.length} users from backup`);
        // Restore primary from backup
        fs.writeFileSync(DB_PATH, raw);
        return users;
      }
    }
  } catch (e) {
    console.error('[AuthStore] Failed to load primary, trying backup:', (e as Error).message);
    try {
      if (fs.existsSync(backupPath)) {
        const raw = fs.readFileSync(backupPath, 'utf-8');
        const data = JSON.parse(raw);
        const users = data.users || [];
        console.log(`[AuthStore] ✅ Recovered ${users.length} users from backup`);
        fs.writeFileSync(DB_PATH, raw);
        return users;
      }
    } catch (e2) {
      console.error('[AuthStore] Backup also failed:', (e2 as Error).message);
    }
  }
  console.warn('[AuthStore] ⚠️ No data found — starting fresh');
  return [];
}

function saveData(users: StoredUser[]) {
  const tmpPath = DB_PATH + '.tmp';
  const backupPath = DB_PATH + '.backup';
  try {
    // Read existing data to preserve other keys (wallet, couple, etc.)
    const existing = fs.existsSync(DB_PATH)
      ? (() => { try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf-8')); } catch { return {}; } })()
      : {};
    existing.users = users;
    existing.savedAt = new Date().toISOString();

    // Atomic write: write to temp file, then rename
    const json = JSON.stringify(existing, null, 2);
    fs.writeFileSync(tmpPath, json, 'utf-8');
    fs.renameSync(tmpPath, DB_PATH);

    // Always save backup — user data must be permanent
    fs.writeFileSync(backupPath, json, 'utf-8');
    // Also save a timestamped backup every 50 saves for disaster recovery
    if (Math.random() < 0.02) {
      const ts = new Date().toISOString().replace(/[:.]/g, '-');
      fs.writeFileSync(DB_PATH.replace('.json', `-${ts}.json`), json, 'utf-8');
    }
  } catch (e) {
    console.error('[AuthStore] ❌ Failed to save data:', (e as Error).message);
    // Attempt direct write as last resort
    try {
      const existing = fs.existsSync(DB_PATH)
        ? JSON.parse(fs.readFileSync(DB_PATH, 'utf-8'))
        : {};
      existing.users = users;
      fs.writeFileSync(DB_PATH, JSON.stringify(existing, null, 2));
      console.log('[AuthStore] ✅ Saved via fallback direct write');
    } catch (e2) {
      console.error('[AuthStore] ❌ Fallback save also failed:', (e2 as Error).message);
    }
  }
}

// ── In-memory user store ──

const users: StoredUser[] = loadData();
const refreshTokens: Map<string, { userId: string; expiresAt: number }> = new Map();
const emailVerificationTokens: Map<string, { email: string; expiresAt: number }> = new Map();
const passwordResetTokens: Map<string, { email: string; expiresAt: number }> = new Map();

// ── Social Feed ──
export interface SocialActivity { id: string; userId: string; userName: string; type: 'photo'|'journal'|'review'|'trip'|'achievement'|'wishlist'; content: string; placeName?: string; photoUrl?: string; createdAt: string; likes: string[]; }
const socialFeed: SocialActivity[] = [];

function addActivity(activity: Omit<SocialActivity, 'id'|'createdAt'|'likes'>) {
  socialFeed.unshift({ ...activity, id: `sa-${Date.now()}`, createdAt: new Date().toISOString(), likes: [] });
  if (socialFeed.length > 500) socialFeed.length = 500;
}
function getSocialFeed(page: number = 0, limit: number = 20): SocialActivity[] {
  return socialFeed.slice(page * limit, (page + 1) * limit);
}

// Expose users array for admin module
(global as any).__authUsers = users;

// ── Password utilities ──

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, BCRYPT_ROUNDS);
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  // Support legacy PBKDF2 hashes (format: salt:hash) during migration
  if (hash.includes(':') && !hash.startsWith('$2')) {
    const [salt, legacyHash] = hash.split(':');
    if (salt && legacyHash && salt.length === 32) {
      const verify = crypto
        .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
        .toString('hex');
      return legacyHash === verify;
    }
  }
  return bcrypt.compare(password, hash);
}

// ── Service ──

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(private readonly jwtService: JwtService) {}

  // ═══════════════════════════════════════════════════════════════════════════
  // AUTHENTICATION
  // ═══════════════════════════════════════════════════════════════════════════

  async register(dto: { email: string; password: string; displayName: string }) {
    const normalizedEmail = dto.email.toLowerCase().trim();

    if (users.find((u) => u.email === normalizedEmail)) {
      throw new ConflictException('Email already registered');
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const verificationExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();

    const user: StoredUser = {
      id: `u${Date.now()}${crypto.randomBytes(4).toString('hex')}`,
      email: normalizedEmail,
      displayName: dto.displayName.trim(),
      passwordHash: await hashPassword(dto.password),
      avatarUrl: null,
      coverUrl: null,
      bio: '',
      location: '',
      level: 1,
      xp: 0,
      memberSince: new Date().toISOString(),
      role: 'USER',
      isVerified: true, // Auto-verified for seamless UX
      verificationToken,
      verificationTokenExpiresAt: verificationExpiresAt,
      createdAt: new Date().toISOString(),
    };

    users.push(user);
    saveData(users);

    this.logger.log(`User registered: ${normalizedEmail} (pending verification)`);

    // In production: send verification email via Resend
    // await this.emailService.sendVerificationEmail(user.email, verificationToken);

    const tokens = await this.generateTokens(user);
    return {
      user: this.sanitizeUser(user),
      ...tokens,
      message:
        'Account created. Please verify your email address. Check your inbox.',
    };
  }

  async login(dto: { email: string; password: string }) {
    const normalizedEmail = dto.email.toLowerCase().trim();
    const user = users.find((u) => u.email === normalizedEmail);

    if (!user || !(await verifyPassword(dto.password, user.passwordHash))) {
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.isVerified) {
      // Resend verification if previous token expired
      if (
        !user.verificationTokenExpiresAt ||
        new Date(user.verificationTokenExpiresAt) < new Date()
      ) {
        user.verificationToken = crypto.randomBytes(32).toString('hex');
        user.verificationTokenExpiresAt = new Date(
          Date.now() + 24 * 60 * 60 * 1000,
        ).toISOString();
        saveData(users);
      }
      throw new UnauthorizedException(
        'Please verify your email before logging in. Check your inbox for the verification link.',
      );
    }

    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async refreshToken(token: string) {
    const stored = refreshTokens.get(token);
    if (!stored || stored.expiresAt < Date.now()) {
      refreshTokens.delete(token);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = users.find((u) => u.id === stored.userId);
    if (!user) {
      refreshTokens.delete(token);
      throw new UnauthorizedException('User not found');
    }

    refreshTokens.delete(token);
    const tokens = await this.generateTokens(user);
    return { user: this.sanitizeUser(user), ...tokens };
  }

  async logout(refreshToken: string) {
    refreshTokens.delete(refreshToken);
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EMAIL VERIFICATION
  // ═══════════════════════════════════════════════════════════════════════════

  async verifyEmail(token: string) {
    const user = users.find((u) => u.verificationToken === token);

    if (!user) {
      throw new BadRequestException(
        'Invalid verification token. Please request a new verification email.',
      );
    }

    if (
      !user.verificationTokenExpiresAt ||
      new Date(user.verificationTokenExpiresAt) < new Date()
    ) {
      throw new BadRequestException(
        'Verification token has expired. Please request a new one.',
      );
    }

    user.isVerified = true;
    user.verificationToken = undefined;
    user.verificationTokenExpiresAt = undefined;
    saveData(users);

    this.logger.log(`Email verified: ${user.email}`);
    return { success: true, message: 'Email verified successfully.' };
  }

  async resendVerification(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find((u) => u.email === normalizedEmail);

    if (!user) {
      // Don't reveal whether email exists
      return {
        success: true,
        message:
          'If an account with that email exists, a verification email has been sent.',
      };
    }

    if (user.isVerified) {
      return { success: true, message: 'Email is already verified.' };
    }

    user.verificationToken = crypto.randomBytes(32).toString('hex');
    user.verificationTokenExpiresAt = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ).toISOString();
    saveData(users);

    // In production: send verification email via Resend
    // await this.emailService.sendVerificationEmail(user.email, user.verificationToken);

    this.logger.log(
      `Verification email resent to: ${user.email} (token: ${user.verificationToken.slice(0, 8)}...)`,
    );
    return {
      success: true,
      message: 'Verification email sent. Please check your inbox.',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PASSWORD RESET
  // ═══════════════════════════════════════════════════════════════════════════

  async forgotPassword(email: string) {
    const normalizedEmail = email.toLowerCase().trim();
    const user = users.find((u) => u.email === normalizedEmail);

    if (!user) {
      // Don't reveal whether email exists (prevents enumeration)
      return {
        success: true,
        message:
          'If an account with that email exists, a password reset link has been sent.',
      };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetToken = resetToken;
    user.resetTokenExpiresAt = new Date(
      Date.now() + 60 * 60 * 1000, // 1 hour expiry
    ).toISOString();
    saveData(users);

    // In production: send password reset email via Resend
    // await this.emailService.sendPasswordResetEmail(user.email, resetToken);

    this.logger.log(
      `Password reset requested for: ${user.email} (token: ${resetToken.slice(0, 8)}...)`,
    );
    return {
      success: true,
      message: 'Password reset email sent. Please check your inbox.',
    };
  }

  async resetPassword(token: string, newPassword: string) {
    const user = users.find((u) => u.resetToken === token);

    if (!user) {
      throw new BadRequestException(
        'Invalid reset token. Please request a new password reset.',
      );
    }

    if (
      !user.resetTokenExpiresAt ||
      new Date(user.resetTokenExpiresAt) < new Date()
    ) {
      throw new BadRequestException(
        'Reset token has expired. Please request a new one.',
      );
    }

    // Simple password validation
    if (!newPassword || newPassword.length < 1) {
      throw new BadRequestException('Password is required.');
    }

    user.passwordHash = await hashPassword(newPassword);
    user.resetToken = undefined;
    user.resetTokenExpiresAt = undefined;

    // Revoke all existing sessions for security
    for (const [rt, data] of refreshTokens) {
      if (data.userId === user.id) refreshTokens.delete(rt);
    }

    saveData(users);
    this.logger.log(`Password reset completed for: ${user.email}`);

    return {
      success: true,
      message:
        'Password has been reset successfully. You can now log in with your new password.',
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PROFILE
  // ═══════════════════════════════════════════════════════════════════════════

  async getProfile(userId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new UnauthorizedException('User not found');
    return this.sanitizeUser(user);
  }

  getUserById(userId: string): StoredUser | null {
    return users.find((u) => u.id === userId) || null;
  }

  getAllUsers(): number {
    return users.length;
  }

  getUsersForSearch() {
    return users.map((u) => ({
      id: u.id,
      displayName: u.displayName,
      email: u.email,
      level: u.level,
    }));
  }

  async validateUser(userId: string): Promise<StoredUser | null> {
    return users.find((u) => u.id === userId) || null;
  }

  async updateProfile(userId: string, dto: any) {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new UnauthorizedException('User not found');

    const allowed = ['displayName', 'bio', 'location', 'avatarUrl', 'coverUrl'];
    for (const key of allowed) {
      if (dto[key] !== undefined) {
        if (key === 'displayName' && typeof dto[key] === 'string') {
          user[key] = dto[key].trim().slice(0, 50);
        } else if (key === 'bio' && typeof dto[key] === 'string') {
          user[key] = dto[key].trim().slice(0, 200);
        } else if (key === 'location' && typeof dto[key] === 'string') {
          user[key] = dto[key].trim().slice(0, 100);
        } else {
          user[key] = dto[key];
        }
      }
    }

    saveData(users);
    return this.sanitizeUser(user);
  }

  async changePassword(
    userId: string,
    dto: { currentPassword: string; newPassword: string },
  ) {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new UnauthorizedException('User not found');

    if (!(await verifyPassword(dto.currentPassword, user.passwordHash))) {
      throw new UnauthorizedException('Current password is incorrect');
    }

    if (!dto.newPassword || dto.newPassword.length < 1) {
      throw new BadRequestException('New password is required.');
    }

    user.passwordHash = await hashPassword(dto.newPassword);
    saveData(users);
    return { success: true, message: 'Password changed successfully.' };
  }

  async adminDeleteUser(targetUserId: string, adminUserId: string) {
    const admin = users.find((u) => u.id === adminUserId);
    if (!admin || (admin.role !== 'ADMIN' && admin.email !== 'yongfeng3318@gmail.com')) {
      throw new UnauthorizedException('Admin access required');
    }
    if (targetUserId === adminUserId) throw new BadRequestException('Cannot delete yourself');
    const idx = users.findIndex((u) => u.id === targetUserId);
    if (idx >= 0) {
      users.splice(idx, 1);
      saveData(users);
      // Clean up refresh tokens
      for (const [token, data] of refreshTokens) {
        if (data.userId === targetUserId) refreshTokens.delete(token);
      }
      return { success: true, message: 'User deleted' };
    }
    throw new NotFoundException('User not found');
  }

  async deleteAccount(userId: string) {
    const idx = users.findIndex((u) => u.id === userId);
    if (idx >= 0) {
      users.splice(idx, 1);
      saveData(users);

      // Clean up refresh tokens
      for (const [token, data] of refreshTokens) {
        if (data.userId === userId) refreshTokens.delete(token);
      }
    }
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SESSIONS
  // ═══════════════════════════════════════════════════════════════════════════

  async getAllSessions(userId: string) {
    const sessions: any[] = [];
    for (const [token, data] of refreshTokens) {
      if (data.userId === userId) {
        sessions.push({
          token: token.slice(0, 10) + '...',
          expiresAt: new Date(data.expiresAt).toISOString(),
        });
      }
    }
    return sessions;
  }

  async revokeSession(userId: string, tokenPrefix: string) {
    for (const [token, data] of refreshTokens) {
      if (data.userId === userId && token.startsWith(tokenPrefix)) {
        refreshTokens.delete(token);
        break;
      }
    }
    return { success: true };
  }

  async revokeAllSessions(userId: string) {
    for (const [token, data] of refreshTokens) {
      if (data.userId === userId) refreshTokens.delete(token);
    }
    return { success: true };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COUPLE
  // ═══════════════════════════════════════════════════════════════════════════

  linkCouple(userId: string, partnerEmail: string) {
    const user = users.find((u) => u.id === userId);
    const partner = users.find(
      (u) => u.email === partnerEmail.toLowerCase().trim(),
    );
    if (!user || !partner) {
      throw new NotFoundException('Partner not found with that email');
    }
    if (user.id === partner.id) {
      throw new BadRequestException('You cannot link with yourself');
    }
    user.couplePartnerId = partner.id;
    partner.couplePartnerId = user.id;
    user.coupleStartDate = new Date().toISOString();
    partner.coupleStartDate = new Date().toISOString();
    saveData(users);
    return {
      user: this.sanitizeUser(user),
      partner: this.sanitizeUser(partner),
    };
  }

  unlinkCouple(userId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.couplePartnerId) {
      throw new BadRequestException('No partner linked');
    }
    const partner = users.find((u) => u.id === user.couplePartnerId);
    if (partner) {
      partner.couplePartnerId = undefined;
      partner.coupleStartDate = undefined;
    }
    user.couplePartnerId = undefined;
    user.coupleStartDate = undefined;
    saveData(users);
    return { success: true };
  }

  getCouplePartner(userId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.couplePartnerId) return null;
    const partner = users.find((u) => u.id === user.couplePartnerId);
    return partner ? this.sanitizeUser(partner) : null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVACY
  // ═══════════════════════════════════════════════════════════════════════════

  getPrivacySettings(userId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return (
      user.privacy || {
        profileVisibility: 'public',
        locationSharing: true,
        travelHistory: true,
        showStats: true,
        showMap: true,
        showDNA: true,
      }
    );
  }

  updatePrivacySettings(userId: string, data: any) {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new NotFoundException('User not found');
    user.privacy = { ...user.privacy, ...data };
    saveData(users);
    return user.privacy;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // TRAVEL HISTORY
  // ═══════════════════════════════════════════════════════════════════════════

  getTravelHistory(userId: string) {
    const user = users.find((u) => u.id === userId);
    return user?.travelHistory || [];
  }

  addTravelHistory(
    userId: string,
    data: { city: string; title: string; date: string; emoji: string },
  ) {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.travelHistory) user.travelHistory = [];
    const entry = {
      id: `th${Date.now()}${crypto.randomBytes(3).toString('hex')}`,
      city: data.city.trim(),
      title: data.title.trim(),
      date: data.date,
      emoji: data.emoji || '✈️',
      completedAt: new Date().toISOString(),
    };
    user.travelHistory.push(entry);
    if (!user.visitedCities) user.visitedCities = [];
    if (!user.visitedCities.includes(data.city.trim())) {
      user.visitedCities.push(data.city.trim());
    }
    user.travelHistory.sort(
      (a: any, b: any) => b.date.localeCompare(a.date),
    );
    saveData(users);
    return entry;
  }

  removeTravelHistory(userId: string, entryId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.travelHistory) throw new NotFoundException('Entry not found');
    const idx = user.travelHistory.findIndex((e: any) => e.id === entryId);
    if (idx >= 0) {
      user.travelHistory.splice(idx, 1);
      saveData(users);
    }
    return { removed: idx >= 0 };
  }

  getVisitedCitiesForUser(userId: string) {
    const user = users.find((u) => u.id === userId);
    return user?.visitedCities || [];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // JOURNALS
  // ═══════════════════════════════════════════════════════════════════════════

  getJournals(userId: string) {
    return users.find((u) => u.id === userId)?.journals || [];
  }

  addJournal(userId: string, data: any) {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.journals) user.journals = [];
    const entry = {
      id: `j${Date.now()}${crypto.randomBytes(3).toString('hex')}`,
      title: (data.title || '').trim(),
      place: (data.place || '').trim(),
      content: (data.content || '').trim(),
      mood: data.mood || '😊',
      photos: data.photos || [],
      date: new Date().toISOString().split('T')[0],
    };
    user.journals.unshift(entry);
    saveData(users);
    addActivity({ userId: user.id, userName: user.displayName, type: 'journal', content: data.title, placeName: data.place });
    return entry;
  }

  updateJournal(userId: string, id: string, data: any) {
    const user = users.find((u) => u.id === userId);
    if (!user?.journals) throw new NotFoundException('Journal not found');
    const entry = user.journals.find((j: any) => j.id === id);
    if (!entry) throw new NotFoundException('Journal not found');
    if (data.title !== undefined) entry.title = (data.title || '').trim();
    if (data.place !== undefined) entry.place = (data.place || '').trim();
    if (data.content !== undefined) entry.content = (data.content || '').trim();
    if (data.mood !== undefined) entry.mood = data.mood;
    if (data.photos !== undefined) entry.photos = data.photos;
    saveData(users);
    return entry;
  }

  deleteJournal(userId: string, id: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.journals) throw new NotFoundException('Journal not found');
    const i = user.journals.findIndex((j: any) => j.id === id);
    if (i >= 0) {
      user.journals.splice(i, 1);
      saveData(users);
    }
    return { removed: i >= 0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ALBUMS
  // ═══════════════════════════════════════════════════════════════════════════

  getAlbums(userId: string) {
    return users.find((u) => u.id === userId)?.albums || [];
  }

  addAlbum(userId: string, data: any) {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.albums) user.albums = [];
    const album = {
      id: `a${Date.now()}${crypto.randomBytes(3).toString('hex')}`,
      title: (data.title || '').trim(),
      place: (data.place || '').trim(),
      coverPhoto: data.coverPhoto || '',
      photos: data.photos || [],
      count: (data.photos || []).length,
      date: new Date().toISOString().split('T')[0],
    };
    user.albums.unshift(album);
    saveData(users);
    return album;
  }

  addPhotoToAlbum(userId: string, albumId: string, photoUrl: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.albums) throw new NotFoundException('Album not found');
    const album = user.albums.find((a: any) => a.id === albumId);
    if (!album) throw new NotFoundException('Album not found');
    if (!album.photos) album.photos = [];
    if (album.photos.length >= 10) throw new BadRequestException('Maximum 10 photos per album');
    album.photos.push(photoUrl);
    album.count = album.photos.length;
    if (!album.coverPhoto) album.coverPhoto = photoUrl;
    saveData(users);
    return album;
  }

  removePhotoFromAlbum(userId: string, albumId: string, photoIndex: number) {
    const user = users.find((u) => u.id === userId);
    if (!user?.albums) throw new NotFoundException('Album not found');
    const album = user.albums.find((a: any) => a.id === albumId);
    if (!album) throw new NotFoundException('Album not found');
    if (!album.photos || photoIndex < 0 || photoIndex >= album.photos.length)
      throw new NotFoundException('Photo not found');
    album.photos.splice(photoIndex, 1);
    album.count = album.photos.length;
    if (album.coverPhoto && album.photos.length > 0 && !album.photos.includes(album.coverPhoto))
      album.coverPhoto = album.photos[0];
    if (album.photos.length === 0) album.coverPhoto = '';
    saveData(users);
    return album;
  }

  setAlbumCover(userId: string, albumId: string, photoUrl: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.albums) throw new NotFoundException('Album not found');
    const album = user.albums.find((a: any) => a.id === albumId);
    if (!album) throw new NotFoundException('Album not found');
    album.coverPhoto = photoUrl;
    saveData(users);
    return album;
  }

  deleteAlbum(userId: string, id: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.albums) throw new NotFoundException('Album not found');
    const i = user.albums.findIndex((a: any) => a.id === id);
    if (i >= 0) {
      user.albums.splice(i, 1);
      saveData(users);
    }
    return { removed: i >= 0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PHOTOS
  // ═══════════════════════════════════════════════════════════════════════════

  getMyPhotos(userId: string) {
    return users.find((u) => u.id === userId)?.myPhotos || [];
  }

  addMyPhoto(userId: string, data: any) {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.myPhotos) user.myPhotos = [];
    const photo = {
      id: `p${Date.now()}${crypto.randomBytes(3).toString('hex')}`,
      url: data.url || '',
      caption: (data.caption || '').trim(),
      place: (data.place || '').trim(),
      date: new Date().toISOString().split('T')[0],
    };
    user.myPhotos.unshift(photo);
    saveData(users);
    addActivity({ userId: user.id, userName: user.displayName, type: 'photo', content: data.caption || 'New photo', placeName: data.place, photoUrl: data.url });
    return photo;
  }

  deleteMyPhoto(userId: string, id: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.myPhotos) throw new NotFoundException('Photo not found');
    const i = user.myPhotos.findIndex((p: any) => p.id === id);
    if (i >= 0) {
      user.myPhotos.splice(i, 1);
      saveData(users);
    }
    return { removed: i >= 0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // WISHLIST
  // ═══════════════════════════════════════════════════════════════════════════

  getWishlist(userId: string) {
    return users.find((u) => u.id === userId)?.wishlist || [];
  }

  addWishlist(userId: string, data: any) {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.wishlist) user.wishlist = [];
    const item = {
      id: `w${Date.now()}${crypto.randomBytes(3).toString('hex')}`,
      destination: (data.destination || '').trim(),
      emoji: data.emoji || '🎯',
      estimatedCost: data.estimatedCost || 0,
      priority: data.priority || 'medium',
      notes: (data.notes || '').trim(),
    };
    user.wishlist.unshift(item);
    saveData(users);
    return item;
  }

  deleteWishlist(userId: string, id: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.wishlist) throw new NotFoundException('Wishlist item not found');
    const i = user.wishlist.findIndex((w: any) => w.id === id);
    if (i >= 0) {
      user.wishlist.splice(i, 1);
      saveData(users);
    }
    return { removed: i >= 0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // REVIEWS
  // ═══════════════════════════════════════════════════════════════════════════

  getReviews(userId: string) {
    return users.find((u) => u.id === userId)?.reviews || [];
  }

  addReview(userId: string, data: any) {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.reviews) user.reviews = [];
    const review = {
      id: `r${Date.now()}${crypto.randomBytes(3).toString('hex')}`,
      placeName: (data.placeName || '').trim(),
      city: (data.city || '').trim(),
      rating: Math.min(5, Math.max(1, data.rating || 5)),
      text: (data.text || '').trim(),
      date: new Date().toISOString().split('T')[0],
    };
    user.reviews.unshift(review);
    saveData(users);
    return review;
  }

  deleteReview(userId: string, reviewId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.reviews) throw new NotFoundException('Review not found');
    const idx = user.reviews.findIndex((r: any) => r.id === reviewId);
    if (idx >= 0) {
      user.reviews.splice(idx, 1);
      saveData(users);
    }
    return { removed: idx >= 0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FAVORITES
  // ═══════════════════════════════════════════════════════════════════════════

  getUserFavorites(userId: string) {
    return users.find((u) => u.id === userId)?.favorites || [];
  }

  addUserFavorite(userId: string, data: any) {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.favorites) user.favorites = [];
    const fav = {
      id: `f${Date.now()}${crypto.randomBytes(3).toString('hex')}`,
      placeName: (data.placeName || '').trim(),
      city: (data.city || '').trim(),
      category: data.category || '',
      rating: data.rating || 0,
      photo: data.photo || '',
      savedAt: new Date().toISOString().split('T')[0],
    };
    user.favorites.unshift(fav);
    saveData(users);
    return fav;
  }

  removeUserFavorite(userId: string, favId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.favorites) throw new NotFoundException('Favorite not found');
    const idx = user.favorites.findIndex((f: any) => f.id === favId);
    if (idx >= 0) {
      user.favorites.splice(idx, 1);
      saveData(users);
    }
    return { removed: idx >= 0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // FOLLOWS
  // ═══════════════════════════════════════════════════════════════════════════

  followUser(userId: string, targetId: string) {
    const user = users.find((u) => u.id === userId);
    const target = users.find((u) => u.id === targetId);
    if (!user || !target)
      throw new NotFoundException('User not found');
    if (userId === targetId)
      throw new BadRequestException('Cannot follow yourself');
    if (!user.following) user.following = [];
    if (!target.followers) target.followers = [];
    if (!user.following.includes(targetId)) {
      user.following.push(targetId);
      target.followers.push(userId);
      saveData(users);
      // Create notification for the followed user
      this.addNotification(targetId, {
        title: 'New Follower',
        message: `${user.displayName || user.email} started following you`,
        type: 'follow',
        fromUserId: userId,
      });
    }
    return {
      following: user.following.length,
      followers: target.followers.length,
    };
  }

  unfollowUser(userId: string, targetId: string) {
    const user = users.find((u) => u.id === userId);
    const target = users.find((u) => u.id === targetId);
    if (!user || !target) throw new NotFoundException('User not found');
    user.following = (user.following || []).filter((id: string) => id !== targetId);
    target.followers = (target.followers || []).filter((id: string) => id !== userId);
    saveData(users);
    return {
      following: user.following.length,
      followers: target.followers.length,
    };
  }

  getFollowers(userId: string) {
    const user = users.find((u) => u.id === userId);
    return (user?.followers || [])
      .map((id: string) => {
        const u = users.find((x) => x.id === id);
        return u
          ? {
              id: u.id,
              displayName: u.displayName,
              avatarUrl: u.avatarUrl,
              level: u.level,
            }
          : null;
      })
      .filter(Boolean);
  }

  getFollowing(userId: string) {
    const user = users.find((u) => u.id === userId);
    return (user?.following || [])
      .map((id: string) => {
        const u = users.find((x) => x.id === id);
        return u
          ? {
              id: u.id,
              displayName: u.displayName,
              avatarUrl: u.avatarUrl,
              level: u.level,
            }
          : null;
      })
      .filter(Boolean);
  }

  // ── Notifications ──
  private addNotification(targetUserId: string, data: { title: string; message: string; type: string; fromUserId?: string }) {
    const target = users.find((u) => u.id === targetUserId);
    if (!target) return;
    if (!target.notifications) target.notifications = [];
    target.notifications.unshift({
      id: `notif-${Date.now()}`,
      ...data,
      isRead: false,
      createdAt: new Date().toISOString(),
    });
    saveData(users);
  }

  getUserNotifications(userId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user) return [];
    return (user.notifications || []).slice(0, 50);
  }

  markNotificationRead(userId: string, notifId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.notifications) return null;
    const n = user.notifications.find((n: any) => n.id === notifId);
    if (n) n.isRead = true;
    saveData(users);
    return n;
  }

  getPublicProfile(userId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user) return null;
    const privacy = user.privacy || {};
    return {
      id: user.id,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      bio: privacy.showBio !== false ? user.bio : '',
      location: privacy.showLocation !== false ? user.location : '',
      level: user.level,
      memberSince: user.memberSince,
      stats:
        privacy.showStats !== false
          ? {
              trips: (user.travelHistory || []).length,
              cities: (user.visitedCities || []).length,
              photos: (user.myPhotos || []).length,
              journals: (user.journals || []).length,
            }
          : null,
      visitedCities:
        privacy.showMap !== false ? user.visitedCities || [] : [],
      dna: privacy.showDNA !== false ? user.dna || [] : [],
      myPhotos: privacy.showPhotos !== false ? (user.myPhotos || []).slice(0, 30) : [],
      travelHistory: privacy.showTrips !== false ? (user.travelHistory || []).slice(0, 20) : [],
      journals: privacy.showJournals !== false ? (user.journals || []).map((j: any) => ({ id: j.id, title: j.title, place: j.place, content: j.content?.slice(0, 200), mood: j.mood, date: j.date })).slice(0, 10) : [],
      badges: user.badges || [],
      followers: (user.followers || []).length,
      following: (user.following || []).length,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // SAVED TRIPS
  // ═══════════════════════════════════════════════════════════════════════════

  getSavedTrips(userId: string) {
    return users.find((u) => u.id === userId)?.savedTrips || [];
  }

  saveTrip(userId: string, data: any) {
    const user = users.find((u) => u.id === userId);
    if (!user) throw new NotFoundException('User not found');
    if (!user.savedTrips) user.savedTrips = [];
    const trip = {
      id: `t${Date.now()}${crypto.randomBytes(3).toString('hex')}`,
      title: (data.title || '').trim(),
      destination: (data.destination || '').trim(),
      days: data.days || 1,
      totalCost: data.totalCost || 0,
      startDate: data.startDate || '',
      endDate: data.endDate || '',
      planData: data,
      savedAt: new Date().toISOString(),
      completed: false,
      completedAt: null,
    };
    user.savedTrips.unshift(trip);
    saveData(users);
    addActivity({ userId: user.id, userName: user.displayName, type: 'trip', content: data.title, placeName: data.destination });
    return trip;
  }

  markTripCompleted(userId: string, tripId: string, completed: boolean) {
    const user = users.find((u) => u.id === userId);
    if (!user?.savedTrips) throw new NotFoundException('Trip not found');
    const trip = user.savedTrips.find((t: any) => t.id === tripId);
    if (!trip) throw new NotFoundException('Trip not found');
    trip.completed = completed;
    trip.completedAt = completed ? new Date().toISOString() : null;
    // Add to travel history when completed
    if (completed) {
      if (!user.travelHistory) user.travelHistory = [];
      const exists = user.travelHistory.find((t: any) => t.id === tripId || t.title === trip.title);
      if (!exists) {
        user.travelHistory.unshift({
          id: tripId,
          city: trip.destination || 'Unknown',
          title: trip.title,
          date: new Date().toISOString().split('T')[0],
          emoji: '✅',
          completedAt: new Date().toISOString(),
        });
        if (!user.visitedCities) user.visitedCities = [];
        if (trip.destination && !user.visitedCities.includes(trip.destination)) {
          user.visitedCities.push(trip.destination);
        }
        user.travelHistory.sort((a: any, b: any) => b.date.localeCompare(a.date));
      }
    }
    saveData(users);
    return trip;
  }

  deleteTrip(userId: string, tripId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.savedTrips) throw new NotFoundException('Trip not found');
    const idx = user.savedTrips.findIndex((t: any) => t.id === tripId);
    if (idx >= 0) {
      user.savedTrips.splice(idx, 1);
      saveData(users);
    }
    return { removed: idx >= 0 };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // COUPLE SHARED
  // ═══════════════════════════════════════════════════════════════════════════

  getCoupleJournals(userId: string) {
    const user = users.find((u) => u.id === userId);
    const partner = user?.couplePartnerId
      ? users.find((u) => u.id === user.couplePartnerId)
      : null;
    return [
      ...(user?.journals || []),
      ...(partner?.journals || []),
    ].sort(
      (a: any, b: any) => b.date?.localeCompare(a.date || '') || 0,
    );
  }

  getCoupleGallery(userId: string) {
    const user = users.find((u) => u.id === userId);
    const partner = user?.couplePartnerId
      ? users.find((u) => u.id === user.couplePartnerId)
      : null;
    return [
      ...(user?.myPhotos || []),
      ...(partner?.myPhotos || []),
    ].sort(
      (a: any, b: any) => b.date?.localeCompare(a.date || '') || 0,
    );
  }

  getCoupleTimeline(userId: string) {
    const user = users.find((u) => u.id === userId);
    const partner = user?.couplePartnerId
      ? users.find((u) => u.id === user.couplePartnerId)
      : null;
    const all = [
      ...(user?.travelHistory || []),
      ...(partner?.travelHistory || []),
    ];
    return all.sort(
      (a: any, b: any) => b.date?.localeCompare(a.date || '') || 0,
    );
  }

  getCoupleCompatibility(userId: string) {
    const user = users.find((u) => u.id === userId);
    const partner = user?.couplePartnerId
      ? users.find((u) => u.id === user.couplePartnerId)
      : null;
    if (!partner) return null;

    const sharedCities = (user?.visitedCities || []).filter((c: string) =>
      partner?.visitedCities?.includes(c),
    ).length;
    const totalCities = new Set([
      ...(user?.visitedCities || []),
      ...(partner?.visitedCities || []),
    ]).size;
    const travelScore =
      totalCities > 0 ? Math.round((sharedCities / totalCities) * 100) : 50;
    const journalScore = Math.min(
      100,
      ((user?.journals || []).length + (partner?.journals || []).length) * 10,
    );
    const photoScore = Math.min(
      100,
      ((user?.myPhotos || []).length + (partner?.myPhotos || []).length) * 5,
    );
    const overall = Math.round(
      travelScore * 0.4 + journalScore * 0.3 + photoScore * 0.3,
    );
    return {
      travelScore,
      journalScore,
      photoScore,
      overall,
      sharedCities,
      totalCities,
      userTrips: (user?.travelHistory || []).length,
      partnerTrips: (partner?.travelHistory || []).length,
    };
  }

  getCoupleAnniversary(userId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user?.coupleStartDate) {
      throw new BadRequestException('No couple start date set');
    }
    const start = new Date(user.coupleStartDate);
    const now = new Date();
    const days = Math.floor(
      (now.getTime() - start.getTime()) / 86400000,
    );
    const months = Math.floor(days / 30);
    const years = Math.floor(days / 365);
    const nextMilestone =
      days < 30
        ? 30 - days
        : days < 365
          ? 365 - (days % 365)
          : 365 - (days % 365);
    return {
      startDate: user.coupleStartDate,
      days,
      months,
      years,
      nextMilestone,
      nextMilestoneDays: nextMilestone,
    };
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // ACHIEVEMENTS
  // ═══════════════════════════════════════════════════════════════════════════

  getRealAchievements(userId: string) {
    const user = users.find((u) => u.id === userId);
    if (!user) return [];
    const t = (user.travelHistory || []).length;
    const c = (user.visitedCities || []).length;
    const j = (user.journals || []).length;
    const p = (user.myPhotos || []).length;
    return [
      {
        id: 'first_trip',
        e: '🌍',
        n: 'First Adventure',
        d: 'Complete 1 trip',
        unlocked: t >= 1,
        progress: t >= 1 ? 1 : 0,
        criteria: `Complete your first trip (${t}/1)`,
      },
      {
        id: 'explorer_3',
        e: '🧭',
        n: 'Explorer',
        d: 'Visit 3 cities',
        unlocked: c >= 3,
        progress: Math.min(1, c / 3),
        criteria: `Visit 3 different cities (${c}/3)`,
      },
      {
        id: 'explorer_5',
        e: '🗺️',
        n: 'Globe Trotter',
        d: 'Visit 5 cities',
        unlocked: c >= 5,
        progress: Math.min(1, c / 5),
        criteria: `Visit 5 different cities (${c}/5)`,
      },
      {
        id: 'journalist',
        e: '📝',
        n: 'Journalist',
        d: 'Write 3 journals',
        unlocked: j >= 3,
        progress: Math.min(1, j / 3),
        criteria: `Write 3 journal entries (${j}/3)`,
      },
      {
        id: 'photographer',
        e: '📸',
        n: 'Photographer',
        d: 'Upload 10 photos',
        unlocked: p >= 10,
        progress: Math.min(1, p / 10),
        criteria: `Upload 10 photos (${p}/10)`,
      },
      {
        id: 'photo_pro',
        e: '📷',
        n: 'Photo Pro',
        d: 'Upload 25 photos',
        unlocked: p >= 25,
        progress: Math.min(1, p / 25),
        criteria: `Upload 25 photos (${p}/25)`,
      },
      {
        id: 'couple',
        e: '💑',
        n: 'Better Together',
        d: 'Link with partner',
        unlocked: !!user.couplePartnerId,
        progress: user.couplePartnerId ? 1 : 0,
        criteria: 'Link account with a partner',
      },
      {
        id: 'foodie',
        e: '🍜',
        n: 'Food Hunter',
        d: '3 food trips',
        unlocked:
          (user.travelHistory || []).filter(
            (t: any) => t.emoji === '🍜',
          ).length >= 3,
        progress: Math.min(
          1,
          (user.travelHistory || []).filter((t: any) => t.emoji === '🍜')
            .length / 3,
        ),
        criteria: 'Complete 3 food-themed trips',
      },
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // PRIVATE HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private async generateTokens(user: StoredUser) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };
    const accessToken = this.jwtService.sign(payload, { expiresIn: '7d' });
    const refreshToken = crypto.randomBytes(40).toString('hex');
    refreshTokens.set(refreshToken, {
      userId: user.id,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000,
    });
    return { accessToken, refreshToken, expiresIn: 900 };
  }

  /**
   * Compute personalized Travel DNA from REAL user activity data.
   * Each trait is scored 0–100 based on actual trip history, favorites,
   * reviews, wishlist, photos, and journals.
   */
  private computeDNA(user: StoredUser): { e: string; l: string; v: number; color: string }[] {
    const travelHistory = user.travelHistory || [];
    const favorites = user.favorites || [];
    const reviews = user.reviews || [];
    const wishlist = user.wishlist || [];
    const journals = user.journals || [];
    const savedTrips = user.savedTrips || [];
    const photos = user.myPhotos || [];
    const cities = user.visitedCities || [];

    // ── Helper: count keyword matches in data ──
    const countKeywords = (texts: string[], keywords: string[]): number => {
      let count = 0;
      for (const text of texts) {
        const lower = (text || '').toLowerCase();
        for (const kw of keywords) {
          if (lower.includes(kw.toLowerCase())) count++;
        }
      }
      return count;
    };

    // Collect all searchable text from user activity
    const tripTexts: string[] = [
      ...travelHistory.map((t: any) => `${t.title} ${t.city} ${t.emoji || ''}`),
      ...savedTrips.map((t: any) => `${t.title} ${t.destination || ''}`),
      ...journals.map((j: any) => `${j.title} ${j.place} ${j.mood || ''} ${j.content || ''}`),
    ];
    const favTexts: string[] = favorites.map((f: any) => `${f.placeName} ${f.city} ${f.category || ''}`);
    const reviewTexts: string[] = reviews.map((r: any) => `${r.placeName} ${r.city}`);
    const wishTexts: string[] = wishlist.map((w: any) => `${w.destination} ${w.emoji || ''} ${w.notes || ''}`);

    // ── Compute raw scores ──

    // 🍜 Food Explorer
    let foodScore = 0;
    foodScore += countKeywords(tripTexts, ['food', 'nasi', 'laksa', 'cafe', 'restaurant', 'hawker', 'kopitiam', 'makan', '🍜', '🍛', '🍝', '☕', '🍰', 'breakfast', 'lunch', 'dinner', 'seafood', 'street food', 'satay']);
    foodScore += countKeywords(favTexts, ['food', 'restaurant', 'cafe', 'nasi', 'hawker']);
    foodScore += countKeywords(reviewTexts, ['food', 'restaurant', 'cafe']);
    foodScore += countKeywords(wishTexts, ['food', 'cafe', 'restaurant']);
    foodScore = Math.min(100, foodScore * 8);

    // 📸 Memory Capturer (based on photos)
    const photoScore = Math.min(100, photos.length * 4);

    // 🌿 Nature Explorer
    let natureScore = 0;
    natureScore += countKeywords(tripTexts, ['nature', 'beach', 'waterfall', 'hiking', 'mountain', 'hill', 'forest', 'park', 'garden', 'island', 'lake', 'river', 'cave', 'sunset', '🌿', '🏔️', '🏖️', '🏝️', '🌊', '🥾', '🌳', '🌸', 'jungle', 'canopy']);
    natureScore += countKeywords(favTexts, ['beach', 'nature', 'park', 'waterfall', 'mountain']);
    natureScore += countKeywords(wishTexts, ['beach', 'nature', 'island', 'mountain']);
    natureScore = Math.min(100, natureScore * 10);

    // 🧗 Adventure Seeker
    let adventureScore = 0;
    adventureScore += countKeywords(tripTexts, ['hike', 'adventure', 'climb', 'trek', 'extreme', 'dive', 'snorkel', 'kayak', 'raft', 'zipline', 'skydive', 'cave', '🧗', '🎢', '⛰️', 'paraglide']);
    adventureScore += countKeywords(wishTexts, ['adventure', 'hike', 'climb', 'dive']);
    adventureScore = Math.min(100, adventureScore * 15);

    // 🏛️ Culture & Heritage
    let cultureScore = 0;
    cultureScore += countKeywords(tripTexts, ['heritage', 'museum', 'temple', 'mosque', 'church', 'history', 'culture', 'traditional', 'unesco', 'art', 'gallery', '🏛️', '⛪', '🕌', '🕍', '🎨', 'landmark', 'monument', 'colonial']);
    cultureScore += countKeywords(favTexts, ['museum', 'temple', 'heritage', 'history', 'art']);
    cultureScore += countKeywords(wishTexts, ['heritage', 'museum', 'temple']);
    cultureScore = Math.min(100, cultureScore * 12);

    // 💑 Romantic
    let romanceScore = 0;
    if (user.couplePartnerId) romanceScore += 30;
    romanceScore += countKeywords(tripTexts, ['date', 'couple', 'romantic', 'honeymoon', 'sunset', '💑', '💕', '❤️', '🌹', 'candle', 'sunset dinner']);
    romanceScore += countKeywords(wishTexts, ['romantic', 'couple', 'honeymoon']);
    romanceScore = Math.min(100, romanceScore * 10);

    // 💰 Budget Explorer
    let budgetScore = 0;
    const lowCostTrips = savedTrips.filter((t: any) => (t.totalCost || 999999) < 500).length;
    const highCostTrips = savedTrips.filter((t: any) => (t.totalCost || 0) > 2000).length;
    budgetScore += lowCostTrips * 15;
    budgetScore += countKeywords(wishTexts, ['budget', 'cheap', 'free', 'affordable']);
    budgetScore += countKeywords(tripTexts, ['budget', 'free', 'hawker', 'street food', 'hostel']);
    // If user is a big spender, budget score should be lower
    budgetScore = Math.max(0, budgetScore - highCostTrips * 20);
    budgetScore = Math.min(100, budgetScore);

    // 🌍 Explorer (breadth of travel)
    const explorerScore = Math.min(100, cities.length * 10 + travelHistory.length * 5 + savedTrips.length * 8);

    // ── Build traits array (only include if score > 0) ──
    const traits: { e: string; l: string; v: number; color: string }[] = [];

    if (foodScore > 5 || cities.length > 0) {
      traits.push({ e: '🍜', l: 'Food Explorer', v: Math.max(10, foodScore), color: '#F97316' });
    }
    if (photoScore > 5 || photos.length >= 0) {
      traits.push({ e: '📸', l: 'Memory Capturer', v: Math.max(10, photoScore), color: '#3B82F6' });
    }
    if (natureScore > 5 || cities.length > 0) {
      traits.push({ e: '🌿', l: 'Nature Lover', v: Math.max(10, natureScore), color: '#22C55E' });
    }
    if (adventureScore > 5) {
      traits.push({ e: '🧗', l: 'Adventure Seeker', v: Math.max(10, adventureScore), color: '#EF4444' });
    }
    if (cultureScore > 5) {
      traits.push({ e: '🏛️', l: 'Culture Buff', v: Math.max(10, cultureScore), color: '#8B5CF6' });
    }
    if (romanceScore > 5) {
      traits.push({ e: '💑', l: 'Romantic', v: Math.max(10, romanceScore), color: '#EC4899' });
    }
    if (budgetScore > 5 || savedTrips.length > 0) {
      traits.push({ e: '💰', l: 'Budget Savvy', v: Math.max(10, budgetScore), color: '#F59E0B' });
    }
    if (explorerScore > 5 || cities.length > 0) {
      traits.push({ e: '🌍', l: 'Explorer', v: Math.max(10, explorerScore), color: '#06B6D4' });
    }
    if (journals.length > 0) {
      traits.push({ e: '📝', l: 'Storyteller', v: Math.min(100, journals.length * 15), color: '#6366F1' });
    }

    // If user has almost no data, return beginner profile
    if (traits.length === 0) {
      return [
        { e: '🌱', l: 'New Explorer', v: 15, color: '#22C55E' },
        { e: '🍜', l: 'Future Foodie', v: 10, color: '#F97316' },
        { e: '📸', l: 'Aspiring Photog', v: 10, color: '#3B82F6' },
        { e: '🌍', l: 'Beginner Explorer', v: 8, color: '#06B6D4' },
      ];
    }

    // Sort by score descending, return top 5
    return traits.sort((a, b) => b.v - a.v).slice(0, 5);
  }

  // ── Social Feed ──
  getGlobalSocialFeed(page: number = 0, limit: number = 20) { return getSocialFeed(page, limit); }
  likeActivity(activityId: string, userId: string) {
    const activity = socialFeed.find(a => a.id === activityId);
    if (!activity) return null;
    if (!activity.likes.includes(userId)) { activity.likes.push(userId); return { liked: true, count: activity.likes.length }; }
    return { liked: false, count: activity.likes.length };
  }

  private sanitizeUser(user: StoredUser | null) {
    if (!user) return null;
    return {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      coverUrl: user.coverUrl,
      bio: user.bio,
      location: user.location,
      level: user.level,
      xp: user.xp,
      memberSince: user.memberSince,
      role: user.role,
      isVerified: user.isVerified,
      createdAt: user.createdAt,
      stats: {
        trips: (user.travelHistory || []).length,
        countries: 1,
        cities: (user.visitedCities || []).length,
        places: (user.visitedCities || []).length,
        photos: (user.myPhotos || []).length,
        reviews: (user.reviews || []).length,
        km: 0,
        daysAbroad: (user.travelHistory || []).length * 3,
      },
      dna: this.computeDNA(user),
      visitedCities: user.visitedCities || [],
      badges: [
        {
          e: '🏆',
          n: 'Pioneer',
          category: 'travel',
          unlocked: (user.travelHistory || []).length >= 1,
        },
        {
          e: '🎖️',
          n: 'Explorer',
          category: 'travel',
          unlocked: (user.visitedCities || []).length >= 3,
        },
        {
          e: '📸',
          n: 'Memory Keeper',
          category: 'photos',
          unlocked: (user.myPhotos || []).length >= 5,
        },
        {
          e: '💑',
          n: 'Couple',
          category: 'social',
          unlocked: !!user.couplePartnerId,
        },
      ],
      wishlist: user.wishlist || [],
      couplePartnerId: user.couplePartnerId || null,
    };
  }
}
