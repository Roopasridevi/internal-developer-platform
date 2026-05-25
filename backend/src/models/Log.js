module.exports = (sequelize, DataTypes) => {
  const Log = sequelize.define('Log', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
    },
    deploymentId: {
      type: DataTypes.UUID,
    },
    pipelineId: {
      type: DataTypes.UUID,
    },
    level: {
      type: DataTypes.ENUM('info', 'warn', 'error', 'debug'),
      allowNull: false,
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    metadata: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    timestamp: {
      type: DataTypes.DATE,
      defaultValue: DataTypes.NOW,
    },
  }, {
    tableName: 'logs',
    timestamps: false,
    indexes: [
      {
        fields: ['projectId', 'timestamp'],
      },
      {
        fields: ['deploymentId'],
      },
      {
        fields: ['pipelineId'],
      },
    ],
  });

  return Log;
};
