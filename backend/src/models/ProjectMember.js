module.exports = (sequelize, DataTypes) => {
  const ProjectMember = sequelize.define('ProjectMember', {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    projectId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    userId: {
      type: DataTypes.UUID,
      allowNull: false,
    },
    role: {
      type: DataTypes.ENUM('owner', 'admin', 'developer', 'viewer'),
      defaultValue: 'developer',
    },
  }, {
    tableName: 'project_members',
    timestamps: true,
  });

  ProjectMember.associate = (models) => {
    ProjectMember.belongsTo(models.Project, {
      foreignKey: 'projectId',
    });
    ProjectMember.belongsTo(models.User, {
      foreignKey: 'userId',
    });
  };

  return ProjectMember;
};
