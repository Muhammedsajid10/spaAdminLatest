// Central type-like JSDoc definitions to help IDE intellisense without TS

/**
 * @typedef {Object} Service
 * @property {string} _id
 * @property {string} name
 * @property {number} duration  // minutes
 * @property {number} price
 */

/**
 * @typedef {Object} Employee
 * @property {string} id
 * @property {string} name
 * @property {string} position
 * @property {object} workSchedule
 * @property {string} [avatar]
 * @property {string} [avatarColor]
 */

/**
 * @typedef {Object} Appointment
 * @property {string} client
 * @property {string} service
 * @property {number} duration // minutes
 * @property {string} startTime // HH:MM
 * @property {string} endTime // HH:MM
 * @property {string} status
 */
