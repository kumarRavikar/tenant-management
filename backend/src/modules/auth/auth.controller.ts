import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { env } from '../../config/env';

export class AuthController {
  private static readonly ACCESS_TOKEN_COOKIE = 'accessToken';
  private static readonly REFRESH_TOKEN_COOKIE = 'refreshToken';

  private static setAuthCookies(
    res: Response,
    tokens: { accessToken: string; refreshToken: string }
  ): void {
    const isProduction = env.NODE_ENV === 'production';

    // Access Token Cookie (15 min)
    res.cookie(this.ACCESS_TOKEN_COOKIE, tokens.accessToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 15 * 60 * 1000,
    });

    // Refresh Token Cookie (7 days)
    res.cookie(this.REFRESH_TOKEN_COOKIE, tokens.refreshToken, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private static clearAuthCookies(res: Response): void {
    const isProduction = env.NODE_ENV === 'production';
    const clearOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };

    res.clearCookie(this.ACCESS_TOKEN_COOKIE, clearOptions);
    res.clearCookie(this.REFRESH_TOKEN_COOKIE, clearOptions);
  }

  public static async register(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const user = await AuthService.register(req.body);
      sendSuccess(res, 'User registered successfully', { user }, 201);
    } catch (error) {
      next(error);
    }
  }

  public static async login(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const meta = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.socket.remoteAddress,
      };

      const result = await AuthService.login(req.body, meta);
      AuthController.setAuthCookies(res, result.tokens);

      sendSuccess(res, 'Login successful', {
        user: result.user,
        accessToken: result.tokens.accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async logout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const sessionId = req.user?.sessionId;
      if (sessionId) {
        await AuthService.logout(sessionId);
      }

      AuthController.clearAuthCookies(res);
      sendSuccess(res, 'Logged out successfully');
    } catch (error) {
      next(error);
    }
  }

  public static async refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let refreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
      if (!refreshToken && req.headers.cookie) {
        const match = req.headers.cookie.match(/refreshToken=([^;]+)/);
        if (match) {
          refreshToken = decodeURIComponent(match[1]);
        }
      }

      const meta = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.socket.remoteAddress,
      };

      const result = await AuthService.refreshToken(refreshToken, meta);
      AuthController.setAuthCookies(res, result.tokens);

      sendSuccess(res, 'Token refreshed successfully', {
        user: result.user,
        accessToken: result.tokens.accessToken,
      });
    } catch (error) {
      next(error);
    }
  }

  public static async getCurrentUser(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const user = await AuthService.getCurrentUser(userId);
      sendSuccess(res, 'Current user profile retrieved', { user });
    } catch (error) {
      next(error);
    }
  }

  public static async changePassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      await AuthService.changePassword(userId, req.body);
      AuthController.clearAuthCookies(res);
      sendSuccess(res, 'Password changed successfully. Please log in again with your new password.');
    } catch (error) {
      next(error);
    }
  }

  public static async forgotPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const result = await AuthService.forgotPassword(req.body);
      sendSuccess(res, result.message, result);
    } catch (error) {
      next(error);
    }
  }

  public static async resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      await AuthService.resetPassword(req.body);
      AuthController.clearAuthCookies(res);
      sendSuccess(res, 'Password reset successfully. You may now log in with your new password.');
    } catch (error) {
      next(error);
    }
  }

  public static async getSessions(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const currentSessionId = req.user!.sessionId;
      const sessions = await AuthService.getUserSessions(userId, currentSessionId);
      sendSuccess(res, 'Active sessions retrieved', { sessions });
    } catch (error) {
      next(error);
    }
  }

  public static async revokeSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      await AuthService.revokeSession(userId, id);
      sendSuccess(res, 'Session revoked successfully');
    } catch (error) {
      next(error);
    }
  }
}

