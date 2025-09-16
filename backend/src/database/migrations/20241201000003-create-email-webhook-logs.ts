import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("EmailWebhookLogs", {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false
      },
      emailWebhookLinkId: {
        type: DataTypes.INTEGER,
        references: { model: "EmailWebhookLinks", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        references: { model: "Companies", key: "id" },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
        allowNull: false
      },
      platform: {
        type: DataTypes.STRING,
        allowNull: false
      },
      eventType: {
        type: DataTypes.STRING,
        allowNull: false
      },
      payloadRaw: {
        type: DataTypes.JSON,
        allowNull: true
      },
      payloadProcessed: {
        type: DataTypes.JSON,
        allowNull: true
      },
      variablesExtracted: {
        type: DataTypes.JSON,
        allowNull: true
      },
      recipientEmail: {
        type: DataTypes.STRING,
        allowNull: true
      },
      recipientName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      emailSubject: {
        type: DataTypes.STRING,
        allowNull: true
      },
      emailScheduled: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      scheduledFor: {
        type: DataTypes.DATE,
        allowNull: true
      },
      emailSent: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      emailStatus: {
        type: DataTypes.STRING,
        allowNull: true
      },
      httpStatus: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      responseTimeMs: {
        type: DataTypes.INTEGER,
        allowNull: true
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      ipAddress: {
        type: DataTypes.STRING,
        allowNull: true
      },
      userAgent: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false
      }
    });
  },

  down: (queryInterface: QueryInterface) => {
    return queryInterface.dropTable("EmailWebhookLogs");
  }
};