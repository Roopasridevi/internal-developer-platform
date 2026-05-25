const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { AppError } = require('../utils/errors');
const config = require('../config');
const logger = require('../utils/logger');

class AuthService {
  async register({ email, password, name }) {
    try {
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        throw new AppError('User already exists', 400);
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const user = await User.create({
        email,
        password: hashedPassword,
        name,
      });

      const tokens = this.generateTokens(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        ...tokens,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error registering user:', error);
      throw new AppError('Failed to register user', 500);
    }
  }

  async login({ email, password }) {
    try {
      const user = await User.findOne({ where: { email } });
      if (!user) {
        throw new AppError('Invalid credentials', 401);
      }

      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new AppError('Invalid credentials', 401);
      }

      const tokens = this.generateTokens(user);

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        ...tokens,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error logging in:', error);
      throw new AppError('Failed to login', 500);
    }
  }

  async refreshToken(refreshToken) {
    try {
      const decoded = jwt.verify(refreshToken, config.jwt.refreshSecret);
      const user = await User.findByPk(decoded.userId);

      if (!user) {
        throw new AppError('Invalid refresh token', 401);
      }

      const tokens = this.generateTokens(user);
      return tokens;
    } catch (error) {
      logger.error('Error refreshing token:', error);
      throw new AppError('Invalid refresh token', 401);
    }
  }

  async logout(userId) {
    // Implement token blacklisting if needed
    logger.info(`User logged out: ${userId}`);
  }

  async getCurrentUser(userId) {
    try {
      const user = await User.findByPk(userId, {
        attributes: ['id', 'email', 'name', 'createdAt'],
      });

      if (!user) {
        throw new AppError('User not found', 404);
      }

      return user;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching user:', error);
      throw new AppError('Failed to fetch user', 500);
    }
  }

  async updateProfile(userId, data) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      await user.update({
        name: data.name || user.name,
      });

      return {
        id: user.id,
        email: user.email,
        name: user.name,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating profile:', error);
      throw new AppError('Failed to update profile', 500);
    }
  }

  async changePassword(userId, currentPassword, newPassword) {
    try {
      const user = await User.findByPk(userId);
      if (!user) {
        throw new AppError('User not found', 404);
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', 401);
      }

      const hashedPassword = await bcrypt.hash(newPassword, 12);
      await user.update({ password: hashedPassword });
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error changing password:', error);
      throw new AppError('Failed to change password', 500);
    }
  }

  generateTokens(user) {
    const accessToken = jwt.sign(
      { userId: user.id, email: user.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      config.jwt.refreshSecret,
      { expiresIn: config.jwt.refreshExpiresIn }
    );

    return { accessToken, refreshToken };
  }
}

module.exports = new AuthService();
