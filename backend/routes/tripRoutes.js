const express = require('express');
const protect = require('../middleware/auth');
const {
  generateTrip,
  getTrips,
  getTrip,
  updateTrip,
  deleteTrip,
  regenerateDay,
  revertToVersion,
} = require('../controllers/tripController');

const router = express.Router();

router.use(protect); // every route below requires a valid session

router.post('/', generateTrip);
router.get('/', getTrips);
router.get('/:id', getTrip);
router.put('/:id', updateTrip);
router.delete('/:id', deleteTrip);
router.post('/:id/regenerate-day', regenerateDay);
router.post('/:id/revert/:versionId', revertToVersion);

module.exports = router;
