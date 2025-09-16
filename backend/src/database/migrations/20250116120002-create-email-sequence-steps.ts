import { QueryInterface, DataTypes } from "sequelize";

module.exports = {
  up: (queryInterface: QueryInterface) => {
    return queryInterface.createTable("EmailSequenceSteps", {
      id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false
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
      stepOrder: {
        type: DataTypes.INTEGER,
        allowNull: false
      },
      delayMinutes: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      conditions: {
        type: DataTypes.JSON,
        allowNull: true
      },
      delayType: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: 'immediate'
      },
      delayConfig: {
        type: DataTypes.JSON,
        allowNull: true
      },
      active: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true
      },
      executionCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      successCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
      },
      failureCount: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
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
    return queryInterface.dropTable("EmailSequenceSteps");
  }
};