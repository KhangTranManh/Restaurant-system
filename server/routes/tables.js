const express = require('express');
const router = express.Router();
const tableController = require('../controllers/tableController');

router.get('/', tableController.getTables);
router.get('/:table_id', tableController.getTable);
router.put('/:table_id/status', tableController.updateTableStatus);

module.exports = router;