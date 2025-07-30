import {
  Injectable,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import ms from 'ms';
import crypto from 'crypto';
import { randomStringGenerator } from '@nestjs/common/utils/random-string-generator.util';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcryptjs';
import { AuthEmailLoginDto } from './dto/auth-email-login.dto';
import { AuthRegisterLoginDto } from './dto/auth-register-login.dto';
import { NullableType } from '../utils/types/nullable.type';
import { LoginResponseDto } from './dto/login-response.dto';
import { ConfigService } from '@nestjs/config';
import { JwtRefreshPayloadType } from './strategies/types/jwt-refresh-payload.type';
import { JwtPayloadType } from './strategies/types/jwt-payload.type';
import { UsersService } from '../users/users.service';
import { AllConfigType } from '../config/config.type';
import { MailService } from '../mail/mail.service';
import { RoleEnum } from '../roles/roles.enum';
import { Session } from '../session/domain/session';
import { SessionService } from '../session/session.service';
import { User } from '../users/domain/user';
import { ERROR_CODES } from '../common/constants/error-codes.constants';

@Injectable()
export class AuthService {
  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
    private sessionService: SessionService,
    private mailService: MailService,
    private configService: ConfigService<AllConfigType>,
  ) {}

  async validateLogin(loginDto: AuthEmailLoginDto): Promise<LoginResponseDto> {
    let user: NullableType<User> = null;

    if (loginDto.username) {
      user = await this.usersService.findByUsername(loginDto.username);
    }

    if (!user && loginDto.email) {
      user = await this.usersService.findByEmail(loginDto.email);
    }

    if (!user) {
      throw new UnprocessableEntityException({
        code: ERROR_CODES.AUTH_INVALID_CREDENTIALS,
        message: 'Usuario o contraseña incorrectos.',
      });
    }

    if (!user.password) {
      throw new UnprocessableEntityException({
        code: ERROR_CODES.AUTH_ACCOUNT_INACTIVE,
        message: 'La cuenta no tiene una contraseña configurada.',
      });
    }

    const isValidPassword = await bcrypt.compare(
      loginDto.password,
      user.password,
    );

    if (!isValidPassword) {
      throw new UnprocessableEntityException({
        code: ERROR_CODES.AUTH_INCORRECT_PASSWORD,
        message: 'La contraseña es incorrecta.',
      });
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const session = await this.sessionService.create({
      user,
      hash,
    });

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: user.id,
      role: user.role,
      sessionId: session.id,
      hash,
    });

    return {
      refreshToken,
      token,
      tokenExpires,
      user,
    };
  }

  async register(dto: AuthRegisterLoginDto): Promise<void> {
    const requiresConfirmation = !!dto.email;
    const initialIsActive = !requiresConfirmation;

    const user = await this.usersService.create({
      ...dto,
      email: dto.email,
      role: {
        id: RoleEnum.waiter,
      },
      isActive: initialIsActive,
    });

    if (requiresConfirmation) {
      const hash = await this.jwtService.signAsync(
        {
          confirmEmailUserId: user.id,
        },
        {
          secret: this.configService.get('auth.confirmEmailSecret', {
            infer: true,
          }),
          expiresIn: this.configService.get('auth.confirmEmailExpires', {
            infer: true,
          }),
        },
      );

      await this.mailService.userSignUp({
        to: dto.email!,
        data: {
          hash,
        },
      });
    }
  }

  async me(userJwtPayload: JwtPayloadType): Promise<NullableType<User>> {
    return this.usersService.findById(userJwtPayload.id);
  }

  async refreshToken(
    data: Pick<JwtRefreshPayloadType, 'sessionId' | 'hash'>,
  ): Promise<Omit<LoginResponseDto, 'user'>> {
    if (!data.sessionId) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_SESSION_EXPIRED_OR_INVALID,
        message: 'Session ID es requerido.',
      });
    }

    const session = await this.sessionService.findById(data.sessionId);

    if (!session) {
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_SESSION_EXPIRED_OR_INVALID,
        message: 'La sesión ha expirado o es inválida.',
      });
    }

    if (session.hash !== data.hash) {
      await this.sessionService.deleteById(session.id);
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_SESSION_EXPIRED_OR_INVALID,
        message: 'Token de refresco inválido.',
      });
    }

    const hash = crypto
      .createHash('sha256')
      .update(randomStringGenerator())
      .digest('hex');

    const user = await this.usersService.findById(session.user.id);

    if (!user?.role) {
      await this.sessionService.deleteById(session.id);
      throw new UnauthorizedException({
        code: ERROR_CODES.AUTH_UNAUTHORIZED,
        message: 'Usuario asociado a la sesión no válido.',
      });
    }

    await this.sessionService.update(session.id, {
      hash,
    });

    const { token, refreshToken, tokenExpires } = await this.getTokensData({
      id: session.user.id,
      role: user.role,
      sessionId: session.id,
      hash,
    });

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }

  private async getTokensData(data: {
    id: User['id'];
    role: User['role'];
    sessionId: Session['id'];
    hash: Session['hash'];
  }) {
    const tokenExpiresIn = this.configService.getOrThrow('auth.expires', {
      infer: true,
    });

    const tokenExpires = Date.now() + ms(tokenExpiresIn);

    const [token, refreshToken] = await Promise.all([
      this.jwtService.signAsync(
        {
          id: data.id,
          role: data.role,
          sessionId: data.sessionId,
        },
        {
          secret: this.configService.getOrThrow('auth.secret', { infer: true }),
          expiresIn: tokenExpiresIn,
        },
      ),
      this.jwtService.signAsync(
        {
          sessionId: data.sessionId,
          hash: data.hash,
        },
        {
          secret: this.configService.getOrThrow('auth.refreshSecret', {
            infer: true,
          }),
          expiresIn: this.configService.getOrThrow('auth.refreshExpires', {
            infer: true,
          }),
        },
      ),
    ]);

    return {
      token,
      refreshToken,
      tokenExpires,
    };
  }
}
