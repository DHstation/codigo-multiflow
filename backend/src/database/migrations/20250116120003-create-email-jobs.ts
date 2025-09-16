import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("EmailJobs", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
      },
      companyId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "Companies",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      sequenceId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "EmailSequences",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      stepId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "EmailSequenceSteps",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      templateId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: "EmailTemplates",
          key: "id"
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE"
      },
      recipientEmail: {
        type: DataTypes.STRING,
        allowNull: false
      },
      recipientName: {
        type: DataTypes.STRING,
        allowNull: true
      },
      variables: {
        type: DataTypes.JSON,
        allowNull: true
      },
      scheduledAt: {
        type: DataTypes.DATE,
        allowNull: false
      },
      sentAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      processedAt: {
        type: DataTypes.DATE,
        allowNull: true
      },
      status: {
        type: DataTypes.ENUM('pending', 'processing', 'sent', 'failed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending'
      },
      errorMessage: {
        type: DataTypes.TEXT,
        allowNull: true
      },
      attempts: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      messageId: {
        type: DataTypes.STRING,
        allowNull: true
      },
      deliveryInfo: {
        type: DataTypes.JSON,
        allowNull: true
      },
      priority: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'normal'
      },
      metadata: {
        type: DataTypes.JSON,
        allowNull: true
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
    return queryInterface.dropTable("EmailJobs");
  }
};