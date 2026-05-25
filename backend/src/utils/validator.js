const Joi = require('joi');

const projectSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().allow('').max(500),
  repositoryUrl: Joi.string().uri().allow(''),
  status: Joi.string().valid('active', 'inactive', 'archived'),
});

const pipelineSchema = Joi.object({
  name: Joi.string().required().min(3).max(100),
  description: Joi.string().allow('').max(500),
  projectId: Joi.string().uuid().required(),
  config: Joi.object().required(),
});

const deploymentSchema = Joi.object({
  projectId: Joi.string().uuid().required(),
  environment: Joi.string().required(),
  version: Joi.string().required(),
  imageUrl: Joi.string().uri(),
  environmentVariables: Joi.object(),
  replicas: Joi.number().integer().min(1).max(100),
});

const userSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  name: Joi.string().required().min(2).max(100),
});

const validate = (schema) => {
  return (data) => {
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errors = error.details.map((detail) => ({
        field: detail.path.join('.'),
        message: detail.message,
      }));
      throw new ValidationError('Validation failed', errors);
    }

    return value;
  };
};

module.exports = {
  validateProject: validate(projectSchema),
  validatePipeline: validate(pipelineSchema),
  validateDeployment: validate(deploymentSchema),
  validateUser: validate(userSchema),
};
