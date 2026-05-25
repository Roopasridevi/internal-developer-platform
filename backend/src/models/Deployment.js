module.exports = (sequelize, DataTypes) => {
  const Deployment = sequelize.define('Deployment', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    environment: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    version: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    imageUrl: {
      type: DataTypes.STRING,
    },
    status: {
      type: DataTypes.ENUM('pending', 'deploying', 'deployed', 'failed', 'rolled_back'),
      defaultValue: 'pending',
    },
    deployedBy: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    environmentVariables: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    k8sDeploymentName: {
      type: DataTypes.STRING,
    },
    replicas: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    previousVersion: {
      type: DataTypes.STRING,
    },
    isRollback: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    rolledBackFrom: {
      type: DataTypes.UUID,
    },
  }, {
    tableName: 'deployments',
    timestamps: true,
  });

  Deployment.associate = (models) => {
    Deployment.belongsTo(models.Project, {
      foreignKey: 'projectId',
    });
  };

  return Deployment;
};
