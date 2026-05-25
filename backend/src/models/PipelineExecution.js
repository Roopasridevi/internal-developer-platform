module.exports = (sequelize, DataTypes) => {
  const PipelineExecution = sequelize.define('PipelineExecution', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    pipelineId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('pending', 'running', 'success', 'failed', 'cancelled'),
      defaultValue: 'pending',
    },
    triggeredBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    parameters: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    result: {
      type: DataTypes.JSONB,
    },
    startedAt: {
      type: DataTypes.DATE,
    },
    completedAt: {
      type: DataTypes.DATE,
    },
  }, {
    tableName: 'pipeline_executions',
    timestamps: true,
  });

  PipelineExecution.associate = (models) => {
    PipelineExecution.belongsTo(models.Pipeline, {
      foreignKey: 'pipelineId',
    });
  };

  return PipelineExecution;
};
