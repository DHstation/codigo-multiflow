import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("EmailWebhookLinks", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      userId: {
        type: DataTypes.INTEGER,
        references: { model: "Users", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "SET NULL",
        allowNull: true
      },
      emailTemplateId: {
        type: DataTypes.INTEGER,
        references: { model: "EmailTemplates", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      platform: {
        type: DataTypes.STRING,
        allowNull: false
      },
      webhookHash: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
      },
      webhookUrl: {
        type: DataTypes.TEXT,
        allowNull: false
      },
      delayType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "immediate"
      },
      delayValue: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      triggerEvents: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: []
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      totalRequests: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      successfulRequests: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      emailsSent: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      lastRequestAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {}
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("EmailWebhookLinks");
  }
};