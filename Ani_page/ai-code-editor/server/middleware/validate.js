// server/middleware/validate.js
const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, removeAdditional: true });

function validate(schema) {
    const validateFn = ajv.compile(schema);
    return (req, res, next) => {
        const valid = validateFn(req.body);
        if (!valid) {
            return res.status(400).json({ error: 'Invalid request', details: validateFn.errors });
        }
        next();
    };
}

module.exports = { validate };
