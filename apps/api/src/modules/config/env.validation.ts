import * as Joi from 'joi';

export const envValidationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ['postgresql', 'postgres'] })
    .required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.number().integer().positive().default(900),
  JWT_REFRESH_EXPIRATION: Joi.number().integer().positive().default(604800),
  CORS_ORIGINS: Joi.string().optional(),
  RESEND_API_KEY: Joi.when('NODE_ENV', {
    is: 'test',
    then: Joi.string().optional().allow(''),
    otherwise: Joi.string().required(),
  }),
  RESEND_FROM_EMAIL: Joi.string().email().optional(),
  FRONTEND_URL: Joi.string().uri().optional().default('http://localhost:3000'),
});
