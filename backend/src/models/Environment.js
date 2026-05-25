module.exports = (sequelize, DataTypes) => {
  const Environment = sequelize.define('Environment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    type: {
      type: DataTypes.ENUM('development', 'staging', 'production'),
      allowNull: false,
    },
    config: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  }, {
    tableName: 'environments',
    timestamps: true,
  });

  Environment.associate = (models) => {
    Environment.belongsTo(models.Project, {
      foreignKey: 'projectId',
    });
  };

  return Environment;
};
