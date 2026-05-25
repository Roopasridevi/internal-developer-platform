module.exports = (sequelize, DataTypes) => {
  const Pipeline = sequelize.define('Pipeline', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    config: {
      type: DataTypes.JSONB,
      allowNull: false,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive'),
      defaultValue: 'active',
    },
    createdBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
  }, {
    tableName: 'pipelines',
    timestamps: true,
  });

  Pipeline.associate = (models) => {
    Pipeline.belongsTo(models.Project, {
      foreignKey: 'projectId',
    });
    Pipeline.hasMany(models.PipelineExecution, {
      foreignKey: 'pipelineId',
    });
  };

  return Pipeline;
};
