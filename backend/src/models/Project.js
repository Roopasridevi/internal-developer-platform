module.exports = (sequelize, DataTypes) => {
  const Project = sequelize.define('Project', {
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
    repositoryUrl: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'archived'),
      defaultValue: 'active',
    },
    ownerId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    settings: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
  }, {
    tableName: 'projects',
    timestamps: true,
  });

  Project.associate = (models) => {
    Project.belongsTo(models.User, {
      foreignKey: 'ownerId',
      as: 'owner',
    });
    Project.hasMany(models.ProjectMember, {
      foreignKey: 'projectId',
    });
    Project.hasMany(models.Pipeline, {
      foreignKey: 'projectId',
    });
    Project.hasMany(models.Deployment, {
      foreignKey: 'projectId',
    });
    Project.hasMany(models.Environment, {
      foreignKey: 'projectId',
    });
  };

  return Project;
};
