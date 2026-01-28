const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/sequelize');

const CandidateLike = sequelize.define('CandidateLike', {
	id: {
		type: DataTypes.UUID,
		defaultValue: DataTypes.UUIDV4,
		primaryKey: true,
		allowNull: false
	},
	employerId: {
		type: DataTypes.UUID,
		allowNull: false,
		references: {
			model: 'users',
			key: 'id'
		}
	},
	candidateId: {
		type: DataTypes.UUID,
		allowNull: false,
		references: {
			model: 'users',
			key: 'id'
		}
	},
	requirementId: {
		type: DataTypes.UUID,
		allowNull: true,
		references: {
			model: 'requirements',
			key: 'id'
		}
	}
}, {
  tableName: 'candidate_likes',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
	underscored: true,
	indexes: [
		{
			fields: ['employer_id', 'candidate_id', 'requirement_id'],
			unique: true,
			name: 'unique_employer_candidate_requirement_like',
			where: { requirement_id: { [require('sequelize').Op.ne]: null } }
		},
		{
			fields: ['employer_id', 'candidate_id'],
			unique: true,
			name: 'unique_employer_candidate_like',
			where: { requirement_id: null }
		},
		{
			fields: ['candidate_id']
		}
	]
});

module.exports = CandidateLike;
