const { Sequelize } = require('sequelize');
const config = require('../config/database');

const env = process.env.NODE_ENV || 'development';
const dbConfig = config[env];

const sequelize = new Sequelize(
  dbConfig.database,
  dbConfig.username,
  dbConfig.password,
  dbConfig
);

const db = {};

db.Sequelize = Sequelize;
db.sequelize = sequelize;

// Import models
db.User = require('./User')(sequelize, Sequelize.DataTypes);
db.Project = require('./Project')(sequelize, Sequelize.DataTypes);
db.ProjectMember = require('./ProjectMember')(sequelize, Sequelize.DataTypes);
db.Pipeline = require('./Pipeline')(sequelize, Sequelize.DataTypes);
db.PipelineExecution = require('./PipelineExecution')(sequelize, Sequelize.DataTypes);
db.Deployment = require('./Deployment')(sequelize, Sequelize.DataTypes);
db.Environment = require('./Environment')(sequelize, Sequelize.DataTypes);
db.Log = require('./Log')(sequelize, Sequelize.DataTypes);

// Define associations
Object.keys(db).forEach((modelName) => {
  if (db[modelName].associate) {
    db[modelName].associate(db);
  }
});

module.exports = db;
